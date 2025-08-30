"""
Development settings for ShareWise AI project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Development specific apps
INSTALLED_APPS += [
    'debug_toolbar',
]

MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Database configuration for development (PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='sharewise_ai_dev'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='password'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# Temporary SQLite fallback (uncomment if PostgreSQL is not available)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Email backend for development
# Use SMTP backend to actually send emails (requires configuration in .env)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# If email credentials are not configured, fall back to console backend
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("WARNING: Email credentials not configured. Using console backend for emails.")

# Logging for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['apps']['level'] = 'DEBUG'

# Development specific REST framework settings
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] += [
    'rest_framework.renderers.BrowsableAPIRenderer',
]

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True

# Security settings override for development
SESSION_COOKIE_SECURE = False  # Allow HTTP in development
CSRF_COOKIE_SECURE = False    # Allow HTTP in development
SECURE_SSL_REDIRECT = False   # Don't force HTTPS in development
SECURE_HSTS_SECONDS = 0       # Disable HSTS in development

# Cache configuration for development (Redis or fallback)
try:
    import redis
    redis_client = redis.Redis.from_url(REDIS_URL + '/1')
    redis_client.ping()
    print("Redis connection successful for Cache")
    # Use Redis cache configuration from base.py
except (ImportError, redis.ConnectionError):
    print("WARNING: Redis not available. Using dummy cache for development")
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        },
        'sessions': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'session-cache',
        }
    }
    # Use database-backed sessions when Redis is not available
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'
    SESSION_CACHE_ALIAS = 'sessions'
    # Also fallback Channels to in-memory
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }

# Development specific ShareWise settings
SHAREWISE_SETTINGS.update({
    'ENABLE_PAPER_TRADING': True,
    'MOCK_BROKER_APIS': True,
    'ENABLE_DEBUG_SIGNALS': True,
})

# Celery Configuration for Development (handled in celery.py with Redis fallback)

# Celery Task Configuration
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_ENABLE_UTC = True

# Development specific Celery settings
CELERY_TASK_ALWAYS_EAGER = env('CELERY_TASK_ALWAYS_EAGER', default=False)  # Set to True to run tasks synchronously
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_LOG_COLOR = True

# Task time limits
CELERY_TASK_SOFT_TIME_LIMIT = 1800  # 30 minutes
CELERY_TASK_TIME_LIMIT = 3600       # 1 hour

# Task routing for development
CELERY_TASK_ROUTES = {
    'apps.ai_studio.tasks.start_model_training': {'queue': 'ml_training'},
    'apps.ai_studio.tasks.backtest_model': {'queue': 'ml_training'},
    'apps.ai_studio.tasks.cleanup_expired_jobs': {'queue': 'maintenance'},
    'apps.ai_studio.tasks.monitor_models': {'queue': 'monitoring'},
    'apps.ai_studio.tasks.cleanup_old_models': {'queue': 'maintenance'},
    'apps.trading.tasks.*': {'queue': 'trading'},
}

# Beat schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
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
}

# Note: Redis configuration and fallbacks are handled in base.py and celery.py