from django.contrib import admin
from django.utils.html import format_html
from .models import MLModel, ModelLeasing, TrainingJob, FnOStrategy


class MLModelAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user_email', 'model_type', 'status_badge', 'is_published',
        'accuracy', 'total_return', 'sharpe_ratio', 'total_leases', 'created_at'
    ]
    list_filter = ['status', 'model_type', 'is_published', 'created_at']
    search_fields = ['name', 'user__email', 'description']
    readonly_fields = [
        'id', 'training_results', 'feature_importance', 'backtest_results',
        'accuracy', 'precision', 'recall', 'f1_score', 'auc_roc',
        'total_return', 'sharpe_ratio', 'sortino_ratio', 'max_drawdown',
        'win_rate', 'total_leases', 'total_earnings', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'name', 'description', 'model_type', 'status')
        }),
        ('Training Configuration', {
            'fields': ('features', 'target_variable', 'training_parameters',
                      'training_period_days', 'validation_split')
        }),
        ('Performance Metrics', {
            'fields': ('accuracy', 'precision', 'recall', 'f1_score', 'auc_roc',
                      'total_return', 'sharpe_ratio', 'sortino_ratio', 
                      'max_drawdown', 'win_rate'),
            'classes': ('collapse',)
        }),
        ('F&O Configuration', {
            'fields': ('instrument_types', 'underlying_assets', 'option_strategies', 'expiry_handling'),
            'classes': ('collapse',)
        }),
        ('F&O Performance Metrics', {
            'fields': ('max_profit_potential', 'max_loss_potential', 'breakeven_points',
                      'implied_volatility_accuracy', 'delta_neutral_success',
                      'delta_prediction_accuracy', 'gamma_prediction_accuracy',
                      'theta_prediction_accuracy', 'vega_prediction_accuracy'),
            'classes': ('collapse',)
        }),
        ('Marketplace', {
            'fields': ('is_published', 'monthly_lease_price', 'total_leases', 'total_earnings')
        }),
        ('Results Data', {
            'fields': ('training_results', 'feature_importance', 'backtest_results'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    
    def status_badge(self, obj):
        color = obj.get_status_display_color()
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


class ModelLeasingAdmin(admin.ModelAdmin):
    list_display = [
        'lessee_email', 'model_name', 'lease_price', 'status', 
        'start_date', 'end_date', 'payment_status', 'is_active_display'
    ]
    list_filter = ['status', 'payment_status', 'start_date', 'created_at']
    search_fields = ['lessee__email', 'model__name']
    readonly_fields = [
        'id', 'platform_commission', 'creator_earnings',
        'total_signals_generated', 'trades_executed',
        'performance_metrics', 'created_at', 'updated_at'
    ]
    
    def lessee_email(self, obj):
        return obj.lessee.email
    lessee_email.short_description = 'Lessee Email'
    
    def model_name(self, obj):
        return obj.model.name
    model_name.short_description = 'Model Name'
    
    def is_active_display(self, obj):
        is_active = obj.is_active()
        color = '#10B981' if is_active else '#EF4444'
        text = 'Active' if is_active else 'Inactive'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, text
        )
    is_active_display.short_description = 'Active Status'


class TrainingJobAdmin(admin.ModelAdmin):
    list_display = [
        'model_name', 'status_badge', 'progress_percentage', 'current_step',
        'duration_display', 'queued_at'
    ]
    list_filter = ['status', 'queued_at', 'started_at']
    search_fields = ['model__name', 'model__user__email']
    readonly_fields = [
        'id', 'celery_task_id', 'result_data', 'duration_display',
        'queued_at', 'started_at', 'completed_at'
    ]
    
    def model_name(self, obj):
        return obj.model.name
    model_name.short_description = 'Model Name'
    
    def status_badge(self, obj):
        colors = {
            'QUEUED': '#F59E0B',
            'RUNNING': '#3B82F6',
            'COMPLETED': '#10B981',
            'FAILED': '#EF4444',
            'CANCELLED': '#6B7280'
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def duration_display(self, obj):
        duration = obj.get_duration()
        if duration:
            total_seconds = int(duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return "-"
    duration_display.short_description = 'Duration'



class FnOStrategyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'strategy_type', 'risk_level_badge', 'minimum_capital',
        'best_market_condition', 'usage_count', 'is_active', 'created_at'
    ]
    list_filter = ['strategy_type', 'risk_level', 'is_active', 'is_template', 'created_at']
    search_fields = ['name', 'description', 'best_market_condition']
    readonly_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'strategy_type', 'description', 'risk_level')
        }),
        ('Financial Configuration', {
            'fields': ('minimum_capital', 'maximum_loss', 'maximum_profit')
        }),
        ('Market Requirements', {
            'fields': ('instruments_required', 'best_market_condition', 'volatility_requirement')
        }),
        ('Greeks Configuration', {
            'fields': ('delta_target_range', 'gamma_consideration', 'theta_strategy', 'vega_consideration'),
            'classes': ('collapse',)
        }),
        ('Trading Rules', {
            'fields': ('entry_conditions', 'exit_conditions', 'stop_loss_rules'),
            'classes': ('collapse',)
        }),
        ('Template Settings', {
            'fields': ('is_template', 'is_active', 'usage_count')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def risk_level_badge(self, obj):
        colors = {
            'LOW': '#10B981',
            'MEDIUM': '#F59E0B', 
            'HIGH': '#EF4444',
            'VERY_HIGH': '#DC2626'
        }
        color = colors.get(obj.risk_level, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px;">{}</span>',
            color, obj.get_risk_level_display()
        )
    risk_level_badge.short_description = 'Risk Level'
    
    actions = ['activate_strategies', 'deactivate_strategies', 'reset_usage_count']
    
    def activate_strategies(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} strategies were successfully activated.')
    activate_strategies.short_description = 'Activate selected strategies'
    
    def deactivate_strategies(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} strategies were successfully deactivated.')
    deactivate_strategies.short_description = 'Deactivate selected strategies'
    
    def reset_usage_count(self, request, queryset):
        count = queryset.update(usage_count=0)
        self.message_user(request, f'Usage count reset for {count} strategies.')
    reset_usage_count.short_description = 'Reset usage count'


# Enhanced Admin Actions and Features

class EnhancedMLModelAdmin(MLModelAdmin):
    """Enhanced ML Model Admin with marketplace features"""
    
    actions = ['publish_models', 'unpublish_models', 'bulk_update_prices', 'generate_performance_report']
    
    def publish_models(self, request, queryset):
        """Bulk publish models"""
        count = 0
        for model in queryset:
            if model.status == 'TRAINED':
                model.is_published = True
                model.save()
                count += 1
        
        self.message_user(
            request,
            f'{count} models were successfully published.',
            messages.SUCCESS
        )
    publish_models.short_description = 'Publish selected models'
    
    def unpublish_models(self, request, queryset):
        """Bulk unpublish models"""
        count = queryset.update(is_published=False)
        self.message_user(
            request,
            f'{count} models were successfully unpublished.',
            messages.WARNING
        )
    unpublish_models.short_description = 'Unpublish selected models'
    
    def bulk_update_prices(self, request, queryset):
        """Bulk update model prices"""
        # This would typically open a form for price updates
        selected = queryset.values_list('id', flat=True)
        return HttpResponseRedirect(
            f'/admin/ai-studio/bulk-price-update/?ids={",".join(map(str, selected))}'
        )
    bulk_update_prices.short_description = 'Update prices for selected models'
    
    def generate_performance_report(self, request, queryset):
        """Generate performance report for selected models"""
        # Generate CSV report
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="model_performance_report.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Model Name', 'Creator', 'Accuracy', 'Sharpe Ratio', 'Total Return',
            'Max Drawdown', 'Total Leases', 'Total Earnings', 'Status'
        ])
        
        for model in queryset:
            writer.writerow([
                model.name,
                model.user.email,
                model.accuracy or 0,
                model.sharpe_ratio or 0,
                model.total_return or 0,
                model.max_drawdown or 0,
                model.total_leases,
                model.total_earnings or 0,
                model.get_status_display()
            ])
        
        return response
    generate_performance_report.short_description = 'Export performance report'


# Register the enhanced MLModel admin
admin.site.register(MLModel, EnhancedMLModelAdmin)


# Enhanced Model Leasing Admin
class EnhancedModelLeasingAdmin(ModelLeasingAdmin):
    """Enhanced Model Leasing Admin with marketplace features"""
    
    actions = ['activate_leases', 'suspend_leases', 'process_payments', 'send_notifications']
    
    def activate_leases(self, request, queryset):
        """Activate selected leases"""
        count = queryset.filter(payment_status='PAID').update(status='ACTIVE')
        self.message_user(
            request,
            f'{count} paid leases were successfully activated.',
            messages.SUCCESS
        )
    activate_leases.short_description = 'Activate paid leases'
    
    def suspend_leases(self, request, queryset):
        """Suspend selected leases"""
        count = queryset.update(status='SUSPENDED')
        self.message_user(
            request,
            f'{count} leases were successfully suspended.',
            messages.WARNING
        )
    suspend_leases.short_description = 'Suspend selected leases'
    
    def process_payments(self, request, queryset):
        """Mark payments as processed"""
        count = queryset.filter(payment_status='PENDING').update(payment_status='PAID')
        self.message_user(
            request,
            f'{count} payments were marked as processed.',
            messages.SUCCESS
        )
    process_payments.short_description = 'Mark payments as processed'
    
    def send_notifications(self, request, queryset):
        """Send notifications to users"""
        # This would integrate with a notification system
        count = queryset.count()
        self.message_user(
            request,
            f'Notifications sent for {count} leases.',
            messages.INFO
        )
    send_notifications.short_description = 'Send notifications'


# Register the enhanced ModelLeasing admin
admin.site.register(ModelLeasing, EnhancedModelLeasingAdmin)

# Register other admin classes
admin.site.register(TrainingJob, TrainingJobAdmin)
admin.site.register(FnOStrategy, FnOStrategyAdmin)


# Custom Admin Site with Marketplace Dashboard
class ShareWiseAdminSite(admin.AdminSite):
    """Custom admin site with enhanced marketplace features"""
    
    site_header = "ShareWise AI Marketplace Administration"
    site_title = "ShareWise AI Admin"
    index_title = "Marketplace Management Dashboard"
    
    def get_urls(self):
        from django.urls import path
        from .admin_views import (
            MarketplaceDashboardView, marketplace_analytics_api,
            export_marketplace_data, model_moderation_action
        )
        
        urls = super().get_urls()
        custom_urls = [
            path('marketplace-dashboard/', MarketplaceDashboardView.as_view(), name='marketplace_dashboard'),
            path('marketplace-analytics/', marketplace_analytics_api, name='marketplace_analytics'),
            path('export-data/', export_marketplace_data, name='export_marketplace_data'),
            path('moderate-model/', model_moderation_action, name='moderate_model'),
        ]
        return custom_urls + urls
    
    def index(self, request, extra_context=None):
        """Override admin index to show marketplace dashboard link"""
        extra_context = extra_context or {}
        extra_context['marketplace_dashboard_url'] = '/admin/marketplace-dashboard/'
        return super().index(request, extra_context)


# Enhanced User Admin for marketplace management
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

class MarketplaceUserAdmin(BaseUserAdmin):
    """Enhanced user admin with marketplace statistics"""
    
    list_display = BaseUserAdmin.list_display + (
        'models_created_count', 'models_leased_count', 'total_earned', 'total_spent'
    )
    
    def models_created_count(self, obj):
        return obj.created_models.count()
    models_created_count.short_description = 'Models Created'
    
    def models_leased_count(self, obj):
        return obj.leased_models.count()
    models_leased_count.short_description = 'Models Leased'
    
    def total_earned(self, obj):
        total = obj.created_models.aggregate(
            total=Sum('leases__creator_earnings')
        )['total'] or Decimal('0')
        return f"₹{total}"
    total_earned.short_description = 'Total Earned'
    
    def total_spent(self, obj):
        total = obj.leased_models.aggregate(
            total=Sum('lease_price')
        )['total'] or Decimal('0')
        return f"₹{total}"
    total_spent.short_description = 'Total Spent'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related(
            'created_models', 'leased_models'
        )

# Re-register User with enhanced admin
if admin.site.is_registered(User):
    admin.site.unregister(User)
admin.site.register(User, MarketplaceUserAdmin)


# Add necessary imports
from django.contrib import messages
from django.http import HttpResponseRedirect, HttpResponse
from django.db.models import Sum
from decimal import Decimal
import csv


# Customize admin site header
admin.site.site_header = "ShareWise AI Marketplace Administration"
admin.site.site_title = "ShareWise AI Admin Portal"
admin.site.index_title = "Marketplace Management Dashboard"