"""
Celery configuration for ShareWise AI with Redis backend
"""

import os
import ssl
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('sharewise_ai')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Redis Configuration for Celery with fallback
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Test Redis connection and configure accordingly
try:
    import redis
    redis_client = redis.Redis.from_url(REDIS_URL + '/4')
    redis_client.ping()
    
    # Redis is available - use Redis backend
    app.conf.broker_url = REDIS_URL + '/4'
    app.conf.result_backend = REDIS_URL + '/5'
    
    # Redis connection pool settings
    app.conf.broker_connection_retry_on_startup = True
    app.conf.broker_pool_limit = 10
    app.conf.broker_connection_timeout = 30.0
    app.conf.broker_connection_retry = True
    app.conf.broker_connection_max_retries = 10
    
    # Result backend settings
    app.conf.result_backend_transport_options = {
        'visibility_timeout': 3600,
        'retry_policy': {
            'timeout': 5.0
        }
    }
    
    print("Celery configured with Redis backend")
    
except (ImportError, redis.ConnectionError, redis.TimeoutError):
    # Redis not available - use database backend
    print("Redis not available. Using database backend for Celery")
    
    # Database backend configuration
    app.conf.broker_url = 'django://'
    app.conf.result_backend = 'django-db'

# Celery Configuration
app.conf.update(
    # Task serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task routing
    task_routes={
        'apps.ai_studio.tasks.train_model': {'queue': 'ml_training'},
        'apps.ai_studio.tasks.backtest_model': {'queue': 'ml_training'},
        'apps.trading.tasks.*': {'queue': 'trading'},
    },
    
    # Task result expiry
    result_expires=3600,
    
    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    
    # Task time limits
    task_soft_time_limit=1800,  # 30 minutes
    task_time_limit=3600,       # 1 hour
    
    # Task retry configuration
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'cleanup-expired-training-jobs': {
            'task': 'apps.ai_studio.tasks.cleanup_expired_jobs',
            'schedule': 300.0,  # Every 5 minutes
        },
        'monitor-model-performance': {
            'task': 'apps.ai_studio.tasks.monitor_models',
            'schedule': 3600.0,  # Every hour
        },
        'cleanup-old-model-files': {
            'task': 'apps.ai_studio.tasks.cleanup_old_models',
            'schedule': 86400.0,  # Every day
        },
    },
)

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f'Request: {self.request!r}')