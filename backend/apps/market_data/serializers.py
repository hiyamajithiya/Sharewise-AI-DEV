from rest_framework import serializers
from decimal import Decimal
from .models import (NSEAPIConfiguration, MarketDataCache, LiveMarketData,
                     DataSubscription, WebSocketConnection, MarketDataLog)


class NSEAPIConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for NSE API Configuration"""
    
    class Meta:
        model = NSEAPIConfiguration
        fields = [
            'id', 'provider', 'base_url', 'websocket_url', 'rate_limit_per_minute',
            'status', 'is_primary', 'last_health_check', 'error_message',
            'daily_api_calls', 'monthly_api_calls', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_health_check', 'error_message', 'daily_api_calls',
            'monthly_api_calls', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate API configuration"""
        if data.get('is_primary'):
            # Check if another primary config exists
            existing_primary = NSEAPIConfiguration.objects.filter(
                is_primary=True,
                status=NSEAPIConfiguration.Status.ACTIVE
            ).exclude(pk=self.instance.pk if self.instance else None).first()
            
            if existing_primary:
                raise serializers.ValidationError(
                    "Another primary configuration already exists. Deactivate it first."
                )
        
        return data


class NSEAPIConfigurationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating NSE API Configuration"""
    
    api_key = serializers.CharField(write_only=True, help_text="API Key (will be encrypted)")
    api_secret = serializers.CharField(write_only=True, required=False, help_text="API Secret (if required)")
    access_token = serializers.CharField(write_only=True, required=False, help_text="Access Token (if required)")
    
    class Meta:
        model = NSEAPIConfiguration
        fields = [
            'provider', 'api_key', 'api_secret', 'access_token', 'base_url',
            'websocket_url', 'rate_limit_per_minute', 'is_primary'
        ]

    def create(self, validated_data):
        """Create new API configuration"""
        # In production, encrypt sensitive data
        instance = NSEAPIConfiguration.objects.create(**validated_data)
        return instance


class LiveMarketDataSerializer(serializers.ModelSerializer):
    """Serializer for live market data"""
    
    formatted_change = serializers.ReadOnlyField()
    is_gaining = serializers.ReadOnlyField()
    
    class Meta:
        model = LiveMarketData
        fields = [
            'id', 'symbol', 'instrument_type', 'exchange', 'last_price',
            'change', 'change_percent', 'open_price', 'high_price', 'low_price',
            'previous_close', 'volume', 'value', 'bid_price', 'ask_price',
            'bid_quantity', 'ask_quantity', 'underlying_symbol', 'strike_price',
            'expiry_date', 'option_type', 'delta', 'gamma', 'theta', 'vega',
            'implied_volatility', 'open_interest', 'open_interest_change',
            'timestamp', 'data_source', 'formatted_change', 'is_gaining'
        ]
        read_only_fields = ['id', 'timestamp', 'data_source']


class MarketQuoteSerializer(serializers.Serializer):
    """Serializer for market quote requests"""
    
    symbol = serializers.CharField(max_length=50, help_text="Stock symbol (e.g., RELIANCE, TCS)")
    exchange = serializers.CharField(max_length=10, default='NSE', help_text="Exchange (NSE/BSE)")
    
    def validate_symbol(self, value):
        """Validate symbol format"""
        return value.upper().strip()


class OptionChainRequestSerializer(serializers.Serializer):
    """Serializer for options chain requests"""
    
    underlying = serializers.CharField(max_length=50, help_text="Underlying symbol (e.g., NIFTY, BANKNIFTY)")
    expiry_date = serializers.DateField(required=False, help_text="Specific expiry date (optional)")
    
    def validate_underlying(self, value):
        """Validate underlying symbol"""
        return value.upper().strip()


class OptionChainDataSerializer(serializers.Serializer):
    """Serializer for options chain data response"""
    
    underlying_symbol = serializers.CharField()
    underlying_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    expiry_date = serializers.DateField(required=False)
    timestamp = serializers.DateTimeField()
    strikes = serializers.DictField()


class DataSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for data subscriptions"""
    
    symbols_count = serializers.SerializerMethodField()
    subscription_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DataSubscription
        fields = [
            'id', 'subscription_type', 'symbols', 'is_active', 'max_symbols',
            'real_time_enabled', 'monthly_cost', 'last_billing_date',
            'created_at', 'updated_at', 'symbols_count', 'subscription_details'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'symbols_count']

    def get_symbols_count(self, obj):
        """Get count of subscribed symbols"""
        return len(obj.symbols) if obj.symbols else 0

    def get_subscription_details(self, obj):
        """Get subscription type details"""
        details = {
            'BASIC': {
                'name': 'Basic Plan',
                'delay': '15 minutes',
                'features': ['Delayed quotes', 'Basic charts', 'Limited symbols'],
                'max_symbols': 20
            },
            'PREMIUM': {
                'name': 'Premium Plan', 
                'delay': 'Real-time',
                'features': ['Real-time quotes', 'Advanced charts', 'Options chain', 'More symbols'],
                'max_symbols': 100
            },
            'PROFESSIONAL': {
                'name': 'Professional Plan',
                'delay': 'Real-time',
                'features': ['Real-time quotes', 'Level 2 data', 'All features', 'Unlimited symbols'],
                'max_symbols': -1  # Unlimited
            }
        }
        return details.get(obj.subscription_type, details['BASIC'])


class DataSubscriptionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating data subscriptions"""
    
    add_symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        help_text="Symbols to add to subscription"
    )
    remove_symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        help_text="Symbols to remove from subscription"
    )
    
    class Meta:
        model = DataSubscription
        fields = ['add_symbols', 'remove_symbols']

    def validate_add_symbols(self, value):
        """Validate symbols to add"""
        return [symbol.upper().strip() for symbol in value]

    def validate_remove_symbols(self, value):
        """Validate symbols to remove"""
        return [symbol.upper().strip() for symbol in value]

    def update(self, instance, validated_data):
        """Update subscription with symbol changes"""
        add_symbols = validated_data.get('add_symbols', [])
        remove_symbols = validated_data.get('remove_symbols', [])
        
        current_symbols = set(instance.symbols)
        
        # Add new symbols (check limits)
        for symbol in add_symbols:
            if len(current_symbols) < instance.max_symbols or instance.max_symbols == -1:
                current_symbols.add(symbol)
        
        # Remove symbols
        for symbol in remove_symbols:
            current_symbols.discard(symbol)
        
        instance.symbols = list(current_symbols)
        instance.save()
        
        return instance


class WebSocketConnectionSerializer(serializers.ModelSerializer):
    """Serializer for WebSocket connections"""
    
    user_display = serializers.CharField(source='user.username', read_only=True)
    is_active_connection = serializers.SerializerMethodField()
    connection_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = WebSocketConnection
        fields = [
            'id', 'connection_id', 'user_display', 'status', 'subscribed_symbols',
            'connected_at', 'disconnected_at', 'last_ping', 'error_count',
            'last_error', 'is_active_connection', 'connection_duration'
        ]
        read_only_fields = [
            'id', 'connection_id', 'user_display', 'connected_at', 'disconnected_at',
            'last_ping', 'error_count', 'last_error'
        ]

    def get_is_active_connection(self, obj):
        """Check if connection is active"""
        return obj.is_active()

    def get_connection_duration(self, obj):
        """Calculate connection duration"""
        if obj.connected_at:
            end_time = obj.disconnected_at or obj.updated_at
            duration = end_time - obj.connected_at
            return str(duration).split('.')[0]  # Remove microseconds
        return None


class MarketDataLogSerializer(serializers.ModelSerializer):
    """Serializer for market data logs"""
    
    class Meta:
        model = MarketDataLog
        fields = [
            'id', 'level', 'message', 'api_provider', 'endpoint', 'symbol',
            'response_time_ms', 'status_code', 'error_code', 'error_details',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MarketDataStatsSerializer(serializers.Serializer):
    """Serializer for market data statistics"""
    
    total_api_calls_today = serializers.IntegerField()
    total_api_calls_month = serializers.IntegerField()
    active_connections = serializers.IntegerField()
    cached_symbols = serializers.IntegerField()
    error_rate_today = serializers.DecimalField(max_digits=5, decimal_places=2)
    top_symbols = serializers.ListField()
    provider_status = serializers.DictField()


class SymbolSearchSerializer(serializers.Serializer):
    """Serializer for symbol search"""
    
    query = serializers.CharField(max_length=100, help_text="Search query")
    exchange = serializers.CharField(max_length=10, default='NSE', required=False)
    instrument_type = serializers.CharField(max_length=20, required=False)
    limit = serializers.IntegerField(default=20, min_value=1, max_value=100, required=False)
    
    def validate_query(self, value):
        """Validate search query"""
        return value.upper().strip()


class SymbolInfoSerializer(serializers.Serializer):
    """Serializer for symbol information"""
    
    symbol = serializers.CharField()
    name = serializers.CharField()
    exchange = serializers.CharField()
    instrument_type = serializers.CharField()
    sector = serializers.CharField(required=False)
    industry = serializers.CharField(required=False)
    market_cap = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    lot_size = serializers.IntegerField(required=False)
    tick_size = serializers.DecimalField(max_digits=8, decimal_places=4, required=False)


class BulkQuoteRequestSerializer(serializers.Serializer):
    """Serializer for bulk quote requests"""
    
    symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        min_length=1,
        max_length=50,
        help_text="List of symbols to fetch quotes for"
    )
    
    def validate_symbols(self, value):
        """Validate and normalize symbols"""
        return [symbol.upper().strip() for symbol in value if symbol.strip()]


class HistoricalDataRequestSerializer(serializers.Serializer):
    """Serializer for historical data requests"""
    
    symbol = serializers.CharField(max_length=50)
    from_date = serializers.DateField()
    to_date = serializers.DateField()
    interval = serializers.ChoiceField(
        choices=[
            ('1m', '1 minute'),
            ('5m', '5 minutes'),
            ('15m', '15 minutes'),
            ('1h', '1 hour'),
            ('1d', '1 day'),
            ('1w', '1 week'),
            ('1M', '1 month')
        ],
        default='1d'
    )
    
    def validate(self, data):
        """Validate date range"""
        if data['from_date'] >= data['to_date']:
            raise serializers.ValidationError("from_date must be before to_date")
        
        # Limit historical data range
        date_diff = data['to_date'] - data['from_date']
        if date_diff.days > 365:
            raise serializers.ValidationError("Date range cannot exceed 365 days")
        
        return data