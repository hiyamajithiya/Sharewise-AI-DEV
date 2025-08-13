from django.apps import AppConfig


class MarketDataConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.market_data'
    verbose_name = 'Market Data'
    
    def ready(self):
        """Initialize market data services when app is ready"""
        try:
            from .services import MarketDataService
            # MarketDataService.initialize()
        except Exception as e:
            print(f"Market data service initialization failed: {e}")