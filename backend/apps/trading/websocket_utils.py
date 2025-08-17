"""
Utility functions for sending WebSocket messages from trading app
"""

import json
import logging
from typing import Dict, Any, List
from decimal import Decimal

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

logger = logging.getLogger(__name__)


class WebSocketNotifier:
    """Utility class for sending WebSocket notifications"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def _send_to_group(self, group_name: str, message: Dict[str, Any]):
        """Send message to a WebSocket group"""
        if self.channel_layer:
            try:
                async_to_sync(self.channel_layer.group_send)(group_name, message)
            except Exception as e:
                logger.error(f"Failed to send WebSocket message to group {group_name}: {e}")
    
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
    
    def send_new_signal(self, user_id: str, signal_data: Dict[str, Any]):
        """Send new trading signal notification"""
        prepared_data = self._prepare_message_data(signal_data)
        
        message = {
            'type': 'new_signal',
            'signal': prepared_data
        }
        
        # Send to user-specific group
        self._send_to_group(f"signals_{user_id}", message)
        
        # Send to symbol-specific group if symbol is present
        if 'symbol' in signal_data:
            self._send_to_group(f"signals_symbol_{signal_data['symbol']}", message)
    
    def send_signal_update(self, user_id: str, signal_data: Dict[str, Any]):
        """Send trading signal update"""
        prepared_data = self._prepare_message_data(signal_data)
        
        message = {
            'type': 'signal_update',
            'signal': prepared_data
        }
        
        self._send_to_group(f"signals_{user_id}", message)
    
    def send_portfolio_update(self, user_id: str, portfolio_data: Dict[str, Any]):
        """Send portfolio update notification"""
        prepared_data = self._prepare_message_data(portfolio_data)
        
        message = {
            'type': 'portfolio_update',
            'update': prepared_data
        }
        
        self._send_to_group(f"portfolio_{user_id}", message)
    
    def send_position_update(self, user_id: str, position_data: Dict[str, Any]):
        """Send position update notification"""
        prepared_data = self._prepare_message_data(position_data)
        
        message = {
            'type': 'position_update',
            'position': prepared_data
        }
        
        self._send_to_group(f"portfolio_{user_id}", message)
    
    def send_trade_execution(self, user_id: str, execution_data: Dict[str, Any]):
        """Send trade execution notification"""
        prepared_data = self._prepare_message_data(execution_data)
        
        message = {
            'type': 'trade_executed',
            'execution': prepared_data
        }
        
        self._send_to_group(f"executions_{user_id}", message)
    
    def send_trade_failure(self, user_id: str, execution_data: Dict[str, Any], error: str):
        """Send trade execution failure notification"""
        prepared_data = self._prepare_message_data(execution_data)
        
        message = {
            'type': 'trade_failed',
            'execution': prepared_data,
            'error': error
        }
        
        self._send_to_group(f"executions_{user_id}", message)
    
    def send_risk_alert(self, user_id: str, alert_data: Dict[str, Any], severity: str = 'medium'):
        """Send risk alert notification"""
        prepared_data = self._prepare_message_data(alert_data)
        
        message = {
            'type': 'risk_alert',
            'alert': prepared_data,
            'severity': severity
        }
        
        self._send_to_group(f"risk_alerts_{user_id}", message)
    
    def send_pnl_update(self, user_id: str, pnl_data: Dict[str, Any]):
        """Send P&L update notification"""
        prepared_data = self._prepare_message_data(pnl_data)
        
        message = {
            'type': 'pnl_update',
            'pnl': prepared_data
        }
        
        self._send_to_group(f"pnl_{user_id}", message)
    
    def send_market_sentiment_update(self, sentiment_data: Dict[str, Any]):
        """Send market sentiment update to all subscribers"""
        prepared_data = self._prepare_message_data(sentiment_data)
        
        message = {
            'type': 'sentiment_update',
            'sentiment': prepared_data
        }
        
        self._send_to_group("market_sentiment", message)
    
    def send_fno_greeks_update(self, user_id: str, greeks_data: Dict[str, Any]):
        """Send F&O Greeks update"""
        prepared_data = self._prepare_message_data(greeks_data)
        
        message = {
            'type': 'greeks_update',
            'data': prepared_data
        }
        
        self._send_to_group(f"fno_{user_id}", message)
    
    def send_fno_volatility_update(self, user_id: str, volatility_data: Dict[str, Any]):
        """Send F&O volatility update"""
        prepared_data = self._prepare_message_data(volatility_data)
        
        message = {
            'type': 'volatility_update',
            'data': prepared_data
        }
        
        self._send_to_group(f"fno_{user_id}", message)
    
    def send_option_chain_update(self, user_id: str, option_chain_data: Dict[str, Any]):
        """Send option chain update"""
        prepared_data = self._prepare_message_data(option_chain_data)
        
        message = {
            'type': 'option_chain_update',
            'data': prepared_data
        }
        
        self._send_to_group(f"fno_{user_id}", message)


# Global notifier instance
notifier = WebSocketNotifier()


# Convenience functions
def notify_new_signal(user_id: str, signal_data: Dict[str, Any]):
    """Send new trading signal notification"""
    notifier.send_new_signal(user_id, signal_data)


def notify_portfolio_update(user_id: str, portfolio_data: Dict[str, Any]):
    """Send portfolio update notification"""
    notifier.send_portfolio_update(user_id, portfolio_data)


def notify_trade_execution(user_id: str, execution_data: Dict[str, Any]):
    """Send trade execution notification"""
    notifier.send_trade_execution(user_id, execution_data)


def notify_risk_alert(user_id: str, alert_data: Dict[str, Any], severity: str = 'medium'):
    """Send risk alert notification"""
    notifier.send_risk_alert(user_id, alert_data, severity)


def notify_pnl_update(user_id: str, pnl_data: Dict[str, Any]):
    """Send P&L update notification"""
    notifier.send_pnl_update(user_id, pnl_data)