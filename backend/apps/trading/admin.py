from django.contrib import admin
from django.utils.html import format_html
from .models import TradingSignal, TradingOrder


@admin.register(TradingSignal)
class TradingSignalAdmin(admin.ModelAdmin):
    list_display = [
        'symbol', 'user', 'strategy_name', 'signal_type', 'confidence_indicator',
        'entry_price', 'execution_status', 'timestamp'
    ]
    list_filter = [
        'signal_type', 'executed', 'strategy_name', 'timestamp'
    ]
    search_fields = ['symbol', 'strategy_name', 'user__email']
    readonly_fields = ['id', 'timestamp', 'created_at', 'updated_at']
    
    def confidence_indicator(self, obj):
        score = float(obj.confidence_score)
        color = 'green' if score >= 0.8 else 'orange' if score >= 0.6 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1%}</span>',
            color, score
        )
    confidence_indicator.short_description = 'Confidence'
    
    def execution_status(self, obj):
        if obj.executed:
            return format_html('<span style="color: green;">● Executed</span>')
        else:
            return format_html('<span style="color: gray;">○ Pending</span>')
    execution_status.short_description = 'Status'
    
    fieldsets = (
        ('Signal Information', {
            'fields': ('symbol', 'signal_type', 'strategy_name', 'user')
        }),
        ('Pricing', {
            'fields': ('entry_price', 'target_price', 'stop_loss', 'confidence_score')
        }),
        ('Execution', {
            'fields': ('executed', 'executed_price', 'valid_until')
        }),
        ('Data', {
            'fields': ('backtest_result', 'market_data'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'timestamp', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(TradingOrder)
class TradingOrderAdmin(admin.ModelAdmin):
    list_display = [
        'symbol', 'transaction_type', 'order_type', 'quantity', 
        'price', 'status', 'user', 'order_timestamp'
    ]
    list_filter = [
        'transaction_type', 'order_type', 'status', 'order_timestamp'
    ]
    search_fields = ['symbol', 'broker_order_id', 'user__email']
    readonly_fields = ['id', 'order_timestamp', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('symbol', 'transaction_type', 'order_type', 'user', 'signal')
        }),
        ('Pricing & Quantity', {
            'fields': ('quantity', 'price', 'trigger_price', 'filled_quantity', 'average_price')
        }),
        ('Status', {
            'fields': ('status', 'broker_order_id', 'rejection_reason')
        }),
        ('Costs', {
            'fields': ('fees', 'taxes')
        }),
        ('Timestamps', {
            'fields': ('order_timestamp', 'exchange_timestamp'),
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'signal')