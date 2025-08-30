"""
Redis caching utilities for ShareWise AI
Provides advanced caching patterns and cache management
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Callable
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class RedisCacheManager:
    """Advanced Redis cache management with patterns and invalidation"""
    
    def __init__(self):
        self.default_timeout = getattr(settings, 'DEFAULT_CACHE_TIMEOUT', 300)
        
    def get_or_set(self, key: str, callback: Callable, timeout: Optional[int] = None) -> Any:
        """
        Get from cache or set using callback if not found
        
        Args:
            key: Cache key
            callback: Function to call if cache miss
            timeout: Cache timeout in seconds
        
        Returns:
            Cached data or fresh data from callback
        """
        cached_data = cache.get(key)
        if cached_data is not None:
            logger.debug(f"Cache HIT for key: {key}")
            return cached_data
        
        logger.debug(f"Cache MISS for key: {key}")
        fresh_data = callback()
        
        cache_timeout = timeout or self.default_timeout
        cache.set(key, fresh_data, timeout=cache_timeout)
        
        return fresh_data
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all cache keys matching pattern
        
        Args:
            pattern: Pattern to match (e.g., "user_*", "*_quotes")
        
        Returns:
            Number of keys invalidated
        """
        # Redis-specific pattern deletion
        try:
            import redis
            from django_redis import get_redis_connection
            
            redis_conn = get_redis_connection("default")
            keys = redis_conn.keys(f"{settings.CACHES['default']['KEY_PREFIX']}:{pattern}")
            
            if keys:
                deleted = redis_conn.delete(*keys)
                logger.info(f"Invalidated {deleted} cache keys matching pattern: {pattern}")
                return deleted
            
            return 0
            
        except ImportError:
            logger.warning("Redis connection not available for pattern invalidation")
            return 0
    
    def cache_with_tags(self, key: str, data: Any, tags: List[str], timeout: Optional[int] = None) -> None:
        """
        Cache data with tags for group invalidation
        
        Args:
            key: Cache key
            data: Data to cache
            tags: List of tags for this cache entry
            timeout: Cache timeout
        """
        cache_timeout = timeout or self.default_timeout
        
        # Store the data
        cache.set(key, data, timeout=cache_timeout)
        
        # Store tag associations
        for tag in tags:
            tag_key = f"tag:{tag}"
            tagged_keys = cache.get(tag_key, set())
            tagged_keys.add(key)
            cache.set(tag_key, tagged_keys, timeout=cache_timeout + 3600)  # Tags live longer
    
    def invalidate_by_tag(self, tag: str) -> int:
        """
        Invalidate all cache entries with specific tag
        
        Args:
            tag: Tag to invalidate
        
        Returns:
            Number of keys invalidated
        """
        tag_key = f"tag:{tag}"
        tagged_keys = cache.get(tag_key, set())
        
        if tagged_keys:
            # Delete all tagged keys
            for key in tagged_keys:
                cache.delete(key)
            
            # Delete the tag key itself
            cache.delete(tag_key)
            
            logger.info(f"Invalidated {len(tagged_keys)} cache keys with tag: {tag}")
            return len(tagged_keys)
        
        return 0
    
    def cache_user_data(self, user_id: str, data_type: str, data: Any, timeout: Optional[int] = None) -> None:
        """
        Cache user-specific data with automatic invalidation patterns
        
        Args:
            user_id: User ID
            data_type: Type of data (profile, permissions, etc.)
            data: Data to cache
            timeout: Cache timeout
        """
        key = f"user:{user_id}:{data_type}"
        tags = [f"user:{user_id}", f"type:{data_type}"]
        
        self.cache_with_tags(key, data, tags, timeout)
    
    def cache_market_data(self, symbol: str, data_type: str, data: Any, timeout: int = 5) -> None:
        """
        Cache market data with short timeouts
        
        Args:
            symbol: Stock/asset symbol
            data_type: Type of market data (quote, option_chain, etc.)
            data: Market data
            timeout: Cache timeout (default 5 seconds)
        """
        key = f"market:{symbol}:{data_type}"
        tags = [f"symbol:{symbol}", f"market_data", f"type:{data_type}"]
        
        self.cache_with_tags(key, data, tags, timeout)
    
    def cache_ai_results(self, model_id: str, result_type: str, data: Any, timeout: int = 3600) -> None:
        """
        Cache AI model results
        
        Args:
            model_id: ML Model ID
            result_type: Type of result (prediction, analysis, etc.)
            data: AI result data
            timeout: Cache timeout (default 1 hour)
        """
        key = f"ai:{model_id}:{result_type}"
        tags = [f"model:{model_id}", f"ai_results", f"type:{result_type}"]
        
        self.cache_with_tags(key, data, tags, timeout)
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get Redis cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            info = redis_conn.info()
            
            return {
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', '0B'),
                'used_memory_peak_human': info.get('used_memory_peak_human', '0B'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(
                    info.get('keyspace_hits', 0),
                    info.get('keyspace_misses', 0)
                ),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'uptime_in_seconds': info.get('uptime_in_seconds', 0),
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {'error': str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)


class CacheKeyBuilder:
    """Utility class for building consistent cache keys"""
    
    @staticmethod
    def user_profile(user_id: str) -> str:
        return f"user:profile:{user_id}"
    
    @staticmethod
    def user_permissions(user_id: str) -> str:
        return f"user:permissions:{user_id}"
    
    @staticmethod
    def live_quote(symbol: str) -> str:
        return f"market:quote:{symbol.upper()}"
    
    @staticmethod
    def option_chain(symbol: str, expiry: Optional[str] = None) -> str:
        expiry_key = expiry or "current"
        return f"market:options:{symbol.upper()}:{expiry_key}"
    
    @staticmethod
    def market_status() -> str:
        # Include current minute for automatic expiration
        current_minute = datetime.now().strftime('%Y%m%d_%H%M')
        return f"market:status:{current_minute}"
    
    @staticmethod
    def ai_dashboard(user_id: str) -> str:
        return f"ai:dashboard:{user_id}"
    
    @staticmethod
    def trading_signals(user_id: str, symbol: Optional[str] = None) -> str:
        if symbol:
            return f"trading:signals:{user_id}:{symbol.upper()}"
        return f"trading:signals:{user_id}"
    
    @staticmethod
    def portfolio_summary(user_id: str) -> str:
        return f"portfolio:summary:{user_id}"


class CacheInvalidator:
    """Handles cache invalidation for different scenarios"""
    
    def __init__(self, cache_manager: RedisCacheManager):
        self.cache_manager = cache_manager
    
    def user_updated(self, user_id: str) -> None:
        """Invalidate all user-related caches when user is updated"""
        self.cache_manager.invalidate_by_tag(f"user:{user_id}")
        
        # Also invalidate specific known keys
        keys_to_delete = [
            CacheKeyBuilder.user_profile(user_id),
            CacheKeyBuilder.user_permissions(user_id),
            CacheKeyBuilder.ai_dashboard(user_id),
            CacheKeyBuilder.trading_signals(user_id),
            CacheKeyBuilder.portfolio_summary(user_id),
        ]
        
        for key in keys_to_delete:
            cache.delete(key)
    
    def market_data_updated(self, symbol: str) -> None:
        """Invalidate market data caches for a symbol"""
        self.cache_manager.invalidate_by_tag(f"symbol:{symbol}")
    
    def ai_model_updated(self, model_id: str) -> None:
        """Invalidate AI model caches when model is updated"""
        self.cache_manager.invalidate_by_tag(f"model:{model_id}")
    
    def system_config_updated(self) -> None:
        """Invalidate system configuration caches"""
        cache.delete("email_configuration_active")
        cache.delete("system_configuration_active")
        self.cache_manager.invalidate_pattern("system:*")


# Global instances
redis_cache = RedisCacheManager()
cache_keys = CacheKeyBuilder()
cache_invalidator = CacheInvalidator(redis_cache)


def cache_function_result(timeout: int = 300, key_prefix: str = "func"):
    """
    Decorator to cache function results
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
    
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs) -> Any:
            # Create cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]
            
            # Add string representation of args and kwargs
            if args:
                args_str = hashlib.md5(str(args).encode()).hexdigest()[:8]
                key_parts.append(f"args_{args_str}")
            
            if kwargs:
                kwargs_str = hashlib.md5(str(sorted(kwargs.items())).encode()).hexdigest()[:8]
                key_parts.append(f"kwargs_{kwargs_str}")
            
            cache_key = ":".join(key_parts)
            
            return redis_cache.get_or_set(
                cache_key,
                lambda: func(*args, **kwargs),
                timeout
            )
        
        return wrapper
    return decorator