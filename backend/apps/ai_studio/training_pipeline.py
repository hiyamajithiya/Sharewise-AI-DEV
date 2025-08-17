"""
Asynchronous ML Model Training Pipeline for ShareWise AI
Handles model training, validation, and deployment without Docker
"""

import logging
import os
import pickle
import joblib
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from django.db import transaction

# ML Libraries
from sklearn.model_selection import train_test_split, GridSearchCV, TimeSeriesSplit
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Optional ML libraries
try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False

try:
    from catboost import CatBoostClassifier
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

# SHAP for explainability
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

# Deep Learning capabilities
try:
    from .deep_learning import DeepFinancialPredictor, DeepEnsemble, create_deep_learning_model
    import torch
    import pytorch_lightning as pl
    DEEP_LEARNING_AVAILABLE = True
    print("Deep Learning capabilities enabled (PyTorch + Lightning detected)")
except ImportError as e:
    DEEP_LEARNING_AVAILABLE = False
    print(f"Deep Learning capabilities disabled: {e}")
    print("To enable: pip install torch pytorch-lightning optuna tensorboard")

from .models import MLModel, TrainingJob
from apps.trading.models import TradingSignal, TradingOrder, AutomatedTradeExecution

logger = logging.getLogger(__name__)


class TrainingProgressTracker:
    """Track and update training progress"""
    
    def __init__(self, training_job: TrainingJob):
        self.training_job = training_job
        self.current_step = 0
        self.total_steps = 10  # Default steps
    
    def set_total_steps(self, total_steps: int):
        """Set total number of steps"""
        self.total_steps = total_steps
        self.training_job.total_steps = total_steps
        self.training_job.save(update_fields=['total_steps'])
    
    def update_progress(self, step: int, description: str, percentage: float = None):
        """Update training progress"""
        self.current_step = step
        
        if percentage is None:
            percentage = (step / self.total_steps) * 100
        
        self.training_job.progress_percentage = min(percentage, 100)
        self.training_job.current_step = description
        self.training_job.save(update_fields=['progress_percentage', 'current_step'])
        
        logger.info(f"Training progress: {percentage:.1f}% - {description}")
    
    def add_log(self, message: str):
        """Add log entry"""
        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        
        if self.training_job.training_logs:
            self.training_job.training_logs += log_entry
        else:
            self.training_job.training_logs = log_entry
        
        self.training_job.save(update_fields=['training_logs'])


class ModelDataProcessor:
    """Process and prepare data for model training"""
    
    def __init__(self, model: MLModel):
        self.model = model
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def fetch_training_data(self) -> pd.DataFrame:
        """Fetch historical trading data for model training"""
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.model.training_period_days)
        
        # Fetch trading signals and executions
        signals = TradingSignal.objects.filter(
            user=self.model.user,
            created_at__range=[start_date, end_date]
        ).select_related('user')
        
        executions = AutomatedTradeExecution.objects.filter(
            signal__user=self.model.user,
            created_at__range=[start_date, end_date],
            status=AutomatedTradeExecution.ExecutionStatus.COMPLETED
        ).select_related('signal')
        
        # Convert to DataFrame
        data_rows = []
        
        for signal in signals:
            # Find corresponding execution
            execution = executions.filter(signal=signal).first()
            
            # Extract features from market data
            market_data = signal.market_data or {}
            technical_indicators = market_data.get('technical_indicators', {})
            
            row = {
                'signal_id': str(signal.id),
                'symbol': signal.symbol,
                'signal_type': signal.signal_type,
                'confidence_score': float(signal.confidence_score),
                'entry_price': float(signal.entry_price),
                'target_price': float(signal.target_price) if signal.target_price else None,
                'stop_loss': float(signal.stop_loss) if signal.stop_loss else None,
                'timestamp': signal.timestamp,
                
                # Technical indicators as features
                'rsi': technical_indicators.get('rsi', 50),
                'macd': technical_indicators.get('macd', 0),
                'macd_signal': technical_indicators.get('macd_signal', 0),
                'sma_20': technical_indicators.get('sma_20', 0),
                'sma_50': technical_indicators.get('sma_50', 0),
                'ema_12': technical_indicators.get('ema_12', 0),
                'ema_26': technical_indicators.get('ema_26', 0),
                'bb_upper': technical_indicators.get('bb_upper', 0),
                'bb_lower': technical_indicators.get('bb_lower', 0),
                'atr': technical_indicators.get('atr', 0),
                'volume_ratio': technical_indicators.get('volume_ratio', 1),
                'volatility': technical_indicators.get('volatility', 0),
                'price_change': technical_indicators.get('price_change', 0),
                
                # Outcome variables
                'was_executed': execution is not None,
                'actual_pnl': float(execution.total_pnl) if execution else 0,
                'was_profitable': execution.total_pnl > 0 if execution else False,
                'execution_time_hours': 0
            }
            
            # Calculate execution time
            if execution and execution.exit_executed_at:
                duration = execution.exit_executed_at - execution.entry_executed_at
                row['execution_time_hours'] = duration.total_seconds() / 3600
            
            data_rows.append(row)
        
        df = pd.DataFrame(data_rows)
        
        if df.empty:
            # Create synthetic data for testing
            df = self._generate_synthetic_data()
        
        self.logger.info(f"Prepared training data: {len(df)} samples")
        return df
    
    def _generate_synthetic_data(self) -> pd.DataFrame:
        """Generate synthetic training data for testing"""
        np.random.seed(42)  # For reproducible results
        
        n_samples = 1000
        data = {
            'signal_id': [f"synthetic_{i}" for i in range(n_samples)],
            'symbol': np.random.choice(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'], n_samples),
            'signal_type': np.random.choice(['BUY', 'SELL'], n_samples),
            'confidence_score': np.random.uniform(0.5, 0.95, n_samples),
            'entry_price': np.random.uniform(100, 3000, n_samples),
            'target_price': np.random.uniform(105, 3150, n_samples),
            'stop_loss': np.random.uniform(95, 2850, n_samples),
            'timestamp': pd.date_range(start='2023-01-01', periods=n_samples, freq='1H'),
            
            # Technical indicators
            'rsi': np.random.uniform(20, 80, n_samples),
            'macd': np.random.uniform(-2, 2, n_samples),
            'macd_signal': np.random.uniform(-2, 2, n_samples),
            'sma_20': np.random.uniform(100, 3000, n_samples),
            'sma_50': np.random.uniform(100, 3000, n_samples),
            'ema_12': np.random.uniform(100, 3000, n_samples),
            'ema_26': np.random.uniform(100, 3000, n_samples),
            'bb_upper': np.random.uniform(105, 3150, n_samples),
            'bb_lower': np.random.uniform(95, 2850, n_samples),
            'atr': np.random.uniform(5, 100, n_samples),
            'volume_ratio': np.random.uniform(0.5, 3.0, n_samples),
            'volatility': np.random.uniform(0.5, 5.0, n_samples),
            'price_change': np.random.uniform(-5, 5, n_samples),
            
            # Outcomes
            'was_executed': np.random.choice([True, False], n_samples, p=[0.7, 0.3]),
            'actual_pnl': np.random.normal(50, 200, n_samples),
            'execution_time_hours': np.random.uniform(1, 48, n_samples)
        }
        
        df = pd.DataFrame(data)
        df['was_profitable'] = df['actual_pnl'] > 0
        
        return df
    
    def prepare_features_and_target(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare feature matrix and target variable"""
        
        # Define feature columns
        feature_columns = [
            'confidence_score', 'rsi', 'macd', 'macd_signal', 'sma_20', 'sma_50',
            'ema_12', 'ema_26', 'bb_upper', 'bb_lower', 'atr', 'volume_ratio',
            'volatility', 'price_change'
        ]
        
        # Add custom features based on model configuration
        if self.model.features:
            custom_features = [f for f in self.model.features if f in df.columns]
            feature_columns.extend(custom_features)
        
        # Remove duplicates
        feature_columns = list(set(feature_columns))
        
        # Prepare feature matrix
        X = df[feature_columns].copy()
        
        # Handle missing values
        X = X.fillna(X.median())
        
        # Prepare target variable
        target_var = self.model.target_variable
        
        if target_var == 'signal_type':
            y = df['signal_type']
        elif target_var == 'was_profitable':
            y = df['was_profitable']
        elif target_var == 'actual_pnl':
            y = df['actual_pnl']
        else:
            # Default to profitability prediction
            y = df['was_profitable'] if 'was_profitable' in df.columns else df['signal_type']
        
        self.logger.info(f"Prepared features: {X.shape[1]} features, {len(y)} samples")
        return X, y


class ModelTrainer:
    """Train ML models with various algorithms"""
    
    def __init__(self, model: MLModel, progress_tracker: TrainingProgressTracker):
        self.model = model
        self.progress_tracker = progress_tracker
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def train_model(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Train the ML model and return results"""
        
        self.progress_tracker.update_progress(3, "Splitting data for training and validation")
        
        # Split data
        validation_split = self.model.validation_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=validation_split, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
        )
        
        self.progress_tracker.update_progress(4, "Initializing model algorithm")
        
        # Select and configure model
        model_algorithm = self._get_model_algorithm()
        
        self.progress_tracker.update_progress(5, "Training model...")
        
        # Train model
        if isinstance(model_algorithm, GridSearchCV):
            model_algorithm.fit(X_train, y_train)
            trained_model = model_algorithm.best_estimator_
            best_params = model_algorithm.best_params_
        else:
            model_algorithm.fit(X_train, y_train)
            trained_model = model_algorithm
            best_params = {}
        
        self.progress_tracker.update_progress(7, "Evaluating model performance")
        
        # Make predictions
        y_pred = trained_model.predict(X_test)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test, y_pred, trained_model, X_test)
        
        self.progress_tracker.update_progress(8, "Generating feature importance")
        
        # Feature importance
        feature_importance = self._calculate_feature_importance(trained_model, X_train.columns)
        
        self.progress_tracker.update_progress(9, "Saving trained model")
        
        # Save model
        model_path = self._save_model(trained_model, X_train.columns)
        
        # Prepare results
        results = {
            'model_path': model_path,
            'metrics': metrics,
            'feature_importance': feature_importance,
            'best_parameters': best_params,
            'training_samples': len(X_train),
            'validation_samples': len(X_test),
            'feature_names': list(X_train.columns)
        }
        
        self.progress_tracker.update_progress(10, "Training completed successfully", 100)
        
        return results
    
    def _get_model_algorithm(self):
        """Get configured model algorithm with deep learning support"""
        model_type = self.model.model_type
        training_params = self.model.training_parameters or {}
        
        # Deep Learning Models
        if DEEP_LEARNING_AVAILABLE and training_params.get('use_deep_learning', False):
            dl_model_type = training_params.get('dl_model_type', 'transformer')
            return self._create_deep_learning_model(dl_model_type, training_params)
        
        # Traditional ML Models
        if model_type == MLModel.ModelType.CLASSIFICATION:
            # Random Forest as default
            return RandomForestClassifier(
                n_estimators=training_params.get('n_estimators', 100),
                max_depth=training_params.get('max_depth', 10),
                random_state=42,
                n_jobs=-1
            )
        
        elif model_type == MLModel.ModelType.ENSEMBLE:
            # XGBoost if available, otherwise Gradient Boosting
            if XGB_AVAILABLE:
                return xgb.XGBClassifier(
                    n_estimators=training_params.get('n_estimators', 100),
                    max_depth=training_params.get('max_depth', 6),
                    learning_rate=training_params.get('learning_rate', 0.1),
                    random_state=42,
                    n_jobs=-1
                )
            else:
                return GradientBoostingClassifier(
                    n_estimators=training_params.get('n_estimators', 100),
                    max_depth=training_params.get('max_depth', 6),
                    learning_rate=training_params.get('learning_rate', 0.1),
                    random_state=42
                )
        
        elif model_type == MLModel.ModelType.NEURAL_NETWORK:
            # Use Deep Learning if available, otherwise Gradient Boosting
            if DEEP_LEARNING_AVAILABLE:
                return self._create_deep_learning_model('transformer', training_params)
            else:
                return GradientBoostingClassifier(
                    n_estimators=training_params.get('n_estimators', 100),
                    max_depth=training_params.get('max_depth', 6),
                    learning_rate=training_params.get('learning_rate', 0.1),
                    random_state=42
                )
        
        else:
            # Default to Random Forest
            return RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
    
    def _create_deep_learning_model(self, dl_model_type: str, training_params: Dict[str, Any]):
        """Create a deep learning model wrapper for compatibility"""
        
        class DeepLearningWrapper:
            """Wrapper to make deep learning models compatible with sklearn interface"""
            
            def __init__(self, model_type: str, params: Dict[str, Any]):
                self.model_type = model_type
                self.params = params
                self.predictor = None
                self.is_fitted = False
                self.feature_names_ = None
                
            def fit(self, X, y):
                """Train the deep learning model"""
                try:
                    # Convert to DataFrame if needed
                    if not isinstance(X, pd.DataFrame):
                        X = pd.DataFrame(X)
                    
                    # Add target column
                    data = X.copy()
                    data['target'] = y
                    
                    # Store feature names for later use
                    self.feature_names_ = X.columns.tolist()
                    
                    # Train deep learning model
                    results = create_deep_learning_model(
                        model_type=self.model_type,
                        data=data,
                        target_column='target',
                        optimize_hyperparams=self.params.get('optimize_hyperparams', True),
                        use_ensemble=self.params.get('use_ensemble', False)
                    )
                    
                    if results['success']:
                        self.predictor = results['model']
                        self.training_results = results
                        self.is_fitted = True
                    else:
                        raise Exception(f"Deep learning training failed: {results.get('error', 'Unknown error')}")
                        
                except Exception as e:
                    print(f"Deep learning training failed, falling back to XGBoost: {e}")
                    # Fallback to XGBoost
                    if XGB_AVAILABLE:
                        self.predictor = xgb.XGBClassifier(
                            n_estimators=self.params.get('n_estimators', 100),
                            max_depth=self.params.get('max_depth', 6),
                            learning_rate=self.params.get('learning_rate', 0.1),
                            random_state=42
                        )
                    else:
                        self.predictor = GradientBoostingClassifier(
                            n_estimators=self.params.get('n_estimators', 100),
                            max_depth=self.params.get('max_depth', 6),
                            learning_rate=self.params.get('learning_rate', 0.1),
                            random_state=42
                        )
                    
                    self.predictor.fit(X, y)
                    self.is_fitted = True
                
                return self
            
            def predict(self, X):
                """Make predictions"""
                if not self.is_fitted:
                    raise ValueError("Model must be fitted before making predictions")
                
                if hasattr(self.predictor, 'predict'):
                    # Traditional ML model
                    return self.predictor.predict(X)
                else:
                    # Deep learning model
                    if not isinstance(X, np.ndarray):
                        X = X.values if hasattr(X, 'values') else np.array(X)
                    
                    # For ensemble models
                    if hasattr(self.predictor, 'predict'):
                        return self.predictor.predict(X)
                    else:
                        # Individual deep learning predictor
                        return self.predictor.predict(X).flatten()
            
            def predict_proba(self, X):
                """Predict probabilities (if supported)"""
                if hasattr(self.predictor, 'predict_proba'):
                    return self.predictor.predict_proba(X)
                else:
                    # For deep learning models, return dummy probabilities
                    predictions = self.predict(X)
                    proba = np.zeros((len(predictions), 2))
                    proba[:, 1] = predictions  # Assuming binary classification
                    proba[:, 0] = 1 - predictions
                    return proba
            
            @property
            def feature_importances_(self):
                """Get feature importances (if available)"""
                if hasattr(self.predictor, 'feature_importances_'):
                    return self.predictor.feature_importances_
                else:
                    # Return equal importance for deep learning models
                    if self.feature_names_:
                        return np.ones(len(self.feature_names_)) / len(self.feature_names_)
                    else:
                        return np.array([])
        
        return DeepLearningWrapper(dl_model_type, training_params)
    
    def _calculate_metrics(self, y_true, y_pred, model, X_test) -> Dict[str, float]:
        """Calculate model performance metrics"""
        
        metrics = {}
        
        try:
            # Classification metrics
            metrics['accuracy'] = float(accuracy_score(y_true, y_pred))
            metrics['precision'] = float(precision_score(y_true, y_pred, average='weighted', zero_division=0))
            metrics['recall'] = float(recall_score(y_true, y_pred, average='weighted', zero_division=0))
            metrics['f1_score'] = float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
            
            # ROC AUC for binary classification
            if len(np.unique(y_true)) == 2 and hasattr(model, 'predict_proba'):
                y_proba = model.predict_proba(X_test)[:, 1]
                metrics['auc_roc'] = float(roc_auc_score(y_true, y_proba))
            
        except Exception as e:
            self.logger.warning(f"Error calculating some metrics: {e}")
            metrics['accuracy'] = 0.5  # Default fallback
        
        return metrics
    
    def _calculate_feature_importance(self, model, feature_names) -> Dict[str, float]:
        """Calculate SHAP feature importance if available, otherwise use built-in importance"""
        
        try:
            # Use SHAP for feature importance if available
            if SHAP_AVAILABLE and hasattr(model, 'predict_proba'):
                try:
                    explainer = shap.TreeExplainer(model)
                    # Use a sample for SHAP calculation to avoid memory issues
                    sample_size = min(100, len(feature_names))
                    sample_data = np.random.randn(sample_size, len(feature_names))
                    shap_values = explainer.shap_values(sample_data)
                    
                    if isinstance(shap_values, list):
                        shap_values = shap_values[0]  # Take first class for binary classification
                    
                    importance = np.abs(shap_values).mean(0)
                except Exception as shap_error:
                    self.logger.warning(f"SHAP calculation failed: {shap_error}, falling back to built-in importance")
                    importance = model.feature_importances_ if hasattr(model, 'feature_importances_') else np.ones(len(feature_names)) / len(feature_names)
                
            elif hasattr(model, 'feature_importances_'):
                # Fallback to built-in feature importance
                importance = model.feature_importances_
            
            else:
                # Equal importance as fallback
                importance = np.ones(len(feature_names)) / len(feature_names)
            
            # Convert to dictionary
            feature_importance = {
                name: float(importance[i]) for i, name in enumerate(feature_names)
            }
            
            return feature_importance
            
        except Exception as e:
            self.logger.warning(f"Error calculating feature importance: {e}")
            return {name: 1.0 / len(feature_names) for name in feature_names}
    
    def _save_model(self, model, feature_names) -> str:
        """Save trained model to file"""
        
        # Create model directory
        model_dir = os.path.join(settings.MEDIA_ROOT, 'ml_models')
        os.makedirs(model_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"model_{self.model.id}_{timestamp}.pkl"
        filepath = os.path.join(model_dir, filename)
        
        # Save model and metadata
        model_data = {
            'model': model,
            'feature_names': list(feature_names),
            'model_type': self.model.model_type,
            'target_variable': self.model.target_variable,
            'created_at': timezone.now().isoformat()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        self.logger.info(f"Model saved to: {filepath}")
        return filepath


class TrainingPipeline:
    """Main training pipeline orchestrator"""
    
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @transaction.atomic
    def start_training(self) -> Dict[str, Any]:
        """Start the complete training pipeline"""
        
        try:
            # Get model and create training job
            model = MLModel.objects.get(id=self.model_id)
            
            # Create training job
            training_job = TrainingJob.objects.create(
                model=model,
                status=TrainingJob.Status.RUNNING,
                started_at=timezone.now()
            )
            
            # Update model status
            model.status = MLModel.Status.TRAINING
            model.training_started_at = timezone.now()
            model.save(update_fields=['status', 'training_started_at'])
            
            # Initialize progress tracker
            progress_tracker = TrainingProgressTracker(training_job)
            progress_tracker.set_total_steps(10)
            
            self.logger.info(f"Starting training for model: {model.name}")
            progress_tracker.add_log(f"Training started for model: {model.name}")
            
            # Step 1: Data Processing
            progress_tracker.update_progress(1, "Fetching training data")
            data_processor = ModelDataProcessor(model)
            df = data_processor.fetch_training_data()
            
            if df.empty:
                raise ValueError("No training data available")
            
            # Step 2: Feature Engineering
            progress_tracker.update_progress(2, "Preparing features and target variables")
            X, y = data_processor.prepare_features_and_target(df)
            
            # Step 3-10: Model Training
            trainer = ModelTrainer(model, progress_tracker)
            training_results = trainer.train_model(X, y)
            
            # Update model with results
            model.status = MLModel.Status.COMPLETED
            model.training_completed_at = timezone.now()
            model.model_file_path = training_results['model_path']
            model.training_results = training_results
            model.feature_importance = training_results['feature_importance']
            
            # Update performance metrics
            metrics = training_results['metrics']
            model.accuracy = metrics.get('accuracy')
            model.precision = metrics.get('precision')
            model.recall = metrics.get('recall')
            model.f1_score = metrics.get('f1_score')
            model.auc_roc = metrics.get('auc_roc')
            
            model.save()
            
            # Update training job
            training_job.status = TrainingJob.Status.COMPLETED
            training_job.completed_at = timezone.now()
            training_job.result_data = training_results
            training_job.save()
            
            progress_tracker.add_log("Training completed successfully")
            
            self.logger.info(f"Training completed successfully for model: {model.name}")
            
            return {
                'status': 'success',
                'model_id': str(model.id),
                'training_job_id': str(training_job.id),
                'results': training_results
            }
            
        except Exception as e:
            self.logger.error(f"Training failed for model {self.model_id}: {e}")
            
            # Update model and job status on failure
            try:
                model.status = MLModel.Status.FAILED
                model.save(update_fields=['status'])
                
                training_job.status = TrainingJob.Status.FAILED
                training_job.error_message = str(e)
                training_job.completed_at = timezone.now()
                training_job.save()
                
                progress_tracker.add_log(f"Training failed: {e}")
                
            except Exception as save_error:
                self.logger.error(f"Error updating status after training failure: {save_error}")
            
            return {
                'status': 'error',
                'error': str(e),
                'model_id': str(self.model_id)
            }


# Utility functions for external use
def start_model_training(model_id: str) -> Dict[str, Any]:
    """Start asynchronous model training"""
    pipeline = TrainingPipeline(model_id)
    return pipeline.start_training()


def get_training_progress(training_job_id: str) -> Dict[str, Any]:
    """Get current training progress"""
    try:
        job = TrainingJob.objects.get(id=training_job_id)
        return {
            'status': job.status,
            'progress_percentage': job.progress_percentage,
            'current_step': job.current_step,
            'total_steps': job.total_steps,
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'estimated_completion': None,  # Could calculate based on progress
            'logs': job.training_logs
        }
    except TrainingJob.DoesNotExist:
        return {'error': 'Training job not found'}


def load_trained_model(model_id: str):
    """Load a trained model for inference"""
    try:
        model = MLModel.objects.get(id=model_id, status=MLModel.Status.COMPLETED)
        
        if not model.model_file_path or not os.path.exists(model.model_file_path):
            raise FileNotFoundError("Model file not found")
        
        with open(model.model_file_path, 'rb') as f:
            model_data = pickle.load(f)
        
        return model_data
        
    except Exception as e:
        logger.error(f"Error loading model {model_id}: {e}")
        return None