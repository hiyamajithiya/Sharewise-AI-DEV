"""
WebSocket consumers for AI Studio real-time features
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from .models import MLModel, TrainingJob, ModelLeasing
from .training_pipeline import get_training_progress

logger = logging.getLogger(__name__)


class AuthenticatedStudioConsumer(AsyncWebsocketConsumer):
    """Base consumer with authentication for AI Studio"""
    
    async def connect(self):
        """Handle WebSocket connection with authentication"""
        self.user = self.scope["user"]
        
        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return
        
        self.user_id = str(self.user.id)
        await self.accept()
        logger.info(f"AI Studio WebSocket connected: {self.__class__.__name__} for user {self.user.email}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"AI Studio WebSocket disconnected: {self.__class__.__name__} for user {self.user.email if hasattr(self, 'user') else 'unknown'}")
    
    async def send_error(self, error_message: str, error_code: str = None):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'error': error_message,
            'error_code': error_code,
            'timestamp': timezone.now().isoformat()
        }))


class ModelTrainingConsumer(AuthenticatedStudioConsumer):
    """Real-time model training progress updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.training_job_id = self.scope['url_route']['kwargs']['training_job_id']
            
            # Verify user owns this training job
            if await self.verify_training_job_ownership():
                self.group_name = f"training_{self.training_job_id}"
                await self.channel_layer.group_add(self.group_name, self.channel_name)
                
                # Send initial progress
                await self.send_training_progress()
            else:
                await self.close(code=4003)  # Forbidden
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def verify_training_job_ownership(self):
        """Verify user owns the training job"""
        try:
            job = TrainingJob.objects.get(
                id=self.training_job_id,
                model__user=self.user
            )
            return True
        except TrainingJob.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_training_job_info(self):
        """Get training job information"""
        try:
            job = TrainingJob.objects.get(id=self.training_job_id)
            return {
                'id': str(job.id),
                'model_id': str(job.model.id),
                'model_name': job.model.name,
                'status': job.status,
                'progress_percentage': job.progress_percentage,
                'current_step': job.current_step,
                'total_steps': job.total_steps,
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
                'error_message': job.error_message,
                'celery_task_id': job.celery_task_id
            }
        except TrainingJob.DoesNotExist:
            return None
    
    async def send_training_progress(self):
        """Send current training progress"""
        job_info = await self.get_training_job_info()
        if job_info:
            # Also get progress from training pipeline
            progress_data = get_training_progress(self.training_job_id)
            
            await self.send(text_data=json.dumps({
                'type': 'training_progress',
                'job': job_info,
                'progress': progress_data,
                'timestamp': timezone.now().isoformat()
            }))
    
    async def receive(self, text_data):
        """Handle incoming messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_progress':
                await self.send_training_progress()
            elif message_type == 'cancel_training':
                await self.cancel_training()
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
    
    @database_sync_to_async
    def cancel_training_job(self):
        """Cancel the training job"""
        try:
            job = TrainingJob.objects.get(id=self.training_job_id)
            if job.status in [TrainingJob.Status.QUEUED, TrainingJob.Status.RUNNING]:
                job.status = TrainingJob.Status.CANCELLED
                job.completed_at = timezone.now()
                job.error_message = "Cancelled by user via WebSocket"
                job.save()
                
                # Update model status
                job.model.status = MLModel.Status.DRAFT
                job.model.save()
                
                return True
            return False
        except TrainingJob.DoesNotExist:
            return False
    
    async def cancel_training(self):
        """Handle training cancellation request"""
        success = await self.cancel_training_job()
        
        if success:
            await self.send(text_data=json.dumps({
                'type': 'training_cancelled',
                'message': 'Training job cancelled successfully',
                'timestamp': timezone.now().isoformat()
            }))
        else:
            await self.send_error("Failed to cancel training job")
    
    # WebSocket event handlers
    async def training_update(self, event):
        """Handle training progress update event"""
        await self.send(text_data=json.dumps({
            'type': 'training_update',
            'progress': event['progress'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def training_completed(self, event):
        """Handle training completion event"""
        await self.send(text_data=json.dumps({
            'type': 'training_completed',
            'result': event['result'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def training_failed(self, event):
        """Handle training failure event"""
        await self.send(text_data=json.dumps({
            'type': 'training_failed',
            'error': event['error'],
            'timestamp': timezone.now().isoformat()
        }))


class ModelMonitoringConsumer(AuthenticatedStudioConsumer):
    """Real-time model performance monitoring"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.model_id = self.scope['url_route']['kwargs']['model_id']
            
            # Verify user owns this model
            if await self.verify_model_ownership():
                self.group_name = f"monitoring_{self.model_id}"
                await self.channel_layer.group_add(self.group_name, self.channel_name)
                
                # Send initial model status
                await self.send_model_status()
            else:
                await self.close(code=4003)  # Forbidden
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def verify_model_ownership(self):
        """Verify user owns the model"""
        try:
            model = MLModel.objects.get(id=self.model_id, user=self.user)
            return True
        except MLModel.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_model_status(self):
        """Get current model status and metrics"""
        try:
            model = MLModel.objects.get(id=self.model_id)
            return {
                'id': str(model.id),
                'name': model.name,
                'status': model.status,
                'model_type': model.model_type,
                'accuracy': model.accuracy,
                'precision': model.precision,
                'recall': model.recall,
                'f1_score': model.f1_score,
                'auc_roc': model.auc_roc,
                'total_return': model.total_return,
                'sharpe_ratio': model.sharpe_ratio,
                'win_rate': model.win_rate,
                'is_published': model.is_published,
                'total_leases': model.total_leases,
                'total_earnings': float(model.total_earnings),
                'created_at': model.created_at.isoformat(),
                'training_completed_at': model.training_completed_at.isoformat() if model.training_completed_at else None
            }
        except MLModel.DoesNotExist:
            return None
    
    async def send_model_status(self):
        """Send current model status"""
        model_status = await self.get_model_status()
        if model_status:
            await self.send(text_data=json.dumps({
                'type': 'model_status',
                'model': model_status,
                'timestamp': timezone.now().isoformat()
            }))
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_status':
                await self.send_model_status()
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
    
    # WebSocket event handlers
    async def model_update(self, event):
        """Handle model update event"""
        await self.send(text_data=json.dumps({
            'type': 'model_update',
            'update': event['update'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def performance_alert(self, event):
        """Handle performance alert event"""
        await self.send(text_data=json.dumps({
            'type': 'performance_alert',
            'alert': event['alert'],
            'severity': event['severity'],
            'timestamp': timezone.now().isoformat()
        }))


class StudioDashboardConsumer(AuthenticatedStudioConsumer):
    """Real-time AI Studio dashboard updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"studio_dashboard_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.send_dashboard_data()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def get_dashboard_data(self):
        """Get dashboard summary data"""
        user_models = MLModel.objects.filter(user=self.user)
        
        return {
            'total_models': user_models.count(),
            'published_models': user_models.filter(is_published=True).count(),
            'training_models': user_models.filter(status=MLModel.Status.TRAINING).count(),
            'completed_models': user_models.filter(status=MLModel.Status.COMPLETED).count(),
            'total_earnings': float(sum(model.total_earnings for model in user_models)),
            'active_leases': ModelLeasing.objects.filter(
                model__user=self.user, 
                status=ModelLeasing.Status.ACTIVE
            ).count(),
            'recent_training_jobs': TrainingJob.objects.filter(
                model__user=self.user
            ).order_by('-queued_at')[:5].count()
        }
    
    async def send_dashboard_data(self):
        """Send current dashboard data"""
        dashboard = await self.get_dashboard_data()
        
        await self.send(text_data=json.dumps({
            'type': 'dashboard_data',
            'dashboard': dashboard,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_dashboard':
                await self.send_dashboard_data()
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
    
    # WebSocket event handlers
    async def dashboard_update(self, event):
        """Handle dashboard update event"""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'update': event['update'],
            'timestamp': timezone.now().isoformat()
        }))


class MarketplaceNotificationsConsumer(AuthenticatedStudioConsumer):
    """Real-time marketplace notifications"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"marketplace_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def model_leased(self, event):
        """Handle model lease notification"""
        await self.send(text_data=json.dumps({
            'type': 'model_leased',
            'lease': event['lease'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def earnings_update(self, event):
        """Handle earnings update notification"""
        await self.send(text_data=json.dumps({
            'type': 'earnings_update',
            'earnings': event['earnings'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def model_review(self, event):
        """Handle new model review notification"""
        await self.send(text_data=json.dumps({
            'type': 'model_review',
            'review': event['review'],
            'timestamp': timezone.now().isoformat()
        }))


class ModelPredictionsConsumer(AuthenticatedStudioConsumer):
    """Real-time model predictions stream"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.model_id = self.scope['url_route']['kwargs']['model_id']
            
            # Verify user owns or has leased this model
            if await self.verify_model_access():
                self.group_name = f"predictions_{self.model_id}"
                await self.channel_layer.group_add(self.group_name, self.channel_name)
            else:
                await self.close(code=4003)  # Forbidden
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def verify_model_access(self):
        """Verify user owns or has leased the model"""
        try:
            # Check if user owns the model
            model = MLModel.objects.get(id=self.model_id, user=self.user)
            return True
        except MLModel.DoesNotExist:
            # Check if user has active lease for the model
            try:
                lease = ModelLeasing.objects.get(
                    model_id=self.model_id,
                    lessee=self.user,
                    status=ModelLeasing.Status.ACTIVE
                )
                return lease.is_active()
            except ModelLeasing.DoesNotExist:
                return False
    
    # WebSocket event handlers
    async def new_prediction(self, event):
        """Handle new prediction event"""
        await self.send(text_data=json.dumps({
            'type': 'new_prediction',
            'prediction': event['prediction'],
            'timestamp': timezone.now().isoformat()
        }))


class BacktestProgressConsumer(AuthenticatedStudioConsumer):
    """Real-time backtesting progress updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.model_id = self.scope['url_route']['kwargs']['model_id']
            
            # Verify user owns this model
            if await self.verify_model_ownership():
                self.group_name = f"backtest_{self.model_id}"
                await self.channel_layer.group_add(self.group_name, self.channel_name)
            else:
                await self.close(code=4003)  # Forbidden
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def verify_model_ownership(self):
        """Verify user owns the model"""
        try:
            model = MLModel.objects.get(id=self.model_id, user=self.user)
            return True
        except MLModel.DoesNotExist:
            return False
    
    # WebSocket event handlers
    async def backtest_progress(self, event):
        """Handle backtest progress update"""
        await self.send(text_data=json.dumps({
            'type': 'backtest_progress',
            'progress': event['progress'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def backtest_completed(self, event):
        """Handle backtest completion"""
        await self.send(text_data=json.dumps({
            'type': 'backtest_completed',
            'results': event['results'],
            'timestamp': timezone.now().isoformat()
        }))


class SystemHealthConsumer(AuthenticatedStudioConsumer):
    """Real-time system health and worker status updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = "system_health"  # Global group
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def system_status_update(self, event):
        """Handle system status update"""
        await self.send(text_data=json.dumps({
            'type': 'system_status_update',
            'status': event['status'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def worker_status_update(self, event):
        """Handle worker status update"""
        await self.send(text_data=json.dumps({
            'type': 'worker_status_update',
            'workers': event['workers'],
            'timestamp': timezone.now().isoformat()
        }))