import os
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg
from .models import MLModel, ModelLeasing, TrainingJob, ModelReview, FnOStrategy
from .serializers import (
    MLModelSerializer, MLModelCreateSerializer, TrainingJobSerializer,
    ModelLeasingSerializer, ModelReviewSerializer, MarketplaceModelSerializer,
    ModelPublishSerializer, FnOStrategySerializer
)
try:
    from .tasks import start_model_training as celery_start_training
    from celery.result import AsyncResult
    CELERY_AVAILABLE = True
except ImportError:
    celery_start_training = None
    CELERY_AVAILABLE = False

from .training_pipeline import start_model_training, get_training_progress, load_trained_model

from .security import security_manager, access_control, api_security
from .model_monitoring import ModelMonitor, ModelLifecycleManager
from .ml_engines import MLEngineFactory


class MLModelViewSet(ModelViewSet):
    """ViewSet for ML Model CRUD operations"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MLModelCreateSerializer
        elif self.action == 'publish':
            return ModelPublishSerializer
        return MLModelSerializer
    
    def get_queryset(self):
        """Return models for current user"""
        return MLModel.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create model for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        """Start training for a model with enhanced security"""
        model = self.get_object()
        
        # Security checks
        security_result = api_security.check_api_security(request, request.user)
        if not security_result['allowed']:
            return Response({
                'error': security_result['reason'],
                'rate_limited': security_result.get('rate_limited', False)
            }, status=status.HTTP_429_TOO_MANY_REQUESTS if security_result.get('rate_limited') else status.HTTP_403_FORBIDDEN)
        
        # Check permissions
        if not access_control.check_model_permission(request.user, model, 'train'):
            return Response({
                'error': 'Permission denied to train this model'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if model is in correct status
        if model.status not in [MLModel.Status.DRAFT, MLModel.Status.FAILED]:
            return Response({
                'error': 'Model must be in DRAFT or FAILED status to start training'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate training parameters for security
        if model.training_parameters and not security_manager.validate_model_parameters(model.training_parameters):
            security_manager.log_security_event(
                'suspicious_training_params',
                str(request.user.id),
                {
                    'model_id': str(model.id),
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'parameters': model.training_parameters
                }
            )
            return Response({
                'error': 'Invalid training parameters detected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check rate limiting
        if not security_manager.check_rate_limit(str(request.user.id), 'model_training'):
            return Response({
                'error': 'Training rate limit exceeded. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check user subscription for training limits
        user = request.user
        if not self._check_training_limits(user):
            return Response({
                'error': 'Training limit reached for your subscription tier'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create training job
        training_job = TrainingJob.objects.create(
            model=model,
            status=TrainingJob.Status.QUEUED
        )
        
        # Use Celery for asynchronous training if available
        if CELERY_AVAILABLE:
            try:
                # Start Celery task for training
                task = celery_start_training.delay(str(model.id), str(training_job.id))
                
                # Update training job with Celery task ID
                training_job.celery_task_id = task.id
                training_job.save()
                
                return Response({
                    'message': 'Training started asynchronously',
                    'training_job_id': str(training_job.id),
                    'task_id': task.id,
                    'model_id': str(model.id),
                    'status': 'queued'
                }, status=status.HTTP_202_ACCEPTED)
                
            except Exception as e:
                training_job.status = TrainingJob.Status.FAILED
                training_job.error_message = f'Failed to start Celery task: {str(e)}'
                training_job.save()
                
                return Response({
                    'error': f'Failed to start async training: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Fallback to synchronous training using our pipeline
            try:
                result = start_model_training(str(model.id))
                
                if result['status'] == 'success':
                    return Response({
                        'message': 'Training completed successfully (synchronous)',
                        'training_job_id': result['training_job_id'],
                        'model_id': result['model_id']
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': f'Training failed: {result.get("error", "Unknown error")}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except Exception as e:
                return Response({
                    'error': f'Training failed: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish model to marketplace with security checks"""
        model = self.get_object()
        
        # Security and permission checks
        if not access_control.check_model_permission(request.user, model, 'publish'):
            return Response({
                'error': 'Permission denied to publish this model'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if model can be published
        if model.status != MLModel.Status.COMPLETED:
            return Response({
                'error': 'Only completed models can be published'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check user subscription tier
        if not self._check_publish_permissions(request.user):
            return Response({
                'error': 'Publishing models requires Elite subscription'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            model.monthly_lease_price = serializer.validated_data['monthly_lease_price']
            model.is_published = True
            model.status = MLModel.Status.PUBLISHED
            model.save()
            
            return Response({
                'message': 'Model published to marketplace successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Remove model from marketplace"""
        model = self.get_object()
        
        if not model.is_published:
            return Response({
                'error': 'Model is not published'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        model.is_published = False
        model.status = MLModel.Status.COMPLETED
        model.save()
        
        return Response({
            'message': 'Model removed from marketplace'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get detailed performance metrics for model"""
        model = self.get_object()
        
        performance_data = {
            'model_id': str(model.id),
            'model_name': model.name,
            'training_results': model.training_results,
            'backtest_results': model.backtest_results,
            'feature_importance': model.feature_importance,
            'metrics': {
                'accuracy': model.accuracy,
                'precision': model.precision,
                'recall': model.recall,
                'f1_score': model.f1_score,
                'auc_roc': model.auc_roc,
                'total_return': model.total_return,
                'sharpe_ratio': model.sharpe_ratio,
                'sortino_ratio': model.sortino_ratio,
                'max_drawdown': model.max_drawdown,
                'win_rate': model.win_rate,
            }
        }
        
        return Response(performance_data, status=status.HTTP_200_OK)
    
    def _check_training_limits(self, user):
        """Check if user can start training based on subscription"""
        # Get user's current training jobs
        active_jobs = TrainingJob.objects.filter(
            model__user=user,
            status__in=[TrainingJob.Status.QUEUED, TrainingJob.Status.RUNNING]
        ).count()
        
        # Check subscription limits
        limits = {
            'FREE': 1,
            'PRO': 5,
            'ELITE': 20,
            'ENTERPRISE': 100
        }
        
        user_tier = getattr(user, 'subscription_tier', 'FREE')
        max_concurrent = limits.get(user_tier, 1)
        
        return active_jobs < max_concurrent
    
    def _check_publish_permissions(self, user):
        """Check if user can publish models"""
        # Check if user has Pro or higher subscription
        allowed_tiers = ['PRO', 'ELITE', 'ENTERPRISE']
        user_tier = getattr(user, 'subscription_tier', 'FREE')
        return user_tier in allowed_tiers


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_jobs(request):
    """Get user's training jobs"""
    user_models = MLModel.objects.filter(user=request.user)
    jobs = TrainingJob.objects.filter(model__in=user_models).order_by('-queued_at')
    serializer = TrainingJobSerializer(jobs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_job_detail(request, job_id):
    """Get specific training job details"""
    try:
        job = TrainingJob.objects.get(
            id=job_id,
            model__user=request.user
        )
        serializer = TrainingJobSerializer(job)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except TrainingJob.DoesNotExist:
        return Response({
            'error': 'Training job not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_progress(request, job_id):
    """Get real-time training progress for a job"""
    try:
        job = TrainingJob.objects.get(
            id=job_id,
            model__user=request.user
        )
        
        progress_data = {}
        
        # Check if using Celery
        if CELERY_AVAILABLE and job.celery_task_id:
            try:
                # Get Celery task result
                task_result = AsyncResult(job.celery_task_id)
                
                if task_result.state == 'PROGRESS':
                    # Get progress info from Celery task
                    progress_info = task_result.info
                    progress_data = {
                        'status': job.status,
                        'progress_percentage': progress_info.get('percentage', job.progress_percentage),
                        'current_step': progress_info.get('description', job.current_step),
                        'total_steps': progress_info.get('total_steps', job.total_steps),
                        'started_at': job.started_at.isoformat() if job.started_at else None,
                        'estimated_completion': None,
                        'logs': job.training_logs,
                        'task_state': task_result.state,
                        'task_info': progress_info
                    }
                elif task_result.state == 'SUCCESS':
                    progress_data = {
                        'status': 'COMPLETED',
                        'progress_percentage': 100,
                        'current_step': 'Training completed successfully',
                        'total_steps': job.total_steps,
                        'started_at': job.started_at.isoformat() if job.started_at else None,
                        'logs': job.training_logs,
                        'task_state': task_result.state,
                        'result': task_result.result
                    }
                elif task_result.state == 'FAILURE':
                    progress_data = {
                        'status': 'FAILED',
                        'progress_percentage': job.progress_percentage,
                        'current_step': 'Training failed',
                        'total_steps': job.total_steps,
                        'started_at': job.started_at.isoformat() if job.started_at else None,
                        'logs': job.training_logs,
                        'task_state': task_result.state,
                        'error': str(task_result.info)
                    }
                else:
                    # Default to database values
                    progress_data = {
                        'status': job.status,
                        'progress_percentage': job.progress_percentage,
                        'current_step': job.current_step,
                        'total_steps': job.total_steps,
                        'started_at': job.started_at.isoformat() if job.started_at else None,
                        'logs': job.training_logs,
                        'task_state': task_result.state
                    }
                    
            except Exception as celery_error:
                # Fall back to database values if Celery fails
                progress_data = get_training_progress(str(job_id))
        else:
            # Use our pipeline progress tracking
            progress_data = get_training_progress(str(job_id))
        
        if 'error' in progress_data:
            return Response(progress_data, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'job_id': str(job.id),
            'model_id': str(job.model.id),
            'model_name': job.model.name,
            'status': job.status,
            'progress': progress_data,
            'created_at': job.queued_at,
            'started_at': job.started_at,
            'completed_at': job.completed_at,
            'using_celery': CELERY_AVAILABLE and job.celery_task_id is not None
        }, status=status.HTTP_200_OK)
        
    except TrainingJob.DoesNotExist:
        return Response({
            'error': 'Training job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Progress check failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_training(request, job_id):
    """Cancel a running training job"""
    try:
        job = TrainingJob.objects.get(
            id=job_id,
            model__user=request.user
        )
        
        # Only allow cancellation of queued or running jobs
        if job.status not in [TrainingJob.Status.QUEUED, TrainingJob.Status.RUNNING]:
            return Response({
                'error': 'Cannot cancel completed or failed training job'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancel Celery task if it exists
        if CELERY_AVAILABLE and job.celery_task_id:
            try:
                from celery import current_app
                current_app.control.revoke(job.celery_task_id, terminate=True)
            except Exception as celery_error:
                logger.warning(f"Failed to cancel Celery task {job.celery_task_id}: {celery_error}")
        
        # Update job status
        job.status = TrainingJob.Status.CANCELLED
        job.completed_at = timezone.now()
        job.error_message = "Training cancelled by user"
        job.save()
        
        # Update model status
        job.model.status = MLModel.Status.DRAFT
        job.model.save()
        
        return Response({
            'message': 'Training job cancelled successfully',
            'job_id': str(job.id)
        }, status=status.HTTP_200_OK)
        
    except TrainingJob.DoesNotExist:
        return Response({
            'error': 'Training job not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Cancellation failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_model(request, model_id):
    """Test a trained model with sample data"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        if model.status != MLModel.Status.COMPLETED:
            return Response({
                'error': 'Model must be completed to run tests'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load trained model
        model_data = load_trained_model(str(model.id))
        if not model_data:
            return Response({
                'error': 'Failed to load trained model'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get test data from request or generate sample
        test_data = request.data.get('test_data')
        if not test_data:
            # Generate sample test data
            import numpy as np
            import pandas as pd
            
            feature_names = model_data['feature_names']
            n_samples = 10
            
            # Generate random test data matching training features
            test_data = {}
            for feature in feature_names:
                if 'rsi' in feature:
                    test_data[feature] = np.random.uniform(20, 80, n_samples).tolist()
                elif 'price' in feature or 'sma' in feature or 'ema' in feature:
                    test_data[feature] = np.random.uniform(100, 3000, n_samples).tolist()
                elif 'volume' in feature:
                    test_data[feature] = np.random.uniform(0.5, 3.0, n_samples).tolist()
                else:
                    test_data[feature] = np.random.uniform(-2, 2, n_samples).tolist()
        
        # Convert to DataFrame
        test_df = pd.DataFrame(test_data)
        
        # Make predictions
        trained_model = model_data['model']
        predictions = trained_model.predict(test_df)
        
        # Get prediction probabilities if available
        probabilities = None
        if hasattr(trained_model, 'predict_proba'):
            probabilities = trained_model.predict_proba(test_df).tolist()
        
        return Response({
            'model_id': str(model.id),
            'model_name': model.name,
            'test_samples': len(test_df),
            'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions,
            'probabilities': probabilities,
            'feature_names': feature_names,
            'test_data': test_data
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Model testing failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deploy_model(request, model_id):
    """Deploy a model for production use"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        if model.status != MLModel.Status.COMPLETED:
            return Response({
                'error': 'Only completed models can be deployed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if model file exists
        if not model.model_file_path or not os.path.exists(model.model_file_path):
            return Response({
                'error': 'Model file not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate model performance meets minimum thresholds
        min_accuracy = 0.6  # 60% minimum accuracy
        if model.accuracy and model.accuracy < min_accuracy:
            return Response({
                'error': f'Model accuracy ({model.accuracy:.2%}) is below minimum threshold ({min_accuracy:.2%})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create deployment configuration
        deployment_config = {
            'model_id': str(model.id),
            'model_path': model.model_file_path,
            'feature_names': model.training_results.get('feature_names', []),
            'model_type': model.model_type,
            'target_variable': model.target_variable,
            'deployment_timestamp': timezone.now().isoformat(),
            'version': f"v{model.created_at.strftime('%Y%m%d_%H%M%S')}"
        }
        
        # Update model metadata
        model.status = MLModel.Status.PUBLISHED  # Use PUBLISHED for deployed models
        deployment_metadata = model.training_results.copy()
        deployment_metadata['deployment_config'] = deployment_config
        model.training_results = deployment_metadata
        model.save()
        
        return Response({
            'message': 'Model deployed successfully',
            'model_id': str(model.id),
            'deployment_config': deployment_config,
            'endpoint_url': f'/api/ai-studio/models/{model.id}/predict/',
            'deployment_status': 'active'
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Deployment failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_with_model(request, model_id):
    """Use a deployed model for prediction"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        if model.status != MLModel.Status.PUBLISHED:
            return Response({
                'error': 'Model must be deployed to make predictions'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load trained model
        model_data = load_trained_model(str(model.id))
        if not model_data:
            return Response({
                'error': 'Failed to load trained model'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get input data
        input_data = request.data.get('input_data')
        if not input_data:
            return Response({
                'error': 'input_data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate input features
        expected_features = model_data['feature_names']
        missing_features = [f for f in expected_features if f not in input_data]
        if missing_features:
            return Response({
                'error': f'Missing required features: {missing_features}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare input data
        import pandas as pd
        input_df = pd.DataFrame([input_data])
        input_df = input_df[expected_features]  # Ensure correct order
        
        # Make prediction
        trained_model = model_data['model']
        prediction = trained_model.predict(input_df)[0]
        
        # Get confidence/probability if available
        confidence = None
        if hasattr(trained_model, 'predict_proba'):
            probabilities = trained_model.predict_proba(input_df)[0]
            confidence = float(max(probabilities))
        elif hasattr(trained_model, 'decision_function'):
            decision_score = trained_model.decision_function(input_df)[0]
            confidence = float(abs(decision_score))
        
        # Log prediction for monitoring
        prediction_log = {
            'model_id': str(model.id),
            'prediction': str(prediction),
            'confidence': confidence,
            'timestamp': timezone.now().isoformat(),
            'input_features': list(expected_features)
        }
        
        return Response({
            'model_id': str(model.id),
            'model_name': model.name,
            'prediction': prediction,
            'confidence': confidence,
            'model_type': model.model_type,
            'target_variable': model.target_variable,
            'prediction_log': prediction_log
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Prediction failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarketplaceViewSet(generics.ListAPIView):
    """ViewSet for marketplace model listings"""
    serializer_class = MarketplaceModelSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get published models for marketplace"""
        queryset = MLModel.objects.filter(
            is_published=True,
            status=MLModel.Status.PUBLISHED
        ).exclude(user=self.request.user)  # Don't show own models
        
        # Apply filters
        search = self.request.query_params.get('search', '')
        model_type = self.request.query_params.get('model_type', '')
        min_rating = self.request.query_params.get('min_rating', '')
        max_price = self.request.query_params.get('max_price', '')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        if model_type:
            queryset = queryset.filter(model_type=model_type)
        
        if max_price:
            try:
                queryset = queryset.filter(monthly_lease_price__lte=float(max_price))
            except ValueError:
                pass
        
        # Order by performance metrics
        ordering = self.request.query_params.get('ordering', '-total_return')
        if ordering in ['total_return', '-total_return', 'sharpe_ratio', '-sharpe_ratio', 
                       'win_rate', '-win_rate', 'monthly_lease_price', '-monthly_lease_price']:
            queryset = queryset.order_by(ordering)
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lease_model(request, model_id):
    """Lease a model from marketplace"""
    try:
        model = MLModel.objects.get(
            id=model_id,
            is_published=True,
            status=MLModel.Status.PUBLISHED
        )
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found or not available for leasing'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user already has active lease
    existing_lease = ModelLeasing.objects.filter(
        lessee=request.user,
        model=model,
        status=ModelLeasing.Status.ACTIVE
    ).first()
    
    if existing_lease:
        return Response({
            'error': 'You already have an active lease for this model'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate lease details
    lease_price = model.monthly_lease_price
    platform_commission = lease_price * 0.10  # 10% commission
    creator_earnings = lease_price - platform_commission
    
    # Create lease (payment integration would happen here)
    start_date = timezone.now()
    end_date = start_date + timezone.timedelta(days=30)  # 30-day lease
    
    lease = ModelLeasing.objects.create(
        lessee=request.user,
        model=model,
        lease_price=lease_price,
        platform_commission=platform_commission,
        creator_earnings=creator_earnings,
        start_date=start_date,
        end_date=end_date,
        status=ModelLeasing.Status.ACTIVE,
        payment_status='completed'  # Would be 'pending' until payment
    )
    
    # Update model statistics
    model.total_leases += 1
    model.total_earnings += creator_earnings
    model.save()
    
    return Response({
        'message': 'Model leased successfully',
        'lease_id': str(lease.id),
        'end_date': end_date
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_leases(request):
    """Get user's active model leases"""
    leases = ModelLeasing.objects.filter(lessee=request.user).order_by('-created_at')
    serializer = ModelLeasingSerializer(leases, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


class ModelReviewViewSet(ModelViewSet):
    """ViewSet for model reviews"""
    serializer_class = ModelReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get reviews for models user has leased"""
        return ModelReview.objects.filter(reviewer=self.request.user)
    
    def perform_create(self, serializer):
        """Create review for current user"""
        serializer.save(reviewer=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_features(request):
    """Get list of available features for model training"""
    features = [
        # Technical Indicators
        {'name': 'rsi', 'display_name': 'RSI (14)', 'category': 'Technical', 'description': 'Relative Strength Index'},
        {'name': 'macd', 'display_name': 'MACD', 'category': 'Technical', 'description': 'Moving Average Convergence Divergence'},
        {'name': 'bollinger_bands', 'display_name': 'Bollinger Bands', 'category': 'Technical', 'description': 'Bollinger Bands'},
        {'name': 'sma_20', 'display_name': 'SMA (20)', 'category': 'Technical', 'description': 'Simple Moving Average 20'},
        {'name': 'ema_12', 'display_name': 'EMA (12)', 'category': 'Technical', 'description': 'Exponential Moving Average 12'},
        {'name': 'volume', 'display_name': 'Volume', 'category': 'Technical', 'description': 'Trading Volume'},
        {'name': 'atr', 'display_name': 'ATR', 'category': 'Technical', 'description': 'Average True Range'},
        
        # Price-based Features
        {'name': 'price_change', 'display_name': 'Price Change %', 'category': 'Price', 'description': 'Percentage price change'},
        {'name': 'high_low_ratio', 'display_name': 'High/Low Ratio', 'category': 'Price', 'description': 'High to Low price ratio'},
        {'name': 'open_close_ratio', 'display_name': 'Open/Close Ratio', 'category': 'Price', 'description': 'Open to Close price ratio'},
        
        # Market Features
        {'name': 'market_cap', 'display_name': 'Market Cap', 'category': 'Market', 'description': 'Market Capitalization'},
        {'name': 'sector_performance', 'display_name': 'Sector Performance', 'category': 'Market', 'description': 'Sector relative performance'},
        {'name': 'volatility', 'display_name': 'Volatility', 'category': 'Market', 'description': 'Price volatility'},
        
        # Sentiment Features
        {'name': 'news_sentiment', 'display_name': 'News Sentiment', 'category': 'Sentiment', 'description': 'News sentiment score'},
        {'name': 'social_sentiment', 'display_name': 'Social Sentiment', 'category': 'Sentiment', 'description': 'Social media sentiment'},
        
        # F&O Options Features - Greeks
        {'name': 'delta', 'display_name': 'Delta', 'category': 'Options Greeks', 'description': 'Option price sensitivity to underlying price'},
        {'name': 'gamma', 'display_name': 'Gamma', 'category': 'Options Greeks', 'description': 'Rate of change of delta'},
        {'name': 'theta', 'display_name': 'Theta', 'category': 'Options Greeks', 'description': 'Time decay of option premium'},
        {'name': 'vega', 'display_name': 'Vega', 'category': 'Options Greeks', 'description': 'Volatility sensitivity'},
        {'name': 'rho', 'display_name': 'Rho', 'category': 'Options Greeks', 'description': 'Interest rate sensitivity'},
        
        # F&O Options Features - Pricing
        {'name': 'implied_volatility', 'display_name': 'Implied Volatility', 'category': 'Options Pricing', 'description': 'Market-implied volatility'},
        {'name': 'historical_volatility', 'display_name': 'Historical Volatility', 'category': 'Options Pricing', 'description': 'Historical price volatility'},
        {'name': 'option_premium', 'display_name': 'Option Premium', 'category': 'Options Pricing', 'description': 'Current option price'},
        {'name': 'intrinsic_value', 'display_name': 'Intrinsic Value', 'category': 'Options Pricing', 'description': 'Intrinsic value of option'},
        {'name': 'time_value', 'display_name': 'Time Value', 'category': 'Options Pricing', 'description': 'Time value of option'},
        {'name': 'moneyness', 'display_name': 'Moneyness', 'category': 'Options Pricing', 'description': 'ITM/ATM/OTM status'},
        {'name': 'strike_distance', 'display_name': 'Strike Distance', 'category': 'Options Pricing', 'description': 'Distance from current price to strike'},
        
        # F&O Options Features - Chain Analysis  
        {'name': 'put_call_ratio', 'display_name': 'Put/Call Ratio', 'category': 'Options Chain', 'description': 'Put to Call volume ratio'},
        {'name': 'max_pain', 'display_name': 'Max Pain', 'category': 'Options Chain', 'description': 'Maximum pain point'},
        {'name': 'open_interest', 'display_name': 'Open Interest', 'category': 'Options Chain', 'description': 'Total open positions'},
        {'name': 'oi_change', 'display_name': 'OI Change', 'category': 'Options Chain', 'description': 'Change in open interest'},
        {'name': 'volume_oi_ratio', 'display_name': 'Volume/OI Ratio', 'category': 'Options Chain', 'description': 'Volume to Open Interest ratio'},
        {'name': 'iv_skew', 'display_name': 'IV Skew', 'category': 'Options Chain', 'description': 'Implied volatility skew'},
        {'name': 'iv_term_structure', 'display_name': 'IV Term Structure', 'category': 'Options Chain', 'description': 'Volatility term structure'},
        
        # F&O Futures Features
        {'name': 'futures_premium', 'display_name': 'Futures Premium', 'category': 'Futures', 'description': 'Premium of futures over spot'},
        {'name': 'basis', 'display_name': 'Basis', 'category': 'Futures', 'description': 'Difference between futures and spot'},
        {'name': 'cost_of_carry', 'display_name': 'Cost of Carry', 'category': 'Futures', 'description': 'Theoretical cost of carry'},
        {'name': 'futures_curve', 'display_name': 'Futures Curve', 'category': 'Futures', 'description': 'Shape of futures curve'},
        {'name': 'rollover_ratio', 'display_name': 'Rollover %', 'category': 'Futures', 'description': 'Futures rollover percentage'},
        {'name': 'long_short_ratio', 'display_name': 'Long/Short Ratio', 'category': 'Futures', 'description': 'Long to short position ratio'},
        
        # F&O Strategy Features
        {'name': 'volatility_cone', 'display_name': 'Volatility Cone', 'category': 'Strategy', 'description': 'Historical volatility percentiles'},
        {'name': 'term_structure_slope', 'display_name': 'Term Structure Slope', 'category': 'Strategy', 'description': 'Volatility term structure slope'},
        {'name': 'skew_momentum', 'display_name': 'Skew Momentum', 'category': 'Strategy', 'description': 'Change in volatility skew'},
        {'name': 'delta_hedged_pnl', 'display_name': 'Delta Hedged P&L', 'category': 'Strategy', 'description': 'Delta neutral P&L'},
        {'name': 'gamma_exposure', 'display_name': 'Gamma Exposure', 'category': 'Strategy', 'description': 'Market gamma exposure'},
        
        # F&O Risk Management  
        {'name': 'portfolio_delta', 'display_name': 'Portfolio Delta', 'category': 'Risk Management', 'description': 'Total portfolio delta'},
        {'name': 'portfolio_gamma', 'display_name': 'Portfolio Gamma', 'category': 'Risk Management', 'description': 'Total portfolio gamma'},
        {'name': 'portfolio_vega', 'display_name': 'Portfolio Vega', 'category': 'Risk Management', 'description': 'Total portfolio vega'},
        {'name': 'var_estimate', 'display_name': 'VaR Estimate', 'category': 'Risk Management', 'description': 'Value at Risk estimate'},
        {'name': 'margin_utilization', 'display_name': 'Margin Utilization', 'category': 'Risk Management', 'description': 'Margin usage percentage'},
    ]
    
    return Response({
        'features': features,
        'categories': ['Technical', 'Price', 'Market', 'Sentiment', 'Options Greeks', 'Options Pricing', 'Options Chain', 'Futures', 'Strategy', 'Risk Management']
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def studio_dashboard(request):
    """Get AI Studio dashboard data"""
    user = request.user
    user_models = MLModel.objects.filter(user=user)
    
    dashboard_data = {
        'total_models': user_models.count(),
        'published_models': user_models.filter(is_published=True).count(),
        'training_models': user_models.filter(status=MLModel.Status.TRAINING).count(),
        'completed_models': user_models.filter(status=MLModel.Status.COMPLETED).count(),
        'total_earnings': float(sum(model.total_earnings for model in user_models)),
        'active_leases': ModelLeasing.objects.filter(
            model__user=user, 
            status=ModelLeasing.Status.ACTIVE
        ).count(),
        'recent_models': MLModelSerializer(
            user_models.order_by('-created_at')[:5], 
            many=True, 
            context={'request': request}
        ).data,
        'recent_training_jobs': TrainingJobSerializer(
            TrainingJob.objects.filter(
                model__user=user
            ).order_by('-queued_at')[:5],
            many=True
        ).data
    }
    
    return Response(dashboard_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fno_strategies(request):
    """Get available F&O strategy templates"""
    strategies = FnOStrategy.objects.filter(is_active=True, is_template=True)
    serializer = FnOStrategySerializer(strategies, many=True)
    return Response({
        'strategies': serializer.data,
        'strategy_types': [
            {'value': choice[0], 'label': choice[1]} 
            for choice in FnOStrategy.StrategyType.choices
        ],
        'risk_levels': [
            {'value': choice[0], 'label': choice[1]} 
            for choice in FnOStrategy.RiskLevel.choices
        ]
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fno_instruments(request):
    """Get available F&O instruments and underlyings"""
    instruments = {
        'options': [
            {'symbol': 'NIFTY', 'name': 'NIFTY 50', 'lot_size': 50, 'expiry_type': 'WEEKLY'},
            {'symbol': 'BANKNIFTY', 'name': 'BANK NIFTY', 'lot_size': 25, 'expiry_type': 'WEEKLY'},
            {'symbol': 'FINNIFTY', 'name': 'NIFTY FINANCIAL', 'lot_size': 40, 'expiry_type': 'WEEKLY'},
            {'symbol': 'RELIANCE', 'name': 'Reliance Industries', 'lot_size': 250, 'expiry_type': 'MONTHLY'},
            {'symbol': 'TCS', 'name': 'Tata Consultancy Services', 'lot_size': 150, 'expiry_type': 'MONTHLY'},
            {'symbol': 'HDFC', 'name': 'HDFC Bank', 'lot_size': 550, 'expiry_type': 'MONTHLY'},
            {'symbol': 'INFY', 'name': 'Infosys Limited', 'lot_size': 300, 'expiry_type': 'MONTHLY'},
            {'symbol': 'ICICIBANK', 'name': 'ICICI Bank', 'lot_size': 1375, 'expiry_type': 'MONTHLY'},
        ],
        'futures': [
            {'symbol': 'NIFTY', 'name': 'NIFTY 50', 'lot_size': 50, 'expiry_months': 3},
            {'symbol': 'BANKNIFTY', 'name': 'BANK NIFTY', 'lot_size': 25, 'expiry_months': 3},
            {'symbol': 'FINNIFTY', 'name': 'NIFTY FINANCIAL', 'lot_size': 40, 'expiry_months': 3},
            {'symbol': 'RELIANCE', 'name': 'Reliance Industries', 'lot_size': 250, 'expiry_months': 3},
            {'symbol': 'TCS', 'name': 'Tata Consultancy Services', 'lot_size': 150, 'expiry_months': 3},
            {'symbol': 'HDFC', 'name': 'HDFC Bank', 'lot_size': 550, 'expiry_months': 3},
        ]
    }
    
    return Response(instruments, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fno_model_types(request):
    """Get F&O-specific model types and their configurations"""
    model_types = [
        {
            'type': 'OPTIONS_STRATEGY',
            'name': 'Options Strategy Model',
            'description': 'AI models for options trading strategies using Greeks and volatility analysis',
            'recommended_features': ['delta', 'gamma', 'theta', 'vega', 'implied_volatility', 'time_value'],
            'target_variables': ['strategy_signal', 'entry_exit', 'position_size'],
            'algorithms': ['RANDOM_FOREST', 'GRADIENT_BOOST', 'NEURAL_NETWORK'],
            'min_training_days': 180,
            'complexity': 'HIGH'
        },
        {
            'type': 'FUTURES_MOMENTUM',
            'name': 'Futures Momentum Model',
            'description': 'AI models for futures trading based on momentum and basis analysis',
            'recommended_features': ['futures_premium', 'basis', 'rollover_ratio', 'volume', 'rsi'],
            'target_variables': ['direction', 'momentum_strength', 'rollover_decision'],
            'algorithms': ['RANDOM_FOREST', 'SVM', 'ENSEMBLE'],
            'min_training_days': 365,
            'complexity': 'MEDIUM'
        },
        {
            'type': 'VOLATILITY_TRADING',
            'name': 'Volatility Trading Model',
            'description': 'AI models for volatility-based strategies using IV analysis',
            'recommended_features': ['implied_volatility', 'historical_volatility', 'iv_skew', 'vega'],
            'target_variables': ['volatility_direction', 'iv_premium', 'skew_trade'],
            'algorithms': ['NEURAL_NETWORK', 'ENSEMBLE', 'GRADIENT_BOOST'],
            'min_training_days': 252,
            'complexity': 'HIGH'
        },
        {
            'type': 'ARBITRAGE',
            'name': 'Arbitrage Model',
            'description': 'AI models for identifying arbitrage opportunities in F&O markets',
            'recommended_features': ['basis', 'cost_of_carry', 'futures_premium', 'calendar_spreads'],
            'target_variables': ['arbitrage_signal', 'spread_direction', 'profit_potential'],
            'algorithms': ['CLASSIFICATION', 'ENSEMBLE', 'RULE_BASED'],
            'min_training_days': 90,
            'complexity': 'MEDIUM'
        }
    ]
    
    return Response({'model_types': model_types}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_fno_model(request):
    """Create a new F&O-specific model with enhanced configuration"""
    data = request.data.copy()
    
    # Validate F&O specific requirements
    model_type = data.get('model_type')
    if model_type not in ['OPTIONS_STRATEGY', 'FUTURES_MOMENTUM', 'VOLATILITY_TRADING', 'ARBITRAGE']:
        return Response({
            'error': 'Invalid F&O model type'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set F&O specific defaults
    data['instrument_types'] = data.get('instrument_types', ['OPTIONS', 'FUTURES'])
    data['underlying_assets'] = data.get('underlying_assets', ['NIFTY', 'BANKNIFTY'])
    
    # Add F&O validation rules
    fno_features = [
        'delta', 'gamma', 'theta', 'vega', 'implied_volatility', 'futures_premium',
        'basis', 'put_call_ratio', 'max_pain', 'open_interest'
    ]
    
    selected_features = data.get('features', [])
    has_fno_features = any(feature in fno_features for feature in selected_features)
    
    if not has_fno_features:
        return Response({
            'error': 'F&O models must include at least one F&O-specific feature'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create the model
    serializer = MLModelCreateSerializer(data=data)
    if serializer.is_valid():
        model = serializer.save(user=request.user)
        return Response({
            'message': 'F&O model created successfully',
            'model_id': str(model.id),
            'model_type': model.model_type
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fno_performance_metrics(request):
    """Get F&O-specific performance metrics definitions"""
    metrics = {
        'options_metrics': [
            {'name': 'delta_neutral_success', 'description': 'Success rate of delta neutral strategies', 'unit': 'percentage'},
            {'name': 'gamma_scalping_profit', 'description': 'Profit from gamma scalping', 'unit': 'currency'},
            {'name': 'theta_decay_capture', 'description': 'Effectiveness of theta decay capture', 'unit': 'percentage'},
            {'name': 'vega_hedge_efficiency', 'description': 'Volatility hedge efficiency', 'unit': 'percentage'},
            {'name': 'implied_volatility_accuracy', 'description': 'IV prediction accuracy', 'unit': 'percentage'},
            {'name': 'option_expiry_success', 'description': 'Success rate near expiry', 'unit': 'percentage'},
        ],
        'futures_metrics': [
            {'name': 'basis_prediction_accuracy', 'description': 'Basis movement prediction accuracy', 'unit': 'percentage'},
            {'name': 'rollover_timing_success', 'description': 'Rollover timing success rate', 'unit': 'percentage'},
            {'name': 'contango_backwardation_signal', 'description': 'Curve shape signal accuracy', 'unit': 'percentage'},
            {'name': 'margin_efficiency', 'description': 'Margin utilization efficiency', 'unit': 'ratio'},
        ],
        'strategy_metrics': [
            {'name': 'max_profit_realization', 'description': 'Maximum profit potential realized', 'unit': 'percentage'},
            {'name': 'breakeven_accuracy', 'description': 'Breakeven point accuracy', 'unit': 'percentage'},
            {'name': 'early_exit_success', 'description': 'Early exit decision success', 'unit': 'percentage'},
            {'name': 'risk_reward_ratio', 'description': 'Average risk-reward ratio', 'unit': 'ratio'},
        ],
        'risk_metrics': [
            {'name': 'max_portfolio_delta', 'description': 'Maximum portfolio delta exposure', 'unit': 'absolute'},
            {'name': 'gamma_risk_exposure', 'description': 'Maximum gamma risk taken', 'unit': 'absolute'},
            {'name': 'vega_risk_exposure', 'description': 'Maximum vega risk taken', 'unit': 'absolute'},
            {'name': 'margin_buffer_maintained', 'description': 'Minimum margin buffer maintained', 'unit': 'percentage'},
        ]
    }
    
    return Response(metrics, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def backtest_fno_strategy(request, model_id):
    """Run F&O-specific backtesting for a model"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        # Import F&O analytics
        from .fno_analytics import FnOBacktester, FnOPerformanceAnalyzer
        import pandas as pd
        import numpy as np
        
        # Generate sample market data for backtesting (in production, use real data)
        dates = pd.date_range(start='2023-01-01', end='2024-12-31', freq='D')
        np.random.seed(42)  # For reproducible results
        
        market_data = pd.DataFrame({
            'close': 18000 + np.cumsum(np.random.randn(len(dates)) * 50),
            'price_change': np.random.randn(len(dates)) * 0.02,
            'volume': np.random.randint(1000000, 5000000, len(dates)),
            'implied_volatility': 0.15 + np.random.randn(len(dates)) * 0.05
        }, index=dates)
        
        # Configure backtesting
        strategy_config = {
            'strategy_type': model.model_type,
            'instrument_types': model.instrument_types,
            'underlying_assets': model.underlying_assets,
            'initial_capital': 1000000,
            'features': model.features
        }
        
        # Run backtesting
        backtester = FnOBacktester()
        backtest_results = backtester.backtest_options_strategy(strategy_config, market_data)
        
        # Analyze performance
        analyzer = FnOPerformanceAnalyzer()
        
        # Generate sample trade data for analysis
        trades_df = pd.DataFrame(backtester.trades)
        model_predictions = pd.DataFrame({
            'predicted_delta': np.random.randn(100) * 0.5,
            'actual_delta': np.random.randn(100) * 0.5,
        })
        
        if not trades_df.empty and model.model_type in ['OPTIONS_STRATEGY', 'VOLATILITY_TRADING']:
            performance_metrics = analyzer.analyze_options_performance(trades_df, model_predictions)
        else:
            performance_metrics = analyzer.analyze_futures_performance(trades_df)
        
        # Generate comprehensive report
        fno_report = analyzer.generate_fno_report(str(model.id), backtest_results, performance_metrics)
        
        # Update model with F&O-specific metrics
        model.implied_volatility_accuracy = performance_metrics.get('implied_volatility_edge', 0)
        model.delta_prediction_accuracy = performance_metrics.get('delta_prediction_accuracy', 0)
        model.gamma_prediction_accuracy = performance_metrics.get('gamma_effectiveness', 0)
        model.theta_prediction_accuracy = performance_metrics.get('theta_capture_rate', 0)
        model.vega_prediction_accuracy = performance_metrics.get('vega_hedge_efficiency', 0)
        model.max_profit_potential = backtest_results.get('max_profit', 0)
        model.max_loss_potential = abs(backtest_results.get('max_loss', 0))
        model.save()
        
        return Response({
            'backtest_results': backtest_results,
            'fno_report': fno_report,
            'model_updated': True
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Backtesting failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def monitor_model(request, model_id):
    """Monitor model for drift and performance issues"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        # Mock current data for monitoring (in production, this would come from request)
        import numpy as np
        current_data = np.random.randn(100, len(model.features) if model.features else 10)
        current_predictions = np.random.rand(100)
        
        # Run monitoring
        monitor = ModelMonitor()
        monitoring_result = monitor.monitor_model(model_id, current_data, current_predictions)
        
        return Response(monitoring_result, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Monitoring failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def model_health(request, model_id):
    """Get comprehensive model health assessment"""
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        lifecycle_manager = ModelLifecycleManager()
        health_assessment = lifecycle_manager.evaluate_model_health(model_id)
        retirement_suggestion = lifecycle_manager.suggest_retirement(model_id)
        
        return Response({
            'health_assessment': health_assessment,
            'retirement_suggestion': retirement_suggestion
        }, status=status.HTTP_200_OK)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found or access denied'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Health check failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_advanced_model(request):
    """Create model with advanced ML engines"""
    try:
        data = request.data.copy()
        
        # Security validation
        if not security_manager.validate_model_parameters(data.get('training_parameters', {})):
            return Response({
                'error': 'Invalid training parameters detected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sanitize model name
        if 'name' in data:
            data['name'] = security_manager.sanitize_model_name(data['name'])
        
        # Set advanced engine options
        engine_type = data.get('engine_type', 'traditional')
        if engine_type in ['deep_learning', 'automl', 'ensemble']:
            data['training_parameters']['use_advanced_engine'] = True
            data['training_parameters']['engine_type'] = engine_type
        
        # Create model
        serializer = MLModelCreateSerializer(data=data)
        if serializer.is_valid():
            model = serializer.save(user=request.user)
            
            # Log model creation
            security_manager.log_security_event(
                'model_created',
                str(request.user.id),
                {
                    'model_id': str(model.id),
                    'model_type': model.model_type,
                    'engine_type': engine_type,
                    'ip_address': request.META.get('REMOTE_ADDR')
                }
            )
            
            return Response({
                'message': 'Advanced model created successfully',
                'model_id': str(model.id),
                'engine_type': engine_type
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'error': f'Model creation failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_model_types(request):
    """Get available advanced model types and engines"""
    
    advanced_types = [
        {
            'engine_type': 'deep_learning',
            'name': 'Deep Learning Models',
            'description': 'Neural networks for complex pattern recognition',
            'model_types': ['lstm', 'cnn', 'transformer', 'dense'],
            'min_features': 5,
            'recommended_samples': 10000,
            'training_time': 'high',
            'accuracy_potential': 'very_high'
        },
        {
            'engine_type': 'automl',
            'name': 'AutoML Optimization',
            'description': 'Automated hyperparameter tuning and model selection',
            'algorithms': ['xgboost', 'lightgbm', 'random_forest', 'svm'],
            'min_features': 3,
            'recommended_samples': 1000,
            'training_time': 'medium',
            'accuracy_potential': 'high'
        },
        {
            'engine_type': 'ensemble',
            'name': 'Ensemble Methods',
            'description': 'Combine multiple models for better performance',
            'methods': ['voting', 'stacking'],
            'min_features': 3,
            'recommended_samples': 5000,
            'training_time': 'medium',
            'accuracy_potential': 'high'
        },
        {
            'engine_type': 'traditional',
            'name': 'Traditional ML',
            'description': 'Standard machine learning algorithms',
            'algorithms': ['random_forest', 'gradient_boosting', 'logistic_regression', 'svm'],
            'min_features': 1,
            'recommended_samples': 100,
            'training_time': 'low',
            'accuracy_potential': 'medium'
        }
    ]
    
    return Response({
        'advanced_types': advanced_types,
        'recommended_workflow': [
            'Start with traditional ML for baseline',
            'Use AutoML for hyperparameter optimization',
            'Try ensemble methods for improved performance',
            'Use deep learning for complex patterns'
        ]
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status(request):
    """Get system status and health metrics"""
    try:
        # Get basic stats
        total_models = MLModel.objects.count()
        active_training = TrainingJob.objects.filter(
            status__in=[TrainingJob.Status.QUEUED, TrainingJob.Status.RUNNING]
        ).count()
        
        # Get user stats
        user_models = MLModel.objects.filter(user=request.user).count()
        user_training = TrainingJob.objects.filter(
            model__user=request.user,
            status__in=[TrainingJob.Status.QUEUED, TrainingJob.Status.RUNNING]
        ).count()
        
        # System health indicators
        import os
        model_dir = os.path.join(settings.BASE_DIR, 'media', 'ml_models')
        model_files = len([f for f in os.listdir(model_dir) if f.startswith('model_')]) if os.path.exists(model_dir) else 0
        
        # Celery status
        celery_status = {
            'available': CELERY_AVAILABLE,
            'workers': {},
            'queues': {}
        }
        
        if CELERY_AVAILABLE:
            try:
                from celery import current_app
                inspect = current_app.control.inspect()
                
                # Get active workers
                active_workers = inspect.active()
                if active_workers:
                    celery_status['workers'] = {
                        'active': len(active_workers),
                        'details': active_workers
                    }
                
                # Get queue information
                reserved_tasks = inspect.reserved()
                active_tasks = inspect.active()
                if reserved_tasks or active_tasks:
                    celery_status['queues'] = {
                        'reserved_tasks': reserved_tasks or {},
                        'active_tasks': active_tasks or {}
                    }
                
            except Exception as celery_error:
                celery_status['error'] = str(celery_error)
        
        return Response({
            'system': {
                'status': 'healthy',
                'total_models': total_models,
                'active_training_jobs': active_training,
                'model_files': model_files,
                'celery': celery_status
            },
            'user': {
                'models': user_models,
                'active_training': user_training,
                'subscription_tier': getattr(request.user, 'subscription_tier', 'FREE')
            },
            'timestamp': timezone.now()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Status check failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_celery_training(request, model_id):
    """Start model training using Celery (alternative endpoint)"""
    if not CELERY_AVAILABLE:
        return Response({
            'error': 'Celery is not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        model = MLModel.objects.get(id=model_id, user=request.user)
        
        if model.status not in [MLModel.Status.DRAFT, MLModel.Status.FAILED]:
            return Response({
                'error': 'Model must be in DRAFT or FAILED status to start training'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create training job
        training_job = TrainingJob.objects.create(
            model=model,
            status=TrainingJob.Status.QUEUED
        )
        
        # Start Celery task
        task = celery_start_training.delay(str(model.id), str(training_job.id))
        
        # Update training job with task ID
        training_job.celery_task_id = task.id
        training_job.save()
        
        # Update model status
        model.status = MLModel.Status.TRAINING
        model.training_started_at = timezone.now()
        model.save()
        
        return Response({
            'message': 'Celery training started successfully',
            'training_job_id': str(training_job.id),
            'task_id': task.id,
            'model_id': str(model.id)
        }, status=status.HTTP_202_ACCEPTED)
        
    except MLModel.DoesNotExist:
        return Response({
            'error': 'Model not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to start Celery training: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def celery_worker_status(request):
    """Get detailed Celery worker status"""
    if not CELERY_AVAILABLE:
        return Response({
            'error': 'Celery is not available'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        from celery import current_app
        inspect = current_app.control.inspect()
        
        # Get comprehensive worker information
        worker_info = {
            'active_workers': inspect.active() or {},
            'reserved_tasks': inspect.reserved() or {},
            'scheduled_tasks': inspect.scheduled() or {},
            'worker_stats': inspect.stats() or {},
            'registered_tasks': inspect.registered() or {},
            'ping_results': inspect.ping() or {}
        }
        
        # Get queue lengths if using Redis
        queue_info = {}
        try:
            from django.conf import settings
            if 'redis' in settings.CELERY_BROKER_URL:
                import redis
                redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)
                
                # Get queue lengths for different queues
                queues = ['ml_training', 'trading', 'monitoring', 'maintenance', 'celery']
                for queue in queues:
                    try:
                        queue_length = redis_client.llen(queue)
                        queue_info[queue] = queue_length
                    except:
                        queue_info[queue] = 'unknown'
        except:
            queue_info = {'error': 'Could not get queue information'}
        
        return Response({
            'worker_info': worker_info,
            'queue_info': queue_info,
            'timestamp': timezone.now()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to get worker status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)