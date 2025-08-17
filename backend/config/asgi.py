"""
ASGI config for ShareWise AI project.

This module contains the ASGI application used by Django's development server
and any production ASGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runworker`` commands 
discover this application via the ``ASGI_APPLICATION`` setting.
"""

import os
import django
from django.core.asgi import get_asgi_application

# Set the default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import channels routing after Django setup
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Import routing modules
import apps.market_data.routing

# Import additional routing if available
try:
    import apps.trading.routing
    TRADING_ROUTING_AVAILABLE = True
except ImportError:
    TRADING_ROUTING_AVAILABLE = False

try:
    import apps.ai_studio.routing
    AI_STUDIO_ROUTING_AVAILABLE = True
except ImportError:
    AI_STUDIO_ROUTING_AVAILABLE = False

# Build websocket URL patterns
websocket_urlpatterns = []
websocket_urlpatterns.extend(apps.market_data.routing.websocket_urlpatterns)

if TRADING_ROUTING_AVAILABLE:
    websocket_urlpatterns.extend(apps.trading.routing.websocket_urlpatterns)

if AI_STUDIO_ROUTING_AVAILABLE:
    websocket_urlpatterns.extend(apps.ai_studio.routing.websocket_urlpatterns)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
