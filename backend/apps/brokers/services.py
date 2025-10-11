from asgiref.sync import sync_to_async
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import asyncio
import logging

from .models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession, BrokerAPILog
from .clients import get_broker_client
from .clients.base import OrderRequest

logger = logging.getLogger(__name__)


class BrokerService:
    """Service class for broker operations"""
    
    @staticmethod
    async def test_connection(broker_type: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Test broker connection with provided credentials"""
        try:
            client = get_broker_client(broker_type, credentials)
            result = await client.test_connection()
            return result
        except Exception as e:
            logger.error(f"Connection test failed for {broker_type}: {str(e)}")
            return {
                'success': False,
                'message': 'Connection test failed',
                'error': str(e)
            }
    
    @staticmethod
    async def sync_account_data(broker_account: BrokerAccount) -> Dict[str, Any]:
        """Sync account data from broker API"""
        try:
            credentials = broker_account.get_credentials()
            client = get_broker_client(broker_account.broker_type, credentials)
            
            # Authenticate
            authenticated = await client.authenticate()
            if not authenticated:
                broker_account.status = BrokerAccount.Status.ERROR
                broker_account.last_error = 'Authentication failed'
                await sync_to_async(broker_account.save)()
                return {'success': False, 'error': 'Authentication failed'}
            
            # Get balance
            balance = await client.get_balance()
            await sync_to_async(broker_account.update_account_info)({
                'net': balance.net,
                'available': balance.available,
                'utilised': balance.utilised
            })
            
            # Sync positions
            if broker_account.auto_sync:
                await BrokerService._sync_positions(broker_account, client)
                await BrokerService._sync_orders(broker_account, client)
            
            return {
                'success': True,
                'message': 'Account data synced successfully',
                'data': {
                    'balance': {
                        'net': float(balance.net),
                        'available': float(balance.available),
                        'utilised': float(balance.utilised)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Account sync failed for {broker_account.id}: {str(e)}")
            broker_account.status = BrokerAccount.Status.ERROR
            broker_account.last_error = str(e)
            await sync_to_async(broker_account.save)()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _sync_positions(broker_account: BrokerAccount, client) -> None:
        """Sync positions from broker"""
        try:
            positions = await client.get_positions()
            
            # Clear existing positions for this account
            BrokerPosition.objects.filter(broker_account=broker_account).delete()
            
            # Create new positions
            for position in positions:
                BrokerPosition.objects.create(
                    broker_account=broker_account,
                    symbol=position.symbol,
                    exchange=position.exchange,
                    product=position.product,
                    quantity=position.quantity,
                    average_price=position.average_price,
                    last_price=position.last_price,
                    unrealized_pnl=position.unrealized_pnl,
                    realized_pnl=position.realized_pnl
                )
                
        except Exception as e:
            logger.error(f"Position sync failed: {str(e)}")
    
    @staticmethod
    async def _sync_orders(broker_account: BrokerAccount, client) -> None:
        """Sync orders from broker"""
        try:
            orders = await client.get_orders()
            
            for order in orders:
                # Update or create broker order
                broker_order, created = BrokerOrder.objects.update_or_create(
                    broker_account=broker_account,
                    broker_order_id=order.order_id,
                    defaults={
                        'symbol': order.symbol,
                        'exchange': order.exchange,
                        'order_type': order.order_type,
                        'transaction_type': order.transaction_type,
                        'quantity': order.quantity,
                        'price': order.price,
                        'trigger_price': order.trigger_price,
                        'status': order.status,
                        'filled_quantity': order.filled_quantity,
                        'average_price': order.average_price,
                        'placed_at': order.order_timestamp,
                        'executed_at': order.exchange_timestamp
                    }
                )
                
                # Update related trading order status if exists
                if broker_order.trading_order:
                    trading_order = broker_order.trading_order
                    trading_order.status = order.status
                    trading_order.filled_quantity = order.filled_quantity
                    trading_order.average_price = order.average_price
                    await sync_to_async(order.save)()
                
        except Exception as e:
            logger.error(f"Order sync failed: {str(e)}")
    
    @staticmethod
    async def place_order(broker_account: BrokerAccount, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Place order through broker"""
        try:
            credentials = broker_account.get_credentials()
            client = get_broker_client(broker_account.broker_type, credentials)
            
            # Authenticate
            authenticated = await client.authenticate()
            if not authenticated:
                return {'success': False, 'error': 'Authentication failed'}
            
            # Create order request
            order_request = OrderRequest(
                symbol=order_data['symbol'],
                exchange=order_data.get('exchange', 'NSE'),
                transaction_type=order_data['transaction_type'],
                order_type=order_data['order_type'],
                quantity=order_data['quantity'],
                price=Decimal(str(order_data['price'])) if order_data.get('price') else None,
                trigger_price=Decimal(str(order_data['trigger_price'])) if order_data.get('trigger_price') else None,
                product=order_data.get('product', 'CNC'),
                validity=order_data.get('validity', 'DAY'),
                disclosed_quantity=order_data.get('disclosed_quantity', 0),
                tag=order_data.get('tag')
            )
            
            # Check risk limits
            risk_check = await BrokerService._check_risk_limits(broker_account, order_request)
            if not risk_check['allowed']:
                return {'success': False, 'error': risk_check['reason']}
            
            # Place order
            response = await client.place_order(order_request)
            
            if response.error:
                return {'success': False, 'error': response.error}
            
            # Create broker order record
            broker_order = BrokerOrder.objects.create(
                broker_account=broker_account,
                broker_order_id=response.order_id,
                platform_order_id=order_data.get('platform_order_id'),
                symbol=order_request.symbol,
                exchange=order_request.exchange,
                order_type=order_request.order_type,
                transaction_type=order_request.transaction_type,
                quantity=order_request.quantity,
                price=order_request.price,
                trigger_price=order_request.trigger_price,
                status=response.status,
                placed_at=timezone.now() if response.status != 'REJECTED' else None
            )
            
            return {
                'success': True,
                'message': response.message or 'Order placed successfully',
                'data': {
                    'broker_order_id': response.order_id,
                    'platform_order_id': str(broker_order.id),
                    'status': response.status
                }
            }
            
        except Exception as e:
            logger.error(f"Order placement failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def modify_order(broker_account: BrokerAccount, order_id: str, 
                          order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Modify existing order"""
        try:
            credentials = broker_account.get_credentials()
            client = get_broker_client(broker_account.broker_type, credentials)
            
            # Authenticate
            authenticated = await client.authenticate()
            if not authenticated:
                return {'success': False, 'error': 'Authentication failed'}
            
            # Create order request
            order_request = OrderRequest(
                symbol=order_data['symbol'],
                exchange=order_data.get('exchange', 'NSE'),
                transaction_type=order_data['transaction_type'],
                order_type=order_data['order_type'],
                quantity=order_data['quantity'],
                price=Decimal(str(order_data['price'])) if order_data.get('price') else None,
                trigger_price=Decimal(str(order_data['trigger_price'])) if order_data.get('trigger_price') else None,
                product=order_data.get('product', 'CNC'),
                validity=order_data.get('validity', 'DAY')
            )
            
            # Modify order
            response = await client.modify_order(order_id, order_request)
            
            if response.error:
                return {'success': False, 'error': response.error}
            
            # Update broker order record
            try:
                broker_order = BrokerOrder.objects.get(
                    broker_account=broker_account,
                    broker_order_id=order_id
                )
                broker_order.quantity = order_request.quantity
                broker_order.price = order_request.price
                broker_order.trigger_price = order_request.trigger_price
                broker_order.order_type = order_request.order_type
                broker_order.status = response.status
                await sync_to_async(broker_order.save)()
            except BrokerOrder.DoesNotExist:
                pass
            
            return {
                'success': True,
                'message': response.message or 'Order modified successfully',
                'data': {'status': response.status}
            }
            
        except Exception as e:
            logger.error(f"Order modification failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def cancel_order(broker_account: BrokerAccount, order_id: str) -> Dict[str, Any]:
        """Cancel existing order"""
        try:
            credentials = broker_account.get_credentials()
            client = get_broker_client(broker_account.broker_type, credentials)
            
            # Authenticate
            authenticated = await client.authenticate()
            if not authenticated:
                return {'success': False, 'error': 'Authentication failed'}
            
            # Cancel order
            response = await client.cancel_order(order_id)
            
            if response.error:
                return {'success': False, 'error': response.error}
            
            # Update broker order record
            try:
                broker_order = BrokerOrder.objects.get(
                    broker_account=broker_account,
                    broker_order_id=order_id
                )
                broker_order.status = response.status
                broker_order.cancelled_at = timezone.now()
                await sync_to_async(broker_order.save)()
            except BrokerOrder.DoesNotExist:
                pass
            
            return {
                'success': True,
                'message': response.message or 'Order cancelled successfully',
                'data': {'status': response.status}
            }
            
        except Exception as e:
            logger.error(f"Order cancellation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _check_risk_limits(broker_account: BrokerAccount, order_request: OrderRequest) -> Dict[str, Any]:
        """Check risk limits before placing order"""
        if not broker_account.risk_limit_enabled:
            return {'allowed': True}
        
        try:
            # Check daily loss limit
            if broker_account.daily_loss_limit > 0:
                today_orders = BrokerOrder.objects.filter(
                    broker_account=broker_account,
                    placed_at__date=timezone.now().date(),
                    status__in=['COMPLETE', 'PLACED']
                )
                
                # Calculate approximate loss (simplified)
                total_value = sum(
                    float(order.price or 0) * order.quantity 
                    for order in today_orders
                    if order.transaction_type == 'BUY'
                )
                
                if total_value > float(broker_account.daily_loss_limit):
                    return {
                        'allowed': False,
                        'reason': 'Daily loss limit exceeded'
                    }
            
            # Check position size limit
            if broker_account.position_size_limit > 0:
                order_value = float(order_request.price or 0) * order_request.quantity
                if order_value > float(broker_account.position_size_limit):
                    return {
                        'allowed': False,
                        'reason': 'Position size limit exceeded'
                    }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error(f"Risk check failed: {str(e)}")
            return {'allowed': True}  # Allow on error to avoid blocking trades
    
    @staticmethod
    async def get_quotes(broker_account: BrokerAccount, symbols: List[str]) -> Dict[str, Any]:
        """Get real-time quotes for symbols"""
        try:
            credentials = broker_account.get_credentials()
            client = get_broker_client(broker_account.broker_type, credentials)
            
            # Authenticate
            authenticated = await client.authenticate()
            if not authenticated:
                return {'success': False, 'error': 'Authentication failed'}
            
            quotes = {}
            for symbol in symbols:
                try:
                    quote = await client.get_quote(symbol)
                    quotes[symbol] = quote
                except Exception as e:
                    logger.error(f"Failed to get quote for {symbol}: {str(e)}")
                    quotes[symbol] = {'error': str(e)}
            
            return {
                'success': True,
                'data': quotes
            }
            
        except Exception as e:
            logger.error(f"Quotes fetch failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def log_api_call(broker_account: BrokerAccount, endpoint: str, method: str,
                    request_data: Dict = None, response_data: Dict = None,
                    status_code: int = None, response_time_ms: int = None,
                    level: str = 'INFO', message: str = None):
        """Log API call for monitoring"""
        try:
            BrokerAPILog.objects.create(
                broker_account=broker_account,
                endpoint=endpoint,
                method=method,
                request_data=request_data,
                response_data=response_data,
                status_code=status_code,
                response_time_ms=response_time_ms,
                level=level,
                message=message
            )
        except Exception as e:
            logger.error(f"Failed to log API call: {str(e)}")


class BrokerWebhookService:
    """Service for handling broker webhooks"""
    
    @staticmethod
    def process_webhook(broker_account: BrokerAccount, event_type: str, event_data: Dict[str, Any]):
        """Process incoming webhook from broker"""
        try:
            from .models import BrokerWebhook
            
            webhook = BrokerWebhook.objects.create(
                broker_account=broker_account,
                event_type=event_type,
                event_data=event_data
            )
            
            # Process webhook based on event type
            if event_type == 'ORDER_UPDATE':
                BrokerWebhookService._process_order_update(webhook)
            elif event_type == 'POSITION_UPDATE':
                BrokerWebhookService._process_position_update(webhook)
            elif event_type == 'BALANCE_UPDATE':
                BrokerWebhookService._process_balance_update(webhook)
            
            webhook.processed = True
            webhook.processed_at = timezone.now()
            webhook.save()
            
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            webhook.error_message = str(e)
            webhook.save()
    
    @staticmethod
    def _process_order_update(webhook):
        """Process order update webhook"""
        try:
            event_data = webhook.event_data
            order_id = event_data.get('order_id')
            
            if order_id:
                broker_order = BrokerOrder.objects.filter(
                    broker_account=webhook.broker_account,
                    broker_order_id=order_id
                ).first()
                
                if broker_order:
                    broker_order.status = event_data.get('status', broker_order.status)
                    broker_order.filled_quantity = event_data.get('filled_quantity', broker_order.filled_quantity)
                    broker_order.average_price = event_data.get('average_price', broker_order.average_price)
                    await sync_to_async(broker_order.save)()
                    
        except Exception as e:
            logger.error(f"Order update processing failed: {str(e)}")
    
    @staticmethod
    def _process_position_update(webhook):
        """Process position update webhook"""
        # Implementation would go here
        pass
    
    @staticmethod
    def _process_balance_update(webhook):
        """Process balance update webhook"""
        # Implementation would go here
        pass