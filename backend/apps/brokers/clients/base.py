from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


@dataclass
class OrderRequest:
    """Standardized order request structure"""
    symbol: str
    exchange: str
    transaction_type: str  # BUY, SELL
    order_type: str  # MARKET, LIMIT, SL, SL_M
    quantity: int
    price: Optional[Decimal] = None
    trigger_price: Optional[Decimal] = None
    product: str = 'CNC'  # CNC, MIS, NRML
    validity: str = 'DAY'  # DAY, IOC, GTD
    disclosed_quantity: int = 0
    tag: Optional[str] = None


@dataclass
class OrderResponse:
    """Standardized order response structure"""
    order_id: str
    status: str
    message: Optional[str] = None
    error: Optional[str] = None


@dataclass
class Position:
    """Standardized position structure"""
    symbol: str
    exchange: str
    product: str
    quantity: int
    average_price: Decimal
    last_price: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal = Decimal('0')


@dataclass
class Balance:
    """Standardized balance structure"""
    net: Decimal
    available: Decimal
    utilised: Decimal
    margin_used: Decimal = Decimal('0')
    cash: Decimal = Decimal('0')


@dataclass
class Order:
    """Standardized order structure"""
    order_id: str
    symbol: str
    exchange: str
    transaction_type: str
    order_type: str
    quantity: int
    price: Optional[Decimal]
    trigger_price: Optional[Decimal]
    status: str
    filled_quantity: int = 0
    average_price: Optional[Decimal] = None
    order_timestamp: Optional[str] = None
    exchange_timestamp: Optional[str] = None
    status_message: Optional[str] = None


class BaseBrokerClient(ABC):
    """Abstract base class for broker API clients"""
    
    def __init__(self, credentials: Dict[str, Any]):
        self.credentials = credentials
        self.session = None
        self.logger = logging.getLogger(f"{self.__class__.__name__}")
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate with broker API"""
        pass
    
    @abstractmethod
    async def get_profile(self) -> Dict[str, Any]:
        """Get user profile information"""
        pass
    
    @abstractmethod
    async def get_balance(self) -> Balance:
        """Get account balance"""
        pass
    
    @abstractmethod
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        pass
    
    @abstractmethod
    async def get_orders(self) -> List[Order]:
        """Get order history"""
        pass
    
    @abstractmethod
    async def place_order(self, order_request: OrderRequest) -> OrderResponse:
        """Place a new order"""
        pass
    
    @abstractmethod
    async def modify_order(self, order_id: str, order_request: OrderRequest) -> OrderResponse:
        """Modify existing order"""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> OrderResponse:
        """Cancel existing order"""
        pass
    
    @abstractmethod
    async def get_quote(self, symbol: str, exchange: str = 'NSE') -> Dict[str, Any]:
        """Get real-time quote for symbol"""
        pass
    
    @abstractmethod
    async def get_historical_data(self, symbol: str, from_date: str, to_date: str, 
                                interval: str = 'day') -> List[Dict[str, Any]]:
        """Get historical OHLC data"""
        pass
    
    @abstractmethod
    async def subscribe_to_ticks(self, symbols: List[str], callback) -> bool:
        """Subscribe to real-time market data"""
        pass
    
    @abstractmethod
    async def unsubscribe_from_ticks(self, symbols: List[str]) -> bool:
        """Unsubscribe from real-time market data"""
        pass
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test broker connection and return status"""
        try:
            authenticated = await self.authenticate()
            if not authenticated:
                return {
                    'success': False,
                    'message': 'Authentication failed',
                    'error': 'Invalid credentials'
                }
            
            profile = await self.get_profile()
            balance = await self.get_balance()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'data': {
                    'profile': profile,
                    'balance': {
                        'net': float(balance.net),
                        'available': float(balance.available),
                        'utilised': float(balance.utilised)
                    }
                }
            }
        except Exception as e:
            self.logger.error(f"Connection test failed: {str(e)}")
            return {
                'success': False,
                'message': 'Connection test failed',
                'error': str(e)
            }
    
    def _log_api_call(self, endpoint: str, method: str, request_data: Dict = None, 
                     response_data: Dict = None, status_code: int = None,
                     response_time_ms: int = None, error: str = None):
        """Log API calls for debugging and monitoring"""
        log_data = {
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'response_time_ms': response_time_ms
        }
        
        if error:
            self.logger.error(f"API call failed: {log_data}, Error: {error}")
        else:
            self.logger.info(f"API call successful: {log_data}")
    
    def _standardize_order_status(self, broker_status: str) -> str:
        """Convert broker-specific order status to standardized format"""
        status_mapping = {
            'COMPLETE': 'COMPLETE',
            'CANCELLED': 'CANCELLED',
            'REJECTED': 'REJECTED',
            'OPEN': 'PLACED',
            'PENDING': 'PENDING',
            'MODIFY_PENDING': 'PLACED',
            'CANCEL_PENDING': 'PLACED'
        }
        return status_mapping.get(broker_status.upper(), broker_status)
    
    def _format_symbol(self, symbol: str, exchange: str = 'NSE') -> str:
        """Format symbol according to broker requirements"""
        # Default implementation - override in specific clients
        return f"{exchange}:{symbol}"
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on broker connection"""
        try:
            # Try to get profile - minimal API call
            profile = await self.get_profile()
            return {
                'healthy': True,
                'timestamp': None,
                'latency_ms': None
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e),
                'timestamp': None
            }