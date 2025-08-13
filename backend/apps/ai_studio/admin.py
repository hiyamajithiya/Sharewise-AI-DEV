from django.contrib import admin
from django.utils.html import format_html
from .models import MLModel, ModelLeasing, TrainingJob, ModelReview, FnOStrategy


@admin.register(MLModel)
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


@admin.register(ModelLeasing)
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


@admin.register(TrainingJob)
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


@admin.register(ModelReview)
class ModelReviewAdmin(admin.ModelAdmin):
    list_display = [
        'model_name', 'reviewer_email', 'rating_display', 'title',
        'would_recommend', 'created_at'
    ]
    list_filter = ['rating', 'would_recommend', 'created_at']
    search_fields = ['model__name', 'reviewer__email', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def model_name(self, obj):
        return obj.model.name
    model_name.short_description = 'Model Name'
    
    def reviewer_email(self, obj):
        return obj.reviewer.email
    reviewer_email.short_description = 'Reviewer Email'
    
    def rating_display(self, obj):
        stars = '⭐' * obj.rating
        return f"{stars} ({obj.rating}/5)"
    rating_display.short_description = 'Rating'


@admin.register(FnOStrategy)
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


# Customize admin site header
admin.site.site_header = "ShareWise AI Admin"
admin.site.site_title = "ShareWise AI Admin Portal"
admin.site.index_title = "Welcome to ShareWise AI Administration"