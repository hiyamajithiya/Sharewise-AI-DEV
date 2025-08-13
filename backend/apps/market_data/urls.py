from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'api-config', views.NSEAPIConfigurationViewSet, basename='nse_api_config')
router.register(r'subscriptions', views.DataSubscriptionViewSet, basename='data_subscription')
router.register(r'live-data', views.LiveMarketDataViewSet, basename='live_market_data')
router.register(r'websocket-connections', views.WebSocketConnectionViewSet, basename='websocket_connections')

app_name = 'market_data'

urlpatterns = [
    # Include viewset URLs
    path('', include(router.urls)),
    
    # Live market data endpoints
    path('quote/<str:symbol>/', views.get_live_quote, name='live_quote'),
    path('quotes/bulk/', views.get_bulk_quotes, name='bulk_quotes'),
    path('option-chain/<str:underlying>/', views.get_option_chain, name='option_chain'),
    
    # Subscription management
    path('subscribe/', views.subscribe_to_symbols, name='subscribe_symbols'),
    
    # Search and discovery
    path('search/', views.search_symbols, name='search_symbols'),
    
    # Market status
    path('market-status/', views.get_market_status, name='market_status'),
    
    # Admin dashboard
    path('admin/dashboard/', views.market_data_dashboard, name='admin_dashboard'),
]