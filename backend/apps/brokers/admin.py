from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    BrokerAccount, BrokerSession, BrokerOrder, BrokerPosition, 
    BrokerWebhook, BrokerAPILog
)


@admin.register(BrokerAccount)
class BrokerAccountAdmin(admin.ModelAdmin):
    list_display = [
        'account_name', 'user', 'broker_type', 'status_indicator', 
        'account_balance', 'available_balance', 'is_primary', 
        'last_connected_at', 'created_at'
    ]
    list_filter = ['broker_type', 'status', 'is_primary', 'created_at']
    search_fields = ['account_name', 'user__username', 'user__email', 'broker_user_id']
    readonly_fields = [
        'id', 'encrypted_credentials', 'last_connected_at', 'last_error',
        'account_balance', 'available_balance', 'margin_used',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'broker_type', 'account_name', 'broker_user_id')
        }),
        ('Connection Status', {
            'fields': ('status', 'last_connected_at', 'last_error')
        }),
        ('Account Details', {
            'fields': ('account_balance', 'available_balance', 'margin_used')
        }),
        ('Settings', {
            'fields': (
                'is_primary', 'auto_sync', 'risk_limit_enabled',
                'daily_loss_limit', 'position_size_limit'
            )
        }),
        ('Security', {
            'fields': ('encrypted_credentials',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def status_indicator(self, obj):
        colors = {
            'ACTIVE': 'green',
            'INACTIVE': 'orange',
            'ERROR': 'red',
            'EXPIRED': 'gray',
            'CONNECTING': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {};">●</span> {}',
            color, obj.get_status_display()
        )
    status_indicator.short_description = 'Status'
    status_indicator.admin_order_field = 'status'


@admin.register(BrokerSession)
class BrokerSessionAdmin(admin.ModelAdmin):
    list_display = ['broker_account', 'expires_at', 'is_valid_status', 'created_at']
    list_filter = ['created_at', 'expires_at']
    readonly_fields = ['id', 'session_token', 'created_at', 'updated_at']
    
    def is_valid_status(self, obj):
        valid = obj.is_valid()
        color = 'green' if valid else 'red'
        status = 'Valid' if valid else 'Expired'
        return format_html(
            '<span style="color: {};">●</span> {}',
            color, status
        )
    is_valid_status.short_description = 'Valid'


@admin.register(BrokerOrder)
class BrokerOrderAdmin(admin.ModelAdmin):
    list_display = [
        'broker_order_id', 'broker_account', 'symbol', 'transaction_type',
        'order_type', 'quantity', 'price', 'status_indicator', 'placed_at'
    ]
    list_filter = [
        'status', 'transaction_type', 'order_type', 'exchange',
        'broker_account__broker_type', 'placed_at'
    ]
    search_fields = [
        'broker_order_id', 'platform_order_id', 'symbol',
        'broker_account__account_name'
    ]
    readonly_fields = [
        'id', 'broker_order_id', 'filled_quantity', 'average_price',
        'placed_at', 'executed_at', 'cancelled_at', 'error_message',
        'retry_count', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Order Information', {
            'fields': (
                'id', 'broker_account', 'trading_order', 'broker_order_id', 
                'platform_order_id'
            )
        }),
        ('Order Details', {
            'fields': (
                'symbol', 'exchange', 'order_type', 'transaction_type',
                'quantity', 'price', 'trigger_price'
            )
        }),
        ('Execution Details', {
            'fields': (
                'status', 'filled_quantity', 'average_price',
                'placed_at', 'executed_at', 'cancelled_at'
            )
        }),
        ('Error Handling', {
            'fields': ('error_message', 'retry_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def status_indicator(self, obj):
        colors = {
            'COMPLETE': 'green',
            'PLACED': 'blue',
            'CANCELLED': 'orange',
            'REJECTED': 'red',
            'PENDING': 'gray',
            'MODIFIED': 'purple'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {};">●</span> {}',
            color, obj.get_status_display()
        )
    status_indicator.short_description = 'Status'
    status_indicator.admin_order_field = 'status'


@admin.register(BrokerPosition)
class BrokerPositionAdmin(admin.ModelAdmin):
    list_display = [
        'symbol', 'broker_account', 'exchange', 'product',
        'quantity', 'average_price', 'last_price', 'pnl_indicator',
        'last_synced_at'
    ]
    list_filter = [
        'exchange', 'product', 'broker_account__broker_type',
        'last_synced_at'
    ]
    search_fields = ['symbol', 'broker_account__account_name']
    readonly_fields = [
        'id', 'unrealized_pnl', 'realized_pnl', 'created_at',
        'updated_at', 'last_synced_at'
    ]
    
    def pnl_indicator(self, obj):
        pnl = float(obj.unrealized_pnl)
        if pnl > 0:
            return format_html(
                '<span style="color: green;">+₹{:.2f}</span>', pnl
            )
        elif pnl < 0:
            return format_html(
                '<span style="color: red;">₹{:.2f}</span>', pnl
            )
        else:
            return '₹0.00'
    pnl_indicator.short_description = 'Unrealized P&L'
    pnl_indicator.admin_order_field = 'unrealized_pnl'


@admin.register(BrokerWebhook)
class BrokerWebhookAdmin(admin.ModelAdmin):
    list_display = [
        'broker_account', 'event_type', 'processed_status',
        'created_at', 'processed_at'
    ]
    list_filter = ['event_type', 'processed', 'created_at']
    search_fields = ['broker_account__account_name', 'event_type']
    readonly_fields = [
        'id', 'event_data', 'processed_at', 'error_message', 'created_at'
    ]
    
    def processed_status(self, obj):
        if obj.processed:
            return format_html(
                '<span style="color: green;">●</span> Processed'
            )
        elif obj.error_message:
            return format_html(
                '<span style="color: red;">●</span> Error'
            )
        else:
            return format_html(
                '<span style="color: orange;">●</span> Pending'
            )
    processed_status.short_description = 'Status'
    processed_status.admin_order_field = 'processed'


@admin.register(BrokerAPILog)
class BrokerAPILogAdmin(admin.ModelAdmin):
    list_display = [
        'broker_account', 'endpoint', 'method', 'status_code',
        'response_time_ms', 'level_indicator', 'created_at'
    ]
    list_filter = [
        'level', 'method', 'status_code', 'broker_account__broker_type',
        'created_at'
    ]
    search_fields = [
        'broker_account__account_name', 'endpoint', 'message'
    ]
    readonly_fields = [
        'id', 'request_data', 'response_data', 'created_at'
    ]
    
    fieldsets = (
        ('Request Information', {
            'fields': ('broker_account', 'endpoint', 'method')
        }),
        ('Response Information', {
            'fields': ('status_code', 'response_time_ms', 'level', 'message')
        }),
        ('Data', {
            'fields': ('request_data', 'response_data'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        })
    )
    
    def level_indicator(self, obj):
        colors = {
            'INFO': 'blue',
            'WARNING': 'orange',
            'ERROR': 'red',
            'DEBUG': 'gray'
        }
        color = colors.get(obj.level, 'gray')
        return format_html(
            '<span style="color: {};">●</span> {}',
            color, obj.level
        )
    level_indicator.short_description = 'Level'
    level_indicator.admin_order_field = 'level'
    
    def has_add_permission(self, request):
        # API logs should not be manually added
        return False