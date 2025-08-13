import asyncio
import aiohttp
import websockets
import json
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from typing import Dict, List, Optional, Any
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from decimal import Decimal
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .models import (NSEAPIConfiguration, MarketDataCache, LiveMarketData, 
                     MarketDataLog, WebSocketConnection, DataSubscription)

logger = logging.getLogger(__name__)


class NSEDataProvider:
    """NSE Official API Data Provider"""
    
    def __init__(self, config: NSEAPIConfiguration):
        self.config = config
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
        }
        self.base_url = config.base_url
        
    def _setup_session(self):
        """Setup HTTP session with retry strategy"""
        if not self.session:
            self.session = requests.Session()
            retry_strategy = Retry(
                total=3,
                backoff_factor=0.5,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            self.session.mount("http://", adapter)
            self.session.mount("https://", adapter)
            self.session.headers.update(self.headers)
    
    async def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get real-time quote for a symbol"""
        try:
            self._setup_session()
            
            # NSE API endpoint for equity quotes
            url = f"{self.base_url}/quote-equity"
            params = {'symbol': symbol}
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self._normalize_quote_data(data)
            else:
                await self._log_error(f"Quote API error: {response.status_code}", symbol=symbol)
                return None
                
        except Exception as e:
            await self._log_error(f"Quote fetch error: {str(e)}", symbol=symbol)
            return None
    
    async def get_option_chain(self, underlying: str, expiry: str = None) -> Optional[Dict]:
        """Get options chain data"""
        try:
            self._setup_session()
            
            url = f"{self.base_url}/option-chain-indices"
            params = {'symbol': underlying}
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                return self._normalize_option_chain(data, expiry)
            else:
                await self._log_error(f"Option chain API error: {response.status_code}", symbol=underlying)
                return None
                
        except Exception as e:
            await self._log_error(f"Option chain fetch error: {str(e)}", symbol=underlying)
            return None
    
    async def get_futures_data(self, underlying: str) -> Optional[Dict]:
        """Get futures data"""
        try:
            # This would implement futures data fetching
            # NSE doesn't have a direct futures API, so we'd use derivatives data
            return await self._get_derivatives_data(underlying, 'FUTURES')
        except Exception as e:
            await self._log_error(f"Futures fetch error: {str(e)}", symbol=underlying)
            return None
    
    def _normalize_quote_data(self, data: Dict) -> Dict:
        """Normalize NSE API response to our format"""
        try:
            price_info = data.get('priceInfo', {})
            
            return {
                'symbol': data.get('info', {}).get('symbol', ''),
                'last_price': Decimal(str(price_info.get('lastPrice', 0))),
                'change': Decimal(str(price_info.get('change', 0))),
                'change_percent': Decimal(str(price_info.get('pChange', 0))),
                'open_price': Decimal(str(price_info.get('open', 0))),
                'high_price': Decimal(str(price_info.get('intraDayHighLow', {}).get('max', 0))),
                'low_price': Decimal(str(price_info.get('intraDayHighLow', {}).get('min', 0))),
                'previous_close': Decimal(str(price_info.get('previousClose', 0))),
                'volume': int(data.get('securityWiseDP', {}).get('quantityTraded', 0)),
                'value': Decimal(str(data.get('securityWiseDP', {}).get('totalTradedValue', 0))),
                'timestamp': timezone.now(),
                'data_source': 'NSE_OFFICIAL'
            }
        except Exception as e:
            logger.error(f"Error normalizing quote data: {e}")
            return {}
    
    def _normalize_option_chain(self, data: Dict, expiry_filter: str = None) -> Dict:
        """Normalize options chain data"""
        try:
            records = data.get('records', {})
            option_data = records.get('data', [])
            
            normalized = {
                'underlying_symbol': records.get('underlyingValue', ''),
                'underlying_price': Decimal(str(records.get('underlyingValue', 0))),
                'timestamp': timezone.now(),
                'strikes': {}
            }
            
            for item in option_data:
                strike = item.get('strikePrice', 0)
                ce_data = item.get('CE', {})
                pe_data = item.get('PE', {})
                
                normalized['strikes'][strike] = {
                    'call': {
                        'last_price': Decimal(str(ce_data.get('lastPrice', 0))),
                        'change': Decimal(str(ce_data.get('change', 0))),
                        'change_percent': Decimal(str(ce_data.get('pchangeinOpenInterest', 0))),
                        'volume': int(ce_data.get('totalTradedVolume', 0)),
                        'open_interest': int(ce_data.get('openInterest', 0)),
                        'implied_volatility': Decimal(str(ce_data.get('impliedVolatility', 0))),
                        'bid_price': Decimal(str(ce_data.get('bidprice', 0))),
                        'ask_price': Decimal(str(ce_data.get('askPrice', 0))),
                    },
                    'put': {
                        'last_price': Decimal(str(pe_data.get('lastPrice', 0))),
                        'change': Decimal(str(pe_data.get('change', 0))),
                        'change_percent': Decimal(str(pe_data.get('pchangeinOpenInterest', 0))),
                        'volume': int(pe_data.get('totalTradedVolume', 0)),
                        'open_interest': int(pe_data.get('openInterest', 0)),
                        'implied_volatility': Decimal(str(pe_data.get('impliedVolatility', 0))),
                        'bid_price': Decimal(str(pe_data.get('bidprice', 0))),
                        'ask_price': Decimal(str(pe_data.get('askPrice', 0))),
                    }
                }
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing option chain: {e}")
            return {}
    
    async def _get_derivatives_data(self, underlying: str, instrument_type: str) -> Dict:
        """Get derivatives data from NSE"""
        # Implementation would depend on specific NSE derivatives API
        return {}
    
    async def _log_error(self, message: str, symbol: str = None, **kwargs):
        """Log API errors"""
        try:
            await sync_to_async(MarketDataLog.objects.create)(
                level=MarketDataLog.LogLevel.ERROR,
                message=message,
                api_provider='NSE_OFFICIAL',
                symbol=symbol or '',
                **kwargs
            )
        except Exception as e:
            logger.error(f"Error logging to database: {e}")


class MarketDataService:
    """Main service for managing market data"""
    
    def __init__(self):
        self.providers = {}
        self.websocket_connections = {}
        self.channel_layer = get_channel_layer()
        
    @classmethod
    async def initialize(cls):
        """Initialize market data service"""
        instance = cls()
        await instance.load_providers()
        return instance
    
    async def load_providers(self):
        """Load configured data providers"""
        try:
            configs = await sync_to_async(list)(
                NSEAPIConfiguration.objects.filter(status=NSEAPIConfiguration.Status.ACTIVE)
            )
            
            for config in configs:
                if config.provider == NSEAPIConfiguration.APIProvider.NSE_OFFICIAL:
                    self.providers[config.id] = NSEDataProvider(config)
                # Add other providers here (Zerodha, Upstox, etc.)
                
            logger.info(f"Loaded {len(self.providers)} market data providers")
            
        except Exception as e:
            logger.error(f"Error loading providers: {e}")
    
    async def get_live_quote(self, symbol: str, use_cache: bool = True) -> Optional[Dict]:
        """Get live quote with caching"""
        cache_key = f"quote_{symbol}"
        
        # Check cache first
        if use_cache:
            cached_data = await sync_to_async(cache.get)(cache_key)
            if cached_data:
                return cached_data
        
        # Get from primary provider
        primary_config = await sync_to_async(NSEAPIConfiguration.get_primary_config)()
        if not primary_config:
            return None
            
        provider = self.providers.get(primary_config.id)
        if not provider:
            return None
        
        # Fetch fresh data
        quote_data = await provider.get_quote(symbol)
        
        if quote_data:
            # Cache for 1 second (real-time)
            await sync_to_async(cache.set)(cache_key, quote_data, timeout=1)
            
            # Save to database
            await self._save_live_data(quote_data)
            
            # Broadcast to WebSocket subscribers
            await self._broadcast_quote_update(symbol, quote_data)
        
        return quote_data
    
    async def get_option_chain(self, underlying: str, expiry: str = None, use_cache: bool = True) -> Optional[Dict]:
        """Get options chain data"""
        cache_key = f"option_chain_{underlying}_{expiry or 'current'}"
        
        if use_cache:
            cached_data = await sync_to_async(cache.get)(cache_key)
            if cached_data:
                return cached_data
        
        primary_config = await sync_to_async(NSEAPIConfiguration.get_primary_config)()
        if not primary_config:
            return None
            
        provider = self.providers.get(primary_config.id)
        if not provider:
            return None
        
        option_data = await provider.get_option_chain(underlying, expiry)
        
        if option_data:
            # Cache for 5 seconds
            await sync_to_async(cache.set)(cache_key, option_data, timeout=5)
            
            # Broadcast to subscribers
            await self._broadcast_option_chain_update(underlying, option_data)
        
        return option_data
    
    async def subscribe_to_symbol(self, user_id: int, symbol: str, connection_id: str):
        """Subscribe user to real-time updates for a symbol"""
        try:
            # Check user's data subscription
            subscription = await sync_to_async(DataSubscription.objects.get)(user_id=user_id)
            
            if not subscription.real_time_enabled:
                return False, "Real-time data not enabled for this user"
            
            if len(subscription.symbols) >= subscription.max_symbols:
                return False, "Symbol limit exceeded"
            
            # Add to user's subscription
            await sync_to_async(subscription.add_symbol)(symbol)
            
            # Track WebSocket connection
            ws_conn, created = await sync_to_async(WebSocketConnection.objects.get_or_create)(
                connection_id=connection_id,
                defaults={
                    'user_id': user_id,
                    'status': WebSocketConnection.Status.CONNECTED,
                    'connected_at': timezone.now()
                }
            )
            
            # Add symbol to connection's subscribed symbols
            if symbol not in ws_conn.subscribed_symbols:
                ws_conn.subscribed_symbols.append(symbol)
                await sync_to_async(ws_conn.save)()
            
            return True, "Subscribed successfully"
            
        except DataSubscription.DoesNotExist:
            return False, "No data subscription found"
        except Exception as e:
            logger.error(f"Error subscribing to symbol: {e}")
            return False, str(e)
    
    async def _save_live_data(self, quote_data: Dict):
        """Save live data to database"""
        try:
            await sync_to_async(LiveMarketData.objects.update_or_create)(
                symbol=quote_data['symbol'],
                defaults={
                    'instrument_type': LiveMarketData.InstrumentType.EQUITY,
                    'last_price': quote_data['last_price'],
                    'change': quote_data['change'],
                    'change_percent': quote_data['change_percent'],
                    'open_price': quote_data['open_price'],
                    'high_price': quote_data['high_price'],
                    'low_price': quote_data['low_price'],
                    'previous_close': quote_data['previous_close'],
                    'volume': quote_data['volume'],
                    'value': quote_data['value'],
                    'timestamp': quote_data['timestamp'],
                    'data_source': quote_data['data_source']
                }
            )
        except Exception as e:
            logger.error(f"Error saving live data: {e}")
    
    async def _broadcast_quote_update(self, symbol: str, quote_data: Dict):
        """Broadcast quote update to WebSocket subscribers"""
        if not self.channel_layer:
            return
            
        try:
            # Find all connections subscribed to this symbol
            connections = await sync_to_async(list)(
                WebSocketConnection.objects.filter(
                    subscribed_symbols__contains=[symbol],
                    status=WebSocketConnection.Status.CONNECTED
                )
            )
            
            # Broadcast to each connection
            for conn in connections:
                await self.channel_layer.send(
                    f"market_data_{conn.connection_id}",
                    {
                        'type': 'market_data_update',
                        'symbol': symbol,
                        'data': {
                            'symbol': symbol,
                            'last_price': float(quote_data['last_price']),
                            'change': float(quote_data['change']),
                            'change_percent': float(quote_data['change_percent']),
                            'volume': quote_data['volume'],
                            'timestamp': quote_data['timestamp'].isoformat()
                        }
                    }
                )
                
        except Exception as e:
            logger.error(f"Error broadcasting quote update: {e}")
    
    async def _broadcast_option_chain_update(self, underlying: str, option_data: Dict):
        """Broadcast options chain update"""
        if not self.channel_layer:
            return
            
        try:
            # Broadcast to all connections interested in this underlying
            connections = await sync_to_async(list)(
                WebSocketConnection.objects.filter(
                    status=WebSocketConnection.Status.CONNECTED
                )
            )
            
            for conn in connections:
                await self.channel_layer.send(
                    f"market_data_{conn.connection_id}",
                    {
                        'type': 'option_chain_update',
                        'underlying': underlying,
                        'data': option_data
                    }
                )
                
        except Exception as e:
            logger.error(f"Error broadcasting option chain update: {e}")
    
    async def start_real_time_updates(self):
        """Start periodic real-time updates"""
        while True:
            try:
                # Get all actively subscribed symbols
                connections = await sync_to_async(list)(
                    WebSocketConnection.objects.filter(
                        status=WebSocketConnection.Status.CONNECTED
                    ).values_list('subscribed_symbols', flat=True)
                )
                
                # Flatten the list of symbols
                all_symbols = set()
                for symbols_list in connections:
                    all_symbols.update(symbols_list)
                
                # Update quotes for all symbols
                for symbol in all_symbols:
                    await self.get_live_quote(symbol, use_cache=False)
                
                # Wait before next update (1 second for real-time)
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in real-time updates: {e}")
                await asyncio.sleep(5)  # Wait longer on error


# Singleton instance
market_data_service = None


async def get_market_data_service():
    """Get or create market data service instance"""
    global market_data_service
    if not market_data_service:
        market_data_service = await MarketDataService.initialize()
    return market_data_service