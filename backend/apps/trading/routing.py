"""
WebSocket routing for Trading app
Handles real-time trading signals, portfolio updates, and market data
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Trading signals stream
    re_path(r'ws/trading/signals/$', consumers.TradingSignalsConsumer.as_asgi()),
    
    # Portfolio updates stream
    re_path(r'ws/trading/portfolio/$', consumers.PortfolioUpdatesConsumer.as_asgi()),
    
    # Trade execution notifications
    re_path(r'ws/trading/executions/$', consumers.TradeExecutionConsumer.as_asgi()),
    
    # Market sentiment updates
    re_path(r'ws/trading/sentiment/$', consumers.MarketSentimentConsumer.as_asgi()),
    
    # Risk alerts and notifications
    re_path(r'ws/trading/risk-alerts/$', consumers.RiskAlertsConsumer.as_asgi()),
    
    # Live P&L updates
    re_path(r'ws/trading/pnl/$', consumers.LivePnLConsumer.as_asgi()),
    
    # F&O specific updates (Greeks, volatility, etc.)
    re_path(r'ws/trading/fno/$', consumers.FnOUpdatesConsumer.as_asgi()),
]