"""
Audit Trail Admin Configuration
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import AuditEvent, DataAccessLog, SecurityEvent, ComplianceReport, AuditConfiguration


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    """Admin interface for audit events"""
    
    list_display = [
        'id', 'event_type', 'user', 'severity', 'status', 
        'ip_address', 'timestamp', 'colored_severity'
    ]
    list_filter = [
        'event_type', 'severity', 'status', 'timestamp',
        'regulatory_category', 'compliance_status'
    ]
    search_fields = [
        'description', 'user__email', 'ip_address', 'user_agent',
        'request_path'
    ]
    readonly_fields = [
        'id', 'timestamp', 'created_at', 'session_key',
        'forwarded_for', 'referer'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'event_type', 'severity', 'status', 'description')
        }),
        ('User & Session', {
            'fields': ('user', 'session_key', 'user_agent')
        }),
        ('Network Information', {
            'fields': ('ip_address', 'forwarded_for', 'referer')
        }),
        ('Request Details', {
            'fields': ('request_path', 'request_method', 'request_data', 'response_status')
        }),
        ('Event Details', {
            'fields': ('details', 'content_type', 'object_id')
        }),
        ('Timing & Performance', {
            'fields': ('timestamp', 'duration_ms', 'created_at')
        }),
        ('Financial Information', {
            'fields': ('amount', 'currency')
        }),
        ('Compliance', {
            'fields': ('regulatory_category', 'compliance_status')
        }),
    )
    
    def colored_severity(self, obj):
        """Display severity with color coding"""
        colors = {
            'LOW': 'green',
            'MEDIUM': 'orange', 
            'HIGH': 'red',
            'CRITICAL': 'darkred'
        }
        color = colors.get(obj.severity, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_severity_display()
        )
    colored_severity.short_description = 'Severity'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_type')


@admin.register(DataAccessLog)
class DataAccessLogAdmin(admin.ModelAdmin):
    """Admin interface for data access logs"""
    
    list_display = [
        'id', 'user', 'access_type', 'table_name', 'record_count',
        'data_classification', 'timestamp', 'colored_classification'
    ]
    list_filter = [
        'access_type', 'data_classification', 'timestamp', 'gdpr_lawful_basis'
    ]
    search_fields = [
        'user__email', 'table_name', 'purpose', 'business_justification',
        'ip_address'
    ]
    readonly_fields = ['id', 'timestamp', 'query_hash']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Access Information', {
            'fields': ('id', 'user', 'access_type', 'timestamp')
        }),
        ('Data Details', {
            'fields': ('table_name', 'record_count', 'data_classification', 'query_hash')
        }),
        ('Purpose & Justification', {
            'fields': ('purpose', 'business_justification', 'filters_applied')
        }),
        ('Network & Session', {
            'fields': ('ip_address', 'session_key', 'duration_ms')
        }),
        ('Compliance', {
            'fields': ('gdpr_lawful_basis', 'retention_period_days')
        }),
    )
    
    def colored_classification(self, obj):
        """Display data classification with color coding"""
        colors = {
            'PUBLIC': 'green',
            'INTERNAL': 'blue',
            'CONFIDENTIAL': 'orange',
            'RESTRICTED': 'red'
        }
        color = colors.get(obj.data_classification, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.data_classification
        )
    colored_classification.short_description = 'Classification'


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    """Admin interface for security events"""
    
    list_display = [
        'id', 'title', 'category', 'threat_level', 'user',
        'ip_address', 'blocked', 'timestamp', 'colored_threat_level'
    ]
    list_filter = [
        'category', 'threat_level', 'blocked', 'timestamp'
    ]
    search_fields = [
        'title', 'description', 'user__email', 'ip_address',
        'user_agent', 'attack_vector', 'payload'
    ]
    readonly_fields = ['id', 'timestamp', 'audit_event']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'title', 'category', 'threat_level', 'timestamp')
        }),
        ('Description', {
            'fields': ('description', 'indicators')
        }),
        ('User & Network', {
            'fields': ('user', 'ip_address', 'user_agent')
        }),
        ('Attack Details', {
            'fields': ('attack_vector', 'payload')
        }),
        ('Response', {
            'fields': ('blocked', 'action_taken')
        }),
        ('Related Audit Event', {
            'fields': ('audit_event',)
        }),
    )
    
    def colored_threat_level(self, obj):
        """Display threat level with color coding"""
        colors = {
            'LOW': 'green',
            'MEDIUM': 'orange',
            'HIGH': 'red',
            'CRITICAL': 'darkred'
        }
        color = colors.get(obj.threat_level, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_threat_level_display()
        )
    colored_threat_level.short_description = 'Threat Level'


@admin.register(ComplianceReport)
class ComplianceReportAdmin(admin.ModelAdmin):
    """Admin interface for compliance reports"""
    
    list_display = [
        'id', 'title', 'report_type', 'status', 'generated_by',
        'period_start', 'period_end', 'created_at', 'colored_status'
    ]
    list_filter = [
        'report_type', 'status', 'regulatory_framework',
        'created_at', 'generated_at'
    ]
    search_fields = [
        'title', 'description', 'generated_by__email', 'regulatory_framework'
    ]
    readonly_fields = [
        'id', 'created_at', 'generated_at', 'submitted_at', 'file_size'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Report Information', {
            'fields': ('id', 'title', 'report_type', 'description')
        }),
        ('Time Period', {
            'fields': ('period_start', 'period_end')
        }),
        ('Content', {
            'fields': ('summary', 'details')
        }),
        ('File Information', {
            'fields': ('file_path', 'file_size')
        }),
        ('Status & Metadata', {
            'fields': ('status', 'generated_by', 'created_at', 'generated_at', 'submitted_at')
        }),
        ('Regulatory', {
            'fields': ('regulatory_framework', 'submission_deadline')
        }),
    )
    
    def colored_status(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'GENERATED': 'blue',
            'SUBMITTED': 'green',
            'ARCHIVED': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    colored_status.short_description = 'Status'


@admin.register(AuditConfiguration)
class AuditConfigurationAdmin(admin.ModelAdmin):
    """Admin interface for audit configuration"""
    
    list_display = [
        'event_type', 'enabled', 'log_level', 'retention_days',
        'required_for_compliance', 'regulatory_framework'
    ]
    list_filter = [
        'enabled', 'log_level', 'required_for_compliance',
        'alert_on_failure', 'regulatory_framework'
    ]
    search_fields = ['event_type', 'regulatory_framework']
    ordering = ['event_type']
    
    fieldsets = (
        ('Event Configuration', {
            'fields': ('event_type', 'enabled', 'log_level')
        }),
        ('Data Retention', {
            'fields': ('retention_days', 'archive_after_days')
        }),
        ('Alerting', {
            'fields': ('alert_on_failure', 'alert_threshold')
        }),
        ('Compliance', {
            'fields': ('required_for_compliance', 'regulatory_framework')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


# Customize admin site header
admin.site.site_header = 'ShareWise AI Audit Trail Administration'
admin.site.site_title = 'Audit Admin'
admin.site.index_title = 'Audit Trail Management'