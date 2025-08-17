"""
Redis configuration and utilities for ShareWise AI
"""

import os
import logging
import redis
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


class RedisConnectionManager:
    """Centralized Redis connection management"""
    
    def __init__(self):
        self.redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
        self._connections = {}
        
    def get_connection(self, db: int = 0, **kwargs) -> redis.Redis:
        """Get Redis connection for specific database"""
        connection_key = f"db_{db}"
        
        if connection_key not in self._connections:
            try:
                self._connections[connection_key] = redis.Redis.from_url(
                    f"{self.redis_url}/{db}",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30,
                    **kwargs
                )
                # Test connection
                self._connections[connection_key].ping()
                logger.info(f"Redis connection established for database {db}")
                
            except redis.ConnectionError as e:
                logger.error(f"Failed to connect to Redis database {db}: {e}")
                raise ImproperlyConfigured(f"Redis connection failed: {e}")
                
        return self._connections[connection_key]
    
    def get_cache_connection(self) -> redis.Redis:
        """Get Redis connection for Django cache"""
        return self.get_connection(db=1)
    
    def get_session_connection(self) -> redis.Redis:
        """Get Redis connection for Django sessions"""
        return self.get_connection(db=2)
    
    def get_channels_connection(self) -> redis.Redis:
        """Get Redis connection for Django Channels"""
        return self.get_connection(db=3)
    
    def get_celery_broker_connection(self) -> redis.Redis:
        """Get Redis connection for Celery broker"""
        return self.get_connection(db=4)
    
    def get_celery_result_connection(self) -> redis.Redis:
        """Get Redis connection for Celery results"""
        return self.get_connection(db=5)
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive Redis health check"""
        health_status = {
            'redis_available': False,
            'databases': {},
            'memory_usage': None,
            'connected_clients': None,
            'uptime': None,
            'errors': []
        }
        
        try:
            # Test main connection
            main_conn = self.get_connection(db=0)
            main_conn.ping()
            health_status['redis_available'] = True
            
            # Get Redis info
            info = main_conn.info()
            health_status['memory_usage'] = info.get('used_memory_human')
            health_status['connected_clients'] = info.get('connected_clients')
            health_status['uptime'] = info.get('uptime_in_seconds')
            
            # Test specific databases
            db_tests = {
                'cache': 1,
                'sessions': 2,
                'channels': 3,
                'celery_broker': 4,
                'celery_results': 5
            }
            
            for name, db_num in db_tests.items():
                try:
                    conn = self.get_connection(db=db_num)
                    conn.ping()
                    health_status['databases'][name] = {
                        'status': 'healthy',
                        'db_size': conn.dbsize()
                    }
                except Exception as e:
                    health_status['databases'][name] = {
                        'status': 'error',
                        'error': str(e)
                    }
                    health_status['errors'].append(f"{name}: {e}")
                    
        except Exception as e:
            health_status['errors'].append(f"Main connection: {e}")
            logger.error(f"Redis health check failed: {e}")
            
        return health_status
    
    def clear_all_caches(self) -> Dict[str, bool]:
        """Clear all Redis caches (use with caution)"""
        results = {}
        
        cache_dbs = {
            'django_cache': 1,
            'sessions': 2,
            'channels': 3
        }
        
        for name, db_num in cache_dbs.items():
            try:
                conn = self.get_connection(db=db_num)
                conn.flushdb()
                results[name] = True
                logger.info(f"Cleared {name} cache (db {db_num})")
            except Exception as e:
                results[name] = False
                logger.error(f"Failed to clear {name} cache: {e}")
                
        return results
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache usage statistics"""
        stats = {}
        
        try:
            # Django cache stats
            cache_conn = self.get_cache_connection()
            cache_info = cache_conn.info('memory')
            stats['cache'] = {
                'keys': cache_conn.dbsize(),
                'memory_used': cache_info.get('used_memory_human'),
                'hit_rate': self._calculate_hit_rate(cache_conn)
            }
            
            # Session stats
            session_conn = self.get_session_connection()
            stats['sessions'] = {
                'active_sessions': session_conn.dbsize(),
                'memory_used': session_conn.info('memory').get('used_memory_human')
            }
            
            # Channels stats
            channels_conn = self.get_channels_connection()
            stats['channels'] = {
                'active_channels': channels_conn.dbsize(),
                'memory_used': channels_conn.info('memory').get('used_memory_human')
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            stats['error'] = str(e)
            
        return stats
    
    def _calculate_hit_rate(self, connection: redis.Redis) -> Optional[float]:
        """Calculate cache hit rate"""
        try:
            info = connection.info()
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            total = hits + misses
            
            if total > 0:
                return round((hits / total) * 100, 2)
        except Exception:
            pass
        return None


# Global Redis manager instance
redis_manager = RedisConnectionManager()


def get_redis_connection(db: int = 0) -> redis.Redis:
    """Get Redis connection - convenience function"""
    return redis_manager.get_connection(db=db)


def redis_health_check() -> Dict[str, Any]:
    """Redis health check - convenience function"""
    return redis_manager.health_check()


def is_redis_available() -> bool:
    """Check if Redis is available"""
    try:
        redis_manager.get_connection().ping()
        return True
    except Exception:
        return False


class RedisMetrics:
    """Redis metrics collection for monitoring"""
    
    @staticmethod
    def get_all_metrics() -> Dict[str, Any]:
        """Get comprehensive Redis metrics"""
        try:
            conn = redis_manager.get_connection()
            info = conn.info()
            
            return {
                'server': {
                    'redis_version': info.get('redis_version'),
                    'uptime_seconds': info.get('uptime_in_seconds'),
                    'process_id': info.get('process_id'),
                },
                'memory': {
                    'used_memory': info.get('used_memory'),
                    'used_memory_human': info.get('used_memory_human'),
                    'used_memory_rss': info.get('used_memory_rss'),
                    'used_memory_peak': info.get('used_memory_peak'),
                    'used_memory_peak_human': info.get('used_memory_peak_human'),
                    'maxmemory': info.get('maxmemory'),
                    'maxmemory_human': info.get('maxmemory_human'),
                },
                'clients': {
                    'connected_clients': info.get('connected_clients'),
                    'client_recent_max_input_buffer': info.get('client_recent_max_input_buffer'),
                    'client_recent_max_output_buffer': info.get('client_recent_max_output_buffer'),
                },
                'stats': {
                    'total_connections_received': info.get('total_connections_received'),
                    'total_commands_processed': info.get('total_commands_processed'),
                    'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec'),
                    'total_net_input_bytes': info.get('total_net_input_bytes'),
                    'total_net_output_bytes': info.get('total_net_output_bytes'),
                    'keyspace_hits': info.get('keyspace_hits'),
                    'keyspace_misses': info.get('keyspace_misses'),
                },
                'persistence': {
                    'rdb_changes_since_last_save': info.get('rdb_changes_since_last_save'),
                    'rdb_bgsave_in_progress': info.get('rdb_bgsave_in_progress'),
                    'rdb_last_save_time': info.get('rdb_last_save_time'),
                    'rdb_last_bgsave_status': info.get('rdb_last_bgsave_status'),
                }
            }
        except Exception as e:
            logger.error(f"Failed to get Redis metrics: {e}")
            return {'error': str(e)}


# Initialize logging for Redis operations
logging.getLogger('redis').setLevel(logging.WARNING)