from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'signals', views.TradingSignalViewSet, basename='tradingsignal')
router.register(r'orders', views.TradingOrderViewSet, basename='tradingorder')
router.register(r'fo-instruments', views.FuturesOptionsDataViewSet, basename='fo_instruments')

# Trading automation viewsets
router.register(r'strategies', views.TradingStrategyViewSet, basename='tradingstrategy')
router.register(r'approvals', views.TradeApprovalViewSet, basename='tradeapproval')
router.register(r'executions', views.AutomatedTradeExecutionViewSet, basename='automatedexecution')
router.register(r'positions', views.PortfolioPositionViewSet, basename='portfolioposition')

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
    
    # Trading automation endpoints
    path('automation/process-signal/', views.process_signal, name='process_signal'),
    path('automation/stats/', views.automation_stats, name='automation_stats'),
    path('automation/health/', views.system_health, name='system_health'),
    path('automation/dashboard/', views.automation_dashboard, name='automation_dashboard'),
    
    # Market analysis endpoints
    path('market/generate-signals/', views.generate_market_signals, name='generate_market_signals'),
    path('market/generate-signal/', views.generate_single_signal, name='generate_single_signal'),
    path('market/sentiment/', views.market_sentiment, name='market_sentiment'),
    path('market/analysis/<str:symbol>/', views.market_data_analysis, name='market_data_analysis'),
    path('market/popular-symbols/', views.popular_symbols, name='popular_symbols'),
    path('market/backtest/', views.backtest_strategy, name='backtest_strategy'),
    
    # Reporting and Analytics endpoints
    path('reports/performance/', views.performance_report, name='performance_report'),
    path('reports/strategy/<uuid:strategy_id>/', views.strategy_performance_report, name='strategy_performance_report'),
    path('reports/portfolio-analytics/', views.portfolio_analytics, name='portfolio_analytics'),
    path('reports/monthly-performance/', views.monthly_performance, name='monthly_performance'),
    path('reports/trade-history/', views.trade_history_export, name='trade_history_export'),
    path('reports/risk-analysis/', views.risk_analysis, name='risk_analysis'),
    
    # Usage analytics endpoints (subscription tiers removed - all users are ELITE)
    path('subscription/status/', views.subscription_status, name='subscription_status'),
    path('subscription/usage-analytics/', views.usage_analytics, name='usage_analytics'),
    
    # Portfolio Aggregation endpoints
    path('portfolio/overview/', views.portfolio_overview, name='portfolio_overview'),
    path('portfolio/sync/', views.sync_portfolio, name='sync_portfolio'),
    path('portfolio/positions/', views.portfolio_positions, name='portfolio_positions'),
    path('portfolio/allocation/', views.portfolio_allocation, name='portfolio_allocation'),
    path('portfolio/consolidation/', views.consolidation_opportunities, name='consolidation_opportunities'),
    path('portfolio/insights/', views.portfolio_insights, name='portfolio_insights'),
]