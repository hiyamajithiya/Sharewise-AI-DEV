import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from decimal import Decimal
import json


class NSEAPIConfiguration(models.Model):
    """NSE API Configuration managed by Super Admin"""
    
    class APIProvider(models.TextChoices):
        NSE_OFFICIAL = 'NSE_OFFICIAL', 'NSE Official API'
        ZERODHA_KITE = 'ZERODHA_KITE', 'Zerodha Kite API'
        ANGEL_BROKING = 'ANGEL_BROKING', 'Angel Broking API'
        UPSTOX = 'UPSTOX', 'Upstox API'
        ALPHA_VANTAGE = 'ALPHA_VANTAGE', 'Alpha Vantage'
        FINNHUB = 'FINNHUB', 'Finnhub API'
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        ERROR = 'ERROR', 'Error'
        TESTING = 'TESTING', 'Testing'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=50, choices=APIProvider.choices, default=APIProvider.NSE_OFFICIAL)
    
    # API Credentials
    api_key = models.TextField(help_text="API Key for the provider")
    api_secret = models.TextField(blank=True, help_text="API Secret (if required)")
    access_token = models.TextField(blank=True, help_text="Access Token (if required)")
    
    # API Configuration
    base_url = models.URLField(default="https://www.nseindia.com/api")
    websocket_url = models.URLField(blank=True, help_text="WebSocket URL for real-time data")
    rate_limit_per_minute = models.PositiveIntegerField(default=100, help_text="API calls per minute limit")
    
    # Status and Monitoring
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INACTIVE)
    is_primary = models.BooleanField(default=False, help_text="Primary data source")
    last_health_check = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Usage Statistics
    daily_api_calls = models.PositiveIntegerField(default=0)
    monthly_api_calls = models.PositiveIntegerField(default=0)
    last_reset_date = models.DateField(auto_now_add=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'nse_api_configuration'
        verbose_name = 'NSE API Configuration'
        verbose_name_plural = 'NSE API Configurations'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary configuration
        if self.is_primary:
            NSEAPIConfiguration.objects.exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_primary_config(cls):
        """Get the primary API configuration"""
        return cls.objects.filter(is_primary=True, status=cls.Status.ACTIVE).first()


class MarketDataCache(models.Model):
    """Cache for market data to reduce API calls"""
    
    class DataType(models.TextChoices):
        QUOTE = 'QUOTE', 'Stock Quote'
        OPTIONS_CHAIN = 'OPTIONS_CHAIN', 'Options Chain'
        FUTURES_CHAIN = 'FUTURES_CHAIN', 'Futures Chain'
        HISTORICAL = 'HISTORICAL', 'Historical Data'
        INDICES = 'INDICES', 'Index Data'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    symbol = models.CharField(max_length=50, db_index=True)
    data_type = models.CharField(max_length=20, choices=DataType.choices, db_index=True)
    
    # Data storage
    data = models.JSONField(help_text="Cached market data")
    
    # Cache management
    expires_at = models.DateTimeField(help_text="Cache expiration time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Metadata
    source_provider = models.CharField(max_length=50, blank=True)
    cache_hits = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'market_data_cache'
        verbose_name = 'Market Data Cache'
        verbose_name_plural = 'Market Data Cache'
        unique_together = ['symbol', 'data_type']
        indexes = [
            models.Index(fields=['symbol', 'data_type']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - {self.get_data_type_display()}"
    
    @property
    def is_expired(self):
        """Check if cache entry is expired"""
        return timezone.now() > self.expires_at
    
    def increment_hits(self):
        """Increment cache hit counter"""
        self.cache_hits += 1
        self.save(update_fields=['cache_hits'])


class LiveMarketData(models.Model):
    """Real-time market data streaming model"""
    
    class InstrumentType(models.TextChoices):
        EQUITY = 'EQUITY', 'Equity'
        FUTURES = 'FUTURES', 'Futures'
        OPTIONS = 'OPTIONS', 'Options'
        INDEX = 'INDEX', 'Index'
        COMMODITY = 'COMMODITY', 'Commodity'
        CURRENCY = 'CURRENCY', 'Currency'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Instrument Details
    symbol = models.CharField(max_length=100, db_index=True)
    instrument_type = models.CharField(max_length=20, choices=InstrumentType.choices)
    exchange = models.CharField(max_length=10, default='NSE')
    
    # Price Data
    last_price = models.DecimalField(max_digits=12, decimal_places=2)
    change = models.DecimalField(max_digits=12, decimal_places=2)
    change_percent = models.DecimalField(max_digits=6, decimal_places=2)
    
    # OHLC Data
    open_price = models.DecimalField(max_digits=12, decimal_places=2)
    high_price = models.DecimalField(max_digits=12, decimal_places=2)
    low_price = models.DecimalField(max_digits=12, decimal_places=2)
    previous_close = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Volume and Value
    volume = models.BigIntegerField(default=0)
    value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Bid/Ask Data
    bid_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    ask_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    bid_quantity = models.PositiveIntegerField(null=True, blank=True)
    ask_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    # Options/Futures specific
    underlying_symbol = models.CharField(max_length=50, blank=True)
    strike_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    option_type = models.CharField(max_length=4, blank=True)  # CALL/PUT
    
    # Greeks (for options)
    delta = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    gamma = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    theta = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    vega = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    implied_volatility = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Open Interest (for F&O)
    open_interest = models.BigIntegerField(null=True, blank=True)
    open_interest_change = models.IntegerField(null=True, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(help_text="Market data timestamp")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Source tracking
    data_source = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'live_market_data'
        verbose_name = 'Live Market Data'
        verbose_name_plural = 'Live Market Data'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['symbol', '-timestamp']),
            models.Index(fields=['instrument_type', '-timestamp']),
            models.Index(fields=['underlying_symbol', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - ₹{self.last_price} ({self.change_percent}%)"
    
    @property
    def is_gaining(self):
        """Check if price is gaining"""
        return self.change > 0
    
    @property
    def formatted_change(self):
        """Format price change with sign"""
        if self.change >= 0:
            return f"+₹{self.change}"
        else:
            return f"-₹{abs(self.change)}"


class DataSubscription(models.Model):
    """User subscriptions for real-time data"""
    
    class SubscriptionType(models.TextChoices):
        BASIC = 'BASIC', 'Basic (15min delay)'
        PREMIUM = 'PREMIUM', 'Premium (Real-time)'
        PROFESSIONAL = 'PROFESSIONAL', 'Professional (Real-time + L2)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='data_subscriptions')
    
    # Subscription details
    subscription_type = models.CharField(max_length=20, choices=SubscriptionType.choices, default=SubscriptionType.BASIC)
    symbols = models.JSONField(default=list, help_text="List of subscribed symbols")
    is_active = models.BooleanField(default=True)
    
    # Limits
    max_symbols = models.PositiveIntegerField(default=100, help_text="Maximum symbols allowed")
    real_time_enabled = models.BooleanField(default=False)
    
    # Billing
    monthly_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    last_billing_date = models.DateField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_subscription'
        verbose_name = 'Data Subscription'
        verbose_name_plural = 'Data Subscriptions'
        unique_together = ['user']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_subscription_type_display()}"
    
    def add_symbol(self, symbol):
        """Add symbol to subscription"""
        if symbol not in self.symbols and len(self.symbols) < self.max_symbols:
            self.symbols.append(symbol)
            self.save()
            return True
        return False
    
    def remove_symbol(self, symbol):
        """Remove symbol from subscription"""
        if symbol in self.symbols:
            self.symbols.remove(symbol)
            self.save()
            return True
        return False


class MarketDataLog(models.Model):
    """Log for market data API calls and errors"""
    
    class LogLevel(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        CRITICAL = 'CRITICAL', 'Critical'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Log details
    level = models.CharField(max_length=10, choices=LogLevel.choices)
    message = models.TextField()
    
    # Context
    api_provider = models.CharField(max_length=50, blank=True)
    endpoint = models.CharField(max_length=200, blank=True)
    symbol = models.CharField(max_length=50, blank=True)
    
    # Performance metrics
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True)
    
    # Error details
    error_code = models.CharField(max_length=50, blank=True)
    error_details = models.JSONField(null=True, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'market_data_log'
        verbose_name = 'Market Data Log'
        verbose_name_plural = 'Market Data Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['level', '-created_at']),
            models.Index(fields=['api_provider', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.level} - {self.message[:50]}"


class WebSocketConnection(models.Model):
    """Track WebSocket connections for real-time data"""
    
    class Status(models.TextChoices):
        CONNECTED = 'CONNECTED', 'Connected'
        DISCONNECTED = 'DISCONNECTED', 'Disconnected'
        RECONNECTING = 'RECONNECTING', 'Reconnecting'
        ERROR = 'ERROR', 'Error'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='ws_connections')
    
    # Connection details
    connection_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DISCONNECTED)
    subscribed_symbols = models.JSONField(default=list)
    
    # Connection metrics
    connected_at = models.DateTimeField(null=True, blank=True)
    disconnected_at = models.DateTimeField(null=True, blank=True)
    last_ping = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'websocket_connection'
        verbose_name = 'WebSocket Connection'
        verbose_name_plural = 'WebSocket Connections'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"
    
    def is_active(self):
        """Check if connection is active"""
        return self.status == self.Status.CONNECTED and self.last_ping and \
               (timezone.now() - self.last_ping).seconds < 60  # 60 seconds timeout