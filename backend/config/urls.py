"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/ai-studio/', include('apps.ai_studio.urls')),
    path('api/brokers/', include('apps.brokers.urls')),
    path('api/trading/', include('apps.trading.urls')),
    path('api/market-data/', include('apps.market_data.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/system/', include('system_config.urls')),
    path('', include('system_config.urls')),  # Health checks at root level
]

# Add debug toolbar URLs in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
