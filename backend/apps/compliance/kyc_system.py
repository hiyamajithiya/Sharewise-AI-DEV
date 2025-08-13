"""
KYC/AML System for SEBI Compliance
Implements Know Your Customer and Anti-Money Laundering checks
"""
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.conf import settings

from .models import KYCDocument, InvestorProfile, AuditTrail, TradingAlert

User = get_user_model()
logger = logging.getLogger(__name__)


class PANValidator:
    """PAN Card validation as per IT Department format"""
    
    @staticmethod
    def validate_pan(pan_number: str) -> bool:
        """Validate PAN number format: AAAAA9999A"""
        if not pan_number or len(pan_number) != 10:
            return False
        
        pan_pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
        return bool(re.match(pan_pattern, pan_number.upper()))
    
    @staticmethod
    def extract_pan_info(pan_number: str) -> Dict[str, str]:
        """Extract information from PAN number"""
        if not PANValidator.validate_pan(pan_number):
            return {}
        
        pan = pan_number.upper()
        
        # Fourth character indicates entity type
        entity_mapping = {
            'P': 'Individual',
            'C': 'Company',
            'H': 'HUF',
            'F': 'Firm',
            'A': 'Association of Persons',
            'T': 'Trust',
            'B': 'Body of Individuals',
            'L': 'Local Authority',
            'J': 'Artificial Juridical Person',
            'G': 'Government',
        }
        
        entity_type = entity_mapping.get(pan[3], 'Unknown')
        
        return {
            'entity_type': entity_type,
            'is_individual': pan[3] == 'P',
            'check_digit': pan[9]
        }


class AadhaarValidator:
    """Aadhaar validation (without storing actual number for privacy)"""
    
    @staticmethod
    def validate_aadhaar(aadhaar_number: str) -> bool:
        """Validate Aadhaar number format and Verhoeff checksum"""
        if not aadhaar_number or len(aadhaar_number) != 12:
            return False
        
        if not aadhaar_number.isdigit():
            return False
        
        # Verhoeff algorithm validation
        return AadhaarValidator._verhoeff_check(aadhaar_number)
    
    @staticmethod
    def _verhoeff_check(number: str) -> bool:
        """Verhoeff checksum validation"""
        # Multiplication table
        d = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
            [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
            [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
            [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
            [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
            [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
            [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
            [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
            [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        ]
        
        # Permutation table
        p = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
            [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
            [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
            [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
            [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
            [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
            [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
        ]
        
        # Inverse table
        inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]
        
        c = 0
        myArray = [int(x) for x in reversed(number)]
        
        for i in range(len(myArray)):
            c = d[c][p[i % 8][myArray[i]]]
        
        return c == 0
    
    @staticmethod
    def mask_aadhaar(aadhaar_number: str) -> str:
        """Mask Aadhaar number for privacy (show only last 4 digits)"""
        if not aadhaar_number or len(aadhaar_number) != 12:
            return "****-****-****"
        
        return f"XXXX-XXXX-{aadhaar_number[-4:]}"


class KYCProcessor:
    """Main KYC processing system"""
    
    def __init__(self):
        self.mandatory_documents = {
            'INDIVIDUAL': ['PAN', 'AADHAAR', 'ADDRESS', 'BANK_STMT', 'PHOTO', 'SIGNATURE'],
            'COMPANY': ['PAN', 'INCORPORATION_CERT', 'MOA_AOA', 'BOARD_RESOLUTION', 'DIRECTOR_LIST'],
            'HUF': ['PAN', 'HUF_DEED', 'KARTA_ID', 'ADDRESS', 'BANK_STMT']
        }
    
    def initiate_kyc(self, user: User, investor_category: str) -> Dict[str, Any]:
        """Initiate KYC process for user"""
        try:
            # Create or get investor profile
            profile, created = InvestorProfile.objects.get_or_create(
                user=user,
                defaults={'category': investor_category}
            )
            
            # Get required documents
            required_docs = self.mandatory_documents.get(investor_category, self.mandatory_documents['INDIVIDUAL'])
            
            # Create audit trail
            AuditTrail.objects.create(
                user=user,
                action_type=AuditTrail.ActionType.KYC_UPDATE,
                action_description=f"KYC process initiated for category: {investor_category}",
                ip_address="127.0.0.1",  # This should come from request
                user_agent="System",
                metadata={
                    'investor_category': investor_category,
                    'required_documents': required_docs
                }
            )
            
            return {
                'status': 'initiated',
                'required_documents': required_docs,
                'profile_id': str(profile.id) if hasattr(profile, 'id') else None,
                'message': f'KYC process initiated for {investor_category} category'
            }
            
        except Exception as e:
            logger.error(f"KYC initiation failed for user {user.id}: {str(e)}")
            return {
                'status': 'error',
                'message': f'KYC initiation failed: {str(e)}'
            }
    
    def validate_document(self, document: KYCDocument) -> Dict[str, Any]:
        """Validate uploaded KYC document"""
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Document-specific validation
            if document.document_type == KYCDocument.DocumentType.PAN_CARD:
                if not PANValidator.validate_pan(document.document_number):
                    validation_result['is_valid'] = False
                    validation_result['errors'].append('Invalid PAN format')
                else:
                    # Extract PAN info
                    pan_info = PANValidator.extract_pan_info(document.document_number)
                    validation_result['pan_info'] = pan_info
            
            elif document.document_type == KYCDocument.DocumentType.AADHAAR:
                if not AadhaarValidator.validate_aadhaar(document.document_number):
                    validation_result['is_valid'] = False
                    validation_result['errors'].append('Invalid Aadhaar format')
                else:
                    # Mask Aadhaar for storage
                    document.document_number = AadhaarValidator.mask_aadhaar(document.document_number)
            
            # File validation
            if document.document_file:
                file_validation = self._validate_document_file(document.document_file)
                if not file_validation['is_valid']:
                    validation_result['is_valid'] = False
                    validation_result['errors'].extend(file_validation['errors'])
            
            # Expiry date validation
            if document.expiry_date and document.expiry_date <= timezone.now():
                validation_result['is_valid'] = False
                validation_result['errors'].append('Document has expired')
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Document validation failed: {str(e)}")
            validation_result['is_valid'] = False
            validation_result['errors'].append(f'Validation error: {str(e)}')
            return validation_result
    
    def _validate_document_file(self, document_file) -> Dict[str, Any]:
        """Validate document file"""
        result = {'is_valid': True, 'errors': []}
        
        # File size check (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if document_file.size > max_size:
            result['is_valid'] = False
            result['errors'].append('File size exceeds 5MB limit')
        
        # File type check
        allowed_types = ['.pdf', '.jpg', '.jpeg', '.png']
        file_extension = document_file.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_types:
            result['is_valid'] = False
            result['errors'].append('Invalid file type. Allowed: PDF, JPG, PNG')
        
        return result
    
    def check_kyc_completeness(self, user: User) -> Dict[str, Any]:
        """Check if user's KYC is complete"""
        try:
            profile = InvestorProfile.objects.get(user=user)
            required_docs = self.mandatory_documents.get(profile.category, self.mandatory_documents['INDIVIDUAL'])
            
            # Check submitted documents
            submitted_docs = KYCDocument.objects.filter(user=user, verification_status=KYCDocument.VerificationStatus.VERIFIED)
            submitted_types = list(submitted_docs.values_list('document_type', flat=True))
            
            # Check completeness
            missing_docs = [doc for doc in required_docs if doc not in submitted_types]
            is_complete = len(missing_docs) == 0
            
            # Check profile completeness
            profile_complete = all([
                profile.pan_number,
                profile.mobile_number,
                profile.address_line1,
                profile.city,
                profile.state,
                profile.pincode,
                profile.annual_income,
                profile.risk_profile
            ])
            
            overall_complete = is_complete and profile_complete
            
            if overall_complete and profile.kyc_status != KYCDocument.VerificationStatus.VERIFIED:
                profile.kyc_status = KYCDocument.VerificationStatus.VERIFIED
                profile.kyc_completion_date = timezone.now()
                profile.save()
            
            return {
                'is_complete': overall_complete,
                'profile_complete': profile_complete,
                'documents_complete': is_complete,
                'missing_documents': missing_docs,
                'kyc_status': profile.kyc_status,
                'completion_percentage': ((len(required_docs) - len(missing_docs)) / len(required_docs)) * 100
            }
            
        except InvestorProfile.DoesNotExist:
            return {
                'is_complete': False,
                'error': 'Investor profile not found'
            }
        except Exception as e:
            logger.error(f"KYC completeness check failed for user {user.id}: {str(e)}")
            return {
                'is_complete': False,
                'error': f'Completeness check failed: {str(e)}'
            }


class AMLMonitoring:
    """Anti-Money Laundering monitoring system"""
    
    def __init__(self):
        self.suspicious_thresholds = {
            'large_transaction': 200000,  # ₹2 Lakhs
            'daily_transaction_count': 50,
            'rapid_succession_minutes': 5,
            'unusual_timing_start': 22,  # 10 PM
            'unusual_timing_end': 6,     # 6 AM
        }
    
    def monitor_transaction(self, user: User, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor transaction for AML compliance"""
        alerts = []
        
        try:
            # Large transaction check
            amount = float(transaction_data.get('amount', 0))
            if amount >= self.suspicious_thresholds['large_transaction']:
                alerts.append({
                    'type': 'LARGE_TRANSACTION',
                    'severity': 'HIGH',
                    'message': f'Large transaction of ₹{amount:,.2f} detected'
                })
            
            # Rapid trading check
            if self._check_rapid_trading(user):
                alerts.append({
                    'type': 'RAPID_TRADING',
                    'severity': 'MEDIUM',
                    'message': 'Multiple transactions in rapid succession'
                })
            
            # Unusual timing check
            current_hour = timezone.now().hour
            if (current_hour >= self.suspicious_thresholds['unusual_timing_start'] or 
                current_hour <= self.suspicious_thresholds['unusual_timing_end']):
                alerts.append({
                    'type': 'UNUSUAL_TIMING',
                    'severity': 'LOW',
                    'message': 'Transaction during unusual hours'
                })
            
            # Create alerts in database
            for alert_data in alerts:
                TradingAlert.objects.create(
                    user=user,
                    alert_type=TradingAlert.AlertType.UNUSUAL_ACTIVITY,
                    severity=alert_data['severity'],
                    title=alert_data['type'],
                    description=alert_data['message'],
                    trigger_value=amount if 'amount' in locals() else None
                )
            
            return {
                'suspicious': len(alerts) > 0,
                'alerts': alerts,
                'risk_score': self._calculate_risk_score(alerts)
            }
            
        except Exception as e:
            logger.error(f"AML monitoring failed for user {user.id}: {str(e)}")
            return {
                'suspicious': False,
                'error': f'AML monitoring failed: {str(e)}'
            }
    
    def _check_rapid_trading(self, user: User) -> bool:
        """Check for rapid trading activity"""
        now = timezone.now()
        time_threshold = now - timedelta(minutes=self.suspicious_thresholds['rapid_succession_minutes'])
        
        recent_trades = AuditTrail.objects.filter(
            user=user,
            action_type=AuditTrail.ActionType.TRADE_ORDER,
            timestamp__gte=time_threshold
        ).count()
        
        return recent_trades >= 5  # 5 trades in 5 minutes
    
    def _calculate_risk_score(self, alerts: List[Dict]) -> int:
        """Calculate overall risk score (0-100)"""
        if not alerts:
            return 0
        
        severity_weights = {
            'LOW': 10,
            'MEDIUM': 30,
            'HIGH': 50,
            'CRITICAL': 100
        }
        
        total_score = sum(severity_weights.get(alert['severity'], 0) for alert in alerts)
        return min(total_score, 100)
    
    def generate_str_report(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate Suspicious Transaction Report (STR) for SEBI"""
        try:
            # Get all high-risk alerts in the period
            suspicious_alerts = TradingAlert.objects.filter(
                triggered_at__range=[start_date, end_date],
                severity__in=['HIGH', 'CRITICAL'],
                status=TradingAlert.AlertStatus.ACTIVE
            ).select_related('user')
            
            str_data = []
            for alert in suspicious_alerts:
                user_profile = getattr(alert.user, 'investor_profile', None)
                
                str_entry = {
                    'client_id': alert.user.id,
                    'client_name': alert.user.get_full_name(),
                    'pan_number': user_profile.pan_number if user_profile else None,
                    'alert_type': alert.alert_type,
                    'severity': alert.severity,
                    'description': alert.description,
                    'trigger_value': float(alert.trigger_value) if alert.trigger_value else None,
                    'triggered_at': alert.triggered_at.isoformat(),
                    'status': alert.status
                }
                str_data.append(str_entry)
            
            return {
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'total_suspicious_transactions': len(str_data),
                'str_entries': str_data,
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"STR generation failed: {str(e)}")
            return {
                'error': f'STR generation failed: {str(e)}'
            }


class ComplianceChecker:
    """Overall compliance checker"""
    
    def __init__(self):
        self.kyc_processor = KYCProcessor()
        self.aml_monitor = AMLMonitoring()
    
    def check_trading_eligibility(self, user: User) -> Dict[str, Any]:
        """Check if user is eligible for trading"""
        try:
            # KYC check
            kyc_status = self.kyc_processor.check_kyc_completeness(user)
            
            if not kyc_status['is_complete']:
                return {
                    'eligible': False,
                    'reason': 'KYC incomplete',
                    'details': kyc_status
                }
            
            # Check for active high-severity alerts
            active_alerts = TradingAlert.objects.filter(
                user=user,
                status=TradingAlert.AlertStatus.ACTIVE,
                severity__in=['HIGH', 'CRITICAL']
            ).count()
            
            if active_alerts > 0:
                return {
                    'eligible': False,
                    'reason': 'Active compliance alerts',
                    'active_alerts': active_alerts
                }
            
            # Check KYC expiry (annual update required)
            profile = InvestorProfile.objects.get(user=user)
            if profile.last_kyc_update:
                kyc_age = timezone.now() - profile.last_kyc_update
                if kyc_age.days > 365:  # 1 year
                    return {
                        'eligible': False,
                        'reason': 'KYC update required (annual)',
                        'last_update': profile.last_kyc_update.isoformat()
                    }
            
            return {
                'eligible': True,
                'kyc_status': kyc_status,
                'last_kyc_update': profile.last_kyc_update.isoformat() if profile.last_kyc_update else None
            }
            
        except InvestorProfile.DoesNotExist:
            return {
                'eligible': False,
                'reason': 'Investor profile not found'
            }
        except Exception as e:
            logger.error(f"Trading eligibility check failed for user {user.id}: {str(e)}")
            return {
                'eligible': False,
                'reason': f'Compliance check failed: {str(e)}'
            }
    
    def perform_daily_compliance_check(self) -> Dict[str, Any]:
        """Perform daily compliance checks"""
        try:
            results = {
                'date': timezone.now().date().isoformat(),
                'checks_performed': [],
                'issues_found': [],
                'summary': {}
            }
            
            # Check expired KYC documents
            expired_docs = KYCDocument.objects.filter(
                expiry_date__lte=timezone.now(),
                verification_status=KYCDocument.VerificationStatus.VERIFIED
            )
            
            for doc in expired_docs:
                doc.verification_status = KYCDocument.VerificationStatus.EXPIRED
                doc.save()
                
                # Create alert
                TradingAlert.objects.create(
                    user=doc.user,
                    alert_type=TradingAlert.AlertType.KYC_EXPIRED,
                    severity='HIGH',
                    title='KYC Document Expired',
                    description=f'{doc.get_document_type_display()} has expired'
                )
                
                results['issues_found'].append({
                    'user_id': doc.user.id,
                    'issue': 'KYC document expired',
                    'document_type': doc.document_type
                })
            
            results['checks_performed'].append('KYC document expiry check')
            results['summary']['expired_kyc_documents'] = len(expired_docs)
            
            # Check pending KYC verifications
            pending_kyc = KYCDocument.objects.filter(
                verification_status=KYCDocument.VerificationStatus.PENDING,
                created_at__lte=timezone.now() - timedelta(days=7)  # Pending for more than 7 days
            ).count()
            
            results['checks_performed'].append('Pending KYC verification check')
            results['summary']['pending_kyc_documents'] = pending_kyc
            
            if pending_kyc > 0:
                results['issues_found'].append({
                    'issue': 'Pending KYC verifications',
                    'count': pending_kyc
                })
            
            # Check unresolved alerts
            unresolved_alerts = TradingAlert.objects.filter(
                status=TradingAlert.AlertStatus.ACTIVE,
                triggered_at__lte=timezone.now() - timedelta(days=3)  # Active for more than 3 days
            ).count()
            
            results['checks_performed'].append('Unresolved alerts check')
            results['summary']['unresolved_alerts'] = unresolved_alerts
            
            if unresolved_alerts > 0:
                results['issues_found'].append({
                    'issue': 'Unresolved compliance alerts',
                    'count': unresolved_alerts
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Daily compliance check failed: {str(e)}")
            return {
                'error': f'Daily compliance check failed: {str(e)}'
            }