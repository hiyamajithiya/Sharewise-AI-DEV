"""
Regulatory Reporting System for SEBI Compliance
Generates and manages various regulatory reports as per SEBI requirements
"""
import csv
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from decimal import Decimal
from io import StringIO, BytesIO
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count, Avg
from django.conf import settings
from django.core.files.base import ContentFile
import pandas as pd

from .models import (
    RegulatoryReporting, TradingAlert, AuditTrail, 
    InvestorProfile, KYCDocument, RiskManagement
)
from .kyc_system import AMLMonitoring

User = get_user_model()
logger = logging.getLogger(__name__)


class SEBIReportGenerator:
    """Generate SEBI compliance reports"""
    
    def __init__(self):
        self.aml_monitor = AMLMonitoring()
    
    def generate_daily_trading_report(self, report_date: date) -> Dict[str, Any]:
        """Generate daily trading activity report"""
        try:
            start_datetime = datetime.combine(report_date, datetime.min.time())
            end_datetime = datetime.combine(report_date, datetime.max.time())
            
            # Get trading activities from audit trail
            trading_activities = AuditTrail.objects.filter(
                action_type__in=[
                    AuditTrail.ActionType.TRADE_ORDER,
                    AuditTrail.ActionType.TRADE_EXECUTION,
                    AuditTrail.ActionType.TRADE_CANCELLATION
                ],
                timestamp__range=[start_datetime, end_datetime]
            ).select_related('user')
            
            report_data = {
                'report_date': report_date.isoformat(),
                'total_trades': 0,
                'total_users': 0,
                'trade_summary': {
                    'orders_placed': 0,
                    'orders_executed': 0,
                    'orders_cancelled': 0,
                },
                'user_activities': [],
                'alerts_triggered': 0,
                'compliance_issues': []
            }
            
            # Process trading activities
            user_activities = {}
            for activity in trading_activities:
                user_id = activity.user.id
                action_type = activity.action_type
                
                if user_id not in user_activities:
                    user_activities[user_id] = {
                        'user_id': user_id,
                        'user_name': activity.user.get_full_name() or activity.user.username,
                        'orders_placed': 0,
                        'orders_executed': 0,
                        'orders_cancelled': 0,
                        'total_value': Decimal('0.00'),
                        'compliance_status': 'COMPLIANT'
                    }
                
                # Update counters
                if action_type == AuditTrail.ActionType.TRADE_ORDER:
                    user_activities[user_id]['orders_placed'] += 1
                    report_data['trade_summary']['orders_placed'] += 1
                elif action_type == AuditTrail.ActionType.TRADE_EXECUTION:
                    user_activities[user_id]['orders_executed'] += 1
                    report_data['trade_summary']['orders_executed'] += 1
                elif action_type == AuditTrail.ActionType.TRADE_CANCELLATION:
                    user_activities[user_id]['orders_cancelled'] += 1
                    report_data['trade_summary']['orders_cancelled'] += 1
                
                # Extract trade value from metadata
                if hasattr(activity, 'metadata') and activity.metadata:
                    trade_value = activity.metadata.get('trade_value', 0)
                    if trade_value:
                        user_activities[user_id]['total_value'] += Decimal(str(trade_value))
            
            report_data['total_trades'] = report_data['trade_summary']['orders_placed']
            report_data['total_users'] = len(user_activities)
            report_data['user_activities'] = list(user_activities.values())
            
            # Get alerts for the day
            daily_alerts = TradingAlert.objects.filter(
                triggered_at__range=[start_datetime, end_datetime]
            )
            
            report_data['alerts_triggered'] = daily_alerts.count()
            
            # Check for compliance issues
            high_severity_alerts = daily_alerts.filter(severity__in=['HIGH', 'CRITICAL'])
            for alert in high_severity_alerts:
                report_data['compliance_issues'].append({
                    'user_id': alert.user.id,
                    'alert_type': alert.alert_type,
                    'severity': alert.severity,
                    'description': alert.description,
                    'triggered_at': alert.triggered_at.isoformat()
                })
            
            return {
                'status': 'success',
                'report_data': report_data,
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Daily trading report generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Report generation failed: {str(e)}'
            }
    
    def generate_monthly_client_report(self, year: int, month: int) -> Dict[str, Any]:
        """Generate monthly client activity and compliance report"""
        try:
            # Define date range
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1) - timedelta(days=1)
            
            report_data = {
                'period': f"{year}-{month:02d}",
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'client_summary': {
                    'total_clients': 0,
                    'active_clients': 0,
                    'new_registrations': 0,
                    'kyc_pending': 0,
                    'kyc_completed': 0
                },
                'trading_summary': {
                    'total_trades': 0,
                    'total_volume': Decimal('0.00'),
                    'average_trade_size': Decimal('0.00')
                },
                'compliance_summary': {
                    'alerts_generated': 0,
                    'alerts_resolved': 0,
                    'pending_alerts': 0,
                    'str_cases': 0
                },
                'client_details': []
            }
            
            # Get all users with investor profiles
            clients = InvestorProfile.objects.select_related('user').all()
            report_data['client_summary']['total_clients'] = clients.count()
            
            # Track new registrations
            new_clients = clients.filter(created_at__range=[start_date, end_date])
            report_data['client_summary']['new_registrations'] = new_clients.count()
            
            # KYC status summary
            kyc_pending = clients.filter(kyc_status=KYCDocument.VerificationStatus.PENDING)
            kyc_completed = clients.filter(kyc_status=KYCDocument.VerificationStatus.VERIFIED)
            
            report_data['client_summary']['kyc_pending'] = kyc_pending.count()
            report_data['client_summary']['kyc_completed'] = kyc_completed.count()
            
            # Get active clients (traded in the month)
            active_client_ids = AuditTrail.objects.filter(
                action_type=AuditTrail.ActionType.TRADE_ORDER,
                timestamp__range=[start_date, end_date]
            ).values_list('user_id', flat=True).distinct()
            
            report_data['client_summary']['active_clients'] = len(active_client_ids)
            
            # Trading summary
            trading_activities = AuditTrail.objects.filter(
                action_type=AuditTrail.ActionType.TRADE_EXECUTION,
                timestamp__range=[start_date, end_date]
            )
            
            report_data['trading_summary']['total_trades'] = trading_activities.count()
            
            # Process client details
            for client in clients:
                client_trades = trading_activities.filter(user=client.user).count()
                client_alerts = TradingAlert.objects.filter(
                    user=client.user,
                    triggered_at__range=[start_date, end_date]
                ).count()
                
                client_detail = {
                    'client_id': client.user.id,
                    'client_name': client.user.get_full_name(),
                    'pan_number': client.pan_number,
                    'kyc_status': client.kyc_status,
                    'risk_profile': client.risk_profile,
                    'trades_count': client_trades,
                    'alerts_count': client_alerts,
                    'registration_date': client.created_at.isoformat()
                }
                
                if client_trades > 0:
                    client_detail['active'] = True
                
                report_data['client_details'].append(client_detail)
            
            # Compliance alerts summary
            monthly_alerts = TradingAlert.objects.filter(
                triggered_at__range=[start_date, end_date]
            )
            
            report_data['compliance_summary']['alerts_generated'] = monthly_alerts.count()
            report_data['compliance_summary']['alerts_resolved'] = monthly_alerts.filter(
                status=TradingAlert.AlertStatus.RESOLVED
            ).count()
            report_data['compliance_summary']['pending_alerts'] = monthly_alerts.filter(
                status=TradingAlert.AlertStatus.ACTIVE
            ).count()
            
            # STR cases (high severity alerts)
            str_cases = monthly_alerts.filter(severity__in=['HIGH', 'CRITICAL']).count()
            report_data['compliance_summary']['str_cases'] = str_cases
            
            return {
                'status': 'success',
                'report_data': report_data,
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Monthly client report generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Report generation failed: {str(e)}'
            }
    
    def generate_str_report(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Generate Suspicious Transaction Report (STR) for SEBI"""
        try:
            # Use AML monitoring system to generate STR
            str_report = self.aml_monitor.generate_str_report(
                datetime.combine(start_date, datetime.min.time()),
                datetime.combine(end_date, datetime.max.time())
            )
            
            if 'error' in str_report:
                return str_report
            
            # Enhance STR with additional compliance data
            enhanced_entries = []
            
            for entry in str_report.get('str_entries', []):
                try:
                    user = User.objects.get(id=entry['client_id'])
                    profile = InvestorProfile.objects.get(user=user)
                    
                    # Add KYC and risk profile information
                    enhanced_entry = entry.copy()
                    enhanced_entry.update({
                        'kyc_status': profile.kyc_status,
                        'risk_profile': profile.risk_profile,
                        'category': profile.category,
                        'annual_income': profile.annual_income,
                        'trading_experience': profile.trading_experience,
                        'last_kyc_update': profile.last_kyc_update.isoformat() if profile.last_kyc_update else None
                    })
                    
                    # Add recent trading pattern
                    recent_trades = AuditTrail.objects.filter(
                        user=user,
                        action_type=AuditTrail.ActionType.TRADE_ORDER,
                        timestamp__gte=timezone.now() - timedelta(days=30)
                    ).count()
                    
                    enhanced_entry['recent_trading_activity'] = recent_trades
                    enhanced_entries.append(enhanced_entry)
                    
                except (User.DoesNotExist, InvestorProfile.DoesNotExist):
                    # Keep original entry if profile not found
                    enhanced_entries.append(entry)
            
            str_report['str_entries'] = enhanced_entries
            str_report['sebi_format'] = True
            str_report['report_type'] = 'SUSPICIOUS_TRANSACTION_REPORT'
            
            return {
                'status': 'success',
                'report_data': str_report,
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"STR report generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'STR generation failed: {str(e)}'
            }
    
    def generate_quarterly_compliance_report(self, year: int, quarter: int) -> Dict[str, Any]:
        """Generate quarterly compliance assessment report"""
        try:
            # Define quarter dates
            quarter_months = {
                1: (1, 3), 2: (4, 6), 3: (7, 9), 4: (10, 12)
            }
            
            start_month, end_month = quarter_months[quarter]
            start_date = datetime(year, start_month, 1)
            end_date = datetime(year, end_month + 1, 1) - timedelta(days=1) if end_month < 12 else datetime(year, 12, 31)
            
            report_data = {
                'period': f"Q{quarter} {year}",
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'compliance_metrics': {
                    'overall_score': 0,
                    'kyc_compliance_rate': 0,
                    'risk_management_score': 0,
                    'alert_resolution_rate': 0,
                    'audit_trail_completeness': 100
                },
                'kyc_analysis': {
                    'total_profiles': 0,
                    'verified_profiles': 0,
                    'pending_verification': 0,
                    'expired_documents': 0,
                    'compliance_rate': 0
                },
                'risk_management_analysis': {
                    'users_with_limits': 0,
                    'limit_breaches': 0,
                    'circuit_breaker_triggers': 0,
                    'risk_score_distribution': {}
                },
                'alert_analysis': {
                    'total_alerts': 0,
                    'resolved_alerts': 0,
                    'pending_alerts': 0,
                    'false_positives': 0,
                    'resolution_rate': 0,
                    'average_resolution_time': 0
                },
                'audit_compliance': {
                    'total_events': 0,
                    'compliance_events': 0,
                    'non_compliance_events': 0,
                    'coverage_percentage': 100
                },
                'regulatory_filings': {
                    'reports_due': 0,
                    'reports_filed': 0,
                    'overdue_reports': 0
                },
                'recommendations': []
            }
            
            # KYC Analysis
            all_profiles = InvestorProfile.objects.all()
            verified_profiles = all_profiles.filter(kyc_status=KYCDocument.VerificationStatus.VERIFIED)
            pending_profiles = all_profiles.filter(kyc_status=KYCDocument.VerificationStatus.PENDING)
            
            report_data['kyc_analysis'].update({
                'total_profiles': all_profiles.count(),
                'verified_profiles': verified_profiles.count(),
                'pending_verification': pending_profiles.count(),
                'compliance_rate': (verified_profiles.count() / max(all_profiles.count(), 1)) * 100
            })
            
            # Check expired KYC documents
            expired_docs = KYCDocument.objects.filter(
                expiry_date__lt=timezone.now(),
                verification_status=KYCDocument.VerificationStatus.VERIFIED
            ).count()
            
            report_data['kyc_analysis']['expired_documents'] = expired_docs
            
            # Risk Management Analysis
            risk_users = RiskManagement.objects.all()
            report_data['risk_management_analysis']['users_with_limits'] = risk_users.count()
            
            # Count limit breaches in the quarter
            limit_breach_alerts = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.POSITION_LIMIT,
                triggered_at__range=[start_date, end_date]
            ).count()
            
            circuit_breaker_alerts = TradingAlert.objects.filter(
                alert_type=TradingAlert.AlertType.CIRCUIT_BREAKER,
                triggered_at__range=[start_date, end_date]
            ).count()
            
            report_data['risk_management_analysis'].update({
                'limit_breaches': limit_breach_alerts,
                'circuit_breaker_triggers': circuit_breaker_alerts
            })
            
            # Alert Analysis
            quarter_alerts = TradingAlert.objects.filter(
                triggered_at__range=[start_date, end_date]
            )
            
            resolved_alerts = quarter_alerts.filter(status=TradingAlert.AlertStatus.RESOLVED)
            false_positive_alerts = quarter_alerts.filter(status=TradingAlert.AlertStatus.FALSE_POSITIVE)
            
            report_data['alert_analysis'].update({
                'total_alerts': quarter_alerts.count(),
                'resolved_alerts': resolved_alerts.count(),
                'pending_alerts': quarter_alerts.filter(status=TradingAlert.AlertStatus.ACTIVE).count(),
                'false_positives': false_positive_alerts.count(),
                'resolution_rate': (resolved_alerts.count() / max(quarter_alerts.count(), 1)) * 100
            })
            
            # Calculate average resolution time
            resolved_with_times = resolved_alerts.exclude(resolved_at__isnull=True)
            if resolved_with_times.exists():
                total_resolution_time = sum([
                    (alert.resolved_at - alert.triggered_at).total_seconds() 
                    for alert in resolved_with_times
                ])
                avg_resolution_hours = (total_resolution_time / resolved_with_times.count()) / 3600
                report_data['alert_analysis']['average_resolution_time'] = round(avg_resolution_hours, 2)
            
            # Audit Trail Analysis
            audit_events = AuditTrail.objects.filter(
                timestamp__range=[start_date, end_date]
            )
            
            compliant_events = audit_events.filter(compliance_status='COMPLIANT')
            
            report_data['audit_compliance'].update({
                'total_events': audit_events.count(),
                'compliance_events': compliant_events.count(),
                'non_compliance_events': audit_events.count() - compliant_events.count(),
                'coverage_percentage': 100  # Assuming full audit coverage
            })
            
            # Calculate overall compliance score
            kyc_score = report_data['kyc_analysis']['compliance_rate']
            alert_score = report_data['alert_analysis']['resolution_rate']
            
            # Risk management score based on breach frequency
            total_users = max(all_profiles.count(), 1)
            breach_rate = (limit_breach_alerts + circuit_breaker_alerts) / total_users
            risk_score = max(0, 100 - (breach_rate * 20))  # Penalize breaches
            
            overall_score = (kyc_score * 0.4) + (alert_score * 0.3) + (risk_score * 0.3)
            
            report_data['compliance_metrics'].update({
                'overall_score': round(overall_score, 2),
                'kyc_compliance_rate': round(kyc_score, 2),
                'risk_management_score': round(risk_score, 2),
                'alert_resolution_rate': round(alert_score, 2)
            })
            
            # Generate recommendations
            recommendations = []
            
            if kyc_score < 95:
                recommendations.append("Improve KYC completion rate - currently below 95% threshold")
            
            if expired_docs > 0:
                recommendations.append(f"Update {expired_docs} expired KYC documents")
            
            if alert_score < 80:
                recommendations.append("Improve alert resolution time and processes")
            
            if limit_breach_alerts > total_users * 0.1:
                recommendations.append("Review and adjust position limits - high breach frequency")
            
            if circuit_breaker_alerts > 0:
                recommendations.append("Investigate circuit breaker triggers and user risk management")
            
            if not recommendations:
                recommendations.append("Maintain current compliance standards - all metrics within acceptable ranges")
            
            report_data['recommendations'] = recommendations
            
            return {
                'status': 'success',
                'report_data': report_data,
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Quarterly compliance report generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Report generation failed: {str(e)}'
            }


class ReportManager:
    """Manage regulatory reporting workflow"""
    
    def __init__(self):
        self.report_generator = SEBIReportGenerator()
    
    def create_report(self, report_type: str, parameters: Dict[str, Any], 
                     user: Optional[User] = None) -> Dict[str, Any]:
        """Create a new regulatory report"""
        try:
            # Generate report data based on type
            if report_type == RegulatoryReporting.ReportType.DAILY_TRADES:
                report_date = parameters.get('report_date', date.today())
                if isinstance(report_date, str):
                    report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
                
                result = self.report_generator.generate_daily_trading_report(report_date)
                
            elif report_type == RegulatoryReporting.ReportType.MONTHLY_CLIENT:
                year = parameters.get('year', date.today().year)
                month = parameters.get('month', date.today().month)
                result = self.report_generator.generate_monthly_client_report(year, month)
                
            elif report_type == RegulatoryReporting.ReportType.AML_REPORT:
                start_date = parameters.get('start_date')
                end_date = parameters.get('end_date')
                if isinstance(start_date, str):
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                if isinstance(end_date, str):
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                
                result = self.report_generator.generate_str_report(start_date, end_date)
                
            elif report_type == RegulatoryReporting.ReportType.QUARTERLY_COMPLIANCE:
                year = parameters.get('year', date.today().year)
                quarter = parameters.get('quarter', 1)
                result = self.report_generator.generate_quarterly_compliance_report(year, quarter)
                
            else:
                return {
                    'status': 'error',
                    'error': f'Unsupported report type: {report_type}'
                }
            
            if result['status'] == 'error':
                return result
            
            # Create database record
            report_data = result['report_data']
            
            # Determine period dates
            if 'period_start' in report_data and 'period_end' in report_data:
                period_start = datetime.fromisoformat(report_data['period_start'].replace('Z', '+00:00'))
                period_end = datetime.fromisoformat(report_data['period_end'].replace('Z', '+00:00'))
            elif 'report_date' in report_data:
                report_date = datetime.strptime(report_data['report_date'], '%Y-%m-%d')
                period_start = report_date
                period_end = report_date
            else:
                period_start = timezone.now()
                period_end = timezone.now()
            
            regulatory_report = RegulatoryReporting.objects.create(
                report_type=report_type,
                report_period_start=period_start,
                report_period_end=period_end,
                report_data=report_data,
                status=RegulatoryReporting.ReportStatus.GENERATED,
                generated_by=user,
                generated_at=timezone.now()
            )
            
            return {
                'status': 'success',
                'report_id': str(regulatory_report.id),
                'report_data': report_data,
                'generated_at': result['generated_at']
            }
            
        except Exception as e:
            logger.error(f"Report creation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Report creation failed: {str(e)}'
            }
    
    def export_report_csv(self, report_id: str) -> Optional[bytes]:
        """Export report as CSV file"""
        try:
            report = RegulatoryReporting.objects.get(id=report_id)
            report_data = report.report_data
            
            # Create CSV based on report type
            if report.report_type == RegulatoryReporting.ReportType.DAILY_TRADES:
                return self._export_daily_trades_csv(report_data)
            elif report.report_type == RegulatoryReporting.ReportType.MONTHLY_CLIENT:
                return self._export_monthly_client_csv(report_data)
            elif report.report_type == RegulatoryReporting.ReportType.AML_REPORT:
                return self._export_str_csv(report_data)
            elif report.report_type == RegulatoryReporting.ReportType.QUARTERLY_COMPLIANCE:
                return self._export_compliance_csv(report_data)
            
            return None
            
        except RegulatoryReporting.DoesNotExist:
            logger.error(f"Report {report_id} not found")
            return None
        except Exception as e:
            logger.error(f"CSV export failed: {str(e)}")
            return None
    
    def _export_daily_trades_csv(self, report_data: Dict) -> bytes:
        """Export daily trades report as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Date', 'Total Trades', 'Total Users', 'Orders Placed', 
                        'Orders Executed', 'Orders Cancelled', 'Alerts Triggered'])
        
        # Data
        writer.writerow([
            report_data.get('report_date', ''),
            report_data.get('total_trades', 0),
            report_data.get('total_users', 0),
            report_data.get('trade_summary', {}).get('orders_placed', 0),
            report_data.get('trade_summary', {}).get('orders_executed', 0),
            report_data.get('trade_summary', {}).get('orders_cancelled', 0),
            report_data.get('alerts_triggered', 0)
        ])
        
        # User activities
        writer.writerow([])  # Empty row
        writer.writerow(['User Activities'])
        writer.writerow(['User ID', 'User Name', 'Orders Placed', 'Orders Executed', 
                        'Orders Cancelled', 'Total Value'])
        
        for user_activity in report_data.get('user_activities', []):
            writer.writerow([
                user_activity.get('user_id', ''),
                user_activity.get('user_name', ''),
                user_activity.get('orders_placed', 0),
                user_activity.get('orders_executed', 0),
                user_activity.get('orders_cancelled', 0),
                user_activity.get('total_value', 0)
            ])
        
        return output.getvalue().encode('utf-8')
    
    def _export_str_csv(self, report_data: Dict) -> bytes:
        """Export STR report as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Client ID', 'Client Name', 'PAN Number', 'Alert Type', 
                        'Severity', 'Description', 'Trigger Value', 'Triggered At',
                        'KYC Status', 'Risk Profile'])
        
        # STR entries
        for entry in report_data.get('str_entries', []):
            writer.writerow([
                entry.get('client_id', ''),
                entry.get('client_name', ''),
                entry.get('pan_number', ''),
                entry.get('alert_type', ''),
                entry.get('severity', ''),
                entry.get('description', ''),
                entry.get('trigger_value', ''),
                entry.get('triggered_at', ''),
                entry.get('kyc_status', ''),
                entry.get('risk_profile', '')
            ])
        
        return output.getvalue().encode('utf-8')
    
    def _export_monthly_client_csv(self, report_data: Dict) -> bytes:
        """Export monthly client report as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Summary
        writer.writerow(['Monthly Client Report Summary'])
        writer.writerow(['Period', report_data.get('period', '')])
        writer.writerow(['Total Clients', report_data.get('client_summary', {}).get('total_clients', 0)])
        writer.writerow(['Active Clients', report_data.get('client_summary', {}).get('active_clients', 0)])
        writer.writerow(['New Registrations', report_data.get('client_summary', {}).get('new_registrations', 0)])
        writer.writerow([])
        
        # Client details
        writer.writerow(['Client Details'])
        writer.writerow(['Client ID', 'Client Name', 'PAN Number', 'KYC Status', 
                        'Risk Profile', 'Trades Count', 'Alerts Count', 'Registration Date'])
        
        for client in report_data.get('client_details', []):
            writer.writerow([
                client.get('client_id', ''),
                client.get('client_name', ''),
                client.get('pan_number', ''),
                client.get('kyc_status', ''),
                client.get('risk_profile', ''),
                client.get('trades_count', 0),
                client.get('alerts_count', 0),
                client.get('registration_date', '')
            ])
        
        return output.getvalue().encode('utf-8')
    
    def _export_compliance_csv(self, report_data: Dict) -> bytes:
        """Export quarterly compliance report as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Compliance metrics
        writer.writerow(['Quarterly Compliance Report'])
        writer.writerow(['Period', report_data.get('period', '')])
        writer.writerow([])
        
        writer.writerow(['Compliance Metrics'])
        metrics = report_data.get('compliance_metrics', {})
        for key, value in metrics.items():
            writer.writerow([key.replace('_', ' ').title(), value])
        
        writer.writerow([])
        writer.writerow(['Recommendations'])
        for recommendation in report_data.get('recommendations', []):
            writer.writerow([recommendation])
        
        return output.getvalue().encode('utf-8')
    
    def schedule_periodic_reports(self):
        """Schedule automatic generation of periodic reports"""
        try:
            today = date.today()
            
            # Generate daily report for yesterday
            yesterday = today - timedelta(days=1)
            daily_report = self.create_report(
                RegulatoryReporting.ReportType.DAILY_TRADES,
                {'report_date': yesterday}
            )
            
            # Generate monthly report if it's the first day of the month
            if today.day == 1:
                last_month = today - timedelta(days=1)
                monthly_report = self.create_report(
                    RegulatoryReporting.ReportType.MONTHLY_CLIENT,
                    {'year': last_month.year, 'month': last_month.month}
                )
            
            # Generate quarterly report if it's the first day of a new quarter
            if today.month in [1, 4, 7, 10] and today.day == 1:
                last_quarter_month = today.month - 1 if today.month > 1 else 12
                last_quarter_year = today.year if today.month > 1 else today.year - 1
                quarter = ((last_quarter_month - 1) // 3) + 1
                
                quarterly_report = self.create_report(
                    RegulatoryReporting.ReportType.QUARTERLY_COMPLIANCE,
                    {'year': last_quarter_year, 'quarter': quarter}
                )
            
            logger.info(f"Periodic reports generated for {today}")
            
        except Exception as e:
            logger.error(f"Periodic report generation failed: {str(e)}")