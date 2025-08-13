import aiohttp
import hashlib
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime

from .base import BaseBrokerClient, OrderRequest, OrderResponse, Position, Balance, Order


class AliceBlueClient(BaseBrokerClient):
    """Alice Blue API client"""
    
    BASE_URL = 'https://ant.aliceblueonline.com/rest/AliceBlueAPIService'
    
    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.user_id = credentials.get('user_id')
        self.api_key = credentials.get('api_key')
        self.session_id = credentials.get('session_id')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_id} {self.session_id}' if self.session_id else None
        }
    
    async def authenticate(self) -> bool:
        """Authenticate with Alice Blue API"""
        try:
            if self.session_id:
                # Verify existing session
                profile = await self.get_profile()
                return bool(profile)
            
            # For Alice Blue, would need to implement login flow
            # For now, assume session_id is provided
            return bool(self.session_id)
        except Exception as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
    
    async def get_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        data = {
            'uid': self.user_id
        }
        return await self._make_request('POST', '/api/customer/accountDetails', data=data)
    
    async def get_balance(self) -> Balance:
        """Get account balance"""
        data = {
            'uid': self.user_id
        }
        result = await self._make_request('POST', '/api/customer/accountBalance', data=data)
        
        return Balance(
            net=Decimal(str(result.get('net', 0))),
            available=Decimal(str(result.get('availablecash', 0))),
            utilised=Decimal(str(result.get('utilisedpayout', 0))),
            margin_used=Decimal(str(result.get('m2mrealized', 0))),
            cash=Decimal(str(result.get('availablecash', 0)))
        )
    
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        data = {
            'uid': self.user_id,
            'ret': 'NET'
        }
        result = await self._make_request('POST', '/api/positionBook/positionBookDetails', data=data)
        positions = []
        
        for pos_data in result:
            if int(pos_data.get('Netqty', 0)) != 0:
                positions.append(Position(
                    symbol=pos_data['Tsym'],
                    exchange=pos_data['Exchange'],
                    product=pos_data['Pcode'],
                    quantity=int(pos_data['Netqty']),
                    average_price=Decimal(str(pos_data['Netupldprc'])),
                    last_price=Decimal(str(pos_data['LTP'])),
                    unrealized_pnl=Decimal(str(pos_data['PandL'])),
                    realized_pnl=Decimal('0')
                ))
        
        return positions
    
    async def get_orders(self) -> List[Order]:
        """Get order history"""
        data = {
            'uid': self.user_id
        }
        result = await self._make_request('POST', '/api/placeOrder/orderHistory', data=data)
        orders = []
        
        for order_data in result:
            orders.append(Order(
                order_id=order_data['Nstordno'],
                symbol=order_data['Tsym'],
                exchange=order_data['Exchange'],
                transaction_type=order_data['Trantype'],
                order_type=order_data['Prctype'],
                quantity=int(order_data['Qty']),
                price=Decimal(str(order_data['Prc'])) if order_data['Prc'] != '0' else None,
                trigger_price=Decimal(str(order_data['Trgprc'])) if order_data['Trgprc'] != '0' else None,
                status=self._standardize_order_status(order_data['Status']),
                filled_quantity=int(order_data.get('Fillshares', 0)),
                average_price=Decimal(str(order_data['Avgprc'])) if order_data.get('Avgprc', '0') != '0' else None,
                order_timestamp=order_data.get('orderentrytime'),
                exchange_timestamp=order_data.get('exchtime'),
                status_message=order_data.get('Emsg')
            ))
        
        return orders
    
    async def place_order(self, order_request: OrderRequest) -> OrderResponse:
        """Place a new order"""
        data = {
            'uid': self.user_id,
            'actid': self.user_id,
            'exch': order_request.exchange,
            'tsym': order_request.symbol,
            'qty': str(order_request.quantity),
            'prc': str(order_request.price) if order_request.price else '0',
            'prd': order_request.product,
            'trantype': order_request.transaction_type,
            'prctyp': order_request.order_type,
            'ret': 'DAY',
            'ordersource': 'API'
        }
        
        if order_request.trigger_price:
            data['trgprc'] = str(order_request.trigger_price)
        
        if order_request.disclosed_quantity:
            data['discqty'] = str(order_request.disclosed_quantity)
        
        try:
            response = await self._make_request('POST', '/api/placeOrder/executePlaceOrder', data=data)
            return OrderResponse(
                order_id=response.get('NOrdNo', ''),
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
            'uid': self.user_id,
            'actid': self.user_id,
            'norenordno': order_id,
            'exch': order_request.exchange,
            'tsym': order_request.symbol,
            'qty': str(order_request.quantity),
            'prc': str(order_request.price) if order_request.price else '0',
            'prd': order_request.product,
            'prctyp': order_request.order_type
        }
        
        if order_request.trigger_price:
            data['trgprc'] = str(order_request.trigger_price)
        
        try:
            response = await self._make_request('POST', '/api/placeOrder/modifyOrder', data=data)
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
        data = {
            'uid': self.user_id,
            'norenordno': order_id
        }
        
        try:
            await self._make_request('POST', '/api/placeOrder/cancelOrder', data=data)
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
        data = {
            'uid': self.user_id,
            'exch': exchange,
            'token': self._get_token(symbol, exchange)
        }
        return await self._make_request('POST', '/api/marketData/getQuote', data=data)
    
    async def get_historical_data(self, symbol: str, from_date: str, to_date: str,
                                interval: str = '1') -> List[Dict[str, Any]]:
        """Get historical OHLC data"""
        data = {
            'uid': self.user_id,
            'exch': 'NSE',
            'token': self._get_token(symbol, 'NSE'),
            'st': from_date,
            'et': to_date,
            'intrv': interval
        }
        return await self._make_request('POST', '/api/chart/history', data=data)
    
    async def subscribe_to_ticks(self, symbols: List[str], callback) -> bool:
        """Subscribe to real-time market data"""
        # WebSocket implementation would go here
        return False
    
    async def unsubscribe_from_ticks(self, symbols: List[str]) -> bool:
        """Unsubscribe from real-time market data"""
        return False
    
    def _get_token(self, symbol: str, exchange: str) -> str:
        """Get token for symbol - simplified implementation"""
        # In production, this would lookup from instrument master
        return symbol
    
    async def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to Alice Blue API"""
        url = f'{self.BASE_URL}{endpoint}'
        
        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                'headers': self.headers,
                'timeout': aiohttp.ClientTimeout(total=30)
            }
            
            if method.upper() == 'POST':
                request_kwargs['json'] = data
            
            async with session.request(method, url, **request_kwargs) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('stat') == 'Ok':
                        return result
                    else:
                        raise Exception(f"API Error: {result.get('emsg', 'Unknown error')}")
                else:
                    error_text = await response.text()
                    raise Exception(f"HTTP {response.status}: {error_text}")
    
    def _format_symbol(self, symbol: str, exchange: str = 'NSE') -> str:
        """Format symbol for Alice Blue API"""
        return symbol