"""
Redis integration for trading operations
Handles caching, real-time data, and background processing for trading
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth import get_user_model

from utils.redis_cache import redis_cache, cache_keys, CacheKeyBuilder
from utils.redis_queue import enqueue_trading_task, Priority

from .models import TradingSignal, PortfolioPosition, TradingOrder

logger = logging.getLogger(__name__)
User = get_user_model()


class TradingCacheManager:
    """Manages Redis caching for trading operations"""
    
    def __init__(self):
        self.default_timeout = 300  # 5 minutes
        
    def cache_trading_signals(self, user_id: str, signals: List[Dict], timeout: int = None) -> None:
        """Cache user's trading signals"""
        cache_key = f"trading:signals:{user_id}"
        cache_timeout = timeout or self.default_timeout
        
        # Add metadata
        cached_data = {
            'signals': signals,
            'cached_at': datetime.now().isoformat(),
            'count': len(signals)
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            cached_data,
            tags=[f"user:{user_id}", "trading_signals"],
            timeout=cache_timeout
        )
    
    def get_cached_signals(self, user_id: str) -> Optional[Dict]:
        """Get cached trading signals for user"""
        cache_key = f"trading:signals:{user_id}"
        return cache.get(cache_key)
    
    def cache_portfolio_summary(self, user_id: str, portfolio_data: Dict, timeout: int = 600) -> None:
        """Cache user's portfolio summary (10 minutes default)"""
        cache_key = f"portfolio:summary:{user_id}"
        
        # Add additional metrics
        enhanced_data = {
            **portfolio_data,
            'cached_at': datetime.now().isoformat(),
            'cache_key': cache_key
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            enhanced_data,
            tags=[f"user:{user_id}", "portfolio_data"],
            timeout=timeout
        )
    
    def get_portfolio_summary(self, user_id: str) -> Optional[Dict]:
        """Get cached portfolio summary"""
        cache_key = f"portfolio:summary:{user_id}"
        return cache.get(cache_key)
    
    def cache_position_pnl(self, user_id: str, position_id: str, pnl_data: Dict, timeout: int = 30) -> None:
        """Cache real-time P&L for a position (30 seconds)"""
        cache_key = f"position:pnl:{user_id}:{position_id}"
        
        pnl_with_timestamp = {
            **pnl_data,
            'calculated_at': datetime.now().isoformat(),
            'position_id': position_id
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            pnl_with_timestamp,
            tags=[f"user:{user_id}", f"position:{position_id}", "pnl_data"],
            timeout=timeout
        )
    
    def get_position_pnl(self, user_id: str, position_id: str) -> Optional[Dict]:
        """Get cached P&L for position"""
        cache_key = f"position:pnl:{user_id}:{position_id}"
        return cache.get(cache_key)
    
    def cache_order_book(self, symbol: str, order_book: Dict, timeout: int = 5) -> None:
        """Cache order book data (5 seconds for real-time)"""
        cache_key = f"orderbook:{symbol.upper()}"
        
        order_book_data = {
            **order_book,
            'symbol': symbol.upper(),
            'cached_at': datetime.now().isoformat()
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            order_book_data,
            tags=[f"symbol:{symbol}", "order_book", "market_data"],
            timeout=timeout
        )
    
    def get_order_book(self, symbol: str) -> Optional[Dict]:
        """Get cached order book"""
        cache_key = f"orderbook:{symbol.upper()}"
        return cache.get(cache_key)
    
    def invalidate_user_trading_data(self, user_id: str) -> None:
        """Invalidate all trading-related cache for user"""
        redis_cache.invalidate_by_tag(f"user:{user_id}")
        
        # Specific keys to delete
        keys_to_delete = [
            f"trading:signals:{user_id}",
            f"portfolio:summary:{user_id}",
            f"trading:dashboard:{user_id}",
            f"trading:performance:{user_id}"
        ]
        
        for key in keys_to_delete:
            cache.delete(key)
    
    def invalidate_symbol_data(self, symbol: str) -> None:
        """Invalidate all cached data for a symbol"""
        redis_cache.invalidate_by_tag(f"symbol:{symbol}")


class TradingRealTimeManager:
    """Manages real-time trading data with Redis"""
    
    def __init__(self):
        self.cache_manager = TradingCacheManager()
    
    def update_position_realtime(self, user_id: str, position_id: str, price_data: Dict) -> None:
        """Update position with real-time price data"""
        try:
            # Calculate real-time P&L
            pnl_data = self._calculate_realtime_pnl(position_id, price_data)
            
            # Cache the updated P&L
            self.cache_manager.cache_position_pnl(user_id, position_id, pnl_data)
            
            # Enqueue task to update portfolio summary
            enqueue_trading_task(
                'update_portfolio_summary',
                {'user_id': user_id, 'position_id': position_id},
                Priority.HIGH
            )
            
        except Exception as e:
            logger.error(f"Failed to update real-time position {position_id}: {e}")
    
    def broadcast_signal_update(self, user_id: str, signal_data: Dict) -> None:
        """Broadcast new trading signal to user"""
        try:
            # Cache the signal
            cache_key = f"latest_signal:{user_id}"
            cache.set(cache_key, signal_data, timeout=300)
            
            # Enqueue notification task
            enqueue_trading_task(
                'send_signal_notification',
                {
                    'user_id': user_id,
                    'signal_data': signal_data,
                    'notification_type': 'trading_signal'
                },
                Priority.HIGH
            )
            
        except Exception as e:
            logger.error(f"Failed to broadcast signal update: {e}")
    
    def _calculate_realtime_pnl(self, position_id: str, price_data: Dict) -> Dict:
        """Calculate real-time P&L for position"""
        try:
            position = PortfolioPosition.objects.get(id=position_id)
            
            current_price = Decimal(str(price_data.get('current_price', 0)))
            entry_price = position.average_price or Decimal('0')
            quantity = position.quantity or Decimal('0')
            
            # Calculate unrealized P&L
            price_diff = current_price - entry_price
            unrealized_pnl = price_diff * quantity
            
            # Calculate percentage change
            pnl_percentage = (price_diff / entry_price * 100) if entry_price > 0 else Decimal('0')
            
            return {
                'position_id': str(position_id),
                'current_price': float(current_price),
                'entry_price': float(entry_price),
                'quantity': float(quantity),
                'unrealized_pnl': float(unrealized_pnl),
                'pnl_percentage': float(pnl_percentage),
                'price_change': float(price_diff),
                'symbol': position.symbol,
                'calculated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate P&L for position {position_id}: {e}")
            return {}


class TradingAnalyticsCache:
    """Cache trading analytics and performance metrics"""
    
    def cache_user_performance(self, user_id: str, performance_data: Dict, timeout: int = 1800) -> None:
        """Cache user trading performance (30 minutes)"""
        cache_key = f"trading:performance:{user_id}"
        
        enhanced_performance = {
            **performance_data,
            'generated_at': datetime.now().isoformat(),
            'cache_duration': timeout
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            enhanced_performance,
            tags=[f"user:{user_id}", "performance_metrics"],
            timeout=timeout
        )
    
    def get_user_performance(self, user_id: str) -> Optional[Dict]:
        """Get cached user performance"""
        cache_key = f"trading:performance:{user_id}"
        return cache.get(cache_key)
    
    def cache_strategy_performance(self, strategy_id: str, performance_data: Dict, timeout: int = 3600) -> None:
        """Cache strategy performance metrics (1 hour)"""
        cache_key = f"strategy:performance:{strategy_id}"
        
        redis_cache.cache_with_tags(
            cache_key,
            performance_data,
            tags=[f"strategy:{strategy_id}", "strategy_performance"],
            timeout=timeout
        )
    
    def cache_market_analytics(self, symbol: str, analytics_data: Dict, timeout: int = 600) -> None:
        """Cache market analytics for symbol (10 minutes)"""
        cache_key = f"market:analytics:{symbol.upper()}"
        
        analytics_with_meta = {
            **analytics_data,
            'symbol': symbol.upper(),
            'generated_at': datetime.now().isoformat()
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            analytics_with_meta,
            tags=[f"symbol:{symbol}", "market_analytics"],
            timeout=timeout
        )
    
    def get_market_analytics(self, symbol: str) -> Optional[Dict]:
        """Get cached market analytics"""
        cache_key = f"market:analytics:{symbol.upper()}"
        return cache.get(cache_key)


class TradingDashboardCache:
    """Cache dashboard data for trading interface"""
    
    def cache_dashboard_data(self, user_id: str, dashboard_data: Dict, timeout: int = 300) -> None:
        """Cache trading dashboard data (5 minutes)"""
        cache_key = f"trading:dashboard:{user_id}"
        
        dashboard_with_meta = {
            **dashboard_data,
            'user_id': user_id,
            'cached_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(seconds=timeout)).isoformat()
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            dashboard_with_meta,
            tags=[f"user:{user_id}", "trading_dashboard"],
            timeout=timeout
        )
    
    def get_dashboard_data(self, user_id: str) -> Optional[Dict]:
        """Get cached dashboard data"""
        cache_key = f"trading:dashboard:{user_id}"
        return cache.get(cache_key)
    
    def cache_active_orders(self, user_id: str, orders_data: List[Dict], timeout: int = 60) -> None:
        """Cache active orders (1 minute)"""
        cache_key = f"orders:active:{user_id}"
        
        orders_with_meta = {
            'orders': orders_data,
            'count': len(orders_data),
            'cached_at': datetime.now().isoformat(),
            'user_id': user_id
        }
        
        redis_cache.cache_with_tags(
            cache_key,
            orders_with_meta,
            tags=[f"user:{user_id}", "active_orders"],
            timeout=timeout
        )
    
    def get_active_orders(self, user_id: str) -> Optional[Dict]:
        """Get cached active orders"""
        cache_key = f"orders:active:{user_id}"
        return cache.get(cache_key)


# Task handlers for trading queue
def handle_update_portfolio_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle portfolio summary update task"""
    user_id = data.get('user_id')
    if not user_id:
        raise ValueError("user_id is required")
    
    try:
        # Get user positions
        positions = PortfolioPosition.objects.filter(user_id=user_id, is_active=True)
        
        total_value = Decimal('0')
        total_pnl = Decimal('0')
        position_count = 0
        
        for position in positions:
            # Get cached P&L or calculate
            cache_manager = TradingCacheManager()
            pnl_data = cache_manager.get_position_pnl(user_id, str(position.id))
            
            if pnl_data:
                total_pnl += Decimal(str(pnl_data.get('unrealized_pnl', 0)))
                total_value += Decimal(str(pnl_data.get('current_price', 0))) * position.quantity
            
            position_count += 1
        
        # Cache portfolio summary
        summary_data = {
            'user_id': user_id,
            'total_value': float(total_value),
            'total_pnl': float(total_pnl),
            'position_count': position_count,
            'updated_at': datetime.now().isoformat()
        }
        
        cache_manager = TradingCacheManager()
        cache_manager.cache_portfolio_summary(user_id, summary_data)
        
        return {'success': True, 'summary': summary_data}
        
    except Exception as e:
        logger.error(f"Failed to update portfolio summary for user {user_id}: {e}")
        raise


def handle_send_signal_notification(data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle trading signal notification task"""
    user_id = data.get('user_id')
    signal_data = data.get('signal_data')
    
    if not user_id or not signal_data:
        raise ValueError("user_id and signal_data are required")
    
    try:
        # This would integrate with notification system
        logger.info(f"Sending signal notification to user {user_id}")
        
        # For now, just cache the notification
        cache_key = f"notifications:trading:{user_id}:{datetime.now().timestamp()}"
        cache.set(cache_key, {
            'type': 'trading_signal',
            'data': signal_data,
            'created_at': datetime.now().isoformat()
        }, timeout=86400)  # 24 hours
        
        return {'success': True, 'notification_sent': True}
        
    except Exception as e:
        logger.error(f"Failed to send signal notification: {e}")
        raise


# Global instances
trading_cache = TradingCacheManager()
realtime_manager = TradingRealTimeManager()
analytics_cache = TradingAnalyticsCache()
dashboard_cache = TradingDashboardCache()