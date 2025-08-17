"""
Audit Trail API Views
"""

from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import AuditEvent, DataAccessLog, SecurityEvent, ComplianceReport, AuditConfiguration
from .serializers import (
    AuditEventSerializer, AuditEventCreateSerializer, DataAccessLogSerializer,
    SecurityEventSerializer, ComplianceReportSerializer, ComplianceReportCreateSerializer,
    AuditConfigurationSerializer, AuditSummarySerializer, SecurityDashboardSerializer,
    ComplianceDashboardSerializer
)
from .services import audit_logger, compliance_service

User = get_user_model()


class AuditPagination(PageNumberPagination):
    """Custom pagination for audit logs"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000


class AuditEventViewSet(viewsets.ModelViewSet):
    """ViewSet for audit events"""
    
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AuditEventCreateSerializer
        return AuditEventSerializer
    
    def get_queryset(self):
        queryset = AuditEvent.objects.select_related('user').all()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address')
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)
        
        return queryset.order_by('-timestamp')
    
    def perform_create(self, serializer):
        # Auto-set user if not provided
        if not serializer.validated_data.get('user'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get audit summary statistics"""
        
        # Date range (default to last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        
        # Base queryset
        events = AuditEvent.objects.filter(
            timestamp__range=[start_date, end_date]
        )
        
        # Calculate statistics
        total_events = events.count()
        
        events_by_type = dict(
            events.values('event_type')
            .annotate(count=Count('id'))
            .values_list('event_type', 'count')
        )
        
        events_by_severity = dict(
            events.values('severity')
            .annotate(count=Count('id'))
            .values_list('severity', 'count')
        )
        
        events_by_status = dict(
            events.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        
        security_events_count = SecurityEvent.objects.filter(
            timestamp__range=[start_date, end_date]
        ).count()
        
        high_severity_events = events.filter(
            severity__in=['HIGH', 'CRITICAL']
        ).count()
        
        failed_events = events.filter(
            status__in=['FAILURE', 'ERROR']
        ).count()
        
        unique_users = events.filter(user__isnull=False).values('user').distinct().count()
        
        summary_data = {
            'total_events': total_events,
            'events_by_type': events_by_type,
            'events_by_severity': events_by_severity,
            'events_by_status': events_by_status,
            'security_events_count': security_events_count,
            'high_severity_events': high_severity_events,
            'failed_events': failed_events,
            'unique_users': unique_users,
            'period_start': start_date,
            'period_end': end_date,
        }
        
        serializer = AuditSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent audit events"""
        
        limit = int(request.query_params.get('limit', 20))
        recent_events = self.get_queryset()[:limit]
        
        serializer = self.get_serializer(recent_events, many=True)
        return Response(serializer.data)


class DataAccessLogViewSet(viewsets.ModelViewSet):
    """ViewSet for data access logs"""
    
    queryset = DataAccessLog.objects.all()
    serializer_class = DataAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditPagination
    
    def get_queryset(self):
        queryset = DataAccessLog.objects.select_related('user').all()
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by table
        table_name = self.request.query_params.get('table_name')
        if table_name:
            queryset = queryset.filter(table_name__icontains=table_name)
        
        # Filter by access type
        access_type = self.request.query_params.get('access_type')
        if access_type:
            queryset = queryset.filter(access_type=access_type)
        
        # Filter by data classification
        data_classification = self.request.query_params.get('data_classification')
        if data_classification:
            queryset = queryset.filter(data_classification=data_classification)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset.order_by('-timestamp')


class SecurityEventViewSet(viewsets.ModelViewSet):
    """ViewSet for security events"""
    
    queryset = SecurityEvent.objects.all()
    serializer_class = SecurityEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditPagination
    
    def get_queryset(self):
        queryset = SecurityEvent.objects.select_related('user', 'audit_event').all()
        
        # Filter by threat level
        threat_level = self.request.query_params.get('threat_level')
        if threat_level:
            queryset = queryset.filter(threat_level=threat_level)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by blocked status
        blocked = self.request.query_params.get('blocked')
        if blocked is not None:
            queryset = queryset.filter(blocked=blocked.lower() == 'true')
        
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address')
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get security dashboard data"""
        
        # Date range (default to last 7 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        
        # Base queryset
        incidents = SecurityEvent.objects.filter(
            timestamp__range=[start_date, end_date]
        )
        
        total_incidents = incidents.count()
        
        incidents_by_threat_level = dict(
            incidents.values('threat_level')
            .annotate(count=Count('id'))
            .values_list('threat_level', 'count')
        )
        
        incidents_by_category = dict(
            incidents.values('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        
        blocked_attacks = incidents.filter(blocked=True).count()
        unique_attackers = incidents.values('ip_address').distinct().count()
        
        recent_incidents = incidents.order_by('-timestamp')[:10]
        
        top_attack_vectors = dict(
            incidents.exclude(attack_vector='')
            .values('attack_vector')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
            .values_list('attack_vector', 'count')
        )
        
        # Mock geographic distribution (in real implementation, use IP geolocation)
        geographic_distribution = {'US': 45, 'CN': 23, 'RU': 15, 'IN': 12, 'OTHER': 5}
        
        dashboard_data = {
            'total_incidents': total_incidents,
            'incidents_by_threat_level': incidents_by_threat_level,
            'incidents_by_category': incidents_by_category,
            'blocked_attacks': blocked_attacks,
            'unique_attackers': unique_attackers,
            'recent_incidents': recent_incidents,
            'top_attack_vectors': top_attack_vectors,
            'geographic_distribution': geographic_distribution,
        }
        
        serializer = SecurityDashboardSerializer(dashboard_data)
        return Response(serializer.data)


class ComplianceReportViewSet(viewsets.ModelViewSet):
    """ViewSet for compliance reports"""
    
    queryset = ComplianceReport.objects.all()
    serializer_class = ComplianceReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ComplianceReportCreateSerializer
        return ComplianceReportSerializer
    
    def get_queryset(self):
        queryset = ComplianceReport.objects.select_related('generated_by').all()
        
        # Filter by report type
        report_type = self.request.query_params.get('report_type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by regulatory framework
        framework = self.request.query_params.get('framework')
        if framework:
            queryset = queryset.filter(regulatory_framework__icontains=framework)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create a new compliance report"""
        
        try:
            # Generate the report
            report = compliance_service.generate_compliance_report(
                report_type=serializer.validated_data['report_type'],
                period_start=serializer.validated_data['period_start'],
                period_end=serializer.validated_data['period_end'],
                generated_by=self.request.user,
                title=serializer.validated_data.get('title', ''),
                description=serializer.validated_data.get('description', '')
            )
            
            # Return the created report
            serializer = ComplianceReportSerializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get compliance dashboard data"""
        
        # Date range (default to last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Reports
        pending_reports = ComplianceReport.objects.filter(
            status='PENDING'
        ).count()
        
        overdue_reports = ComplianceReport.objects.filter(
            submission_deadline__lt=timezone.now(),
            status__in=['PENDING', 'GENERATED']
        ).count()
        
        # Data access metrics
        data_access_count = DataAccessLog.objects.filter(
            timestamp__range=[start_date, end_date]
        ).count()
        
        data_export_count = DataAccessLog.objects.filter(
            timestamp__range=[start_date, end_date],
            access_type='EXPORT'
        ).count()
        
        gdpr_requests = DataAccessLog.objects.filter(
            timestamp__range=[start_date, end_date],
            gdpr_lawful_basis__isnull=False
        ).count()
        
        # Financial transactions
        financial_transactions = AuditEvent.objects.filter(
            timestamp__range=[start_date, end_date],
            event_type__in=[
                'TRADE_EXECUTED', 'PAYMENT_PROCESSED', 'SIGNAL_EXECUTED'
            ]
        ).count()
        
        # Compliance score (mock calculation)
        total_events = AuditEvent.objects.filter(
            timestamp__range=[start_date, end_date]
        ).count()
        
        compliant_events = AuditEvent.objects.filter(
            timestamp__range=[start_date, end_date],
            status='SUCCESS'
        ).count()
        
        compliance_score = (compliant_events / max(total_events, 1)) * 100
        
        recent_reports = ComplianceReport.objects.order_by('-created_at')[:5]
        
        dashboard_data = {
            'pending_reports': pending_reports,
            'overdue_reports': overdue_reports,
            'data_access_count': data_access_count,
            'data_export_count': data_export_count,
            'gdpr_requests': gdpr_requests,
            'financial_transactions': financial_transactions,
            'compliance_score': round(compliance_score, 2),
            'recent_reports': recent_reports,
        }
        
        serializer = ComplianceDashboardSerializer(dashboard_data)
        return Response(serializer.data)


class AuditConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for audit configuration"""
    
    queryset = AuditConfiguration.objects.all()
    serializer_class = AuditConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditConfiguration.objects.all()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by enabled status
        enabled = self.request.query_params.get('enabled')
        if enabled is not None:
            queryset = queryset.filter(enabled=enabled.lower() == 'true')
        
        return queryset.order_by('event_type')