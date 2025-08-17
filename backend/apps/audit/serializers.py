"""
Audit Trail Serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AuditEvent, DataAccessLog, SecurityEvent, ComplianceReport, AuditConfiguration

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for audit logs"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class AuditEventSerializer(serializers.ModelSerializer):
    """Serializer for audit events"""
    
    user = UserBasicSerializer(read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AuditEvent
        fields = [
            'id', 'event_type', 'event_type_display', 'severity', 'severity_display',
            'status', 'status_display', 'user', 'description', 'details',
            'ip_address', 'forwarded_for', 'user_agent', 'referer',
            'request_path', 'request_method', 'response_status',
            'timestamp', 'duration_ms', 'amount', 'currency',
            'regulatory_category', 'compliance_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AuditEventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating audit events"""
    
    class Meta:
        model = AuditEvent
        fields = [
            'event_type', 'severity', 'status', 'description', 'details',
            'amount', 'currency', 'regulatory_category', 'compliance_status'
        ]


class DataAccessLogSerializer(serializers.ModelSerializer):
    """Serializer for data access logs"""
    
    user = UserBasicSerializer(read_only=True)
    access_type_display = serializers.CharField(source='get_access_type_display', read_only=True)
    
    class Meta:
        model = DataAccessLog
        fields = [
            'id', 'user', 'access_type', 'access_type_display', 'table_name',
            'record_count', 'data_classification', 'purpose', 'business_justification',
            'filters_applied', 'ip_address', 'session_key', 'timestamp',
            'duration_ms', 'gdpr_lawful_basis', 'retention_period_days'
        ]
        read_only_fields = ['id']


class SecurityEventSerializer(serializers.ModelSerializer):
    """Serializer for security events"""
    
    user = UserBasicSerializer(read_only=True)
    audit_event = AuditEventSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    threat_level_display = serializers.CharField(source='get_threat_level_display', read_only=True)
    
    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'category', 'category_display', 'threat_level', 'threat_level_display',
            'title', 'description', 'indicators', 'user', 'ip_address',
            'user_agent', 'attack_vector', 'payload', 'blocked',
            'action_taken', 'audit_event', 'timestamp'
        ]
        read_only_fields = ['id']


class ComplianceReportSerializer(serializers.ModelSerializer):
    """Serializer for compliance reports"""
    
    generated_by = UserBasicSerializer(read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ComplianceReport
        fields = [
            'id', 'report_type', 'report_type_display', 'title', 'description',
            'period_start', 'period_end', 'summary', 'details', 'file_path',
            'file_size', 'status', 'status_display', 'generated_by',
            'regulatory_framework', 'submission_deadline', 'created_at',
            'generated_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'created_at', 'generated_at', 'submitted_at']


class ComplianceReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating compliance reports"""
    
    class Meta:
        model = ComplianceReport
        fields = [
            'report_type', 'title', 'description', 'period_start',
            'period_end', 'regulatory_framework', 'submission_deadline'
        ]


class AuditConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for audit configuration"""
    
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    log_level_display = serializers.CharField(source='get_log_level_display', read_only=True)
    
    class Meta:
        model = AuditConfiguration
        fields = [
            'id', 'event_type', 'event_type_display', 'enabled', 'log_level',
            'log_level_display', 'retention_days', 'archive_after_days',
            'alert_on_failure', 'alert_threshold', 'required_for_compliance',
            'regulatory_framework', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AuditSummarySerializer(serializers.Serializer):
    """Serializer for audit summary statistics"""
    
    total_events = serializers.IntegerField()
    events_by_type = serializers.DictField()
    events_by_severity = serializers.DictField()
    events_by_status = serializers.DictField()
    security_events_count = serializers.IntegerField()
    high_severity_events = serializers.IntegerField()
    failed_events = serializers.IntegerField()
    unique_users = serializers.IntegerField()
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()


class SecurityDashboardSerializer(serializers.Serializer):
    """Serializer for security dashboard data"""
    
    total_incidents = serializers.IntegerField()
    incidents_by_threat_level = serializers.DictField()
    incidents_by_category = serializers.DictField()
    blocked_attacks = serializers.IntegerField()
    unique_attackers = serializers.IntegerField()
    recent_incidents = SecurityEventSerializer(many=True)
    top_attack_vectors = serializers.DictField()
    geographic_distribution = serializers.DictField()


class ComplianceDashboardSerializer(serializers.Serializer):
    """Serializer for compliance dashboard data"""
    
    pending_reports = serializers.IntegerField()
    overdue_reports = serializers.IntegerField()
    data_access_count = serializers.IntegerField()
    data_export_count = serializers.IntegerField()
    gdpr_requests = serializers.IntegerField()
    financial_transactions = serializers.IntegerField()
    compliance_score = serializers.FloatField()
    recent_reports = ComplianceReportSerializer(many=True)