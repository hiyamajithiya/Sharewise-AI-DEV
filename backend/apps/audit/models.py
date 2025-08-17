"""
Audit Trail Models for ShareWise AI
Comprehensive logging for compliance, security, and regulatory requirements
"""

import uuid
import json
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

User = get_user_model()


class AuditEvent(models.Model):
    """
    Central audit event model for all system activities
    """
    
    class EventType(models.TextChoices):
        # Authentication & Authorization
        USER_LOGIN = 'USER_LOGIN', 'User Login'
        USER_LOGOUT = 'USER_LOGOUT', 'User Logout'
        USER_REGISTRATION = 'USER_REGISTRATION', 'User Registration'
        PASSWORD_CHANGE = 'PASSWORD_CHANGE', 'Password Change'
        PERMISSION_DENIED = 'PERMISSION_DENIED', 'Permission Denied'
        
        # Trading Activities
        SIGNAL_GENERATED = 'SIGNAL_GENERATED', 'Trading Signal Generated'
        SIGNAL_EXECUTED = 'SIGNAL_EXECUTED', 'Trading Signal Executed'
        TRADE_PLACED = 'TRADE_PLACED', 'Trade Order Placed'
        TRADE_EXECUTED = 'TRADE_EXECUTED', 'Trade Executed'
        TRADE_CANCELLED = 'TRADE_CANCELLED', 'Trade Cancelled'
        PORTFOLIO_UPDATED = 'PORTFOLIO_UPDATED', 'Portfolio Updated'
        RISK_ALERT = 'RISK_ALERT', 'Risk Alert Generated'
        
        # AI Studio Activities
        MODEL_CREATED = 'MODEL_CREATED', 'ML Model Created'
        MODEL_TRAINED = 'MODEL_TRAINED', 'ML Model Training Started'
        MODEL_COMPLETED = 'MODEL_COMPLETED', 'ML Model Training Completed'
        MODEL_PUBLISHED = 'MODEL_PUBLISHED', 'ML Model Published'
        MODEL_LEASED = 'MODEL_LEASED', 'ML Model Leased'
        MODEL_PREDICTION = 'MODEL_PREDICTION', 'ML Model Prediction Made'
        BACKTEST_STARTED = 'BACKTEST_STARTED', 'Backtest Started'
        BACKTEST_COMPLETED = 'BACKTEST_COMPLETED', 'Backtest Completed'
        
        # Data Access
        DATA_ACCESSED = 'DATA_ACCESSED', 'Data Accessed'
        DATA_EXPORTED = 'DATA_EXPORTED', 'Data Exported'
        DATA_IMPORTED = 'DATA_IMPORTED', 'Data Imported'
        REPORT_GENERATED = 'REPORT_GENERATED', 'Report Generated'
        
        # System Administration
        SETTINGS_CHANGED = 'SETTINGS_CHANGED', 'System Settings Changed'
        USER_CREATED = 'USER_CREATED', 'User Account Created'
        USER_UPDATED = 'USER_UPDATED', 'User Account Updated'
        USER_DELETED = 'USER_DELETED', 'User Account Deleted'
        SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED', 'Subscription Changed'
        
        # Security Events
        SECURITY_VIOLATION = 'SECURITY_VIOLATION', 'Security Violation'
        SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY', 'Suspicious Activity'
        RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED', 'Rate Limit Exceeded'
        UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS', 'Unauthorized Access Attempt'
        
        # Financial/Compliance
        PAYMENT_PROCESSED = 'PAYMENT_PROCESSED', 'Payment Processed'
        REFUND_ISSUED = 'REFUND_ISSUED', 'Refund Issued'
        COMPLIANCE_CHECK = 'COMPLIANCE_CHECK', 'Compliance Check'
        REGULATORY_REPORT = 'REGULATORY_REPORT', 'Regulatory Report Generated'
    
    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'
    
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILURE = 'FAILURE', 'Failure'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Event Information
    event_type = models.CharField(max_length=50, choices=EventType.choices)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    
    # User and Session Information
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_events')
    session_key = models.CharField(max_length=40, blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Network Information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    forwarded_for = models.GenericIPAddressField(null=True, blank=True)
    referer = models.URLField(blank=True, max_length=500)
    
    # Event Details
    description = models.TextField()
    details = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    
    # Object Reference (Generic Foreign Key)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.CharField(max_length=255, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Request Information
    request_path = models.CharField(max_length=500, blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    request_data = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    response_status = models.IntegerField(null=True, blank=True)
    
    # Timing
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True, help_text="Duration in milliseconds")
    
    # Financial Information (for trading/payment events)
    amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='INR')
    
    # Compliance and Regulatory
    regulatory_category = models.CharField(max_length=100, blank=True)
    compliance_status = models.CharField(max_length=50, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['severity', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.user} - {self.timestamp}"
    
    def save(self, *args, **kwargs):
        # Auto-set compliance categories
        if self.event_type in ['TRADE_EXECUTED', 'PAYMENT_PROCESSED', 'SIGNAL_EXECUTED']:
            self.regulatory_category = 'FINANCIAL_TRANSACTION'
        elif self.event_type in ['DATA_EXPORTED', 'REPORT_GENERATED']:
            self.regulatory_category = 'DATA_PRIVACY'
        elif self.event_type in ['SECURITY_VIOLATION', 'UNAUTHORIZED_ACCESS']:
            self.regulatory_category = 'SECURITY_INCIDENT'
        
        super().save(*args, **kwargs)


class DataAccessLog(models.Model):
    """
    Detailed logging for data access and privacy compliance
    """
    
    class AccessType(models.TextChoices):
        READ = 'READ', 'Read Access'
        WRITE = 'WRITE', 'Write Access'
        DELETE = 'DELETE', 'Delete Access'
        EXPORT = 'EXPORT', 'Export Access'
        IMPORT = 'IMPORT', 'Import Access'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Access Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_accesses')
    access_type = models.CharField(max_length=20, choices=AccessType.choices)
    
    # Data Information
    table_name = models.CharField(max_length=100)
    record_count = models.PositiveIntegerField(default=0)
    data_classification = models.CharField(max_length=50, default='PUBLIC')  # PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    
    # Query Information
    query_hash = models.CharField(max_length=64, blank=True)  # Hash of the query for analysis
    filters_applied = models.JSONField(default=dict)
    
    # Purpose and Justification
    purpose = models.CharField(max_length=200)
    business_justification = models.TextField(blank=True)
    
    # Network and Session
    ip_address = models.GenericIPAddressField()
    session_key = models.CharField(max_length=40)
    
    # Timing
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    
    # Compliance
    gdpr_lawful_basis = models.CharField(max_length=100, blank=True)
    retention_period_days = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'audit_data_access'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['table_name', 'timestamp']),
            models.Index(fields=['access_type', 'timestamp']),
            models.Index(fields=['data_classification', 'timestamp']),
        ]


class SecurityEvent(models.Model):
    """
    Specialized security event logging
    """
    
    class ThreatLevel(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'
    
    class EventCategory(models.TextChoices):
        AUTHENTICATION = 'AUTHENTICATION', 'Authentication'
        AUTHORIZATION = 'AUTHORIZATION', 'Authorization'
        DATA_BREACH = 'DATA_BREACH', 'Data Breach'
        MALWARE = 'MALWARE', 'Malware'
        INTRUSION = 'INTRUSION', 'Intrusion'
        SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY', 'Suspicious Activity'
        RATE_LIMITING = 'RATE_LIMITING', 'Rate Limiting'
        INPUT_VALIDATION = 'INPUT_VALIDATION', 'Input Validation'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Event Classification
    category = models.CharField(max_length=50, choices=EventCategory.choices)
    threat_level = models.CharField(max_length=20, choices=ThreatLevel.choices)
    
    # Event Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    indicators = models.JSONField(default=list)  # IOCs, patterns, etc.
    
    # User and Network
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Attack Details
    attack_vector = models.CharField(max_length=100, blank=True)
    payload = models.TextField(blank=True)
    
    # Response Information
    blocked = models.BooleanField(default=False)
    action_taken = models.TextField(blank=True)
    
    # Related Audit Event
    audit_event = models.ForeignKey(AuditEvent, on_delete=models.CASCADE, related_name='security_events')
    
    # Timing
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'audit_security_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['threat_level', 'timestamp']),
            models.Index(fields=['category', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]


class ComplianceReport(models.Model):
    """
    Compliance and regulatory reporting
    """
    
    class ReportType(models.TextChoices):
        GDPR_DATA_ACCESS = 'GDPR_DATA_ACCESS', 'GDPR Data Access Report'
        SECURITY_INCIDENT = 'SECURITY_INCIDENT', 'Security Incident Report'
        FINANCIAL_ACTIVITY = 'FINANCIAL_ACTIVITY', 'Financial Activity Report'
        USER_ACTIVITY = 'USER_ACTIVITY', 'User Activity Report'
        SYSTEM_USAGE = 'SYSTEM_USAGE', 'System Usage Report'
        DATA_EXPORT = 'DATA_EXPORT', 'Data Export Report'
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        GENERATED = 'GENERATED', 'Generated'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        ARCHIVED = 'ARCHIVED', 'Archived'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Report Information
    report_type = models.CharField(max_length=50, choices=ReportType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Time Period
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Report Content
    summary = models.JSONField(default=dict)
    details = models.JSONField(default=dict)
    
    # File Information
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    
    # Status and Metadata
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Regulatory Information
    regulatory_framework = models.CharField(max_length=100, blank=True)  # GDPR, SOX, etc.
    submission_deadline = models.DateTimeField(null=True, blank=True)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'audit_compliance_reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['period_start', 'period_end']),
        ]


class AuditConfiguration(models.Model):
    """
    Configuration for audit logging behavior
    """
    
    class LogLevel(models.TextChoices):
        MINIMAL = 'MINIMAL', 'Minimal'
        STANDARD = 'STANDARD', 'Standard'
        DETAILED = 'DETAILED', 'Detailed'
        COMPREHENSIVE = 'COMPREHENSIVE', 'Comprehensive'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Configuration
    event_type = models.CharField(max_length=50, choices=AuditEvent.EventType.choices)
    enabled = models.BooleanField(default=True)
    log_level = models.CharField(max_length=20, choices=LogLevel.choices, default=LogLevel.STANDARD)
    
    # Retention
    retention_days = models.PositiveIntegerField(default=365)
    archive_after_days = models.PositiveIntegerField(default=90)
    
    # Alerting
    alert_on_failure = models.BooleanField(default=False)
    alert_threshold = models.PositiveIntegerField(null=True, blank=True)
    
    # Compliance Requirements
    required_for_compliance = models.BooleanField(default=False)
    regulatory_framework = models.CharField(max_length=100, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'audit_configuration'
        unique_together = ['event_type']