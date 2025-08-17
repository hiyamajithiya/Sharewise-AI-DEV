"""
WebSocket routing for AI Studio app
Handles real-time model training updates, performance monitoring, and marketplace notifications
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Model training progress updates
    re_path(r'ws/ai-studio/training/(?P<training_job_id>[0-9a-f-]+)/$', consumers.ModelTrainingConsumer.as_asgi()),
    
    # Model performance monitoring
    re_path(r'ws/ai-studio/monitoring/(?P<model_id>[0-9a-f-]+)/$', consumers.ModelMonitoringConsumer.as_asgi()),
    
    # AI Studio dashboard updates
    re_path(r'ws/ai-studio/dashboard/$', consumers.StudioDashboardConsumer.as_asgi()),
    
    # Marketplace notifications
    re_path(r'ws/ai-studio/marketplace/$', consumers.MarketplaceNotificationsConsumer.as_asgi()),
    
    # Model predictions stream
    re_path(r'ws/ai-studio/predictions/(?P<model_id>[0-9a-f-]+)/$', consumers.ModelPredictionsConsumer.as_asgi()),
    
    # Backtesting progress
    re_path(r'ws/ai-studio/backtest/(?P<model_id>[0-9a-f-]+)/$', consumers.BacktestProgressConsumer.as_asgi()),
    
    # System health and worker status
    re_path(r'ws/ai-studio/system/$', consumers.SystemHealthConsumer.as_asgi()),
]