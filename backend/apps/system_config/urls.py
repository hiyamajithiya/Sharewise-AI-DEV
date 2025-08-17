"""
System configuration URLs
"""

from django.urls import path
from . import health_checks

app_name = 'system_config'

urlpatterns = [
    # Health check endpoints
    path('health/', health_checks.health_check, name='health_check'),
    path('health/detailed/', health_checks.detailed_health_check, name='detailed_health_check'),
    path('health/redis/', health_checks.redis_health_check, name='redis_health_check'),
    path('health/celery/', health_checks.celery_health_check, name='celery_health_check'),
    path('health/infrastructure/', health_checks.infrastructure_health, name='infrastructure_health'),
    path('security/monitoring/', health_checks.security_monitoring, name='security_monitoring'),
    path('metrics/', health_checks.system_metrics, name='system_metrics'),
    path('admin/clear-cache/', health_checks.clear_redis_cache, name='clear_redis_cache'),
]