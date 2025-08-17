"""
WebSocket consumers for real-time trading features
"""

import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from .models import TradingSignal, TradingOrder, AutomatedTradeExecution, PortfolioPosition
from .usage_limits import SubscriptionLimitService

logger = logging.getLogger(__name__)


class AuthenticatedConsumer(AsyncWebsocketConsumer):
    """Base consumer with authentication and user management"""
    
    async def connect(self):
        """Handle WebSocket connection with authentication"""
        self.user = self.scope["user"]
        
        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return
        
        self.user_id = str(self.user.id)
        await self.accept()
        logger.info(f"WebSocket connected: {self.__class__.__name__} for user {self.user.email}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected: {self.__class__.__name__} for user {self.user.email if hasattr(self, 'user') else 'unknown'}")
    
    async def send_error(self, error_message: str, error_code: str = None):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'error': error_message,
            'error_code': error_code,
            'timestamp': timezone.now().isoformat()
        }))


class TradingSignalsConsumer(AuthenticatedConsumer):
    """Real-time trading signals and recommendations"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            # Join user-specific signals group
            self.group_name = f"signals_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            # Send initial signal data
            await self.send_recent_signals()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle incoming messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_symbol':
                symbol = data.get('symbol')
                if symbol:
                    await self.subscribe_to_symbol(symbol)
            elif message_type == 'unsubscribe_symbol':
                symbol = data.get('symbol')
                if symbol:
                    await self.unsubscribe_from_symbol(symbol)
            elif message_type == 'request_signals':
                await self.send_recent_signals()
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            await self.send_error(f"Error processing request: {str(e)}")
    
    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to signals for specific symbol"""
        symbol_group = f"signals_symbol_{symbol}"
        await self.channel_layer.group_add(symbol_group, self.channel_name)
        
        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'symbol': symbol,
            'message': f'Subscribed to signals for {symbol}',
            'timestamp': timezone.now().isoformat()
        }))
    
    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from signals for specific symbol"""
        symbol_group = f"signals_symbol_{symbol}"
        await self.channel_layer.group_discard(symbol_group, self.channel_name)
        
        await self.send(text_data=json.dumps({
            'type': 'subscription_cancelled',
            'symbol': symbol,
            'message': f'Unsubscribed from signals for {symbol}',
            'timestamp': timezone.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_recent_signals(self):
        """Get recent signals for the user"""
        return list(TradingSignal.objects.filter(
            user=self.user,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-created_at')[:10].values(
            'id', 'symbol', 'signal_type', 'confidence_score', 
            'entry_price', 'target_price', 'stop_loss', 'created_at'
        ))
    
    async def send_recent_signals(self):
        """Send recent signals to client"""
        signals = await self.get_recent_signals()
        
        # Convert signals to JSON serializable format
        for signal in signals:
            signal['id'] = str(signal['id'])
            signal['entry_price'] = float(signal['entry_price'])
            signal['target_price'] = float(signal['target_price']) if signal['target_price'] else None
            signal['stop_loss'] = float(signal['stop_loss']) if signal['stop_loss'] else None
            signal['created_at'] = signal['created_at'].isoformat()
        
        await self.send(text_data=json.dumps({
            'type': 'recent_signals',
            'signals': signals,
            'count': len(signals),
            'timestamp': timezone.now().isoformat()
        }))
    
    # WebSocket event handlers
    async def new_signal(self, event):
        """Handle new trading signal event"""
        await self.send(text_data=json.dumps({
            'type': 'new_signal',
            'signal': event['signal'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def signal_update(self, event):
        """Handle signal update event"""
        await self.send(text_data=json.dumps({
            'type': 'signal_update',
            'signal': event['signal'],
            'timestamp': timezone.now().isoformat()
        }))


class PortfolioUpdatesConsumer(AuthenticatedConsumer):
    """Real-time portfolio and position updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"portfolio_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.send_portfolio_summary()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def get_portfolio_summary(self):
        """Get current portfolio summary"""
        positions = PortfolioPosition.objects.filter(user=self.user, quantity__gt=0)
        
        total_value = sum(pos.current_value for pos in positions)
        total_pnl = sum(pos.unrealized_pnl for pos in positions)
        
        return {
            'total_value': float(total_value),
            'total_pnl': float(total_pnl),
            'position_count': positions.count(),
            'positions': [
                {
                    'id': str(pos.id),
                    'symbol': pos.symbol,
                    'quantity': float(pos.quantity),
                    'avg_price': float(pos.average_price),
                    'current_price': float(pos.current_price),
                    'unrealized_pnl': float(pos.unrealized_pnl),
                    'pnl_percentage': float(pos.pnl_percentage)
                }
                for pos in positions
            ]
        }
    
    async def send_portfolio_summary(self):
        """Send current portfolio summary"""
        portfolio = await self.get_portfolio_summary()
        
        await self.send(text_data=json.dumps({
            'type': 'portfolio_summary',
            'portfolio': portfolio,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_portfolio':
                await self.send_portfolio_summary()
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
    
    # WebSocket event handlers
    async def portfolio_update(self, event):
        """Handle portfolio update event"""
        await self.send(text_data=json.dumps({
            'type': 'portfolio_update',
            'update': event['update'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def position_update(self, event):
        """Handle position update event"""
        await self.send(text_data=json.dumps({
            'type': 'position_update',
            'position': event['position'],
            'timestamp': timezone.now().isoformat()
        }))


class TradeExecutionConsumer(AuthenticatedConsumer):
    """Real-time trade execution notifications"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"executions_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def trade_executed(self, event):
        """Handle trade execution event"""
        await self.send(text_data=json.dumps({
            'type': 'trade_executed',
            'execution': event['execution'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def trade_failed(self, event):
        """Handle trade execution failure"""
        await self.send(text_data=json.dumps({
            'type': 'trade_failed',
            'execution': event['execution'],
            'error': event['error'],
            'timestamp': timezone.now().isoformat()
        }))


class MarketSentimentConsumer(AuthenticatedConsumer):
    """Real-time market sentiment and analysis"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = "market_sentiment"  # Global group
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def sentiment_update(self, event):
        """Handle market sentiment update"""
        await self.send(text_data=json.dumps({
            'type': 'sentiment_update',
            'sentiment': event['sentiment'],
            'timestamp': timezone.now().isoformat()
        }))


class RiskAlertsConsumer(AuthenticatedConsumer):
    """Real-time risk alerts and notifications"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"risk_alerts_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def risk_alert(self, event):
        """Handle risk alert event"""
        await self.send(text_data=json.dumps({
            'type': 'risk_alert',
            'alert': event['alert'],
            'severity': event['severity'],
            'timestamp': timezone.now().isoformat()
        }))


class LivePnLConsumer(AuthenticatedConsumer):
    """Real-time P&L updates"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"pnl_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.send_current_pnl()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    @database_sync_to_async
    def get_current_pnl(self):
        """Get current P&L summary"""
        from .reporting import TradingReportGenerator
        
        generator = TradingReportGenerator(self.user)
        performance = generator.generate_performance_metrics()
        
        return {
            'total_pnl': float(performance.total_return),
            'daily_pnl': float(performance.daily_return),
            'win_rate': float(performance.win_rate),
            'sharpe_ratio': float(performance.sharpe_ratio),
            'max_drawdown': float(performance.max_drawdown)
        }
    
    async def send_current_pnl(self):
        """Send current P&L data"""
        pnl = await self.get_current_pnl()
        
        await self.send(text_data=json.dumps({
            'type': 'current_pnl',
            'pnl': pnl,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_pnl':
                await self.send_current_pnl()
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
    
    # WebSocket event handlers
    async def pnl_update(self, event):
        """Handle P&L update event"""
        await self.send(text_data=json.dumps({
            'type': 'pnl_update',
            'pnl': event['pnl'],
            'timestamp': timezone.now().isoformat()
        }))


class FnOUpdatesConsumer(AuthenticatedConsumer):
    """Real-time F&O updates (Greeks, volatility, etc.)"""
    
    async def connect(self):
        await super().connect()
        if hasattr(self, 'user'):
            self.group_name = f"fno_{self.user_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(close_code)
    
    # WebSocket event handlers
    async def greeks_update(self, event):
        """Handle Greeks update event"""
        await self.send(text_data=json.dumps({
            'type': 'greeks_update',
            'data': event['data'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def volatility_update(self, event):
        """Handle volatility update event"""
        await self.send(text_data=json.dumps({
            'type': 'volatility_update',
            'data': event['data'],
            'timestamp': timezone.now().isoformat()
        }))
    
    async def option_chain_update(self, event):
        """Handle option chain update event"""
        await self.send(text_data=json.dumps({
            'type': 'option_chain_update',
            'data': event['data'],
            'timestamp': timezone.now().isoformat()
        }))