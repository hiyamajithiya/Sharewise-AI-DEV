from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/ai-studio/', include('apps.ai_studio.urls')),
    path('api/brokers/', include('apps.brokers.urls')),
    path('api/trading/', include('apps.trading.urls')),
    path('api/portfolio/', include('apps.portfolios.urls')),
    path('api/market-data/', include('apps.market_data.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/support/', include('support.urls')),
    path('api/system/', include('system_config.urls')),
    path('', include('system_config.urls')),  # Health checks at root level
]

# Add debug toolbar URLs in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
