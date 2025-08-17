"""
Audit Trail Services for ShareWise AI
Centralized audit logging and compliance services
"""

import hashlib
import json
import logging
from typing import Dict, Any, Optional, Union
from decimal import Decimal
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.core.serializers.json import DjangoJSONEncoder

from .models import AuditEvent, DataAccessLog, SecurityEvent, ComplianceReport, AuditConfiguration

User = get_user_model()
logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Central audit logging service
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def log_event(
        self,
        event_type: str,
        user: Optional[User] = None,
        description: str = "",
        details: Optional[Dict[str, Any]] = None,
        severity: str = AuditEvent.Severity.MEDIUM,
        status: str = AuditEvent.Status.SUCCESS,
        request=None,
        content_object=None,
        amount: Optional[Decimal] = None,
        duration_ms: Optional[int] = None,
        regulatory_category: str = "",
        compliance_status: str = ""
    ) -> AuditEvent:
        """
        Log an audit event
        """
        try:
            # Check if this event type is enabled
            config = self._get_audit_config(event_type)
            if not config or not config.enabled:
                return None
            
            # Prepare event data
            event_data = {
                'event_type': event_type,
                'description': description,
                'details': details or {},
                'severity': severity,
                'status': status,
                'user': user,
                'timestamp': timezone.now(),
                'duration_ms': duration_ms,
                'amount': amount,
                'regulatory_category': regulatory_category,
                'compliance_status': compliance_status,
            }
            
            # Extract request information
            if request:
                event_data.update(self._extract_request_info(request))
            
            # Set content object
            if content_object:
                event_data['content_type'] = ContentType.objects.get_for_model(content_object)
                event_data['object_id'] = str(content_object.pk)
            
            # Create audit event
            with transaction.atomic():
                audit_event = AuditEvent.objects.create(**event_data)
                self.logger.info(f"Audit event logged: {event_type} - {audit_event.id}")
                return audit_event
                
        except Exception as e:
            self.logger.error(f"Failed to log audit event {event_type}: {e}")
            return None
    
    def log_security_event(
        self,
        category: str,
        threat_level: str,
        title: str,
        description: str,
        user: Optional[User] = None,
        request=None,
        indicators: Optional[list] = None,
        attack_vector: str = "",
        payload: str = "",
        blocked: bool = False,
        action_taken: str = ""
    ) -> SecurityEvent:
        """
        Log a security event
        """
        try:
            # Create base audit event
            audit_event = self.log_event(
                event_type=AuditEvent.EventType.SECURITY_VIOLATION,
                user=user,
                description=description,
                severity=AuditEvent.Severity.HIGH if threat_level == 'HIGH' else AuditEvent.Severity.CRITICAL,
                status=AuditEvent.Status.WARNING,
                request=request
            )
            
            if not audit_event:
                return None
            
            # Extract network info
            ip_address = None
            user_agent = ""
            if request:
                ip_address = self._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Create security event
            security_event = SecurityEvent.objects.create(
                category=category,
                threat_level=threat_level,
                title=title,
                description=description,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                indicators=indicators or [],
                attack_vector=attack_vector,
                payload=payload,
                blocked=blocked,
                action_taken=action_taken,
                audit_event=audit_event
            )
            
            self.logger.warning(f"Security event logged: {category} - {threat_level}")
            return security_event
            
        except Exception as e:
            self.logger.error(f"Failed to log security event: {e}")
            return None
    
    def log_data_access(
        self,
        user: User,
        access_type: str,
        table_name: str,
        record_count: int = 0,
        purpose: str = "",
        request=None,
        data_classification: str = "PUBLIC",
        filters_applied: Optional[Dict] = None,
        business_justification: str = "",
        gdpr_lawful_basis: str = "",
        duration_ms: Optional[int] = None
    ) -> DataAccessLog:
        """
        Log data access for privacy compliance
        """
        try:
            # Extract network info
            ip_address = None
            session_key = ""
            if request:
                ip_address = self._get_client_ip(request)
                session_key = request.session.session_key or ""
            
            # Create data access log
            access_log = DataAccessLog.objects.create(
                user=user,
                access_type=access_type,
                table_name=table_name,
                record_count=record_count,
                data_classification=data_classification,
                purpose=purpose,
                business_justification=business_justification,
                filters_applied=filters_applied or {},
                ip_address=ip_address,
                session_key=session_key,
                gdpr_lawful_basis=gdpr_lawful_basis,
                duration_ms=duration_ms
            )
            
            # Also create audit event
            self.log_event(
                event_type=AuditEvent.EventType.DATA_ACCESSED,
                user=user,
                description=f"Data access: {table_name} - {access_type}",
                details={
                    'table_name': table_name,
                    'record_count': record_count,
                    'data_classification': data_classification,
                    'purpose': purpose
                },
                request=request
            )
            
            return access_log
            
        except Exception as e:
            self.logger.error(f"Failed to log data access: {e}")
            return None
    
    def _extract_request_info(self, request) -> Dict[str, Any]:
        """
        Extract information from Django request object
        """
        info = {}
        
        if request:
            info.update({
                'ip_address': self._get_client_ip(request),
                'forwarded_for': request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip(),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'referer': request.META.get('HTTP_REFERER', ''),
                'request_path': request.path,
                'request_method': request.method,
                'session_key': getattr(request.session, 'session_key', None),
            })
            
            # Sanitize request data (remove sensitive info)
            request_data = {}
            if hasattr(request, 'data') and request.data:
                request_data = self._sanitize_request_data(dict(request.data))
            elif request.method == 'GET' and request.GET:
                request_data = self._sanitize_request_data(dict(request.GET))
            
            info['request_data'] = request_data
        
        return info
    
    def _get_client_ip(self, request) -> str:
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip
    
    def _sanitize_request_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove sensitive information from request data
        """
        sensitive_fields = {
            'password', 'secret', 'token', 'key', 'auth', 'credential',
            'api_key', 'access_token', 'refresh_token', 'csrf_token'
        }
        
        sanitized = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(sensitive in key_lower for sensitive in sensitive_fields):
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = str(value)[:500]  # Limit length
        
        return sanitized
    
    def _get_audit_config(self, event_type: str) -> Optional[AuditConfiguration]:
        """
        Get audit configuration for event type
        """
        try:
            return AuditConfiguration.objects.get(event_type=event_type)
        except AuditConfiguration.DoesNotExist:
            # Create default configuration
            return AuditConfiguration.objects.create(
                event_type=event_type,
                enabled=True,
                log_level=AuditConfiguration.LogLevel.STANDARD
            )
    
    # Convenience methods for common events
    def log_user_login(self, user: User, request=None, success: bool = True):
        """Log user login event"""
        return self.log_event(
            event_type=AuditEvent.EventType.USER_LOGIN,
            user=user,
            description=f"User login {'successful' if success else 'failed'}",
            status=AuditEvent.Status.SUCCESS if success else AuditEvent.Status.FAILURE,
            request=request
        )
    
    def log_user_logout(self, user: User, request=None):
        """Log user logout event"""
        return self.log_event(
            event_type=AuditEvent.EventType.USER_LOGOUT,
            user=user,
            description="User logout",
            request=request
        )
    
    def log_trade_execution(self, user: User, trade_data: Dict[str, Any], amount: Decimal, request=None):
        """Log trade execution event"""
        return self.log_event(
            event_type=AuditEvent.EventType.TRADE_EXECUTED,
            user=user,
            description=f"Trade executed: {trade_data.get('symbol', 'Unknown')}",
            details=trade_data,
            amount=amount,
            regulatory_category='FINANCIAL_TRANSACTION',
            request=request
        )
    
    def log_model_training(self, user: User, model_data: Dict[str, Any], request=None):
        """Log ML model training event"""
        return self.log_event(
            event_type=AuditEvent.EventType.MODEL_TRAINED,
            user=user,
            description=f"ML model training started: {model_data.get('name', 'Unknown')}",
            details=model_data,
            request=request
        )
    
    def log_model_prediction(self, user: User, model_id: str, prediction_data: Dict[str, Any], request=None):
        """Log model prediction event"""
        return self.log_event(
            event_type=AuditEvent.EventType.MODEL_PREDICTION,
            user=user,
            description=f"Model prediction made: {model_id}",
            details=prediction_data,
            request=request
        )
    
    def log_data_export(self, user: User, export_type: str, record_count: int, request=None):
        """Log data export event"""
        return self.log_event(
            event_type=AuditEvent.EventType.DATA_EXPORTED,
            user=user,
            description=f"Data exported: {export_type}",
            details={'export_type': export_type, 'record_count': record_count},
            regulatory_category='DATA_PRIVACY',
            request=request
        )


class ComplianceService:
    """
    Service for compliance reporting and regulatory requirements
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def generate_compliance_report(
        self,
        report_type: str,
        period_start: datetime,
        period_end: datetime,
        generated_by: User,
        title: str = "",
        description: str = ""
    ) -> ComplianceReport:
        """
        Generate a compliance report
        """
        try:
            # Create report record
            report = ComplianceReport.objects.create(
                report_type=report_type,
                title=title or f"{report_type} Report",
                description=description,
                period_start=period_start,
                period_end=period_end,
                generated_by=generated_by,
                status=ComplianceReport.Status.PENDING
            )
            
            # Generate report content based on type
            if report_type == ComplianceReport.ReportType.GDPR_DATA_ACCESS:
                self._generate_gdpr_report(report)
            elif report_type == ComplianceReport.ReportType.SECURITY_INCIDENT:
                self._generate_security_report(report)
            elif report_type == ComplianceReport.ReportType.FINANCIAL_ACTIVITY:
                self._generate_financial_report(report)
            elif report_type == ComplianceReport.ReportType.USER_ACTIVITY:
                self._generate_user_activity_report(report)
            
            # Update status
            report.status = ComplianceReport.Status.GENERATED
            report.generated_at = timezone.now()
            report.save()
            
            self.logger.info(f"Compliance report generated: {report.id}")
            return report
            
        except Exception as e:
            self.logger.error(f"Failed to generate compliance report: {e}")
            raise
    
    def _generate_gdpr_report(self, report: ComplianceReport):
        """Generate GDPR data access report"""
        data_accesses = DataAccessLog.objects.filter(
            timestamp__range=[report.period_start, report.period_end]
        )
        
        summary = {
            'total_accesses': data_accesses.count(),
            'unique_users': data_accesses.values('user').distinct().count(),
            'data_classifications': {},
            'access_types': {},
            'tables_accessed': set(),
        }
        
        # Aggregate data
        for access in data_accesses:
            # Count by classification
            classification = access.data_classification
            summary['data_classifications'][classification] = \
                summary['data_classifications'].get(classification, 0) + 1
            
            # Count by access type
            access_type = access.access_type
            summary['access_types'][access_type] = \
                summary['access_types'].get(access_type, 0) + 1
            
            # Track tables
            summary['tables_accessed'].add(access.table_name)
        
        # Convert set to list for JSON serialization
        summary['tables_accessed'] = list(summary['tables_accessed'])
        
        report.summary = summary
        report.regulatory_framework = 'GDPR'
        report.save()
    
    def _generate_security_report(self, report: ComplianceReport):
        """Generate security incident report"""
        security_events = SecurityEvent.objects.filter(
            timestamp__range=[report.period_start, report.period_end]
        )
        
        summary = {
            'total_incidents': security_events.count(),
            'threat_levels': {},
            'categories': {},
            'blocked_attacks': security_events.filter(blocked=True).count(),
            'unique_ips': set(),
        }
        
        # Aggregate data
        for event in security_events:
            # Count by threat level
            threat_level = event.threat_level
            summary['threat_levels'][threat_level] = \
                summary['threat_levels'].get(threat_level, 0) + 1
            
            # Count by category
            category = event.category
            summary['categories'][category] = \
                summary['categories'].get(category, 0) + 1
            
            # Track IPs
            summary['unique_ips'].add(str(event.ip_address))
        
        # Convert set to list
        summary['unique_ips'] = list(summary['unique_ips'])
        
        report.summary = summary
        report.save()
    
    def _generate_financial_report(self, report: ComplianceReport):
        """Generate financial activity report"""
        financial_events = AuditEvent.objects.filter(
            timestamp__range=[report.period_start, report.period_end],
            event_type__in=[
                AuditEvent.EventType.TRADE_EXECUTED,
                AuditEvent.EventType.PAYMENT_PROCESSED,
                AuditEvent.EventType.SIGNAL_EXECUTED
            ]
        )
        
        summary = {
            'total_transactions': financial_events.count(),
            'total_amount': 0,
            'transaction_types': {},
            'currency_breakdown': {},
        }
        
        # Aggregate financial data
        for event in financial_events:
            # Count by type
            event_type = event.event_type
            summary['transaction_types'][event_type] = \
                summary['transaction_types'].get(event_type, 0) + 1
            
            # Sum amounts
            if event.amount:
                summary['total_amount'] += float(event.amount)
                currency = event.currency
                summary['currency_breakdown'][currency] = \
                    summary['currency_breakdown'].get(currency, 0) + float(event.amount)
        
        report.summary = summary
        report.regulatory_framework = 'FINANCIAL_REGULATIONS'
        report.save()
    
    def _generate_user_activity_report(self, report: ComplianceReport):
        """Generate user activity report"""
        user_events = AuditEvent.objects.filter(
            timestamp__range=[report.period_start, report.period_end],
            user__isnull=False
        )
        
        summary = {
            'total_events': user_events.count(),
            'unique_users': user_events.values('user').distinct().count(),
            'event_types': {},
            'most_active_users': {},
        }
        
        # Aggregate user activity
        for event in user_events:
            # Count by event type
            event_type = event.event_type
            summary['event_types'][event_type] = \
                summary['event_types'].get(event_type, 0) + 1
            
            # Track most active users
            user_id = str(event.user.id)
            summary['most_active_users'][user_id] = \
                summary['most_active_users'].get(user_id, 0) + 1
        
        report.summary = summary
        report.save()


# Global instances
audit_logger = AuditLogger()
compliance_service = ComplianceService()


# Convenience functions
def log_audit_event(*args, **kwargs):
    """Log an audit event"""
    return audit_logger.log_event(*args, **kwargs)


def log_security_event(*args, **kwargs):
    """Log a security event"""
    return audit_logger.log_security_event(*args, **kwargs)


def log_data_access(*args, **kwargs):
    """Log data access"""
    return audit_logger.log_data_access(*args, **kwargs)