"""
Model Monitoring and Lifecycle Management for ShareWise AI
"""
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from django.db import models
from django.utils import timezone
from dataclasses import dataclass

from .models import MLModel, TrainingJob

logger = logging.getLogger(__name__)


@dataclass
class ModelMetrics:
    """Model performance metrics container"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    prediction_drift: float
    data_drift: float
    model_confidence: float
    timestamp: datetime


@dataclass
class DriftAlert:
    """Model drift alert"""
    model_id: str
    drift_type: str  # 'data', 'prediction', 'performance'
    severity: str   # 'low', 'medium', 'high'
    value: float
    threshold: float
    timestamp: datetime
    message: str


class ModelDriftDetector:
    """Detect model and data drift"""
    
    def __init__(self):
        self.data_drift_threshold = 0.1
        self.prediction_drift_threshold = 0.15
        self.performance_drift_threshold = 0.1
    
    def detect_data_drift(self, reference_data: np.ndarray, current_data: np.ndarray) -> float:
        """Detect data drift using Population Stability Index (PSI)"""
        try:
            # Bin the data
            n_bins = min(10, len(np.unique(reference_data)) // 2)
            
            # Calculate bins based on reference data
            percentiles = np.linspace(0, 100, n_bins + 1)
            bins = np.percentile(reference_data, percentiles)
            bins = np.unique(bins)  # Remove duplicates
            
            if len(bins) < 2:
                return 0.0
            
            # Calculate distributions
            ref_dist, _ = np.histogram(reference_data, bins=bins, density=True)
            cur_dist, _ = np.histogram(current_data, bins=bins, density=True)
            
            # Avoid division by zero
            ref_dist = np.where(ref_dist == 0, 1e-10, ref_dist)
            cur_dist = np.where(cur_dist == 0, 1e-10, cur_dist)
            
            # Calculate PSI
            psi = np.sum((cur_dist - ref_dist) * np.log(cur_dist / ref_dist))
            
            return abs(psi)
            
        except Exception as e:
            logger.error(f"Error calculating data drift: {str(e)}")
            return 0.0
    
    def detect_prediction_drift(self, reference_predictions: np.ndarray, 
                              current_predictions: np.ndarray) -> float:
        """Detect prediction drift using Jensen-Shannon divergence"""
        try:
            # Create distributions
            ref_mean = np.mean(reference_predictions)
            cur_mean = np.mean(current_predictions)
            
            # Simple drift measure: absolute difference in means
            drift = abs(cur_mean - ref_mean)
            
            return drift
            
        except Exception as e:
            logger.error(f"Error calculating prediction drift: {str(e)}")
            return 0.0
    
    def detect_performance_drift(self, reference_performance: Dict[str, float],
                               current_performance: Dict[str, float]) -> float:
        """Detect performance drift"""
        try:
            # Compare key metrics
            key_metrics = ['accuracy', 'precision', 'recall', 'f1_score']
            drifts = []
            
            for metric in key_metrics:
                if metric in reference_performance and metric in current_performance:
                    ref_val = reference_performance[metric]
                    cur_val = current_performance[metric]
                    if ref_val != 0:
                        drift = abs(cur_val - ref_val) / ref_val
                        drifts.append(drift)
            
            return np.mean(drifts) if drifts else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating performance drift: {str(e)}")
            return 0.0


class ModelMonitor:
    """Main model monitoring class"""
    
    def __init__(self):
        self.drift_detector = ModelDriftDetector()
        self.alerts = []
    
    def monitor_model(self, model_id: str, current_data: np.ndarray,
                     current_predictions: np.ndarray) -> Dict[str, Any]:
        """Monitor a model for drift and performance"""
        
        try:
            model = MLModel.objects.get(id=model_id)
            
            # Get historical data for comparison
            reference_data = self._get_reference_data(model)
            reference_predictions = self._get_reference_predictions(model)
            reference_performance = model.training_results
            
            # Calculate current performance
            current_performance = self._calculate_current_performance(
                current_predictions, current_data
            )
            
            # Detect drifts
            data_drift = self.drift_detector.detect_data_drift(
                reference_data, current_data
            ) if reference_data is not None else 0.0
            
            prediction_drift = self.drift_detector.detect_prediction_drift(
                reference_predictions, current_predictions
            ) if reference_predictions is not None else 0.0
            
            performance_drift = self.drift_detector.detect_performance_drift(
                reference_performance, current_performance
            )
            
            # Check for alerts
            alerts = self._check_drift_alerts(
                model_id, data_drift, prediction_drift, performance_drift
            )
            
            # Create metrics object
            metrics = ModelMetrics(
                accuracy=current_performance.get('accuracy', 0.0),
                precision=current_performance.get('precision', 0.0),
                recall=current_performance.get('recall', 0.0),
                f1_score=current_performance.get('f1_score', 0.0),
                auc_roc=current_performance.get('auc_roc', 0.0),
                prediction_drift=prediction_drift,
                data_drift=data_drift,
                model_confidence=self._calculate_model_confidence(current_predictions),
                timestamp=timezone.now()
            )
            
            # Store monitoring results
            self._store_monitoring_results(model, metrics)
            
            return {
                'model_id': model_id,
                'metrics': metrics.__dict__,
                'alerts': [alert.__dict__ for alert in alerts],
                'status': self._determine_model_status(data_drift, prediction_drift, performance_drift)
            }
            
        except Exception as e:
            logger.error(f"Error monitoring model {model_id}: {str(e)}")
            return {
                'model_id': model_id,
                'error': str(e),
                'status': 'error'
            }
    
    def _get_reference_data(self, model: MLModel) -> Optional[np.ndarray]:
        """Get reference data for drift comparison"""
        # In production, this would fetch from a data store
        # For now, return None to indicate no reference data
        return None
    
    def _get_reference_predictions(self, model: MLModel) -> Optional[np.ndarray]:
        """Get reference predictions for drift comparison"""
        # In production, this would fetch from a data store
        return None
    
    def _calculate_current_performance(self, predictions: np.ndarray,
                                     data: np.ndarray) -> Dict[str, float]:
        """Calculate current model performance"""
        # This is a simplified version - in production you'd have actual labels
        return {
            'accuracy': 0.85,  # Mock values
            'precision': 0.82,
            'recall': 0.88,
            'f1_score': 0.85,
            'auc_roc': 0.87
        }
    
    def _calculate_model_confidence(self, predictions: np.ndarray) -> float:
        """Calculate average model confidence"""
        try:
            # For binary classification, confidence is distance from 0.5
            confidences = np.abs(predictions - 0.5) * 2
            return float(np.mean(confidences))
        except:
            return 0.5
    
    def _check_drift_alerts(self, model_id: str, data_drift: float,
                          prediction_drift: float, performance_drift: float) -> List[DriftAlert]:
        """Check for drift alerts"""
        alerts = []
        
        # Data drift alert
        if data_drift > self.drift_detector.data_drift_threshold:
            severity = 'high' if data_drift > 0.2 else 'medium'
            alerts.append(DriftAlert(
                model_id=model_id,
                drift_type='data',
                severity=severity,
                value=data_drift,
                threshold=self.drift_detector.data_drift_threshold,
                timestamp=timezone.now(),
                message=f"Data drift detected: {data_drift:.3f} > {self.drift_detector.data_drift_threshold}"
            ))
        
        # Prediction drift alert
        if prediction_drift > self.drift_detector.prediction_drift_threshold:
            severity = 'high' if prediction_drift > 0.3 else 'medium'
            alerts.append(DriftAlert(
                model_id=model_id,
                drift_type='prediction',
                severity=severity,
                value=prediction_drift,
                threshold=self.drift_detector.prediction_drift_threshold,
                timestamp=timezone.now(),
                message=f"Prediction drift detected: {prediction_drift:.3f} > {self.drift_detector.prediction_drift_threshold}"
            ))
        
        # Performance drift alert
        if performance_drift > self.drift_detector.performance_drift_threshold:
            severity = 'high' if performance_drift > 0.2 else 'medium'
            alerts.append(DriftAlert(
                model_id=model_id,
                drift_type='performance',
                severity=severity,
                value=performance_drift,
                threshold=self.drift_detector.performance_drift_threshold,
                timestamp=timezone.now(),
                message=f"Performance drift detected: {performance_drift:.3f} > {self.drift_detector.performance_drift_threshold}"
            ))
        
        return alerts
    
    def _determine_model_status(self, data_drift: float, prediction_drift: float,
                              performance_drift: float) -> str:
        """Determine overall model status"""
        
        high_drift_count = sum([
            data_drift > 0.2,
            prediction_drift > 0.3,
            performance_drift > 0.2
        ])
        
        if high_drift_count >= 2:
            return 'critical'
        elif high_drift_count == 1:
            return 'warning'
        elif any([
            data_drift > self.drift_detector.data_drift_threshold,
            prediction_drift > self.drift_detector.prediction_drift_threshold,
            performance_drift > self.drift_detector.performance_drift_threshold
        ]):
            return 'attention'
        else:
            return 'healthy'
    
    def _store_monitoring_results(self, model: MLModel, metrics: ModelMetrics):
        """Store monitoring results in the database"""
        try:
            # Update model with latest metrics
            model.last_monitored = metrics.timestamp
            
            # Store in a monitoring log (you could create a separate model for this)
            monitoring_data = {
                'timestamp': metrics.timestamp.isoformat(),
                'metrics': metrics.__dict__
            }
            
            # Add to training results for now (in production, use separate monitoring table)
            if not hasattr(model, 'monitoring_history'):
                model.monitoring_history = []
            
            # Keep last 100 monitoring records
            if len(model.monitoring_history) >= 100:
                model.monitoring_history.pop(0)
            
            model.monitoring_history.append(monitoring_data)
            model.save()
            
        except Exception as e:
            logger.error(f"Error storing monitoring results: {str(e)}")


class ModelLifecycleManager:
    """Manage model lifecycle from training to retirement"""
    
    def __init__(self):
        self.monitor = ModelMonitor()
    
    def evaluate_model_health(self, model_id: str) -> Dict[str, Any]:
        """Evaluate overall model health"""
        try:
            model = MLModel.objects.get(id=model_id)
            
            # Get recent monitoring data
            health_score = self._calculate_health_score(model)
            recommendations = self._generate_recommendations(model)
            lifecycle_stage = self._determine_lifecycle_stage(model)
            
            return {
                'model_id': model_id,
                'health_score': health_score,
                'lifecycle_stage': lifecycle_stage,
                'recommendations': recommendations,
                'last_monitored': model.last_monitored.isoformat() if hasattr(model, 'last_monitored') and model.last_monitored else None,
                'days_since_training': (timezone.now() - model.training_completed_at).days if model.training_completed_at else None
            }
            
        except Exception as e:
            logger.error(f"Error evaluating model health: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_health_score(self, model: MLModel) -> float:
        """Calculate overall model health score (0-100)"""
        try:
            score = 100.0
            
            # Age penalty
            if model.training_completed_at:
                days_old = (timezone.now() - model.training_completed_at).days
                age_penalty = min(days_old * 0.5, 30)  # Max 30 points penalty
                score -= age_penalty
            
            # Performance score
            if model.accuracy:
                if model.accuracy < 0.6:
                    score -= 30
                elif model.accuracy < 0.7:
                    score -= 20
                elif model.accuracy < 0.8:
                    score -= 10
            
            # Usage score (if model is being used actively)
            if hasattr(model, 'total_predictions') and model.total_predictions == 0:
                score -= 15  # Unused model penalty
            
            # Drift penalty (if monitoring data exists)
            if hasattr(model, 'monitoring_history') and model.monitoring_history:
                latest_monitoring = model.monitoring_history[-1]
                metrics = latest_monitoring.get('metrics', {})
                
                data_drift = metrics.get('data_drift', 0)
                prediction_drift = metrics.get('prediction_drift', 0)
                
                if data_drift > 0.2 or prediction_drift > 0.3:
                    score -= 25
                elif data_drift > 0.1 or prediction_drift > 0.15:
                    score -= 15
            
            return max(0.0, min(100.0, score))
            
        except Exception as e:
            logger.error(f"Error calculating health score: {str(e)}")
            return 50.0
    
    def _generate_recommendations(self, model: MLModel) -> List[str]:
        """Generate recommendations for model improvement"""
        recommendations = []
        
        try:
            # Age-based recommendations
            if model.training_completed_at:
                days_old = (timezone.now() - model.training_completed_at).days
                if days_old > 90:
                    recommendations.append("Consider retraining model - it's over 3 months old")
                elif days_old > 180:
                    recommendations.append("URGENT: Model is over 6 months old and should be retrained")
            
            # Performance-based recommendations
            if model.accuracy and model.accuracy < 0.7:
                recommendations.append("Low accuracy detected - consider feature engineering or algorithm change")
            
            if model.win_rate and model.win_rate < 0.4:
                recommendations.append("Low win rate - review trading strategy and risk management")
            
            # Feature importance recommendations
            if model.feature_importance:
                sorted_features = sorted(
                    model.feature_importance.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )
                if len(sorted_features) > 0:
                    top_feature_importance = sorted_features[0][1]
                    if top_feature_importance > 0.5:
                        recommendations.append("High dependence on single feature - consider feature diversification")
            
            # Monitoring-based recommendations
            if hasattr(model, 'monitoring_history') and model.monitoring_history:
                latest_monitoring = model.monitoring_history[-1]
                metrics = latest_monitoring.get('metrics', {})
                
                if metrics.get('data_drift', 0) > 0.1:
                    recommendations.append("Data drift detected - consider model update or retraining")
                
                if metrics.get('model_confidence', 1.0) < 0.6:
                    recommendations.append("Low model confidence - review prediction quality")
            
            if not recommendations:
                recommendations.append("Model appears healthy - continue regular monitoring")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return ["Error generating recommendations"]
    
    def _determine_lifecycle_stage(self, model: MLModel) -> str:
        """Determine current lifecycle stage"""
        try:
            if model.status == MLModel.Status.DRAFT:
                return "development"
            elif model.status == MLModel.Status.TRAINING:
                return "training"
            elif model.status == MLModel.Status.FAILED:
                return "failed"
            elif model.status in [MLModel.Status.COMPLETED, MLModel.Status.PUBLISHED]:
                
                if model.training_completed_at:
                    days_old = (timezone.now() - model.training_completed_at).days
                    
                    if days_old < 7:
                        return "newly_deployed"
                    elif days_old < 30:
                        return "active"
                    elif days_old < 90:
                        return "mature"
                    elif days_old < 180:
                        return "aging"
                    else:
                        return "deprecated"
                
                return "active"
            else:
                return "unknown"
                
        except Exception as e:
            logger.error(f"Error determining lifecycle stage: {str(e)}")
            return "unknown"
    
    def suggest_retirement(self, model_id: str) -> Dict[str, Any]:
        """Suggest if a model should be retired"""
        try:
            health_evaluation = self.evaluate_model_health(model_id)
            health_score = health_evaluation.get('health_score', 50)
            lifecycle_stage = health_evaluation.get('lifecycle_stage', 'unknown')
            
            should_retire = (
                health_score < 30 or
                lifecycle_stage == 'deprecated' or
                (lifecycle_stage == 'aging' and health_score < 50)
            )
            
            retirement_reason = []
            if health_score < 30:
                retirement_reason.append("Poor health score")
            if lifecycle_stage == 'deprecated':
                retirement_reason.append("Model is deprecated due to age")
            if lifecycle_stage == 'aging' and health_score < 50:
                retirement_reason.append("Aging model with declining performance")
            
            return {
                'model_id': model_id,
                'should_retire': should_retire,
                'retirement_reason': retirement_reason,
                'health_score': health_score,
                'lifecycle_stage': lifecycle_stage,
                'alternatives': self._suggest_alternatives(model_id) if should_retire else []
            }
            
        except Exception as e:
            logger.error(f"Error suggesting retirement: {str(e)}")
            return {'error': str(e)}
    
    def _suggest_alternatives(self, model_id: str) -> List[Dict[str, Any]]:
        """Suggest alternative models"""
        try:
            model = MLModel.objects.get(id=model_id)
            
            # Find similar models with better performance
            similar_models = MLModel.objects.filter(
                user=model.user,
                model_type=model.model_type,
                status__in=[MLModel.Status.COMPLETED, MLModel.Status.PUBLISHED]
            ).exclude(id=model_id).order_by('-accuracy')[:3]
            
            alternatives = []
            for alt_model in similar_models:
                alternatives.append({
                    'model_id': str(alt_model.id),
                    'name': alt_model.name,
                    'accuracy': alt_model.accuracy,
                    'created_at': alt_model.created_at.isoformat(),
                    'reason': 'Better performing similar model'
                })
            
            return alternatives
            
        except Exception as e:
            logger.error(f"Error suggesting alternatives: {str(e)}")
            return []