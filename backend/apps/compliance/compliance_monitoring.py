"""
Compliance Monitoring System for SEBI Compliance
Real-time monitoring and alerting for regulatory compliance
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, time
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count, Avg
from django.conf import settings
from django.core.cache import cache
import json

from .models import (
    ComplianceChecklist, TradingAlert, AuditTrail, 
    InvestorProfile, KYCDocument, RiskManagement,
    RegulatoryReporting, SEBICompliance
)
from .kyc_system import ComplianceChecker
from .risk_management import RiskController
from .regulatory_reporting import ReportManager
from .investor_protection import GrievanceManager

User = get_user_model()
logger = logging.getLogger(__name__)


class ComplianceMonitor:
    """Real-time compliance monitoring system"""
    
    def __init__(self):
        self.compliance_checker = ComplianceChecker()
        self.risk_controller = RiskController()
        self.report_manager = ReportManager()
        self.grievance_manager = GrievanceManager()
        
        # Monitoring thresholds
        self.thresholds = {
            'kyc_completion_rate': 95.0,
            'alert_resolution_time_hours': 24,
            'grievance_resolution_rate': 90.0,
            'risk_score_threshold': 80,
            'daily_trade_volume_limit': Decimal('10000000'),  # ₹1 Crore
            'unusual_activity_threshold': 10  # alerts per day per user
        }
    
    def run_compliance_checks(self) -> Dict[str, Any]:
        """Run comprehensive compliance checks"""
        try:
            check_results = {
                'timestamp': timezone.now().isoformat(),
                'overall_status': 'COMPLIANT',
                'checks_performed': [],
                'issues_found': [],
                'warnings': [],
                'recommendations': [],
                'compliance_score': 100
            }
            
            # 1. KYC Compliance Check
            kyc_result = self._check_kyc_compliance()
            check_results['checks_performed'].append('KYC Compliance')
            
            if kyc_result['status'] != 'COMPLIANT':
                check_results['overall_status'] = 'NON_COMPLIANT'
                check_results['issues_found'].extend(kyc_result['issues'])
                check_results['compliance_score'] -= kyc_result['penalty']
            
            check_results['warnings'].extend(kyc_result.get('warnings', []))
            
            # 2. Risk Management Check
            risk_result = self._check_risk_management_compliance()
            check_results['checks_performed'].append('Risk Management')
            
            if risk_result['status'] != 'COMPLIANT':
                if check_results['overall_status'] == 'COMPLIANT':
                    check_results['overall_status'] = 'UNDER_REVIEW'
                check_results['issues_found'].extend(risk_result['issues'])
                check_results['compliance_score'] -= risk_result['penalty']
            
            check_results['warnings'].extend(risk_result.get('warnings', []))
            
            # 3. Trading Activity Monitoring
            trading_result = self._check_trading_compliance()
            check_results['checks_performed'].append('Trading Activity')
            
            if trading_result['status'] != 'COMPLIANT':
                if check_results['overall_status'] == 'COMPLIANT':
                    check_results['overall_status'] = 'UNDER_REVIEW'
                check_results['issues_found'].extend(trading_result['issues'])
                check_results['compliance_score'] -= trading_result['penalty']
            
            # 4. Alert Management Check
            alert_result = self._check_alert_management()
            check_results['checks_performed'].append('Alert Management')
            
            if alert_result['status'] != 'COMPLIANT':
                check_results['warnings'].extend(alert_result['issues'])
                check_results['compliance_score'] -= alert_result['penalty']
            
            # 5. Regulatory Reporting Check
            reporting_result = self._check_regulatory_reporting()
            check_results['checks_performed'].append('Regulatory Reporting')
            
            if reporting_result['status'] != 'COMPLIANT':
                if check_results['overall_status'] == 'COMPLIANT':
                    check_results['overall_status'] = 'NON_COMPLIANT'
                check_results['issues_found'].extend(reporting_result['issues'])
                check_results['compliance_score'] -= reporting_result['penalty']
            
            # 6. Data Retention Check
            retention_result = self._check_data_retention_compliance()
            check_results['checks_performed'].append('Data Retention')
            
            if retention_result['status'] != 'COMPLIANT':
                check_results['warnings'].extend(retention_result['issues'])
                check_results['compliance_score'] -= retention_result['penalty']
            
            # Generate recommendations
            check_results['recommendations'] = self._generate_compliance_recommendations(check_results)
            
            # Cache results for dashboard
            cache.set('compliance_status', check_results, 3600)  # 1 hour
            
            # Update SEBI compliance status
            self._update_sebi_compliance_status(check_results)
            
            return check_results
            
        except Exception as e:
            logger.error(f"Compliance monitoring failed: {str(e)}")
            return {
                'timestamp': timezone.now().isoformat(),
                'overall_status': 'ERROR',
                'error': f'Compliance monitoring failed: {str(e)}'
            }
    
    def _check_kyc_compliance(self) -> Dict[str, Any]:
        """Check KYC compliance status"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            # Check overall KYC completion rate
            total_profiles = InvestorProfile.objects.count()
            verified_profiles = InvestorProfile.objects.filter(
                kyc_status=KYCDocument.VerificationStatus.VERIFIED
            ).count()
            
            if total_profiles > 0:
                completion_rate = (verified_profiles / total_profiles) * 100
                
                if completion_rate < self.thresholds['kyc_completion_rate']:
                    result['status'] = 'NON_COMPLIANT'
                    result['issues'].append(
                        f'KYC completion rate ({completion_rate:.1f}%) below required {self.thresholds["kyc_completion_rate"]}%'
                    )
                    result['penalty'] = (self.thresholds['kyc_completion_rate'] - completion_rate) * 0.5
            
            # Check expired documents
            expired_docs = KYCDocument.objects.filter(
                expiry_date__lt=timezone.now(),
                verification_status=KYCDocument.VerificationStatus.VERIFIED
            )
            
            if expired_docs.exists():
                count = expired_docs.count()
                result['warnings'].append(f'{count} KYC documents have expired')
                result['penalty'] += min(count * 2, 20)
            
            # Check pending verifications over 7 days
            old_pending = KYCDocument.objects.filter(
                verification_status=KYCDocument.VerificationStatus.PENDING,
                created_at__lt=timezone.now() - timedelta(days=7)
            )
            
            if old_pending.exists():
                count = old_pending.count()
                result['warnings'].append(f'{count} KYC documents pending verification for over 7 days')
                result['penalty'] += min(count * 1, 10)
            
            # Check profiles without mandatory information
            incomplete_profiles = InvestorProfile.objects.filter(
                Q(pan_number__isnull=True) | Q(pan_number='') |
                Q(mobile_number__isnull=True) | Q(mobile_number='') |
                Q(address_line1__isnull=True) | Q(address_line1='') |
                Q(annual_income__isnull=True) | Q(annual_income='') |
                Q(risk_profile__isnull=True) | Q(risk_profile='')
            )
            
            if incomplete_profiles.exists():
                count = incomplete_profiles.count()
                result['warnings'].append(f'{count} investor profiles incomplete')
                result['penalty'] += min(count * 1, 15)
            
            return result
            
        except Exception as e:
            logger.error(f"KYC compliance check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'KYC check failed: {str(e)}'],
                'penalty': 50
            }
    
    def _check_risk_management_compliance(self) -> Dict[str, Any]:
        """Check risk management compliance"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            # Check users without risk management settings
            total_users = InvestorProfile.objects.count()
            users_with_risk_mgmt = RiskManagement.objects.count()
            
            if users_with_risk_mgmt < total_users:
                missing = total_users - users_with_risk_mgmt
                result['warnings'].append(f'{missing} users without risk management settings')
                result['penalty'] += min(missing * 0.5, 10)
            
            # Check recent limit breaches
            recent_breaches = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.POSITION_LIMIT,
                triggered_at__gte=timezone.now() - timedelta(days=7),
                status=TradingAlert.AlertStatus.ACTIVE
            )
            
            if recent_breaches.count() > total_users * 0.05:  # More than 5% users
                result['warnings'].append(f'High number of position limit breaches: {recent_breaches.count()}')
                result['penalty'] += 15
            
            # Check circuit breaker triggers
            cb_triggers = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.CIRCUIT_BREAKER,
                triggered_at__gte=timezone.now() - timedelta(days=30)
            )
            
            if cb_triggers.count() > total_users * 0.01:  # More than 1% users
                result['warnings'].append(f'High circuit breaker activity: {cb_triggers.count()} triggers')
                result['penalty'] += 20
            
            # Check unresolved high-risk alerts
            high_risk_alerts = TradingAlert.objects.filter(
                severity__in=['HIGH', 'CRITICAL'],
                status=TradingAlert.AlertStatus.ACTIVE,
                triggered_at__lt=timezone.now() - timedelta(hours=24)
            )
            
            if high_risk_alerts.exists():
                count = high_risk_alerts.count()
                result['issues'].append(f'{count} high-risk alerts unresolved for over 24 hours')
                result['status'] = 'NON_COMPLIANT'
                result['penalty'] += count * 5
            
            return result
            
        except Exception as e:
            logger.error(f"Risk management compliance check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'Risk management check failed: {str(e)}'],
                'penalty': 30
            }
    
    def _check_trading_compliance(self) -> Dict[str, Any]:
        """Check trading activity compliance"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            today = timezone.now().date()
            
            # Check daily trading volume
            daily_trades = AuditTrail.objects.filter(
                action_type=AuditTrail.ActionType.TRADE_EXECUTION,
                timestamp__date=today
            )
            
            # Estimate daily volume (mock calculation)
            estimated_volume = daily_trades.count() * Decimal('50000')  # Avg trade size
            
            if estimated_volume > self.thresholds['daily_trade_volume_limit']:
                result['warnings'].append(
                    f'High daily trading volume: ₹{estimated_volume:,.2f}'
                )
                result['penalty'] += 5
            
            # Check unusual activity patterns
            unusual_users = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.UNUSUAL_ACTIVITY,
                triggered_at__date=today
            ).values('user').annotate(
                alert_count=Count('id')
            ).filter(
                alert_count__gte=self.thresholds['unusual_activity_threshold']
            )
            
            if unusual_users.exists():
                count = unusual_users.count()
                result['warnings'].append(f'{count} users with unusual activity patterns')
                result['penalty'] += min(count * 2, 15)
            
            # Check unauthorized trading alerts
            unauthorized_alerts = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.REGULATORY,
                triggered_at__gte=timezone.now() - timedelta(days=7),
                description__icontains='unauthorized'
            )
            
            if unauthorized_alerts.exists():
                count = unauthorized_alerts.count()
                result['issues'].append(f'{count} potential unauthorized trading alerts')
                result['status'] = 'NON_COMPLIANT'
                result['penalty'] += count * 10
            
            # Check rapid trading alerts
            rapid_trading = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.RAPID_TRADING,
                triggered_at__date=today
            ).count()
            
            if rapid_trading > 10:
                result['warnings'].append(f'High rapid trading activity: {rapid_trading} alerts')
                result['penalty'] += 5
            
            return result
            
        except Exception as e:
            logger.error(f"Trading compliance check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'Trading compliance check failed: {str(e)}'],
                'penalty': 25
            }
    
    def _check_alert_management(self) -> Dict[str, Any]:
        """Check alert management compliance"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            # Check unresolved alerts
            old_alerts = TradingAlert.objects.filter(
                status=TradingAlert.AlertStatus.ACTIVE,
                triggered_at__lt=timezone.now() - timedelta(hours=self.thresholds['alert_resolution_time_hours'])
            )
            
            if old_alerts.exists():
                count = old_alerts.count()
                result['issues'].append(f'{count} alerts unresolved beyond {self.thresholds["alert_resolution_time_hours"]} hours')
                result['penalty'] += min(count * 2, 20)
            
            # Check alert resolution rate
            last_week = timezone.now() - timedelta(days=7)
            week_alerts = TradingAlert.objects.filter(triggered_at__gte=last_week)
            resolved_alerts = week_alerts.filter(status=TradingAlert.AlertStatus.RESOLVED)
            
            if week_alerts.count() > 0:
                resolution_rate = (resolved_alerts.count() / week_alerts.count()) * 100
                
                if resolution_rate < 80:
                    result['warnings'].append(f'Low alert resolution rate: {resolution_rate:.1f}%')
                    result['penalty'] += (80 - resolution_rate) * 0.5
            
            # Check high-severity alert response time
            critical_alerts = TradingAlert.objects.filter(
                severity='CRITICAL',
                triggered_at__gte=timezone.now() - timedelta(days=1),
                status=TradingAlert.AlertStatus.ACTIVE
            )
            
            for alert in critical_alerts:
                hours_open = (timezone.now() - alert.triggered_at).total_seconds() / 3600
                if hours_open > 4:  # Critical alerts should be addressed within 4 hours
                    result['issues'].append(f'Critical alert {alert.id} open for {hours_open:.1f} hours')
                    result['penalty'] += 10
            
            return result
            
        except Exception as e:
            logger.error(f"Alert management check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'Alert management check failed: {str(e)}'],
                'penalty': 20
            }
    
    def _check_regulatory_reporting(self) -> Dict[str, Any]:
        """Check regulatory reporting compliance"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            today = timezone.now().date()
            
            # Check if daily report was generated for yesterday
            yesterday = today - timedelta(days=1)
            daily_report_exists = RegulatoryReporting.objects.filter(
                report_type=RegulatoryReporting.ReportType.DAILY_TRADES,
                report_period_start__date=yesterday
            ).exists()
            
            if not daily_report_exists and yesterday.weekday() < 5:  # Weekday
                result['issues'].append(f'Daily trading report missing for {yesterday}')
                result['penalty'] += 15
                result['status'] = 'NON_COMPLIANT'
            
            # Check monthly reports for last month if it's after 5th of current month
            if today.day > 5:
                last_month = today.replace(day=1) - timedelta(days=1)
                monthly_report_exists = RegulatoryReporting.objects.filter(
                    report_type=RegulatoryReporting.ReportType.MONTHLY_CLIENT,
                    report_period_start__year=last_month.year,
                    report_period_start__month=last_month.month
                ).exists()
                
                if not monthly_report_exists:
                    result['warnings'].append(f'Monthly report missing for {last_month.strftime("%Y-%m")}')
                    result['penalty'] += 10
            
            # Check for overdue reports
            overdue_reports = RegulatoryReporting.objects.filter(
                status=RegulatoryReporting.ReportStatus.DRAFT,
                created_at__lt=timezone.now() - timedelta(days=7)
            )
            
            if overdue_reports.exists():
                count = overdue_reports.count()
                result['warnings'].append(f'{count} reports overdue for submission')
                result['penalty'] += count * 5
            
            # Check STR reports for high-severity alerts
            high_severity_alerts = TradingAlert.objects.filter(
                severity__in=['HIGH', 'CRITICAL'],
                triggered_at__gte=timezone.now() - timedelta(days=30),
                alert_type=TradingAlert.AlertType.UNUSUAL_ACTIVITY
            )
            
            if high_severity_alerts.count() > 5:  # More than 5 in a month
                str_report_exists = RegulatoryReporting.objects.filter(
                    report_type=RegulatoryReporting.ReportType.AML_REPORT,
                    created_at__gte=timezone.now() - timedelta(days=30)
                ).exists()
                
                if not str_report_exists:
                    result['warnings'].append('STR report may be required due to high-severity alerts')
                    result['penalty'] += 20
            
            return result
            
        except Exception as e:
            logger.error(f"Regulatory reporting check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'Regulatory reporting check failed: {str(e)}'],
                'penalty': 30
            }
    
    def _check_data_retention_compliance(self) -> Dict[str, Any]:
        """Check data retention policy compliance"""
        try:
            result = {
                'status': 'COMPLIANT',
                'issues': [],
                'warnings': [],
                'penalty': 0
            }
            
            # SEBI requires 8 years of data retention for most records
            retention_cutoff = timezone.now() - timedelta(days=8*365)
            
            # Check audit trail retention
            old_audit_records = AuditTrail.objects.filter(
                timestamp__lt=retention_cutoff
            ).count()
            
            if old_audit_records > 1000:  # Threshold for cleanup
                result['warnings'].append(f'{old_audit_records} audit records older than 8 years - consider archival')
                result['penalty'] += 5
            
            # Check if recent data is being captured
            recent_audit_count = AuditTrail.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=1)
            ).count()
            
            if recent_audit_count == 0:
                result['issues'].append('No audit trail entries in last 24 hours - check logging')
                result['penalty'] += 15
            
            # Check KYC document retention
            old_kyc_docs = KYCDocument.objects.filter(
                created_at__lt=retention_cutoff,
                verification_status=KYCDocument.VerificationStatus.REJECTED
            ).count()
            
            if old_kyc_docs > 100:
                result['warnings'].append(f'{old_kyc_docs} old KYC documents may need archival')
                result['penalty'] += 3
            
            # Check for missing backup verification
            # This would integrate with your backup system
            last_backup_check = cache.get('last_backup_verification')
            if not last_backup_check:
                result['warnings'].append('Backup verification status unknown')
                result['penalty'] += 5
            
            return result
            
        except Exception as e:
            logger.error(f"Data retention check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'issues': [f'Data retention check failed: {str(e)}'],
                'penalty': 10
            }
    
    def _generate_compliance_recommendations(self, check_results: Dict[str, Any]) -> List[str]:
        """Generate compliance recommendations based on check results"""
        recommendations = []
        
        if check_results['compliance_score'] < 70:
            recommendations.append('URGENT: Compliance score below 70% - immediate action required')
        
        for issue in check_results['issues_found']:
            if 'KYC' in issue:
                recommendations.append('Accelerate KYC verification process and follow up on pending documents')
            elif 'alert' in issue.lower():
                recommendations.append('Improve alert resolution processes and assign dedicated compliance staff')
            elif 'report' in issue.lower():
                recommendations.append('Implement automated regulatory reporting to ensure timely submissions')
            elif 'unauthorized' in issue.lower():
                recommendations.append('Investigate unauthorized trading patterns and strengthen access controls')
        
        if len(check_results['warnings']) > 10:
            recommendations.append('Review compliance processes - high number of warnings detected')
        
        if check_results['overall_status'] == 'NON_COMPLIANT':
            recommendations.append('Schedule immediate compliance review meeting with senior management')
            recommendations.append('Consider engaging external compliance consultant for remediation')
        
        if not recommendations:
            recommendations.append('Maintain current compliance standards - all checks passed')
        
        return recommendations
    
    def _update_sebi_compliance_status(self, check_results: Dict[str, Any]):
        """Update SEBI compliance status in database"""
        try:
            sebi_compliance, created = SEBICompliance.objects.get_or_create(
                platform_name="ShareWise AI",
                defaults={
                    'license_type': 'Investment Adviser',
                    'compliance_officer': 'System Administrator'
                }
            )
            
            # Map check results to SEBI status
            if check_results['overall_status'] == 'COMPLIANT' and check_results['compliance_score'] >= 90:
                sebi_status = SEBICompliance.ComplianceStatus.COMPLIANT
            elif check_results['overall_status'] == 'NON_COMPLIANT' or check_results['compliance_score'] < 60:
                sebi_status = SEBICompliance.ComplianceStatus.NON_COMPLIANT
            else:
                sebi_status = SEBICompliance.ComplianceStatus.UNDER_REVIEW
            
            sebi_compliance.status = sebi_status
            sebi_compliance.last_audit_date = timezone.now()
            sebi_compliance.save()
            
        except Exception as e:
            logger.error(f"SEBI compliance status update failed: {str(e)}")
    
    def create_daily_checklist(self, date: Optional[datetime] = None) -> Dict[str, Any]:
        """Create and populate daily compliance checklist"""
        try:
            if not date:
                date = timezone.now().date()
            
            checklist, created = ComplianceChecklist.objects.get_or_create(
                date=date,
                defaults={}
            )
            
            # Run automated checks
            compliance_results = self.run_compliance_checks()
            
            # Update checklist based on results
            checklist.kyc_verification_completed = 'KYC' not in str(compliance_results.get('issues_found', []))
            checklist.risk_limits_monitored = 'risk' not in str(compliance_results.get('issues_found', [])).lower()
            checklist.unusual_activity_checked = True  # Automated check
            checklist.system_alerts_reviewed = len(compliance_results.get('issues_found', [])) == 0
            
            # Check if reports were generated
            daily_reports_exist = RegulatoryReporting.objects.filter(
                report_period_start__date=date,
                status__in=[
                    RegulatoryReporting.ReportStatus.GENERATED,
                    RegulatoryReporting.ReportStatus.SUBMITTED
                ]
            ).exists()
            
            checklist.daily_reports_generated = daily_reports_exist
            
            # Check data backup (placeholder - integrate with backup system)
            checklist.client_data_backed_up = True
            checklist.audit_logs_generated = True
            checklist.trade_data_verified = True
            
            # Check regulatory updates (placeholder)
            checklist.regulatory_updates_reviewed = True
            
            # Check grievances
            pending_grievances = self.grievance_manager.get_grievance_statistics(
                datetime.combine(date, datetime.min.time()),
                datetime.combine(date, datetime.max.time())
            )
            
            checklist.client_complaints_addressed = pending_grievances.get('status') == 'success'
            
            checklist.save()
            
            return {
                'status': 'success',
                'checklist_id': checklist.id,
                'completion_percentage': self._calculate_checklist_completion(checklist),
                'compliance_score': compliance_results.get('compliance_score', 100),
                'created': created
            }
            
        except Exception as e:
            logger.error(f"Daily checklist creation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Checklist creation failed: {str(e)}'
            }
    
    def _calculate_checklist_completion(self, checklist: ComplianceChecklist) -> float:
        """Calculate checklist completion percentage"""
        total_items = 11  # Total number of checklist items
        completed_items = sum([
            checklist.kyc_verification_completed,
            checklist.risk_limits_monitored,
            checklist.unusual_activity_checked,
            checklist.system_alerts_reviewed,
            checklist.client_complaints_addressed,
            checklist.regulatory_updates_reviewed,
            checklist.trade_data_verified,
            checklist.client_data_backed_up,
            checklist.audit_logs_generated,
            checklist.daily_reports_generated,
            checklist.exception_reports_reviewed
        ])
        
        return (completed_items / total_items) * 100
    
    def get_compliance_dashboard_data(self) -> Dict[str, Any]:
        """Get compliance dashboard summary data"""
        try:
            # Get cached compliance status
            compliance_status = cache.get('compliance_status', {})
            
            # Get today's checklist
            today_checklist = ComplianceChecklist.objects.filter(
                date=timezone.now().date()
            ).first()
            
            # Recent alerts summary
            recent_alerts = TradingAlert.objects.filter(
                triggered_at__gte=timezone.now() - timedelta(days=7)
            )
            
            alert_summary = {
                'total': recent_alerts.count(),
                'active': recent_alerts.filter(status=TradingAlert.AlertStatus.ACTIVE).count(),
                'critical': recent_alerts.filter(severity='CRITICAL').count(),
                'high': recent_alerts.filter(severity='HIGH').count()
            }
            
            # KYC summary
            kyc_summary = {
                'total_profiles': InvestorProfile.objects.count(),
                'verified': InvestorProfile.objects.filter(
                    kyc_status=KYCDocument.VerificationStatus.VERIFIED
                ).count(),
                'pending': InvestorProfile.objects.filter(
                    kyc_status=KYCDocument.VerificationStatus.PENDING
                ).count(),
                'expired': KYCDocument.objects.filter(
                    expiry_date__lt=timezone.now(),
                    verification_status=KYCDocument.VerificationStatus.VERIFIED
                ).count()
            }
            
            if kyc_summary['total_profiles'] > 0:
                kyc_summary['completion_rate'] = (
                    kyc_summary['verified'] / kyc_summary['total_profiles']
                ) * 100
            else:
                kyc_summary['completion_rate'] = 0
            
            # Recent reports summary
            recent_reports = RegulatoryReporting.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            )
            
            reports_summary = {
                'total': recent_reports.count(),
                'submitted': recent_reports.filter(
                    status=RegulatoryReporting.ReportStatus.SUBMITTED
                ).count(),
                'pending': recent_reports.filter(
                    status__in=[
                        RegulatoryReporting.ReportStatus.DRAFT,
                        RegulatoryReporting.ReportStatus.GENERATED
                    ]
                ).count()
            }
            
            dashboard_data = {
                'timestamp': timezone.now().isoformat(),
                'overall_compliance': {
                    'status': compliance_status.get('overall_status', 'UNKNOWN'),
                    'score': compliance_status.get('compliance_score', 0),
                    'last_check': compliance_status.get('timestamp')
                },
                'daily_checklist': {
                    'exists': today_checklist is not None,
                    'completion_percentage': self._calculate_checklist_completion(today_checklist) if today_checklist else 0,
                    'signed_off': today_checklist.compliance_officer_signoff if today_checklist else False
                },
                'alerts': alert_summary,
                'kyc_status': kyc_summary,
                'reports': reports_summary,
                'quick_stats': {
                    'active_investors': InvestorProfile.objects.count(),
                    'recent_trades': AuditTrail.objects.filter(
                        action_type=AuditTrail.ActionType.TRADE_ORDER,
                        timestamp__gte=timezone.now() - timedelta(days=1)
                    ).count(),
                    'pending_grievances': InvestorGrievance.objects.filter(
                        status__in=[
                            InvestorGrievance.GrievanceStatus.OPEN,
                            InvestorGrievance.GrievanceStatus.IN_PROGRESS
                        ]
                    ).count()
                }
            }
            
            return {
                'status': 'success',
                'dashboard_data': dashboard_data
            }
            
        except Exception as e:
            logger.error(f"Dashboard data generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Dashboard data generation failed: {str(e)}'
            }
    
    def schedule_compliance_tasks(self):
        """Schedule automated compliance tasks"""
        try:
            # This would be called by a scheduled task runner (celery, cron, etc.)
            
            # Run daily compliance checks
            compliance_results = self.run_compliance_checks()
            
            # Create daily checklist
            checklist_results = self.create_daily_checklist()
            
            # Generate periodic reports
            self.report_manager.schedule_periodic_reports()
            
            # Check for grievances needing attention
            overdue_grievances = InvestorGrievance.objects.filter(
                expected_resolution_date__lt=timezone.now(),
                status__in=[
                    InvestorGrievance.GrievanceStatus.OPEN,
                    InvestorGrievance.GrievanceStatus.IN_PROGRESS
                ]
            )
            
            for grievance in overdue_grievances:
                TradingAlert.objects.get_or_create(
                    user=grievance.complainant,
                    alert_type=TradingAlert.AlertType.REGULATORY,
                    title='Overdue Grievance',
                    description=f'Grievance "{grievance.subject}" is overdue for resolution',
                    defaults={
                        'severity': 'HIGH'
                    }
                )
            
            logger.info("Scheduled compliance tasks completed successfully")
            
        except Exception as e:
            logger.error(f"Scheduled compliance tasks failed: {str(e)}")