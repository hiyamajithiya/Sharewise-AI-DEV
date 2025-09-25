"""
Base Django settings for ShareWise AI project.
"""

import os
from pathlib import Path
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False)
)

# Take environment variables from .env file if it exists
environ.Env.read_env(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_extensions',
    'channels',
    'django_celery_results',  # For Celery database results backend
]

LOCAL_APPS = [
    'apps.users',
    'apps.trading',
    'apps.ai_studio',
    'apps.brokers',
    'apps.market_data',
    'apps.audit',
    'apps.security',
    'apps.subscriptions',
    'system_config',
    # Add other apps as they are created
    # 'apps.strategies',
    # 'apps.portfolios',
    # 'apps.analytics',
    # 'apps.notifications',
    # 'apps.admin_portal',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'apps.security.middleware.SecurityHeadersMiddleware',
    'apps.security.middleware.IPBlockingMiddleware',
    'apps.security.middleware.RateLimitMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'apps.security.middleware.InputValidationMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.audit.middleware.AuditMiddleware',
    'apps.audit.middleware.SecurityMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Redis Configuration
REDIS_URL = env('REDIS_URL', default='redis://localhost:6379')

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL + '/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
                'socket_connect_timeout': 2,
                'socket_timeout': 2,
                'socket_keepalive': True,
                'socket_keepalive_options': {},
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'sharewise_ai',
        'TIMEOUT': 300,  # 5 minutes default
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL + '/2',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 10,
                'socket_connect_timeout': 2,
                'socket_timeout': 2,
                'socket_keepalive': True,
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'sharewise_sessions',
        'TIMEOUT': 86400,  # 24 hours
    }
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_AGE = 86400  # 24 hours

# Channels configuration with Redis fallback
try:
    import redis
    redis_client = redis.Redis.from_url(REDIS_URL + '/3')
    redis_client.ping()
    
    # Redis is available
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [REDIS_URL + '/3'],
                'capacity': 1500,
                'expiry': 60,
                'group_expiry': 86400,
                'channel_capacity': {
                    'http.request': 200,
                    'http.response': 10,
                    'websocket.send': 20,
                },
            },
        },
    }
    
except (ImportError, Exception):
    # Redis not available - use in-memory fallback
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer'
        }
    }

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='sharewise_ai'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='password'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# Custom User Model
AUTH_USER_MODEL = 'users.CustomUser'

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'apps.users.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'  # IST for Indian markets
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# CORS settings for frontend communication
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",
    "http://localhost:4000",  # Alternative React development server
    "http://127.0.0.1:4000",
]

CORS_ALLOW_CREDENTIALS = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Cache configuration is already defined above with Redis support

# Email configuration (for development)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Enhanced Security Configuration
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Session Security
SESSION_COOKIE_SECURE = True  # Only send over HTTPS in production
SESSION_COOKIE_HTTPONLY = True  # Prevent JS access to session cookies
SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
SESSION_COOKIE_AGE = 86400  # 24 hours

# CSRF Security
CSRF_COOKIE_SECURE = True  # Only send over HTTPS in production
CSRF_COOKIE_HTTPONLY = True  # Prevent JS access to CSRF token
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = True  # Store CSRF token in session instead of cookie

# Rate Limiting Configuration
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# Payment Gateway Configuration
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = env('RAZORPAY_WEBHOOK_SECRET', default='')

# Stripe Configuration (Alternative)
STRIPE_PUBLIC_KEY = env('STRIPE_PUBLIC_KEY', default='')
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

# Subscription Configuration
SUBSCRIPTION_GRACE_PERIOD_DAYS = 3
SUBSCRIPTION_TRIAL_DAYS = 7
ENABLE_FREE_TIER = True

# CORS Security Enhancement
ALLOWED_CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://sharewise-ai.com',
]

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # For development
DEFAULT_FROM_EMAIL = 'ShareWise AI <noreply@sharewise.ai>'
EMAIL_HOST = env('EMAIL_HOST', default='')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env('EMAIL_USE_TLS', default=True)

# Frontend URL for email links
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')

# ShareWise AI specific settings
SHAREWISE_SETTINGS = {
    'MAX_SIGNALS_PER_USER_PER_DAY': 100,
    'DEFAULT_SIGNAL_EXPIRY_HOURS': 24,
    'MAX_CONCURRENT_POSITIONS': 10,
    'SUPPORTED_EXCHANGES': ['NSE', 'BSE'],
    'TRADING_HOURS': {
        'START': '09:15',
        'END': '15:30',
        'TIMEZONE': 'Asia/Kolkata',
    },
    'OTP_EXPIRY_MINUTES': 10,
    'MAX_OTP_ATTEMPTS': 3,
}

# Broker API settings
BROKER_SETTINGS = {
    'ENCRYPTION_KEY': env('BROKER_ENCRYPTION_KEY', default='fake-key-for-dev-only-change-in-production'),
    'MAX_API_RETRIES': 3,
    'API_TIMEOUT_SECONDS': 30,
    'SYNC_INTERVAL_MINUTES': 5,
    'MAX_ORDERS_PER_MINUTE': 20,
    'SUPPORTED_BROKERS': [
        'ZERODHA', 'UPSTOX', 'ALICE_BLUE', 'ANGEL_ONE', 
        'IIFL', 'KOTAK', 'HDFC', 'ICICI'
    ]
}

# Set encryption key for broker credentials
BROKER_ENCRYPTION_KEY = BROKER_SETTINGS['ENCRYPTION_KEY']

# Market Data settings
MARKET_DATA_SETTINGS = {
    'CACHE_TIMEOUT_SECONDS': {
        'QUOTE': 1,  # 1 second for real-time quotes
        'OPTION_CHAIN': 5,  # 5 seconds for options chain
        'FUTURES_CHAIN': 10,  # 10 seconds for futures chain
        'HISTORICAL': 3600,  # 1 hour for historical data
    },
    'MAX_SYMBOLS_PER_USER': {
        'BASIC': 20,
        'PREMIUM': 100,
        'PROFESSIONAL': -1,  # Unlimited
    },
    'WEBSOCKET_SETTINGS': {
        'HEARTBEAT_INTERVAL': 30,  # seconds
        'CONNECTION_TIMEOUT': 300,  # 5 minutes
        'MAX_RECONNECT_ATTEMPTS': 5,
    },
    'API_RATE_LIMITS': {
        'NSE_OFFICIAL': 100,  # per minute
        'ZERODHA_KITE': 200,  # per minute
        'UPSTOX': 150,  # per minute
    },
    'DATA_RETENTION_DAYS': {
        'LIVE_DATA': 7,
        'LOGS': 30,
        'CACHE': 1,
        'WEBSOCKET_CONNECTIONS': 7,
    }
}
# Finnhub Market Data Configuration
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')
FINNHUB_BASE_URL = os.getenv('FINNHUB_BASE_URL', 'https://finnhub.io/api/v1')
FINNHUB_WS_URL = os.getenv('FINNHUB_WS_URL', 'wss://ws.finnhub.io')

MARKET_DATA_CONFIG = {
    'FINNHUB': {
        'API_KEY': FINNHUB_API_KEY,
        'BASE_URL': FINNHUB_BASE_URL,
        'WS_URL': FINNHUB_WS_URL,
        'RATE_LIMIT': 60,  # 60 requests per minute for free tier
        'TIMEOUT': 30,
        'SUPPORTED_EXCHANGES': ['NSE', 'BSE', 'US']
    }
}

# Finnhub Market Data Configuration
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')
FINNHUB_BASE_URL = os.getenv('FINNHUB_BASE_URL', 'https://finnhub.io/api/v1')
FINNHUB_WS_URL = os.getenv('FINNHUB_WS_URL', 'wss://ws.finnhub.io')

MARKET_DATA_CONFIG = {
    'FINNHUB': {
        'API_KEY': FINNHUB_API_KEY,
        'BASE_URL': FINNHUB_BASE_URL,
        'WS_URL': FINNHUB_WS_URL,
        'RATE_LIMIT': 60,  # 60 requests per minute for free tier
        'TIMEOUT': 30,
        'SUPPORTED_EXCHANGES': ['NSE', 'BSE', 'US']
    }
}
