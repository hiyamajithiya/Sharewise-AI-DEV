from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'accounts', views.BrokerAccountViewSet, basename='brokeraccount')

app_name = 'brokers'

urlpatterns = [
    # Include viewset URLs
    path('', include(router.urls)),
    
    # Standalone endpoints
    path('test-connection/', views.test_connection, name='test_connection'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('supported-brokers/', views.supported_brokers, name='supported_brokers'),
    path('portfolio/aggregated/', views.aggregated_portfolio, name='aggregated_portfolio'),
    
    # Webhook endpoint
    path('webhook/<str:broker_type>/<uuid:account_id>/', views.broker_webhook, name='broker_webhook'),
]