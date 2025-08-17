"""
Utility functions for sending WebSocket messages from AI Studio
"""

import json
import logging
from typing import Dict, Any, List
from decimal import Decimal

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

logger = logging.getLogger(__name__)


class AIStudioWebSocketNotifier:
    """Utility class for sending AI Studio WebSocket notifications"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def _send_to_group(self, group_name: str, message: Dict[str, Any]):
        """Send message to a WebSocket group"""
        if self.channel_layer:
            try:
                async_to_sync(self.channel_layer.group_send)(group_name, message)
            except Exception as e:
                logger.error(f"Failed to send AI Studio WebSocket message to group {group_name}: {e}")
    
    def _serialize_data(self, data: Any) -> Any:
        """Serialize data for JSON transmission"""
        if isinstance(data, Decimal):
            return float(data)
        elif hasattr(data, 'isoformat'):  # datetime objects
            return data.isoformat()
        elif hasattr(data, '__dict__'):  # Model instances
            return str(data)
        return data
    
    def _prepare_message_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare message data for WebSocket transmission"""
        serialized_data = {}
        for key, value in data.items():
            serialized_data[key] = self._serialize_data(value)
        return serialized_data
    
    def send_training_progress_update(self, training_job_id: str, progress_data: Dict[str, Any]):
        """Send training progress update"""
        prepared_data = self._prepare_message_data(progress_data)
        
        message = {
            'type': 'training_update',
            'progress': prepared_data
        }
        
        self._send_to_group(f"training_{training_job_id}", message)
    
    def send_training_completed(self, training_job_id: str, result_data: Dict[str, Any]):
        """Send training completion notification"""
        prepared_data = self._prepare_message_data(result_data)
        
        message = {
            'type': 'training_completed',
            'result': prepared_data
        }
        
        self._send_to_group(f"training_{training_job_id}", message)
    
    def send_training_failed(self, training_job_id: str, error: str):
        """Send training failure notification"""
        message = {
            'type': 'training_failed',
            'error': error
        }
        
        self._send_to_group(f"training_{training_job_id}", message)
    
    def send_model_update(self, model_id: str, update_data: Dict[str, Any]):
        """Send model update notification"""
        prepared_data = self._prepare_message_data(update_data)
        
        message = {
            'type': 'model_update',
            'update': prepared_data
        }
        
        self._send_to_group(f"monitoring_{model_id}", message)
    
    def send_performance_alert(self, model_id: str, alert_data: Dict[str, Any], severity: str = 'medium'):
        """Send model performance alert"""
        prepared_data = self._prepare_message_data(alert_data)
        
        message = {
            'type': 'performance_alert',
            'alert': prepared_data,
            'severity': severity
        }
        
        self._send_to_group(f"monitoring_{model_id}", message)
    
    def send_dashboard_update(self, user_id: str, update_data: Dict[str, Any]):
        """Send dashboard update"""
        prepared_data = self._prepare_message_data(update_data)
        
        message = {
            'type': 'dashboard_update',
            'update': prepared_data
        }
        
        self._send_to_group(f"studio_dashboard_{user_id}", message)
    
    def send_marketplace_notification(self, user_id: str, notification_type: str, data: Dict[str, Any]):
        """Send marketplace notification"""
        prepared_data = self._prepare_message_data(data)
        
        message = {
            'type': notification_type,
            notification_type: prepared_data
        }
        
        self._send_to_group(f"marketplace_{user_id}", message)
    
    def send_model_leased(self, user_id: str, lease_data: Dict[str, Any]):
        """Send model lease notification"""
        self.send_marketplace_notification(user_id, 'model_leased', {'lease': lease_data})
    
    def send_earnings_update(self, user_id: str, earnings_data: Dict[str, Any]):
        """Send earnings update notification"""
        self.send_marketplace_notification(user_id, 'earnings_update', {'earnings': earnings_data})
    
    def send_model_review(self, user_id: str, review_data: Dict[str, Any]):
        """Send model review notification"""
        self.send_marketplace_notification(user_id, 'model_review', {'review': review_data})
    
    def send_new_prediction(self, model_id: str, prediction_data: Dict[str, Any]):
        """Send new model prediction"""
        prepared_data = self._prepare_message_data(prediction_data)
        
        message = {
            'type': 'new_prediction',
            'prediction': prepared_data
        }
        
        self._send_to_group(f"predictions_{model_id}", message)
    
    def send_backtest_progress(self, model_id: str, progress_data: Dict[str, Any]):
        """Send backtest progress update"""
        prepared_data = self._prepare_message_data(progress_data)
        
        message = {
            'type': 'backtest_progress',
            'progress': prepared_data
        }
        
        self._send_to_group(f"backtest_{model_id}", message)
    
    def send_backtest_completed(self, model_id: str, results_data: Dict[str, Any]):
        """Send backtest completion notification"""
        prepared_data = self._prepare_message_data(results_data)
        
        message = {
            'type': 'backtest_completed',
            'results': prepared_data
        }
        
        self._send_to_group(f"backtest_{model_id}", message)
    
    def send_system_status_update(self, status_data: Dict[str, Any]):
        """Send system status update to all connected clients"""
        prepared_data = self._prepare_message_data(status_data)
        
        message = {
            'type': 'system_status_update',
            'status': prepared_data
        }
        
        self._send_to_group("system_health", message)
    
    def send_worker_status_update(self, workers_data: Dict[str, Any]):
        """Send worker status update"""
        prepared_data = self._prepare_message_data(workers_data)
        
        message = {
            'type': 'worker_status_update',
            'workers': prepared_data
        }
        
        self._send_to_group("system_health", message)


# Global notifier instance
ai_notifier = AIStudioWebSocketNotifier()


# Convenience functions
def notify_training_progress(training_job_id: str, progress_data: Dict[str, Any]):
    """Send training progress update"""
    ai_notifier.send_training_progress_update(training_job_id, progress_data)


def notify_training_completed(training_job_id: str, result_data: Dict[str, Any]):
    """Send training completion notification"""
    ai_notifier.send_training_completed(training_job_id, result_data)


def notify_training_failed(training_job_id: str, error: str):
    """Send training failure notification"""
    ai_notifier.send_training_failed(training_job_id, error)


def notify_model_update(model_id: str, update_data: Dict[str, Any]):
    """Send model update notification"""
    ai_notifier.send_model_update(model_id, update_data)


def notify_performance_alert(model_id: str, alert_data: Dict[str, Any], severity: str = 'medium'):
    """Send model performance alert"""
    ai_notifier.send_performance_alert(model_id, alert_data, severity)


def notify_dashboard_update(user_id: str, update_data: Dict[str, Any]):
    """Send dashboard update"""
    ai_notifier.send_dashboard_update(user_id, update_data)


def notify_model_leased(user_id: str, lease_data: Dict[str, Any]):
    """Send model lease notification"""
    ai_notifier.send_model_leased(user_id, lease_data)


def notify_new_prediction(model_id: str, prediction_data: Dict[str, Any]):
    """Send new model prediction"""
    ai_notifier.send_new_prediction(model_id, prediction_data)