import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .services import get_market_data_service
from .models import WebSocketConnection, DataSubscription
from django.utils import timezone

logger = logging.getLogger(__name__)


class MarketDataConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time market data"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.connection_id = None
        self.subscribed_symbols = set()
        self.market_service = None
    
    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Get user from scope (requires authentication middleware)
            self.user = self.scope.get("user")
            
            if isinstance(self.user, AnonymousUser) or not self.user:
                await self.close(code=4001)  # Unauthorized
                return
            
            # Generate unique connection ID
            self.connection_id = f"{self.user.id}_{timezone.now().timestamp()}"
            
            # Check if user has data subscription
            subscription = await self.get_user_subscription()
            if not subscription:
                await self.close(code=4002)  # No subscription
                return
            
            # Accept connection
            await self.accept()
            
            # Get market data service
            self.market_service = await get_market_data_service()
            
            # Create/update WebSocket connection record
            await self.create_connection_record()
            
            # Add to channel group for this connection
            await self.channel_layer.group_add(
                f"market_data_{self.connection_id}",
                self.channel_name
            )
            
            logger.info(f"Market data WebSocket connected: {self.user.username}")
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
            await self.close(code=4500)  # Internal error
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Remove from channel group
            if self.connection_id:
                await self.channel_layer.group_discard(
                    f"market_data_{self.connection_id}",
                    self.channel_name
                )
            
            # Update connection record
            await self.update_connection_status('DISCONNECTED')
            
            logger.info(f"Market data WebSocket disconnected: {self.user.username if self.user else 'Unknown'}")
            
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                await self.handle_subscribe(data)
            elif message_type == 'unsubscribe':
                await self.handle_unsubscribe(data)
            elif message_type == 'ping':
                await self.handle_ping()
            else:
                await self.send_error("Unknown message type")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
            await self.send_error("Internal error")
    
    async def handle_subscribe(self, data):
        """Handle symbol subscription request"""
        try:
            symbols = data.get('symbols', [])
            if not isinstance(symbols, list):
                symbols = [symbols]
            
            results = []
            for symbol in symbols:
                if symbol in self.subscribed_symbols:
                    results.append({'symbol': symbol, 'status': 'already_subscribed'})
                    continue
                
                # Subscribe through market service
                success, message = await self.market_service.subscribe_to_symbol(
                    self.user.id, symbol, self.connection_id
                )
                
                if success:
                    self.subscribed_symbols.add(symbol)
                    results.append({'symbol': symbol, 'status': 'subscribed'})
                    
                    # Send initial quote
                    quote = await self.market_service.get_live_quote(symbol)
                    if quote:
                        await self.send_quote_update(symbol, quote)
                else:
                    results.append({'symbol': symbol, 'status': 'error', 'message': message})
            
            await self.send(text_data=json.dumps({
                'type': 'subscription_response',
                'results': results
            }))
            
        except Exception as e:
            logger.error(f"Error handling subscribe: {e}")
            await self.send_error("Subscription failed")
    
    async def handle_unsubscribe(self, data):
        """Handle symbol unsubscription request"""
        try:
            symbols = data.get('symbols', [])
            if not isinstance(symbols, list):
                symbols = [symbols]
            
            results = []
            for symbol in symbols:
                if symbol in self.subscribed_symbols:
                    self.subscribed_symbols.remove(symbol)
                    results.append({'symbol': symbol, 'status': 'unsubscribed'})
                else:
                    results.append({'symbol': symbol, 'status': 'not_subscribed'})
            
            # Update WebSocket connection record
            await self.update_subscribed_symbols()
            
            await self.send(text_data=json.dumps({
                'type': 'unsubscription_response',
                'results': results
            }))
            
        except Exception as e:
            logger.error(f"Error handling unsubscribe: {e}")
            await self.send_error("Unsubscription failed")
    
    async def handle_ping(self):
        """Handle ping message"""
        await self.update_last_ping()
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': timezone.now().isoformat()
        }))
    
    async def market_data_update(self, event):
        """Handle market data update from channel layer"""
        try:
            symbol = event['symbol']
            data = event['data']
            
            if symbol in self.subscribed_symbols:
                await self.send(text_data=json.dumps({
                    'type': 'quote_update',
                    'symbol': symbol,
                    'data': data
                }))
        except Exception as e:
            logger.error(f"Error sending market data update: {e}")
    
    async def option_chain_update(self, event):
        """Handle options chain update from channel layer"""
        try:
            underlying = event['underlying']
            data = event['data']
            
            # Check if user is interested in this underlying
            for symbol in self.subscribed_symbols:
                if underlying in symbol:  # Simple check, can be improved
                    await self.send(text_data=json.dumps({
                        'type': 'option_chain_update',
                        'underlying': underlying,
                        'data': data
                    }))
                    break
        except Exception as e:
            logger.error(f"Error sending option chain update: {e}")
    
    async def send_quote_update(self, symbol, quote_data):
        """Send quote update to client"""
        await self.send(text_data=json.dumps({
            'type': 'quote_update',
            'symbol': symbol,
            'data': {
                'symbol': symbol,
                'last_price': float(quote_data['last_price']),
                'change': float(quote_data['change']),
                'change_percent': float(quote_data['change_percent']),
                'volume': quote_data['volume'],
                'timestamp': quote_data['timestamp'].isoformat()
            }
        }))
    
    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
            'timestamp': timezone.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_user_subscription(self):
        """Get user's data subscription"""
        try:
            return DataSubscription.objects.get(user=self.user, is_active=True)
        except DataSubscription.DoesNotExist:
            return None
    
    @database_sync_to_async
    def create_connection_record(self):
        """Create/update WebSocket connection record"""
        WebSocketConnection.objects.update_or_create(
            connection_id=self.connection_id,
            defaults={
                'user': self.user,
                'status': WebSocketConnection.Status.CONNECTED,
                'connected_at': timezone.now(),
                'last_ping': timezone.now(),
                'subscribed_symbols': list(self.subscribed_symbols)
            }
        )
    
    @database_sync_to_async
    def update_connection_status(self, status):
        """Update connection status"""
        try:
            conn = WebSocketConnection.objects.get(connection_id=self.connection_id)
            conn.status = status
            if status == 'DISCONNECTED':
                conn.disconnected_at = timezone.now()
            conn.save()
        except WebSocketConnection.DoesNotExist:
            pass
    
    @database_sync_to_async
    def update_subscribed_symbols(self):
        """Update subscribed symbols in database"""
        try:
            conn = WebSocketConnection.objects.get(connection_id=self.connection_id)
            conn.subscribed_symbols = list(self.subscribed_symbols)
            conn.save()
        except WebSocketConnection.DoesNotExist:
            pass
    
    @database_sync_to_async
    def update_last_ping(self):
        """Update last ping timestamp"""
        try:
            conn = WebSocketConnection.objects.get(connection_id=self.connection_id)
            conn.last_ping = timezone.now()
            conn.save()
        except WebSocketConnection.DoesNotExist:
            pass


class OptionChainConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer specifically for options chain data"""
    
    async def connect(self):
        """Handle connection for options chain"""
        self.user = self.scope.get("user")
        
        if isinstance(self.user, AnonymousUser) or not self.user:
            await self.close(code=4001)
            return
        
        # Check subscription
        subscription = await self.get_user_subscription()
        if not subscription or not subscription.real_time_enabled:
            await self.close(code=4002)
            return
        
        await self.accept()
        
        # Add to options group
        await self.channel_layer.group_add("options_data", self.channel_name)
    
    async def disconnect(self, close_code):
        """Handle disconnection"""
        await self.channel_layer.group_discard("options_data", self.channel_name)
    
    async def receive(self, text_data):
        """Handle options chain requests"""
        try:
            data = json.loads(text_data)
            underlying = data.get('underlying')
            expiry = data.get('expiry')
            
            if not underlying:
                await self.send_error("Underlying symbol required")
                return
            
            # Get market service and fetch options chain
            market_service = await get_market_data_service()
            option_data = await market_service.get_option_chain(underlying, expiry)
            
            if option_data:
                await self.send(text_data=json.dumps({
                    'type': 'option_chain_data',
                    'underlying': underlying,
                    'expiry': expiry,
                    'data': option_data
                }))
            else:
                await self.send_error("Failed to fetch options chain")
                
        except Exception as e:
            logger.error(f"Error in options chain consumer: {e}")
            await self.send_error("Internal error")
    
    async def option_chain_update(self, event):
        """Handle options chain updates from channel layer"""
        await self.send(text_data=json.dumps({
            'type': 'option_chain_update',
            'underlying': event['underlying'],
            'data': event['data']
        }))
    
    async def send_error(self, message):
        """Send error message"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
    
    @database_sync_to_async
    def get_user_subscription(self):
        """Get user subscription"""
        try:
            return DataSubscription.objects.get(user=self.user, is_active=True)
        except DataSubscription.DoesNotExist:
            return None