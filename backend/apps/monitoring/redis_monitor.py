"""
Redis monitoring and management utilities
Provides comprehensive Redis health checks, performance metrics, and management tools
"""

import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.admin.views.decorators import staff_member_required

try:
    from django_redis import get_redis_connection
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from utils.redis_cache import redis_cache
from utils.redis_queue import get_queue, Queues

logger = logging.getLogger(__name__)


class RedisMonitor:
    """Comprehensive Redis monitoring and health checking"""
    
    def __init__(self):
        if not REDIS_AVAILABLE:
            raise ImportError("Redis is not available")
        
        self.redis_conn = get_redis_connection("default")
    
    def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get comprehensive Redis statistics"""
        try:
            info = self.redis_conn.info()
            
            return {
                'server_info': {
                    'redis_version': info.get('redis_version'),
                    'uptime_in_seconds': info.get('uptime_in_seconds'),
                    'uptime_in_days': info.get('uptime_in_days'),
                    'connected_clients': info.get('connected_clients'),
                    'tcp_port': info.get('tcp_port'),
                    'config_file': info.get('config_file', 'N/A')
                },
                'memory_usage': {
                    'used_memory': info.get('used_memory'),
                    'used_memory_human': info.get('used_memory_human'),
                    'used_memory_rss': info.get('used_memory_rss'),
                    'used_memory_rss_human': info.get('used_memory_rss_human'),
                    'used_memory_peak': info.get('used_memory_peak'),
                    'used_memory_peak_human': info.get('used_memory_peak_human'),
                    'memory_fragmentation_ratio': info.get('mem_fragmentation_ratio'),
                    'maxmemory': info.get('maxmemory'),
                    'maxmemory_human': info.get('maxmemory_human'),
                },
                'performance_metrics': {
                    'total_commands_processed': info.get('total_commands_processed'),
                    'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec'),
                    'keyspace_hits': info.get('keyspace_hits'),
                    'keyspace_misses': info.get('keyspace_misses'),
                    'hit_rate_percentage': self._calculate_hit_rate(
                        info.get('keyspace_hits', 0),
                        info.get('keyspace_misses', 0)
                    ),
                    'expired_keys': info.get('expired_keys'),
                    'evicted_keys': info.get('evicted_keys')
                },
                'persistence': {
                    'rdb_changes_since_last_save': info.get('rdb_changes_since_last_save'),
                    'rdb_last_save_time': info.get('rdb_last_save_time'),
                    'rdb_last_bgsave_status': info.get('rdb_last_bgsave_status'),
                    'aof_enabled': info.get('aof_enabled'),
                    'aof_rewrite_in_progress': info.get('aof_rewrite_in_progress')
                },
                'replication': {
                    'role': info.get('role'),
                    'connected_slaves': info.get('connected_slaves'),
                    'master_repl_offset': info.get('master_repl_offset')
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get Redis stats: {e}")
            return {'error': str(e)}
    
    def get_keyspace_info(self) -> Dict[str, Any]:
        """Get detailed keyspace information"""
        try:
            info = self.redis_conn.info('keyspace')
            keyspace_data = {}
            
            for db_key, db_info in info.items():
                if db_key.startswith('db'):
                    keyspace_data[db_key] = db_info
            
            return {
                'keyspace': keyspace_data,
                'total_keys': sum(
                    int(db_info.get('keys', 0)) 
                    for db_info in keyspace_data.values()
                )
            }
            
        except Exception as e:
            logger.error(f"Failed to get keyspace info: {e}")
            return {'error': str(e)}
    
    def get_slow_queries(self, count: int = 10) -> List[Dict]:
        """Get slow queries from Redis"""
        try:
            slow_log = self.redis_conn.slowlog_get(count)
            
            queries = []
            for entry in slow_log:
                queries.append({
                    'id': entry['id'],
                    'start_time': datetime.fromtimestamp(entry['start_time']).isoformat(),
                    'duration_microseconds': entry['duration'],
                    'duration_ms': round(entry['duration'] / 1000, 2),
                    'command': ' '.join(str(arg) for arg in entry['command'][:5]),  # First 5 args
                    'client_address': entry.get('client_address', 'N/A'),
                    'client_name': entry.get('client_name', 'N/A')
                })
            
            return queries
            
        except Exception as e:
            logger.error(f"Failed to get slow queries: {e}")
            return []
    
    def get_connected_clients(self) -> List[Dict]:
        """Get information about connected clients"""
        try:
            client_list = self.redis_conn.client_list()
            
            clients = []
            for client in client_list:
                clients.append({
                    'id': client.get('id'),
                    'name': client.get('name', 'unnamed'),
                    'addr': client.get('addr'),
                    'age': client.get('age'),
                    'idle': client.get('idle'),
                    'flags': client.get('flags'),
                    'db': client.get('db'),
                    'sub': client.get('sub'),
                    'psub': client.get('psub'),
                    'multi': client.get('multi'),
                    'qbuf': client.get('qbuf'),
                    'qbuf_free': client.get('qbuf-free'),
                    'obl': client.get('obl'),
                    'oll': client.get('oll'),
                    'omem': client.get('omem'),
                    'cmd': client.get('cmd', 'unknown')
                })
            
            return clients
            
        except Exception as e:
            logger.error(f"Failed to get client info: {e}")
            return []
    
    def get_queue_statistics(self) -> Dict[str, Any]:
        """Get statistics for all Redis queues"""
        queue_stats = {}
        
        for queue_name in [Queues.TRADING, Queues.NOTIFICATIONS, Queues.ANALYTICS, 
                          Queues.ML_TRAINING, Queues.MARKET_DATA, Queues.MAINTENANCE]:
            try:
                queue = get_queue(queue_name)
                if queue:
                    queue_stats[queue_name] = queue.get_queue_stats()
            except Exception as e:
                queue_stats[queue_name] = {'error': str(e)}
        
        return queue_stats
    
    def test_performance(self, operations: int = 1000) -> Dict[str, Any]:
        """Test Redis performance with read/write operations"""
        try:
            # Test writes
            start_time = time.time()
            for i in range(operations):
                self.redis_conn.set(f"perf_test:{i}", f"value_{i}")
            write_time = time.time() - start_time
            
            # Test reads
            start_time = time.time()
            for i in range(operations):
                self.redis_conn.get(f"perf_test:{i}")
            read_time = time.time() - start_time
            
            # Cleanup
            keys_to_delete = [f"perf_test:{i}" for i in range(operations)]
            if keys_to_delete:
                self.redis_conn.delete(*keys_to_delete)
            
            return {
                'operations_count': operations,
                'write_time_seconds': round(write_time, 3),
                'read_time_seconds': round(read_time, 3),
                'writes_per_second': round(operations / write_time, 2),
                'reads_per_second': round(operations / read_time, 2),
                'total_time_seconds': round(write_time + read_time, 3)
            }
            
        except Exception as e:
            logger.error(f"Performance test failed: {e}")
            return {'error': str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive Redis health check"""
        health_status = {
            'status': 'healthy',
            'issues': [],
            'warnings': [],
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # Test basic connectivity
            ping_result = self.redis_conn.ping()
            if not ping_result:
                health_status['status'] = 'unhealthy'
                health_status['issues'].append('Redis ping failed')
            
            # Get info
            info = self.redis_conn.info()
            
            # Check memory usage
            used_memory = info.get('used_memory', 0)
            maxmemory = info.get('maxmemory', 0)
            
            if maxmemory > 0:
                memory_usage_percent = (used_memory / maxmemory) * 100
                if memory_usage_percent > 90:
                    health_status['status'] = 'unhealthy'
                    health_status['issues'].append(f'High memory usage: {memory_usage_percent:.1f}%')
                elif memory_usage_percent > 80:
                    health_status['warnings'].append(f'High memory usage: {memory_usage_percent:.1f}%')
            
            # Check fragmentation
            fragmentation_ratio = info.get('mem_fragmentation_ratio', 1.0)
            if fragmentation_ratio > 2.0:
                health_status['warnings'].append(f'High memory fragmentation: {fragmentation_ratio:.2f}')
            
            # Check evicted keys
            evicted_keys = info.get('evicted_keys', 0)
            if evicted_keys > 0:
                health_status['warnings'].append(f'Keys being evicted: {evicted_keys}')
            
            # Check hit rate
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            hit_rate = self._calculate_hit_rate(hits, misses)
            
            if hit_rate < 50 and (hits + misses) > 1000:  # Only check if we have enough samples
                health_status['warnings'].append(f'Low cache hit rate: {hit_rate:.1f}%')
            
            # Test basic operations
            test_key = f"health_check_{int(time.time())}"
            self.redis_conn.set(test_key, 'test_value', ex=10)
            retrieved_value = self.redis_conn.get(test_key)
            
            if retrieved_value != b'test_value':
                health_status['status'] = 'unhealthy'
                health_status['issues'].append('Failed to retrieve test value')
            
            self.redis_conn.delete(test_key)
            
            health_status['metrics'] = {
                'memory_usage_bytes': used_memory,
                'memory_usage_human': info.get('used_memory_human'),
                'hit_rate_percentage': hit_rate,
                'connected_clients': info.get('connected_clients'),
                'operations_per_second': info.get('instantaneous_ops_per_sec')
            }
            
        except Exception as e:
            health_status['status'] = 'unhealthy'
            health_status['issues'].append(f'Health check failed: {str(e)}')
        
        return health_status
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)


# Django views for Redis monitoring
@staff_member_required
@require_http_methods(["GET"])
def redis_dashboard(request):
    """Main Redis monitoring dashboard"""
    if not REDIS_AVAILABLE:
        return JsonResponse({'error': 'Redis is not available'}, status=503)
    
    try:
        monitor = RedisMonitor()
        
        dashboard_data = {
            'health': monitor.health_check(),
            'stats': monitor.get_comprehensive_stats(),
            'keyspace': monitor.get_keyspace_info(),
            'queues': monitor.get_queue_statistics(),
            'cache_stats': redis_cache.get_cache_stats(),
            'timestamp': datetime.now().isoformat()
        }
        
        return JsonResponse(dashboard_data)
        
    except Exception as e:
        logger.error(f"Redis dashboard error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_http_methods(["GET"])
def redis_performance_test(request):
    """Run Redis performance test"""
    if not REDIS_AVAILABLE:
        return JsonResponse({'error': 'Redis is not available'}, status=503)
    
    try:
        operations = int(request.GET.get('operations', 1000))
        operations = min(operations, 10000)  # Limit to prevent abuse
        
        monitor = RedisMonitor()
        performance_data = monitor.test_performance(operations)
        
        return JsonResponse({
            'performance_test': performance_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Performance test error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_http_methods(["GET"])
def redis_slow_queries(request):
    """Get Redis slow queries"""
    if not REDIS_AVAILABLE:
        return JsonResponse({'error': 'Redis is not available'}, status=503)
    
    try:
        count = int(request.GET.get('count', 10))
        count = min(count, 100)  # Limit results
        
        monitor = RedisMonitor()
        slow_queries = monitor.get_slow_queries(count)
        
        return JsonResponse({
            'slow_queries': slow_queries,
            'count': len(slow_queries),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Slow queries error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_http_methods(["GET"])
def redis_clients(request):
    """Get Redis connected clients"""
    if not REDIS_AVAILABLE:
        return JsonResponse({'error': 'Redis is not available'}, status=503)
    
    try:
        monitor = RedisMonitor()
        clients = monitor.get_connected_clients()
        
        return JsonResponse({
            'clients': clients,
            'client_count': len(clients),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Client info error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_http_methods(["POST"])
@csrf_exempt
def redis_flush_cache(request):
    """Flush Redis cache (use with caution)"""
    if not REDIS_AVAILABLE:
        return JsonResponse({'error': 'Redis is not available'}, status=503)
    
    try:
        flush_type = request.POST.get('type', 'pattern')
        pattern = request.POST.get('pattern', '')
        
        if flush_type == 'all':
            # Flush entire cache (dangerous!)
            cache.clear()
            return JsonResponse({
                'success': True,
                'message': 'Entire cache cleared',
                'type': 'all'
            })
        
        elif flush_type == 'pattern' and pattern:
            # Flush by pattern
            deleted_count = redis_cache.invalidate_pattern(pattern)
            return JsonResponse({
                'success': True,
                'message': f'Deleted {deleted_count} keys matching pattern: {pattern}',
                'type': 'pattern',
                'pattern': pattern,
                'deleted_count': deleted_count
            })
        
        else:
            return JsonResponse({'error': 'Invalid flush type or missing pattern'}, status=400)
        
    except Exception as e:
        logger.error(f"Cache flush error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# Global monitor instance
redis_monitor = RedisMonitor() if REDIS_AVAILABLE else None