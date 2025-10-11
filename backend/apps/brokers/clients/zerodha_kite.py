from kiteconnect import KiteConnect
from typing import Dict, List, Any, Optional
from decimal import Decimal
import logging

from .base import BaseBrokerClient, OrderRequest, OrderResponse, Position, Balance, Order

logger = logging.getLogger(__name__)


class ZerodhaKiteClient(BaseBrokerClient):
    """Zerodha KiteConnect API client using official library"""

    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        self.access_token = credentials.get('access_token')
        self.request_token = credentials.get('request_token')
        
        # Initialize KiteConnect
        self.kite = KiteConnect(api_key=self.api_key)
        
        if self.access_token:
            self.kite.set_access_token(self.access_token)

    async def authenticate(self) -> bool:
        """Authenticate with Zerodha KiteConnect"""
        try:
            if self.access_token:
                # Verify existing token by getting profile
                profile = await self.get_profile()
                return bool(profile)

            if self.request_token and self.api_secret:
                # Generate access token from request token
                data = self.kite.generate_session(
                    self.request_token,
                    api_secret=self.api_secret
                )
                self.access_token = data["access_token"]
                self.kite.set_access_token(self.access_token)
                
                # Update credentials with access token
                self.credentials['access_token'] = self.access_token
                return True

            return False
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False

    async def get_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        try:
            return self.kite.profile()
        except Exception as e:
            self.logger.error(f"Get profile failed: {str(e)}")
            raise

    async def get_balance(self) -> Balance:
        """Get account balance"""
        try:
            margins = self.kite.margins()
            equity = margins.get('equity', {})

            return Balance(
                net=Decimal(str(equity.get('net', 0))),
                available=Decimal(str(equity.get('available', {}).get('cash', 0))),
                utilised=Decimal(str(equity.get('utilised', {}).get('debits', 0))),
                margin_used=Decimal(str(equity.get('utilised', {}).get('m2m_unrealised', 0))),
                cash=Decimal(str(equity.get('available', {}).get('cash', 0)))
            )
        except Exception as e:
            self.logger.error(f"Get balance failed: {str(e)}")
            raise

    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        try:
            positions_data = self.kite.positions()
            positions = []

            for pos_data in positions_data.get('net', []):
                if pos_data['quantity'] != 0:
                    positions.append(Position(
                        symbol=pos_data['tradingsymbol'],
                        exchange=pos_data['exchange'],
                        product=pos_data['product'],
                        quantity=int(pos_data['quantity']),
                        average_price=Decimal(str(pos_data['average_price'])),
                        last_price=Decimal(str(pos_data['last_price'])),
                        unrealized_pnl=Decimal(str(pos_data['pnl'])),
                        realized_pnl=Decimal(str(pos_data.get('realised', 0)))
                    ))

            return positions
        except Exception as e:
            self.logger.error(f"Get positions failed: {str(e)}")
            return []

    async def get_orders(self) -> List[Order]:
        """Get order history"""
        try:
            orders_data = self.kite.orders()
            orders = []

            for order_data in orders_data:
                orders.append(Order(
                    order_id=order_data['order_id'],
                    symbol=order_data['tradingsymbol'],
                    exchange=order_data['exchange'],
                    transaction_type=order_data['transaction_type'],
                    order_type=order_data['order_type'],
                    quantity=int(order_data['quantity']),
                    price=Decimal(str(order_data['price'])) if order_data.get('price') else None,
                    trigger_price=Decimal(str(order_data['trigger_price'])) if order_data.get('trigger_price') else None,
                    status=self._standardize_order_status(order_data['status']),
                    filled_quantity=int(order_data['filled_quantity']),
                    average_price=Decimal(str(order_data['average_price'])) if order_data.get('average_price') else None,
                    order_timestamp=order_data.get('order_timestamp'),
                    exchange_timestamp=order_data.get('exchange_timestamp'),
                    status_message=order_data.get('status_message')
                ))

            return orders
        except Exception as e:
            self.logger.error(f"Get orders failed: {str(e)}")
            return []

    async def place_order(self, order_request: OrderRequest) -> OrderResponse:
        """Place a new order"""
        try:
            order_params = {
                'tradingsymbol': order_request.symbol,
                'exchange': order_request.exchange,
                'transaction_type': order_request.transaction_type,
                'order_type': order_request.order_type,
                'quantity': order_request.quantity,
                'product': order_request.product,
                'validity': order_request.validity
            }

            if order_request.price:
                order_params['price'] = float(order_request.price)

            if order_request.trigger_price:
                order_params['trigger_price'] = float(order_request.trigger_price)

            if order_request.disclosed_quantity:
                order_params['disclosed_quantity'] = order_request.disclosed_quantity

            if order_request.tag:
                order_params['tag'] = order_request.tag

            order_id = self.kite.place_order(**order_params)
            
            return OrderResponse(
                order_id=order_id,
                status='PLACED',
                message='Order placed successfully'
            )
        except Exception as e:
            self.logger.error(f"Place order failed: {str(e)}")
            return OrderResponse(
                order_id='',
                status='REJECTED',
                error=str(e)
            )

    async def modify_order(self, order_id: str, order_request: OrderRequest) -> OrderResponse:
        """Modify existing order"""
        try:
            order_params = {
                'order_id': order_id,
                'quantity': order_request.quantity,
                'order_type': order_request.order_type,
                'validity': order_request.validity
            }

            if order_request.price:
                order_params['price'] = float(order_request.price)

            if order_request.trigger_price:
                order_params['trigger_price'] = float(order_request.trigger_price)

            self.kite.modify_order(**order_params)
            
            return OrderResponse(
                order_id=order_id,
                status='MODIFIED',
                message='Order modified successfully'
            )
        except Exception as e:
            self.logger.error(f"Modify order failed: {str(e)}")
            return OrderResponse(
                order_id=order_id,
                status='REJECTED',
                error=str(e)
            )

    async def cancel_order(self, order_id: str) -> OrderResponse:
        """Cancel existing order"""
        try:
            self.kite.cancel_order(order_id=order_id)
            
            return OrderResponse(
                order_id=order_id,
                status='CANCELLED',
                message='Order cancelled successfully'
            )
        except Exception as e:
            self.logger.error(f"Cancel order failed: {str(e)}")
            return OrderResponse(
                order_id=order_id,
                status='REJECTED',
                error=str(e)
            )

    async def get_quote(self, symbol: str, exchange: str = 'NSE') -> Dict[str, Any]:
        """Get real-time quote"""
        try:
            instrument = f'{exchange}:{symbol}'
            quotes = self.kite.quote([instrument])
            return quotes.get(instrument, {})
        except Exception as e:
            self.logger.error(f"Get quote failed for {symbol}: {str(e)}")
            return {'error': str(e)}

    async def get_historical_data(self, symbol: str, from_date: str, to_date: str,
                                interval: str = 'day') -> List[Dict[str, Any]]:
        """Get historical OHLC data"""
        try:
            # This requires instrument token - implement instrument lookup
            return []
        except Exception as e:
            self.logger.error(f"Get historical data failed: {str(e)}")
            return []

    async def subscribe_to_ticks(self, symbols: List[str], callback) -> bool:
        """Subscribe to real-time market data via WebSocket"""
        # KiteTicker implementation would go here
        return False

    async def unsubscribe_from_ticks(self, symbols: List[str]) -> bool:
        """Unsubscribe from real-time market data"""
        return False

    def get_login_url(self) -> str:
        """Get Zerodha login URL for OAuth"""
        return self.kite.login_url()
