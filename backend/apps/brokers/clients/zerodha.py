import aiohttp
import asyncio
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime
import hashlib
import hmac

from .base import BaseBrokerClient, OrderRequest, OrderResponse, Position, Balance, Order


class ZerodhaClient(BaseBrokerClient):
    """Zerodha KiteConnect API client"""
    
    BASE_URL = 'https://api.kite.trade'
    LOGIN_URL = 'https://kite.zerodha.com/connect/login'
    
    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        self.access_token = credentials.get('access_token')
        self.request_token = credentials.get('request_token')
        self.headers = {
            'X-Kite-Version': '3',
            'Authorization': f'token {self.api_key}:{self.access_token}' if self.access_token else None
        }
    
    async def authenticate(self) -> bool:
        """Authenticate with Zerodha KiteConnect"""
        try:
            if self.access_token:
                # Verify existing token
                profile = await self.get_profile()
                return bool(profile)
            
            if self.request_token:
                # Generate access token from request token
                await self._generate_access_token()
                return True
            
            return False
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
    
    async def _generate_access_token(self):
        """Generate access token from request token"""
        checksum = hashlib.sha256(
            (self.api_key + self.request_token + self.api_secret).encode()
        ).hexdigest()
        
        data = {
            'api_key': self.api_key,
            'request_token': self.request_token,
            'checksum': checksum
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f'{self.BASE_URL}/session/token', data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result['data']['access_token']
                    self.headers['Authorization'] = f'token {self.api_key}:{self.access_token}'
                else:
                    raise Exception(f"Token generation failed: {response.status}")
    
    async def get_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        return await self._make_request('GET', '/user/profile')
    
    async def get_balance(self) -> Balance:
        """Get account balance"""
        data = await self._make_request('GET', '/user/margins')
        equity = data.get('equity', {})
        
        return Balance(
            net=Decimal(str(equity.get('net', 0))),
            available=Decimal(str(equity.get('available', {}).get('cash', 0))),
            utilised=Decimal(str(equity.get('utilised', {}).get('debits', 0))),
            margin_used=Decimal(str(equity.get('utilised', {}).get('m2m_unrealised', 0))),
            cash=Decimal(str(equity.get('available', {}).get('cash', 0)))
        )
    
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        data = await self._make_request('GET', '/portfolio/positions')
        positions = []
        
        for pos_data in data.get('net', []):
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
    
    async def get_orders(self) -> List[Order]:
        """Get order history"""
        data = await self._make_request('GET', '/orders')
        orders = []
        
        for order_data in data:
            orders.append(Order(
                order_id=order_data['order_id'],
                symbol=order_data['tradingsymbol'],
                exchange=order_data['exchange'],
                transaction_type=order_data['transaction_type'],
                order_type=order_data['order_type'],
                quantity=int(order_data['quantity']),
                price=Decimal(str(order_data['price'])) if order_data['price'] else None,
                trigger_price=Decimal(str(order_data['trigger_price'])) if order_data['trigger_price'] else None,
                status=self._standardize_order_status(order_data['status']),
                filled_quantity=int(order_data['filled_quantity']),
                average_price=Decimal(str(order_data['average_price'])) if order_data['average_price'] else None,
                order_timestamp=order_data['order_timestamp'],
                exchange_timestamp=order_data['exchange_timestamp'],
                status_message=order_data.get('status_message')
            ))
        
        return orders
    
    async def place_order(self, order_request: OrderRequest) -> OrderResponse:
        """Place a new order"""
        data = {
            'tradingsymbol': order_request.symbol,
            'exchange': order_request.exchange,
            'transaction_type': order_request.transaction_type,
            'order_type': order_request.order_type,
            'quantity': str(order_request.quantity),
            'product': order_request.product,
            'validity': order_request.validity
        }
        
        if order_request.price:
            data['price'] = str(order_request.price)
        
        if order_request.trigger_price:
            data['trigger_price'] = str(order_request.trigger_price)
        
        if order_request.disclosed_quantity:
            data['disclosed_quantity'] = str(order_request.disclosed_quantity)
        
        if order_request.tag:
            data['tag'] = order_request.tag
        
        try:
            response = await self._make_request('POST', '/orders/regular', data=data)
            return OrderResponse(
                order_id=response['order_id'],
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
            'quantity': str(order_request.quantity),
            'order_type': order_request.order_type,
            'validity': order_request.validity
        }
        
        if order_request.price:
            data['price'] = str(order_request.price)
        
        if order_request.trigger_price:
            data['trigger_price'] = str(order_request.trigger_price)
        
        try:
            response = await self._make_request('PUT', f'/orders/regular/{order_id}', data=data)
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
            await self._make_request('DELETE', f'/orders/regular/{order_id}')
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
        instrument = f'{exchange}:{symbol}'
        data = await self._make_request('GET', f'/quote?i={instrument}')
        return data.get(instrument, {})
    
    async def get_historical_data(self, symbol: str, from_date: str, to_date: str,
                                interval: str = 'day') -> List[Dict[str, Any]]:
        """Get historical OHLC data"""
        # Note: This requires instrument token, which would need to be looked up
        # For now, return empty list - implement full instrument mapping later
        return []
    
    async def subscribe_to_ticks(self, symbols: List[str], callback) -> bool:
        """Subscribe to real-time market data via WebSocket"""
        # WebSocket implementation would go here
        # For now, return False indicating not implemented
        return False
    
    async def unsubscribe_from_ticks(self, symbols: List[str]) -> bool:
        """Unsubscribe from real-time market data"""
        # WebSocket implementation would go here
        return False
    
    async def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to Zerodha API"""
        url = f'{self.BASE_URL}{endpoint}'
        
        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                'headers': self.headers,
                'timeout': aiohttp.ClientTimeout(total=30)
            }
            
            if method.upper() == 'POST':
                request_kwargs['data'] = data
            elif method.upper() == 'PUT':
                request_kwargs['data'] = data
            elif method.upper() == 'GET' and data:
                request_kwargs['params'] = data
            
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
        """Format symbol for Zerodha API"""
        return f'{exchange}:{symbol}'