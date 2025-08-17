"""
Health check views for ShareWise AI system monitoring
"""

import logging
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.core.cache import cache
from django.conf import settings

from config.redis_config import redis_manager, is_redis_available
from apps.ai_studio.models import MLModel, TrainingJob
from apps.trading.models import TradingSignal
from apps.audit.models import AuditEvent

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Basic health check endpoint
    Returns 200 if system is healthy, 503 if not
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'database': 'healthy',
                'redis': 'healthy' if is_redis_available() else 'unavailable',
                'web_server': 'healthy'
            }
        }
        
        return JsonResponse(health_status, status=200)
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)


@csrf_exempt
@require_http_methods(["GET"])
def detailed_health_check(request):
    """
    Detailed health check with system metrics
    """
    health_data = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {},
        'system': {},
        'application': {}
    }
    
    overall_healthy = True
    
    # Database health
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
            
        health_data['services']['database'] = {
            'status': 'healthy',
            'migrations_applied': migration_count,
            'connection_status': 'connected'
        }
    except Exception as e:
        health_data['services']['database'] = {
            'status': 'error',
            'error': str(e)
        }
        overall_healthy = False
    
    # Redis health
    try:
        redis_health = redis_manager.health_check()
        health_data['services']['redis'] = redis_health
        
        if not redis_health['redis_available']:
            overall_healthy = False
            
    except Exception as e:
        health_data['services']['redis'] = {
            'status': 'error',
            'error': str(e)
        }
        overall_healthy = False
    
    # Cache health
    try:
        cache_key = 'health_check_test'
        cache.set(cache_key, 'test_value', 30)
        cached_value = cache.get(cache_key)
        cache.delete(cache_key)
        
        health_data['services']['cache'] = {
            'status': 'healthy' if cached_value == 'test_value' else 'error',
            'test_passed': cached_value == 'test_value'
        }
        
        if cached_value != 'test_value':
            overall_healthy = False
            
    except Exception as e:
        health_data['services']['cache'] = {
            'status': 'error',
            'error': str(e)
        }
        overall_healthy = False
    
    # System metrics
    try:
        health_data['system'] = {
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': {
                'percent': psutil.virtual_memory().percent,
                'available_gb': round(psutil.virtual_memory().available / (1024**3), 2),
                'total_gb': round(psutil.virtual_memory().total / (1024**3), 2)
            },
            'disk_usage': {
                'percent': psutil.disk_usage('/').percent,
                'free_gb': round(psutil.disk_usage('/').free / (1024**3), 2),
                'total_gb': round(psutil.disk_usage('/').total / (1024**3), 2)
            },
            'load_average': list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else None
        }
    except Exception as e:
        health_data['system'] = {'error': str(e)}
    
    # Application health
    try:
        # Get recent activity metrics
        recent_time = datetime.now() - timedelta(hours=24)
        
        health_data['application'] = {
            'models': {
                'total': MLModel.objects.count(),
                'trained': MLModel.objects.filter(status='TRAINED').count(),
                'training': MLModel.objects.filter(status='TRAINING').count(),
                'failed': MLModel.objects.filter(status='FAILED').count()
            },
            'training_jobs': {
                'total': TrainingJob.objects.count(),
                'completed_24h': TrainingJob.objects.filter(
                    completed_at__gte=recent_time,
                    status='COMPLETED'
                ).count(),
                'failed_24h': TrainingJob.objects.filter(
                    completed_at__gte=recent_time,
                    status='FAILED'
                ).count()
            },
            'trading_signals': {
                'total': TradingSignal.objects.count(),
                'recent_24h': TradingSignal.objects.filter(
                    created_at__gte=recent_time
                ).count()
            },
            'security': {
                'total_violations': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION'
                ).count(),
                'violations_24h': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION',
                    created_at__gte=recent_time
                ).count(),
                'blocked_ips_24h': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION',
                    details__violation_type='ip_blocked',
                    created_at__gte=recent_time
                ).count()
            }
        }
    except Exception as e:
        health_data['application'] = {'error': str(e)}
    
    # Set overall status
    health_data['status'] = 'healthy' if overall_healthy else 'degraded'
    
    status_code = 200 if overall_healthy else 503
    return JsonResponse(health_data, status=status_code)


@csrf_exempt
@require_http_methods(["GET"])
def redis_health_check(request):
    """
    Dedicated Redis health check endpoint
    """
    try:
        redis_health = redis_manager.health_check()
        
        # Add cache statistics
        redis_health['cache_stats'] = redis_manager.get_cache_stats()
        
        status_code = 200 if redis_health['redis_available'] else 503
        return JsonResponse(redis_health, status=status_code)
        
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return JsonResponse({
            'redis_available': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)


@csrf_exempt
@require_http_methods(["GET"])
def celery_health_check(request):
    """
    Celery health check endpoint
    """
    try:
        from celery import current_app
        from config.celery import app as celery_app
        
        # Test Celery connection
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        active_tasks = inspect.active()
        
        health_data = {
            'status': 'healthy',
            'workers': {},
            'queues': {},
            'timestamp': datetime.now().isoformat()
        }
        
        if stats:
            for worker, worker_stats in stats.items():
                health_data['workers'][worker] = {
                    'status': 'online',
                    'pool': worker_stats.get('pool', {}),
                    'total_tasks': worker_stats.get('total', 0)
                }
        else:
            health_data['status'] = 'no_workers'
            health_data['workers'] = {}
        
        if active_tasks:
            for worker, tasks in active_tasks.items():
                health_data['queues'][worker] = {
                    'active_tasks': len(tasks),
                    'tasks': [task['name'] for task in tasks]
                }
        
        # Test a simple task
        try:
            from config.celery import debug_task
            result = debug_task.delay()
            task_result = result.get(timeout=10)
            health_data['test_task'] = 'passed'
        except Exception as e:
            health_data['test_task'] = f'failed: {str(e)}'
            health_data['status'] = 'degraded'
        
        status_code = 200 if health_data['status'] in ['healthy', 'degraded'] else 503
        return JsonResponse(health_data, status=status_code)
        
    except Exception as e:
        logger.error(f"Celery health check failed: {e}")
        return JsonResponse({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)


@csrf_exempt
@require_http_methods(["GET"])
def system_metrics(request):
    """
    System performance metrics endpoint
    """
    try:
        from config.redis_config import RedisMetrics
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'system': {
                'cpu': {
                    'usage_percent': psutil.cpu_percent(interval=1),
                    'count': psutil.cpu_count(),
                    'per_cpu': psutil.cpu_percent(percpu=True)
                },
                'memory': {
                    'virtual': psutil.virtual_memory()._asdict(),
                    'swap': psutil.swap_memory()._asdict()
                },
                'disk': {
                    'usage': psutil.disk_usage('/')._asdict(),
                    'io': psutil.disk_io_counters()._asdict() if psutil.disk_io_counters() else None
                },
                'network': psutil.net_io_counters()._asdict() if psutil.net_io_counters() else None
            },
            'redis': RedisMetrics.get_all_metrics(),
            'processes': {
                'total': len(psutil.pids()),
                'django': len([p for p in psutil.process_iter(['pid', 'name']) if 'python' in p.info['name'].lower()])
            }
        }
        
        return JsonResponse(metrics, status=200)
        
    except Exception as e:
        logger.error(f"System metrics collection failed: {e}")
        return JsonResponse({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def clear_redis_cache(request):
    """
    Clear Redis caches (admin endpoint)
    """
    try:
        # This should be protected with proper authentication
        # For now, we'll add a simple check
        if not request.user.is_superuser:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        results = redis_manager.clear_all_caches()
        
        return JsonResponse({
            'status': 'completed',
            'results': results,
            'timestamp': datetime.now().isoformat()
        }, status=200)
        
    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        return JsonResponse({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def security_monitoring(request):
    """
    Security monitoring endpoint with detailed threat analysis
    """
    try:
        recent_time = datetime.now() - timedelta(hours=24)
        last_week = datetime.now() - timedelta(days=7)
        
        # Rate limiting violations
        rate_limit_violations = AuditEvent.objects.filter(
            event_type='SECURITY_VIOLATION',
            details__violation_type='rate_limit_exceeded'
        )
        
        # Input validation violations
        input_violations = AuditEvent.objects.filter(
            event_type='SECURITY_VIOLATION',
            details__violation_type__in=[
                'suspicious_query_param', 'suspicious_post_data', 
                'suspicious_json_data', 'malicious_file_upload'
            ]
        )
        
        # Blocked IPs
        blocked_ips = AuditEvent.objects.filter(
            event_type='SECURITY_VIOLATION',
            details__violation_type='ip_blocked'
        )
        
        # Top suspicious IPs in last 24h
        from django.db.models import Count
        suspicious_ips_24h = list(
            AuditEvent.objects.filter(
                event_type='SECURITY_VIOLATION',
                created_at__gte=recent_time
            ).values('ip_address').annotate(
                violation_count=Count('id')
            ).order_by('-violation_count')[:10]
        )
        
        # Security metrics
        security_metrics = {
            'timestamp': datetime.now().isoformat(),
            'overview': {
                'total_violations': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION'
                ).count(),
                'violations_24h': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION',
                    created_at__gte=recent_time
                ).count(),
                'violations_7d': AuditEvent.objects.filter(
                    event_type='SECURITY_VIOLATION',
                    created_at__gte=last_week
                ).count(),
                'blocked_ips_total': blocked_ips.count(),
                'blocked_ips_24h': blocked_ips.filter(
                    created_at__gte=recent_time
                ).count()
            },
            'violation_types': {
                'rate_limiting': {
                    'total': rate_limit_violations.count(),
                    'recent_24h': rate_limit_violations.filter(
                        created_at__gte=recent_time
                    ).count()
                },
                'input_validation': {
                    'total': input_violations.count(),
                    'recent_24h': input_violations.filter(
                        created_at__gte=recent_time
                    ).count()
                }
            },
            'top_suspicious_ips_24h': suspicious_ips_24h,
            'security_status': 'healthy'  # Can be enhanced with threat scoring
        }
        
        # Determine security status based on violations
        violations_24h = security_metrics['overview']['violations_24h']
        if violations_24h > 100:
            security_metrics['security_status'] = 'high_alert'
        elif violations_24h > 50:
            security_metrics['security_status'] = 'moderate_alert'
        elif violations_24h > 10:
            security_metrics['security_status'] = 'low_alert'
        
        return JsonResponse(security_metrics, status=200)
        
    except Exception as e:
        logger.error(f"Security monitoring failed: {e}")
        return JsonResponse({
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'security_status': 'monitoring_error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def infrastructure_health(request):
    """
    Infrastructure health check for dependencies and external services
    """
    try:
        health_data = {
            'timestamp': datetime.now().isoformat(),
            'infrastructure': {},
            'dependencies': {},
            'external_services': {},
            'overall_status': 'healthy'
        }
        
        issues = []
        
        # Check Python version and packages
        import sys
        import django
        health_data['infrastructure']['python'] = {
            'version': sys.version,
            'django_version': django.get_version()
        }
        
        # Check critical directories
        import os
        critical_paths = {
            'logs': settings.BASE_DIR / 'logs',
            'media': settings.MEDIA_ROOT,
            'static': settings.STATIC_ROOT if hasattr(settings, 'STATIC_ROOT') else None
        }
        
        for path_name, path in critical_paths.items():
            if path:
                exists = os.path.exists(path)
                writable = os.access(path, os.W_OK) if exists else False
                health_data['infrastructure'][f'{path_name}_directory'] = {
                    'exists': exists,
                    'writable': writable,
                    'path': str(path)
                }
                if not exists or not writable:
                    issues.append(f'{path_name} directory issue')
        
        # Check environment variables
        required_env_vars = [
            'SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
        ]
        
        env_status = {}
        for var in required_env_vars:
            value = getattr(settings, var, None) or os.environ.get(var)
            env_status[var] = 'configured' if value else 'missing'
            if not value:
                issues.append(f'Missing {var}')
        
        health_data['dependencies']['environment_variables'] = env_status
        
        # Check database migrations
        try:
            from django.core.management import execute_from_command_line
            from django.db.migrations.executor import MigrationExecutor
            
            executor = MigrationExecutor(connection)
            unapplied = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            health_data['dependencies']['migrations'] = {
                'unapplied_count': len(unapplied),
                'status': 'up_to_date' if len(unapplied) == 0 else 'pending_migrations'
            }
            
            if len(unapplied) > 0:
                issues.append('Pending database migrations')
                
        except Exception as e:
            health_data['dependencies']['migrations'] = {
                'status': 'error',
                'error': str(e)
            }
            issues.append('Migration check failed')
        
        # Set overall status
        if issues:
            health_data['overall_status'] = 'degraded'
            health_data['issues'] = issues
        
        status_code = 200 if health_data['overall_status'] == 'healthy' else 503
        return JsonResponse(health_data, status=status_code)
        
    except Exception as e:
        logger.error(f"Infrastructure health check failed: {e}")
        return JsonResponse({
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'error'
        }, status=500)