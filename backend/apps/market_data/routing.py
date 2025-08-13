from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    # Market data WebSocket endpoint
    path('ws/market-data/', consumers.MarketDataConsumer.as_asgi()),
    
    # Options chain specific WebSocket
    path('ws/options/', consumers.OptionChainConsumer.as_asgi()),
    
    # Alternative URLs with regex patterns
    re_path(r'ws/market-data/(?P<room_name>\w+)/$', consumers.MarketDataConsumer.as_asgi()),
]