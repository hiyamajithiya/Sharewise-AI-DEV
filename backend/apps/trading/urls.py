from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'signals', views.TradingSignalViewSet, basename='tradingsignal')
router.register(r'orders', views.TradingOrderViewSet, basename='tradingorder')
router.register(r'fo-instruments', views.FuturesOptionsDataViewSet, basename='fo_instruments')

app_name = 'trading'

urlpatterns = [
    # Include viewset URLs
    path('', include(router.urls)),
    
    # Dashboard and analytics
    path('dashboard/', views.dashboard, name='dashboard'),
    path('performance/', views.performance, name='performance'),
    path('analytics/signals/', views.signals_analytics, name='signals_analytics'),
    
    # Settings and configuration
    path('settings/auto-trade/', views.auto_trade_settings, name='auto_trade_settings'),
    path('market-hours/', views.market_hours, name='market_hours'),
    
    # Risk management
    path('risk-check/', views.risk_check, name='risk_check'),
    
    # F&O specific endpoints
    path('option-chain/<str:underlying_symbol>/', views.option_chain, name='option_chain'),
    path('futures-chain/<str:underlying_symbol>/', views.futures_chain, name='futures_chain'),
    path('margin-calculator/', views.calculate_margin, name='calculate_margin'),
    path('fo-positions/', views.fo_positions, name='fo_positions'),
    path('underlyings/', views.underlying_list, name='underlying_list'),
    path('expiry-dates/<str:underlying_symbol>/', views.expiry_dates, name='expiry_dates'),
]