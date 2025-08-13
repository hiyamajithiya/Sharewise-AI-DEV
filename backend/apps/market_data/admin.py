from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (NSEAPIConfiguration, LiveMarketData, DataSubscription,
                     WebSocketConnection, MarketDataLog, MarketDataCache)


@admin.register(NSEAPIConfiguration)
class NSEAPIConfigurationAdmin(admin.ModelAdmin):
    list_display = [
        'provider', 'status', 'is_primary', 'daily_api_calls', 
        'monthly_api_calls', 'last_health_check', 'created_at'
    ]
    list_filter = ['provider', 'status', 'is_primary']
    search_fields = ['provider', 'base_url']
    readonly_fields = [
        'daily_api_calls', 'monthly_api_calls', 'last_health_check', 
        'error_message', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('provider', 'status', 'is_primary')
        }),
        ('API Configuration', {
            'fields': ('api_key', 'api_secret', 'access_token', 'base_url', 
                      'websocket_url', 'rate_limit_per_minute'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('daily_api_calls', 'monthly_api_calls', 'last_reset_date'),
            'classes': ('collapse',)
        }),
        ('Status Information', {
            'fields': ('last_health_check', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('api_key', 'api_secret', 'access_token')
        return self.readonly_fields
    
    actions = ['test_connection', 'reset_api_calls']
    
    def test_connection(self, request, queryset):
        """Test API connection for selected configurations"""
        for config in queryset:
            try:
                # This would test the connection
                config.status = NSEAPIConfiguration.Status.TESTING
                config.save()
            except Exception as e:
                config.status = NSEAPIConfiguration.Status.ERROR
                config.error_message = str(e)
                config.save()
        
        self.message_user(request, f"Connection test initiated for {queryset.count()} configurations")
    
    def reset_api_calls(self, request, queryset):
        """Reset API call counters"""
        queryset.update(
            daily_api_calls=0,
            monthly_api_calls=0,
            last_reset_date=timezone.now().date()
        )
        self.message_user(request, f"API call counters reset for {queryset.count()} configurations")
    
    test_connection.short_description = "Test API connection"
    reset_api_calls.short_description = "Reset API call counters"


@admin.register(LiveMarketData)
class LiveMarketDataAdmin(admin.ModelAdmin):
    list_display = [
        'symbol', 'instrument_type', 'last_price', 'change', 
        'change_percent', 'volume', 'timestamp', 'data_source'
    ]
    list_filter = ['instrument_type', 'exchange', 'data_source', 'timestamp']
    search_fields = ['symbol', 'underlying_symbol']
    readonly_fields = ['timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Instrument Details', {
            'fields': ('symbol', 'instrument_type', 'exchange', 'underlying_symbol',
                      'strike_price', 'expiry_date', 'option_type')
        }),
        ('Price Information', {
            'fields': ('last_price', 'change', 'change_percent', 'open_price',
                      'high_price', 'low_price', 'previous_close')
        }),
        ('Volume & Value', {
            'fields': ('volume', 'value', 'bid_price', 'ask_price',
                      'bid_quantity', 'ask_quantity')
        }),
        ('F&O Specific', {
            'fields': ('open_interest', 'open_interest_change', 'delta',
                      'gamma', 'theta', 'vega', 'implied_volatility'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('timestamp', 'data_source', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """Limit to recent data"""
        qs = super().get_queryset(request)
        # Show only last 24 hours of data
        yesterday = timezone.now() - timezone.timedelta(days=1)
        return qs.filter(timestamp__gte=yesterday)


@admin.register(DataSubscription)
class DataSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'subscription_type', 'symbols_count', 'is_active',
        'real_time_enabled', 'monthly_cost', 'created_at'
    ]
    list_filter = ['subscription_type', 'is_active', 'real_time_enabled']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Subscription Details', {
            'fields': ('subscription_type', 'is_active', 'real_time_enabled',
                      'max_symbols', 'symbols')
        }),
        ('Billing', {
            'fields': ('monthly_cost', 'last_billing_date'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def symbols_count(self, obj):
        return len(obj.symbols) if obj.symbols else 0
    
    symbols_count.short_description = 'Symbols Count'
    
    actions = ['enable_real_time', 'disable_real_time', 'upgrade_to_premium']
    
    def enable_real_time(self, request, queryset):
        queryset.update(real_time_enabled=True)
        self.message_user(request, f"Real-time data enabled for {queryset.count()} subscriptions")
    
    def disable_real_time(self, request, queryset):
        queryset.update(real_time_enabled=False)
        self.message_user(request, f"Real-time data disabled for {queryset.count()} subscriptions")
    
    def upgrade_to_premium(self, request, queryset):
        queryset.update(
            subscription_type=DataSubscription.SubscriptionType.PREMIUM,
            max_symbols=100,
            real_time_enabled=True
        )
        self.message_user(request, f"Upgraded {queryset.count()} subscriptions to Premium")
    
    enable_real_time.short_description = "Enable real-time data"
    disable_real_time.short_description = "Disable real-time data"
    upgrade_to_premium.short_description = "Upgrade to Premium"


@admin.register(WebSocketConnection)
class WebSocketConnectionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'status', 'subscribed_symbols_count', 'connected_at',
        'last_ping', 'error_count'
    ]
    list_filter = ['status', 'connected_at']
    search_fields = ['user__username', 'connection_id']
    readonly_fields = [
        'connection_id', 'connected_at', 'disconnected_at', 'last_ping',
        'error_count', 'last_error', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Connection Details', {
            'fields': ('user', 'connection_id', 'status')
        }),
        ('Subscription', {
            'fields': ('subscribed_symbols',)
        }),
        ('Connection Metrics', {
            'fields': ('connected_at', 'disconnected_at', 'last_ping'),
            'classes': ('collapse',)
        }),
        ('Error Information', {
            'fields': ('error_count', 'last_error'),
            'classes': ('collapse',)
        })
    )
    
    def subscribed_symbols_count(self, obj):
        return len(obj.subscribed_symbols) if obj.subscribed_symbols else 0
    
    subscribed_symbols_count.short_description = 'Subscribed Symbols'
    
    def get_queryset(self, request):
        """Show recent connections"""
        qs = super().get_queryset(request)
        # Show only last 7 days
        week_ago = timezone.now() - timezone.timedelta(days=7)
        return qs.filter(created_at__gte=week_ago)


@admin.register(MarketDataLog)
class MarketDataLogAdmin(admin.ModelAdmin):
    list_display = [
        'level', 'message_short', 'api_provider', 'symbol',
        'response_time_ms', 'status_code', 'created_at'
    ]
    list_filter = ['level', 'api_provider', 'status_code', 'created_at']
    search_fields = ['message', 'symbol', 'endpoint']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def message_short(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    
    message_short.short_description = 'Message'
    
    def get_queryset(self, request):
        """Show recent logs"""
        qs = super().get_queryset(request)
        # Show only last 3 days
        three_days_ago = timezone.now() - timezone.timedelta(days=3)
        return qs.filter(created_at__gte=three_days_ago)


@admin.register(MarketDataCache)
class MarketDataCacheAdmin(admin.ModelAdmin):
    list_display = [
        'symbol', 'data_type', 'cache_hits', 'expires_at',
        'source_provider', 'created_at'
    ]
    list_filter = ['data_type', 'source_provider', 'expires_at']
    search_fields = ['symbol']
    readonly_fields = ['cache_hits', 'created_at', 'updated_at']
    
    actions = ['clear_cache', 'extend_expiry']
    
    def clear_cache(self, request, queryset):
        """Clear selected cache entries"""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"Cleared {count} cache entries")
    
    def extend_expiry(self, request, queryset):
        """Extend cache expiry by 1 hour"""
        new_expiry = timezone.now() + timezone.timedelta(hours=1)
        queryset.update(expires_at=new_expiry)
        self.message_user(request, f"Extended expiry for {queryset.count()} cache entries")
    
    clear_cache.short_description = "Clear cache entries"
    extend_expiry.short_description = "Extend expiry by 1 hour"