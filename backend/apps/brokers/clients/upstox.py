import aiohttp
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime

from .base import BaseBrokerClient, OrderRequest, OrderResponse, Position, Balance, Order


class UpstoxClient(BaseBrokerClient):
    """Upstox API v2 client"""
    
    BASE_URL = 'https://api.upstox.com/v2'
    
    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        self.access_token = credentials.get('access_token')
        self.redirect_uri = credentials.get('redirect_uri', 'https://localhost')
        self.headers = {
            'Accept': 'application/json',
            'Authorization': f'Bearer {self.access_token}' if self.access_token else None
        }
    
    async def authenticate(self) -> bool:
        """Authenticate with Upstox API"""
        try:
            if self.access_token:
                # Verify existing token
                profile = await self.get_profile()
                return bool(profile)
            
            # For OAuth flow, would need to implement token exchange
            # For now, assume access_token is provided
            return bool(self.access_token)
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
    
    async def get_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        return await self._make_request('GET', '/user/profile')
    
    async def get_balance(self) -> Balance:
        """Get account balance"""
        data = await self._make_request('GET', '/user/get-funds-and-margin')
        equity = data.get('equity', {})
        
        return Balance(
            net=Decimal(str(equity.get('net', 0))),
            available=Decimal(str(equity.get('available_margin', 0))),
            utilised=Decimal(str(equity.get('used_margin', 0))),
            margin_used=Decimal(str(equity.get('used_margin', 0))),
            cash=Decimal(str(equity.get('available_margin', 0)))
        )
    
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        data = await self._make_request('GET', '/portfolio/long-term-positions')
        positions = []
        
        for pos_data in data:
            if pos_data['quantity'] != 0:
                positions.append(Position(
                    symbol=pos_data['trading_symbol'],
                    exchange=pos_data['exchange'],
                    product=pos_data['product'],
                    quantity=int(pos_data['quantity']),
                    average_price=Decimal(str(pos_data['average_price'])),
                    last_price=Decimal(str(pos_data['last_price'])),
                    unrealized_pnl=Decimal(str(pos_data['pnl'])),
                    realized_pnl=Decimal('0')
                ))
        
        return positions
    
    async def get_orders(self) -> List[Order]:
        """Get order history"""
        data = await self._make_request('GET', '/order/retrieve-all')
        orders = []
        
        for order_data in data:
            orders.append(Order(
                order_id=order_data['order_id'],
                symbol=order_data['trading_symbol'],
                exchange=order_data['exchange'],
                transaction_type=order_data['transaction_type'],
                order_type=order_data['order_type'],
                quantity=int(order_data['quantity']),
                price=Decimal(str(order_data['price'])) if order_data['price'] else None,
                trigger_price=Decimal(str(order_data['trigger_price'])) if order_data['trigger_price'] else None,
                status=self._standardize_order_status(order_data['status']),
                filled_quantity=int(order_data.get('filled_quantity', 0)),
                average_price=Decimal(str(order_data['average_price'])) if order_data.get('average_price') else None,
                order_timestamp=order_data.get('order_timestamp'),
                exchange_timestamp=order_data.get('exchange_timestamp'),
                status_message=order_data.get('status_message')
            ))
        
        return orders
    
    async def place_order(self, order_request: OrderRequest) -> OrderResponse:
        """Place a new order"""
        data = {
            'quantity': order_request.quantity,
            'product': order_request.product,
            'validity': order_request.validity,
            'price': float(order_request.price) if order_request.price else 0,
            'tag': order_request.tag or 'string',
            'instrument_token': self._get_instrument_token(order_request.symbol, order_request.exchange),
            'order_type': order_request.order_type,
            'transaction_type': order_request.transaction_type,
            'disclosed_quantity': order_request.disclosed_quantity,
            'trigger_price': float(order_request.trigger_price) if order_request.trigger_price else 0,
            'is_amo': False
        }
        
        try:
            response = await self._make_request('POST', '/order/place', data=data)
            return OrderResponse(
                order_id=response.get('order_id', ''),
                status='PLACED',
                message='Order placed successfully'
            )
        except Exception as e:
            return OrderResponse(
                order_id='',
                status='REJECTED',
                error=str(e)
            )
    
    async def modify_order(self, order_id: str, order_request: OrderRequest) -> OrderResponse:
        """Modify existing order"""
        data = {
            'quantity': order_request.quantity,
            'validity': order_request.validity,
            'price': float(order_request.price) if order_request.price else 0,
            'order_id': order_id,
            'order_type': order_request.order_type,
            'disclosed_quantity': order_request.disclosed_quantity,
            'trigger_price': float(order_request.trigger_price) if order_request.trigger_price else 0
        }
        
        try:
            response = await self._make_request('PUT', '/order/modify', data=data)
            return OrderResponse(
                order_id=order_id,
                status='MODIFIED',
                message='Order modified successfully'
            )
        except Exception as e:
            return OrderResponse(
                order_id=order_id,
                status='REJECTED',
                error=str(e)
            )
    
    async def cancel_order(self, order_id: str) -> OrderResponse:
        """Cancel existing order"""
        try:
            await self._make_request('DELETE', f'/order/cancel?order_id={order_id}')
            return OrderResponse(
                order_id=order_id,
                status='CANCELLED',
                message='Order cancelled successfully'
            )
        except Exception as e:
            return OrderResponse(
                order_id=order_id,
                status='REJECTED',
                error=str(e)
            )
    
    async def get_quote(self, symbol: str, exchange: str = 'NSE') -> Dict[str, Any]:
        """Get real-time quote"""
        instrument_key = self._get_instrument_token(symbol, exchange)
        data = await self._make_request('GET', f'/market-quote/quotes?instrument_key={instrument_key}')
        return data.get(instrument_key, {})
    
    async def get_historical_data(self, symbol: str, from_date: str, to_date: str,
                                interval: str = '1day') -> List[Dict[str, Any]]:
        """Get historical OHLC data"""
        instrument_key = self._get_instrument_token(symbol, exchange)
        params = {
            'instrument_key': instrument_key,
            'interval': interval,
            'from_date': from_date,
            'to_date': to_date
        }
        return await self._make_request('GET', '/historical-candle/intraday', params=params)
    
    async def subscribe_to_ticks(self, symbols: List[str], callback) -> bool:
        """Subscribe to real-time market data"""
        # WebSocket implementation would go here
        return False
    
    async def unsubscribe_from_ticks(self, symbols: List[str]) -> bool:
        """Unsubscribe from real-time market data"""
        return False
    
    def _get_instrument_token(self, symbol: str, exchange: str) -> str:
        """Get instrument token for symbol - simplified implementation"""
        # In production, this would lookup from instrument master file
        return f"{exchange}:{symbol}"
    
    async def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to Upstox API"""
        url = f'{self.BASE_URL}{endpoint}'
        
        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                'headers': self.headers,
                'timeout': aiohttp.ClientTimeout(total=30)
            }
            
            if method.upper() in ['POST', 'PUT']:
                request_kwargs['json'] = data
            elif params:
                request_kwargs['params'] = params
            
            async with session.request(method, url, **request_kwargs) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('status') == 'success':
                        return result.get('data', {})
                    else:
                        raise Exception(f"API Error: {result.get('message', 'Unknown error')}")
                else:
                    error_text = await response.text()
                    raise Exception(f"HTTP {response.status}: {error_text}")
    
    def _format_symbol(self, symbol: str, exchange: str = 'NSE') -> str:
        """Format symbol for Upstox API"""
        return f'{exchange}:{symbol}'