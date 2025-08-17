"""
Audit Trail URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuditEventViewSet, DataAccessLogViewSet, SecurityEventViewSet,
    ComplianceReportViewSet, AuditConfigurationViewSet
)

app_name = 'audit'

# Create router for ViewSets
router = DefaultRouter()
router.register(r'events', AuditEventViewSet, basename='auditevent')
router.register(r'data-access', DataAccessLogViewSet, basename='dataaccesslog')
router.register(r'security', SecurityEventViewSet, basename='securityevent')
router.register(r'compliance', ComplianceReportViewSet, basename='compliancereport')
router.register(r'configuration', AuditConfigurationViewSet, basename='auditconfiguration')

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # Additional specific endpoints can be added here
    # path('api/export/', views.export_audit_data, name='export_audit_data'),
    # path('api/health/', views.audit_health_check, name='audit_health_check'),
]