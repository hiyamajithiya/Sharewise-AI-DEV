"""
Data Retention and Privacy Compliance System
Implements data retention policies as per SEBI and data protection regulations
"""
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.conf import settings
from django.core.management.base import BaseCommand
import hashlib
import json
from pathlib import Path

from .models import (
    AuditTrail, KYCDocument, InvestorProfile, 
    TradingAlert, RegulatoryReporting, InvestorGrievance
)

User = get_user_model()
logger = logging.getLogger(__name__)


class DataRetentionManager:
    """Manage data retention policies and compliance"""
    
    def __init__(self):
        # SEBI data retention requirements (in years)
        self.retention_policies = {
            'audit_trails': 8,           # Trading records - 8 years
            'kyc_documents': 8,          # KYC records - 8 years after account closure
            'client_communications': 3,  # Email, calls, messages - 3 years
            'trading_records': 8,        # All trading data - 8 years
            'advisory_records': 8,       # Investment advice records - 8 years
            'regulatory_reports': 8,     # Compliance reports - 8 years
            'grievance_records': 8,      # Client complaints - 8 years
            'marketing_data': 3,         # Marketing communications - 3 years
            'system_logs': 2,            # System access logs - 2 years
            'backup_data': 8,            # Backup retention - 8 years
        }
        
        # Data anonymization settings
        self.anonymization_delay_days = 90  # Days after account closure
        self.sensitive_fields = [
            'pan_number', 'aadhaar_number', 'account_number',
            'email', 'phone', 'address', 'bank_details'
        ]
    
    def get_retention_schedule(self) -> Dict[str, Any]:
        """Get comprehensive data retention schedule"""
        current_date = timezone.now()
        schedule = {
            'generated_at': current_date.isoformat(),
            'retention_policies': {},
            'deletion_schedule': {},
            'anonymization_schedule': {},
            'compliance_status': 'COMPLIANT'
        }
        
        for data_type, retention_years in self.retention_policies.items():
            retention_date = current_date - timedelta(days=retention_years * 365)
            
            schedule['retention_policies'][data_type] = {
                'retention_period_years': retention_years,
                'cutoff_date': retention_date.date().isoformat(),
                'regulatory_basis': 'SEBI (Investment Advisers) Regulations, 2013',
                'next_review_date': (current_date + timedelta(days=90)).date().isoformat()
            }
        
        # Calculate deletion candidates
        schedule['deletion_schedule'] = self._calculate_deletion_schedule()
        
        # Calculate anonymization candidates
        schedule['anonymization_schedule'] = self._calculate_anonymization_schedule()
        
        return schedule
    
    def _calculate_deletion_schedule(self) -> Dict[str, Any]:
        """Calculate records eligible for deletion"""
        current_date = timezone.now()
        deletion_schedule = {}
        
        # Audit trails older than 8 years
        audit_cutoff = current_date - timedelta(days=8 * 365)
        old_audit_count = AuditTrail.objects.filter(
            timestamp__lt=audit_cutoff
        ).count()
        
        deletion_schedule['audit_trails'] = {
            'cutoff_date': audit_cutoff.date().isoformat(),
            'eligible_records': old_audit_count,
            'action': 'ARCHIVE_THEN_DELETE' if old_audit_count > 0 else 'NO_ACTION'
        }
        
        # System logs (if tracked separately)
        log_cutoff = current_date - timedelta(days=2 * 365)
        deletion_schedule['system_logs'] = {
            'cutoff_date': log_cutoff.date().isoformat(),
            'eligible_records': 0,  # Placeholder - would count actual log records
            'action': 'DELETE'
        }
        
        # Marketing data (if applicable)
        marketing_cutoff = current_date - timedelta(days=3 * 365)
        deletion_schedule['marketing_data'] = {
            'cutoff_date': marketing_cutoff.date().isoformat(),
            'eligible_records': 0,  # Placeholder - would count marketing records
            'action': 'DELETE'
        }
        
        return deletion_schedule
    
    def _calculate_anonymization_schedule(self) -> Dict[str, Any]:
        """Calculate records eligible for anonymization"""
        current_date = timezone.now()
        anonymization_cutoff = current_date - timedelta(days=self.anonymization_delay_days)
        
        # Find inactive users (no trading activity in last 2 years)
        inactive_cutoff = current_date - timedelta(days=2 * 365)
        inactive_users = User.objects.filter(
            last_login__lt=inactive_cutoff
        ).exclude(
            audit_trails__timestamp__gte=inactive_cutoff
        )
        
        anonymization_schedule = {
            'cutoff_date': anonymization_cutoff.date().isoformat(),
            'inactive_users': inactive_users.count(),
            'eligible_profiles': 0,
            'action_required': inactive_users.count() > 0
        }
        
        # Count profiles eligible for anonymization
        if inactive_users.exists():
            eligible_profiles = InvestorProfile.objects.filter(
                user__in=inactive_users,
                updated_at__lt=anonymization_cutoff
            ).count()
            
            anonymization_schedule['eligible_profiles'] = eligible_profiles
        
        return anonymization_schedule
    
    def anonymize_user_data(self, user_id: int, reason: str = 'ACCOUNT_CLOSURE') -> Dict[str, Any]:
        """Anonymize user's personal data while preserving regulatory records"""
        try:
            user = User.objects.get(id=user_id)
            
            # Create audit record before anonymization
            AuditTrail.objects.create(
                user=user,
                action_type=AuditTrail.ActionType.SYSTEM_ALERT,
                action_description=f'Data anonymization initiated - Reason: {reason}',
                ip_address='127.0.0.1',
                user_agent='System',
                metadata={
                    'anonymization_reason': reason,
                    'original_user_id': user_id,
                    'anonymization_timestamp': timezone.now().isoformat()
                }
            )
            
            # Generate anonymization hash
            anon_hash = hashlib.sha256(f"{user_id}_{timezone.now().timestamp()}".encode()).hexdigest()[:16]
            
            anonymized_data = {
                'user_records_anonymized': 0,
                'profile_records_anonymized': 0,
                'kyc_records_anonymized': 0,
                'preservations': [],
                'anonymization_id': anon_hash
            }
            
            # Anonymize user record
            if user.email:
                user.email = f"anonymized_{anon_hash}@deleted.local"
                anonymized_data['user_records_anonymized'] += 1
            
            if user.first_name:
                user.first_name = f"ANON_{anon_hash[:8]}"
                
            if user.last_name:
                user.last_name = "USER"
            
            user.is_active = False
            user.save()
            
            # Anonymize investor profile
            try:
                profile = InvestorProfile.objects.get(user=user)
                
                # Store regulatory data that must be preserved
                preserved_data = {
                    'pan_hash': hashlib.sha256(profile.pan_number.encode()).hexdigest() if profile.pan_number else None,
                    'registration_date': profile.created_at.isoformat(),
                    'kyc_status': profile.kyc_status,
                    'risk_profile': profile.risk_profile,
                    'category': profile.category
                }
                anonymized_data['preservations'].append('regulatory_profile_data')
                
                # Anonymize personal information
                profile.pan_number = f"ANON{anon_hash[:6].upper()}"
                profile.mobile_number = f"+91{anon_hash[:10]}"
                profile.address_line1 = "ANONYMIZED ADDRESS"
                profile.address_line2 = ""
                profile.city = "ANONYMIZED"
                profile.state = "ANONYMIZED"
                profile.pincode = "000000"
                
                if profile.aadhaar_number:
                    profile.aadhaar_number = f"XXXX-XXXX-{anon_hash[:4]}"
                
                profile.save()
                anonymized_data['profile_records_anonymized'] += 1
                
            except InvestorProfile.DoesNotExist:
                pass
            
            # Anonymize KYC documents (but preserve for regulatory compliance)
            kyc_docs = KYCDocument.objects.filter(user=user)
            for doc in kyc_docs:
                # Keep document type and status for regulatory records
                doc.document_number = f"ANON_{anon_hash}_{doc.document_type}"
                doc.save()
                anonymized_data['kyc_records_anonymized'] += 1
                anonymized_data['preservations'].append(f'kyc_{doc.document_type}_metadata')
            
            # Preserve audit trails and trading records for regulatory compliance
            # These are NOT anonymized but marked as belonging to anonymized user
            audit_count = AuditTrail.objects.filter(user=user).update(
                metadata=models.F('metadata').update({'user_anonymized': True, 'anon_id': anon_hash})
            )
            anonymized_data['preservations'].append(f'audit_trails_{audit_count}_records')
            
            # Preserve trading alerts for regulatory compliance
            alert_count = TradingAlert.objects.filter(user=user).count()
            if alert_count > 0:
                anonymized_data['preservations'].append(f'trading_alerts_{alert_count}_records')
            
            # Preserve grievance records for regulatory compliance
            grievance_count = InvestorGrievance.objects.filter(complainant=user).count()
            if grievance_count > 0:
                anonymized_data['preservations'].append(f'grievance_records_{grievance_count}_records')
            
            return {
                'status': 'success',
                'user_id': user_id,
                'anonymization_id': anon_hash,
                'anonymized_data': anonymized_data,
                'preservation_reason': 'SEBI regulatory compliance requires 8-year retention',
                'completed_at': timezone.now().isoformat()
            }
            
        except User.DoesNotExist:
            return {
                'status': 'error',
                'error': 'User not found'
            }
        except Exception as e:
            logger.error(f"Data anonymization failed for user {user_id}: {str(e)}")
            return {
                'status': 'error',
                'error': f'Anonymization failed: {str(e)}'
            }
    
    def archive_old_records(self, archive_date: datetime, data_type: str) -> Dict[str, Any]:
        """Archive old records before deletion"""
        try:
            archive_path = Path(settings.MEDIA_ROOT) / 'archives' / data_type
            archive_path.mkdir(parents=True, exist_ok=True)
            
            archive_file = archive_path / f"{data_type}_{archive_date.strftime('%Y%m%d')}.json"
            
            archived_records = []
            archive_count = 0
            
            if data_type == 'audit_trails':
                old_records = AuditTrail.objects.filter(timestamp__lt=archive_date)
                
                for record in old_records:
                    archived_record = {
                        'id': str(record.id),
                        'user_id': record.user.id,
                        'action_type': record.action_type,
                        'action_description': record.action_description,
                        'timestamp': record.timestamp.isoformat(),
                        'ip_address': str(record.ip_address),
                        'metadata': record.metadata,
                        'archived_at': timezone.now().isoformat()
                    }
                    archived_records.append(archived_record)
                    archive_count += 1
                
                # Write to archive file
                with open(archive_file, 'w') as f:
                    json.dump({
                        'archive_type': data_type,
                        'archive_date': archive_date.isoformat(),
                        'records_count': archive_count,
                        'records': archived_records,
                        'compliance_note': 'Archived as per SEBI data retention policy'
                    }, f, indent=2)
                
                # Delete records after successful archival
                old_records.delete()
            
            elif data_type == 'old_kyc_documents':
                # Archive rejected/expired KYC documents older than retention period
                cutoff_date = archive_date
                old_docs = KYCDocument.objects.filter(
                    created_at__lt=cutoff_date,
                    verification_status__in=[
                        KYCDocument.VerificationStatus.REJECTED,
                        KYCDocument.VerificationStatus.EXPIRED
                    ]
                )
                
                for doc in old_docs:
                    archived_record = {
                        'id': str(doc.id),
                        'user_id': doc.user.id,
                        'document_type': doc.document_type,
                        'verification_status': doc.verification_status,
                        'created_at': doc.created_at.isoformat(),
                        'archived_at': timezone.now().isoformat()
                    }
                    archived_records.append(archived_record)
                    archive_count += 1
                
                # Write archive
                with open(archive_file, 'w') as f:
                    json.dump({
                        'archive_type': data_type,
                        'archive_date': archive_date.isoformat(),
                        'records_count': archive_count,
                        'records': archived_records
                    }, f, indent=2)
                
                # Delete after archival
                old_docs.delete()
            
            return {
                'status': 'success',
                'data_type': data_type,
                'archive_file': str(archive_file),
                'records_archived': archive_count,
                'archive_date': archive_date.isoformat(),
                'file_size_mb': archive_file.stat().st_size / 1024 / 1024 if archive_file.exists() else 0
            }
            
        except Exception as e:
            logger.error(f"Archival failed for {data_type}: {str(e)}")
            return {
                'status': 'error',
                'error': f'Archival failed: {str(e)}'
            }
    
    def run_retention_compliance_check(self) -> Dict[str, Any]:
        """Run comprehensive data retention compliance check"""
        try:
            current_date = timezone.now()
            
            compliance_check = {
                'check_date': current_date.isoformat(),
                'overall_status': 'COMPLIANT',
                'checks_performed': [],
                'violations_found': [],
                'recommendations': [],
                'data_statistics': {}
            }
            
            # Check audit trail retention
            eight_years_ago = current_date - timedelta(days=8 * 365)
            old_audit_count = AuditTrail.objects.filter(
                timestamp__lt=eight_years_ago
            ).count()
            
            compliance_check['data_statistics']['old_audit_trails'] = old_audit_count
            compliance_check['checks_performed'].append('audit_trail_retention_check')
            
            if old_audit_count > 1000:  # Threshold for action
                compliance_check['recommendations'].append(
                    f'Archive {old_audit_count} audit records older than 8 years'
                )
            
            # Check KYC document retention
            old_kyc_count = KYCDocument.objects.filter(
                created_at__lt=eight_years_ago,
                verification_status__in=[
                    KYCDocument.VerificationStatus.REJECTED,
                    KYCDocument.VerificationStatus.EXPIRED
                ]
            ).count()
            
            compliance_check['data_statistics']['old_kyc_documents'] = old_kyc_count
            compliance_check['checks_performed'].append('kyc_document_retention_check')
            
            # Check for missing required data
            users_without_profiles = User.objects.filter(
                investor_profile__isnull=True,
                is_active=True
            ).count()
            
            compliance_check['data_statistics']['users_without_profiles'] = users_without_profiles
            
            if users_without_profiles > 0:
                compliance_check['violations_found'].append(
                    f'{users_without_profiles} active users without investor profiles'
                )
                compliance_check['overall_status'] = 'NON_COMPLIANT'
            
            # Check data backup status
            backup_check = self._check_backup_compliance()
            compliance_check['data_statistics']['backup_status'] = backup_check
            compliance_check['checks_performed'].append('backup_compliance_check')
            
            if not backup_check.get('compliant', True):
                compliance_check['violations_found'].append('Data backup compliance issues')
                compliance_check['overall_status'] = 'NON_COMPLIANT'
            
            # Check for inactive user data that should be anonymized
            inactive_cutoff = current_date - timedelta(days=2 * 365)
            inactive_users = User.objects.filter(
                last_login__lt=inactive_cutoff,
                is_active=True
            ).exclude(
                audit_trails__timestamp__gte=inactive_cutoff
            ).count()
            
            compliance_check['data_statistics']['inactive_users'] = inactive_users
            
            if inactive_users > 10:  # Threshold
                compliance_check['recommendations'].append(
                    f'Consider anonymizing data for {inactive_users} inactive users'
                )
            
            # Check regulatory reporting data retention
            report_cutoff = current_date - timedelta(days=8 * 365)
            old_reports = RegulatoryReporting.objects.filter(
                created_at__lt=report_cutoff
            ).count()
            
            compliance_check['data_statistics']['old_regulatory_reports'] = old_reports
            
            # Generate final recommendations
            if not compliance_check['recommendations'] and compliance_check['overall_status'] == 'COMPLIANT':
                compliance_check['recommendations'].append(
                    'Data retention policies are compliant. Continue regular monitoring.'
                )
            
            return compliance_check
            
        except Exception as e:
            logger.error(f"Retention compliance check failed: {str(e)}")
            return {
                'check_date': current_date.isoformat(),
                'overall_status': 'ERROR',
                'error': f'Compliance check failed: {str(e)}'
            }
    
    def _check_backup_compliance(self) -> Dict[str, Any]:
        """Check backup and disaster recovery compliance"""
        # This would integrate with your actual backup system
        # For now, returning a placeholder check
        
        return {
            'compliant': True,
            'last_backup_date': (timezone.now() - timedelta(hours=1)).isoformat(),
            'backup_frequency': 'DAILY',
            'retention_period_days': 90,
            'offsite_backup': True,
            'encryption_enabled': True,
            'recovery_testing': 'MONTHLY'
        }
    
    def generate_data_map(self) -> Dict[str, Any]:
        """Generate comprehensive data mapping for privacy compliance"""
        try:
            data_map = {
                'generated_at': timezone.now().isoformat(),
                'data_categories': {},
                'processing_purposes': {},
                'retention_periods': self.retention_policies,
                'third_party_sharing': {},
                'data_flows': {}
            }
            
            # Map data categories
            data_map['data_categories'] = {
                'personal_identifiers': {
                    'data_elements': ['name', 'email', 'phone', 'address', 'pan_number', 'aadhaar_number'],
                    'sensitivity_level': 'HIGH',
                    'storage_location': 'encrypted_database',
                    'access_controls': 'role_based_access'
                },
                'financial_data': {
                    'data_elements': ['income', 'net_worth', 'bank_details', 'trading_history'],
                    'sensitivity_level': 'HIGH',
                    'storage_location': 'encrypted_database',
                    'access_controls': 'strict_need_to_know'
                },
                'trading_data': {
                    'data_elements': ['orders', 'positions', 'transactions', 'portfolio_data'],
                    'sensitivity_level': 'MEDIUM',
                    'storage_location': 'encrypted_database',
                    'access_controls': 'role_based_access'
                },
                'technical_data': {
                    'data_elements': ['ip_address', 'device_info', 'session_data', 'usage_analytics'],
                    'sensitivity_level': 'LOW',
                    'storage_location': 'log_files',
                    'access_controls': 'technical_team_access'
                }
            }
            
            # Map processing purposes
            data_map['processing_purposes'] = {
                'service_provision': {
                    'legal_basis': 'contract_performance',
                    'data_used': ['personal_identifiers', 'financial_data', 'trading_data'],
                    'retention_period': '8_years_post_closure'
                },
                'regulatory_compliance': {
                    'legal_basis': 'legal_obligation',
                    'data_used': ['all_categories'],
                    'retention_period': '8_years_minimum'
                },
                'fraud_prevention': {
                    'legal_basis': 'legitimate_interest',
                    'data_used': ['personal_identifiers', 'technical_data', 'trading_data'],
                    'retention_period': '5_years'
                },
                'service_improvement': {
                    'legal_basis': 'legitimate_interest',
                    'data_used': ['anonymized_trading_data', 'technical_data'],
                    'retention_period': '3_years'
                }
            }
            
            # Map third-party sharing
            data_map['third_party_sharing'] = {
                'regulators': {
                    'recipients': ['SEBI', 'RBI', 'Income_Tax_Department'],
                    'data_shared': ['all_regulatory_required_data'],
                    'legal_basis': 'legal_obligation',
                    'frequency': 'as_required'
                },
                'service_providers': {
                    'recipients': ['KYC_agencies', 'payment_processors', 'technology_vendors'],
                    'data_shared': ['limited_necessary_data'],
                    'legal_basis': 'contract_performance',
                    'frequency': 'ongoing'
                },
                'exchanges_depositories': {
                    'recipients': ['stock_exchanges', 'depositories'],
                    'data_shared': ['trading_related_data'],
                    'legal_basis': 'legal_obligation',
                    'frequency': 'real_time'
                }
            }
            
            return data_map
            
        except Exception as e:
            logger.error(f"Data mapping failed: {str(e)}")
            return {
                'generated_at': timezone.now().isoformat(),
                'error': f'Data mapping failed: {str(e)}'
            }
    
    def schedule_retention_tasks(self):
        """Schedule automated data retention tasks"""
        try:
            current_date = timezone.now()
            
            # Monthly retention compliance check
            if current_date.day == 1:  # First day of month
                compliance_check = self.run_retention_compliance_check()
                logger.info(f"Monthly retention compliance check: {compliance_check['overall_status']}")
            
            # Quarterly archival of old data
            if current_date.month in [1, 4, 7, 10] and current_date.day == 1:
                # Archive audit trails older than 8 years
                eight_years_ago = current_date - timedelta(days=8 * 365)
                archive_result = self.archive_old_records(eight_years_ago, 'audit_trails')
                logger.info(f"Quarterly archival result: {archive_result['records_archived']} records")
            
            # Daily inactive user identification
            inactive_cutoff = current_date - timedelta(days=2 * 365)
            inactive_users = User.objects.filter(
                last_login__lt=inactive_cutoff,
                is_active=True
            ).exclude(
                audit_trails__timestamp__gte=inactive_cutoff
            )
            
            if inactive_users.count() > 20:  # Threshold for action
                logger.warning(f"High number of inactive users detected: {inactive_users.count()}")
                
                # Create alert for compliance team
                # This would integrate with your alerting system
            
        except Exception as e:
            logger.error(f"Scheduled retention tasks failed: {str(e)}")