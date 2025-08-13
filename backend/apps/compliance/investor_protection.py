"""
Investor Protection System for SEBI Compliance
Implements investor protection measures as per SEBI guidelines
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Avg
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import (
    InvestorProfile, TradingAlert, AuditTrail, 
    RiskManagement, InvestorGrievance, KYCDocument
)
from .risk_management import RiskController

User = get_user_model()
logger = logging.getLogger(__name__)


class InvestorEducationSystem:
    """Provide investor education and awareness"""
    
    def __init__(self):
        self.risk_controller = RiskController()
    
    def get_risk_disclosure(self, user: User, investment_type: str) -> Dict[str, Any]:
        """Get appropriate risk disclosure for investment type"""
        try:
            profile = InvestorProfile.objects.get(user=user)
            
            # Base risk disclosures
            risk_disclosures = {
                'EQUITY': {
                    'title': 'Equity Investment Risks',
                    'key_risks': [
                        'Market risk: Stock prices can fluctuate significantly',
                        'Company risk: Individual company performance affects stock value',
                        'Liquidity risk: May not be able to sell stocks immediately',
                        'Currency risk: For foreign stocks',
                        'Interest rate risk: Changes in interest rates affect stock valuations'
                    ],
                    'regulatory_warning': 'Past performance does not guarantee future results. All investments in securities market are subject to market risks.',
                    'minimum_knowledge_required': 'Basic understanding of stock markets and company fundamentals'
                },
                'DERIVATIVES': {
                    'title': 'Derivatives Trading Risks',
                    'key_risks': [
                        'High leverage risk: Small price movements can cause large losses',
                        'Time decay risk: Options lose value as expiration approaches',
                        'Volatility risk: Changes in volatility affect option prices',
                        'Counterparty risk: Risk of counterparty default',
                        'Liquidity risk: May not find buyers/sellers at desired prices',
                        'Margin risk: Potential for margin calls and forced liquidation'
                    ],
                    'regulatory_warning': 'DERIVATIVES TRADING IS HIGHLY RISKY. You can lose more than your initial investment. Suitable only for sophisticated investors.',
                    'minimum_knowledge_required': 'Advanced knowledge of derivatives, Greeks, and risk management',
                    'experience_required': 'Minimum 2 years of equity trading experience'
                },
                'COMMODITY': {
                    'title': 'Commodity Trading Risks',
                    'key_risks': [
                        'Price volatility: Commodity prices are highly volatile',
                        'Weather risk: Agricultural commodities affected by weather',
                        'Storage risk: Physical commodities require storage',
                        'Political risk: Government policies affect commodity prices',
                        'Currency risk: International commodity prices in USD'
                    ],
                    'regulatory_warning': 'Commodity trading involves substantial risk of loss. Prices are influenced by factors beyond investor control.',
                    'minimum_knowledge_required': 'Understanding of commodity markets and supply-demand factors'
                }
            }
            
            disclosure = risk_disclosures.get(investment_type, risk_disclosures['EQUITY'])
            
            # Customize based on investor profile
            if profile.risk_profile == InvestorProfile.RiskProfile.LOW:
                disclosure['personal_recommendation'] = 'Based on your low-risk profile, consider conservative investment strategies with proper diversification.'
            elif profile.risk_profile == InvestorProfile.RiskProfile.MODERATE:
                disclosure['personal_recommendation'] = 'Your moderate risk profile allows for balanced investment approach. Ensure proper portfolio diversification.'
            elif profile.risk_profile == InvestorProfile.RiskProfile.HIGH:
                disclosure['personal_recommendation'] = 'While your risk profile is high, always maintain position sizing and risk management disciplines.'
            else:
                disclosure['personal_recommendation'] = 'Very high risk profile requires exceptional risk management and position sizing discipline.'
            
            # Add experience-based warnings
            if profile.trading_experience < 1:
                disclosure['experience_warning'] = 'As a new investor, start with small positions and paper trading to gain experience.'
            elif profile.trading_experience < 3:
                disclosure['experience_warning'] = 'Continue learning and gradually increase position sizes as you gain more experience.'
            
            return {
                'status': 'success',
                'disclosure': disclosure,
                'generated_at': timezone.now().isoformat()
            }
            
        except InvestorProfile.DoesNotExist:
            return {
                'status': 'error',
                'error': 'Investor profile not found. Complete KYC first.'
            }
        except Exception as e:
            logger.error(f"Risk disclosure generation failed for user {user.id}: {str(e)}")
            return {
                'status': 'error',
                'error': f'Risk disclosure generation failed: {str(e)}'
            }
    
    def get_suitability_assessment(self, user: User, investment_amount: Decimal, 
                                  investment_type: str) -> Dict[str, Any]:
        """Assess investment suitability for user"""
        try:
            profile = InvestorProfile.objects.get(user=user)
            
            assessment = {
                'suitable': True,
                'suitability_score': 100,
                'warnings': [],
                'recommendations': [],
                'restrictions': []
            }
            
            # Check investment amount vs annual income
            income_ranges = {
                '<100000': 50000,
                '100000-500000': 300000,
                '500000-1000000': 750000,
                '1000000-2500000': 1750000,
                '2500000-5000000': 3750000,
                '5000000-10000000': 7500000,
                '>10000000': 15000000
            }
            
            estimated_income = income_ranges.get(profile.annual_income, 300000)
            investment_percentage = (investment_amount / Decimal(str(estimated_income))) * 100
            
            # Investment amount checks
            if investment_percentage > 50:
                assessment['suitable'] = False
                assessment['suitability_score'] -= 40
                assessment['warnings'].append(
                    f'Investment amount ({investment_amount:,.2f}) exceeds 50% of estimated annual income'
                )
                assessment['restrictions'].append('Reduce investment amount to max 50% of annual income')
            elif investment_percentage > 25:
                assessment['suitability_score'] -= 20
                assessment['warnings'].append(
                    f'Investment amount is {investment_percentage:.1f}% of estimated annual income - consider smaller amount'
                )
            
            # Risk profile vs investment type
            risk_compatibility = {
                'EQUITY': {'LOW': 60, 'MODERATE': 90, 'HIGH': 100, 'VERY_HIGH': 100},
                'DERIVATIVES': {'LOW': 20, 'MODERATE': 40, 'HIGH': 80, 'VERY_HIGH': 100},
                'COMMODITY': {'LOW': 30, 'MODERATE': 60, 'HIGH': 90, 'VERY_HIGH': 100}
            }
            
            compatibility_score = risk_compatibility.get(investment_type, {}).get(profile.risk_profile, 50)
            assessment['suitability_score'] = min(assessment['suitability_score'], compatibility_score)
            
            if compatibility_score < 50:
                assessment['suitable'] = False
                assessment['warnings'].append(
                    f'{investment_type} investment not suitable for {profile.risk_profile.lower()} risk profile'
                )
            elif compatibility_score < 80:
                assessment['warnings'].append(
                    f'{investment_type} has higher risk than your {profile.risk_profile.lower()} risk profile'
                )
            
            # Experience checks
            if investment_type == 'DERIVATIVES' and profile.trading_experience < 2:
                assessment['suitable'] = False
                assessment['suitability_score'] -= 30
                assessment['warnings'].append('Minimum 2 years trading experience required for derivatives')
                assessment['restrictions'].append('Complete derivatives education program first')
            
            # Age-based checks (if DOB available)
            # Assuming age can be derived from profile or user data
            # For now, using a placeholder check
            if profile.risk_profile == InvestorProfile.RiskProfile.VERY_HIGH and investment_type == 'DERIVATIVES':
                assessment['recommendations'].append('Consider position sizing - never risk more than 2% per trade')
                assessment['recommendations'].append('Use stop-loss orders to limit downside risk')
            
            # Net worth checks
            if profile.net_worth and investment_amount > profile.net_worth * Decimal('0.20'):
                assessment['suitability_score'] -= 25
                assessment['warnings'].append('Investment exceeds 20% of net worth - high concentration risk')
            
            # Generate final recommendations
            if assessment['suitability_score'] >= 80:
                assessment['overall_rating'] = 'SUITABLE'
            elif assessment['suitability_score'] >= 60:
                assessment['overall_rating'] = 'SUITABLE_WITH_CAUTION'
                assessment['recommendations'].append('Proceed with caution and proper risk management')
            elif assessment['suitability_score'] >= 40:
                assessment['overall_rating'] = 'MARGINALLY_SUITABLE'
                assessment['recommendations'].append('Consider smaller investment amount or different investment type')
            else:
                assessment['overall_rating'] = 'NOT_SUITABLE'
                assessment['suitable'] = False
                assessment['recommendations'].append('This investment is not suitable for your profile')
            
            return {
                'status': 'success',
                'assessment': assessment,
                'generated_at': timezone.now().isoformat()
            }
            
        except InvestorProfile.DoesNotExist:
            return {
                'status': 'error',
                'error': 'Investor profile not found. Complete KYC first.'
            }
        except Exception as e:
            logger.error(f"Suitability assessment failed for user {user.id}: {str(e)}")
            return {
                'status': 'error',
                'error': f'Suitability assessment failed: {str(e)}'
            }


class GrievanceManager:
    """Manage investor grievances and complaints"""
    
    def __init__(self):
        self.sla_hours = {
            InvestorGrievance.GrievanceType.TRADING_ISSUE: 24,
            InvestorGrievance.GrievanceType.SETTLEMENT_DELAY: 48,
            InvestorGrievance.GrievanceType.UNAUTHORIZED_TRADE: 4,
            InvestorGrievance.GrievanceType.SYSTEM_ISSUE: 8,
            InvestorGrievance.GrievanceType.ADVISORY_COMPLAINT: 72,
            InvestorGrievance.GrievanceType.BILLING_ISSUE: 48,
            InvestorGrievance.GrievanceType.KYC_ISSUE: 24,
            InvestorGrievance.GrievanceType.OTHER: 48
        }
    
    def file_grievance(self, user: User, grievance_data: Dict[str, Any]) -> Dict[str, Any]:
        """File a new investor grievance"""
        try:
            grievance_type = grievance_data.get('grievance_type')
            subject = grievance_data.get('subject')
            description = grievance_data.get('description')
            supporting_docs = grievance_data.get('supporting_documents', [])
            
            # Validate required fields
            if not all([grievance_type, subject, description]):
                return {
                    'status': 'error',
                    'error': 'Grievance type, subject, and description are required'
                }
            
            # Calculate expected resolution date based on SLA
            sla_hours = self.sla_hours.get(grievance_type, 48)
            expected_resolution = timezone.now() + timedelta(hours=sla_hours)
            
            # Create grievance
            grievance = InvestorGrievance.objects.create(
                complainant=user,
                grievance_type=grievance_type,
                subject=subject,
                description=description,
                supporting_documents=supporting_docs,
                expected_resolution_date=expected_resolution
            )
            
            # Create audit trail
            AuditTrail.objects.create(
                user=user,
                action_type=AuditTrail.ActionType.SYSTEM_ALERT,
                action_description=f'Grievance filed: {subject}',
                ip_address='127.0.0.1',
                user_agent='System',
                metadata={
                    'grievance_id': str(grievance.id),
                    'grievance_type': grievance_type,
                    'sla_hours': sla_hours
                }
            )
            
            # Send confirmation email
            self._send_grievance_confirmation_email(user, grievance)
            
            # Auto-assign based on grievance type
            self._auto_assign_grievance(grievance)
            
            return {
                'status': 'success',
                'grievance_id': str(grievance.id),
                'expected_resolution_date': expected_resolution.isoformat(),
                'sla_hours': sla_hours,
                'message': 'Grievance filed successfully. You will receive updates on resolution.'
            }
            
        except Exception as e:
            logger.error(f"Grievance filing failed for user {user.id}: {str(e)}")
            return {
                'status': 'error',
                'error': f'Grievance filing failed: {str(e)}'
            }
    
    def update_grievance_status(self, grievance_id: str, status: str, 
                              resolution_notes: str = '', assigned_user: Optional[User] = None) -> Dict[str, Any]:
        """Update grievance status"""
        try:
            grievance = InvestorGrievance.objects.get(id=grievance_id)
            
            old_status = grievance.status
            grievance.status = status
            
            if resolution_notes:
                grievance.resolution_notes = resolution_notes
            
            if assigned_user:
                grievance.assigned_to = assigned_user
            
            if status in [InvestorGrievance.GrievanceStatus.RESOLVED, InvestorGrievance.GrievanceStatus.CLOSED]:
                grievance.actual_resolution_date = timezone.now()
            
            grievance.save()
            
            # Create audit trail
            AuditTrail.objects.create(
                user=grievance.complainant,
                action_type=AuditTrail.ActionType.SYSTEM_ALERT,
                action_description=f'Grievance status updated: {old_status} -> {status}',
                ip_address='127.0.0.1',
                user_agent='System',
                metadata={
                    'grievance_id': grievance_id,
                    'old_status': old_status,
                    'new_status': status,
                    'updated_by': assigned_user.id if assigned_user else None
                }
            )
            
            # Send status update email
            self._send_grievance_update_email(grievance.complainant, grievance)
            
            return {
                'status': 'success',
                'message': f'Grievance status updated to {status}',
                'resolution_date': grievance.actual_resolution_date.isoformat() if grievance.actual_resolution_date else None
            }
            
        except InvestorGrievance.DoesNotExist:
            return {
                'status': 'error',
                'error': 'Grievance not found'
            }
        except Exception as e:
            logger.error(f"Grievance status update failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Status update failed: {str(e)}'
            }
    
    def escalate_to_sebi(self, grievance_id: str, reason: str) -> Dict[str, Any]:
        """Escalate grievance to SEBI SCORES"""
        try:
            grievance = InvestorGrievance.objects.get(id=grievance_id)
            
            # Generate SCORES reference (mock - would integrate with actual SEBI system)
            scores_ref = f"SCORES_{timezone.now().strftime('%Y%m%d')}_{str(grievance.id)[:8].upper()}"
            
            grievance.status = InvestorGrievance.GrievanceStatus.ESCALATED
            grievance.escalated_to_sebi = True
            grievance.scores_reference = scores_ref
            grievance.resolution_notes += f"\nEscalated to SEBI SCORES: {reason}\nReference: {scores_ref}"
            grievance.save()
            
            # Create audit trail
            AuditTrail.objects.create(
                user=grievance.complainant,
                action_type=AuditTrail.ActionType.SYSTEM_ALERT,
                action_description=f'Grievance escalated to SEBI: {reason}',
                ip_address='127.0.0.1',
                user_agent='System',
                metadata={
                    'grievance_id': grievance_id,
                    'scores_reference': scores_ref,
                    'escalation_reason': reason
                }
            )
            
            # Create high-priority alert
            TradingAlert.objects.create(
                user=grievance.complainant,
                alert_type=TradingAlert.AlertType.REGULATORY,
                severity='HIGH',
                title='Grievance Escalated to SEBI',
                description=f'Grievance "{grievance.subject}" has been escalated to SEBI SCORES',
                trigger_value=None
            )
            
            # Send escalation notification
            self._send_escalation_notification_email(grievance.complainant, grievance)
            
            return {
                'status': 'success',
                'scores_reference': scores_ref,
                'message': 'Grievance escalated to SEBI SCORES system',
                'next_steps': 'You will receive communication directly from SEBI regarding this grievance.'
            }
            
        except InvestorGrievance.DoesNotExist:
            return {
                'status': 'error',
                'error': 'Grievance not found'
            }
        except Exception as e:
            logger.error(f"SEBI escalation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'SEBI escalation failed: {str(e)}'
            }
    
    def get_grievance_statistics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get grievance handling statistics"""
        try:
            grievances = InvestorGrievance.objects.filter(
                created_at__range=[start_date, end_date]
            )
            
            stats = {
                'total_grievances': grievances.count(),
                'by_type': {},
                'by_status': {},
                'sla_performance': {
                    'within_sla': 0,
                    'breached_sla': 0,
                    'average_resolution_hours': 0
                },
                'escalations_to_sebi': 0,
                'resolution_rate': 0
            }
            
            # Group by type
            for grievance_type, _ in InvestorGrievance.GrievanceType.choices:
                count = grievances.filter(grievance_type=grievance_type).count()
                stats['by_type'][grievance_type] = count
            
            # Group by status
            for status, _ in InvestorGrievance.GrievanceStatus.choices:
                count = grievances.filter(status=status).count()
                stats['by_status'][status] = count
            
            # SLA performance
            resolved_grievances = grievances.filter(
                actual_resolution_date__isnull=False
            )
            
            within_sla = 0
            breached_sla = 0
            total_resolution_hours = 0
            
            for grievance in resolved_grievances:
                resolution_time = grievance.actual_resolution_date - grievance.created_at
                resolution_hours = resolution_time.total_seconds() / 3600
                
                sla_hours = self.sla_hours.get(grievance.grievance_type, 48)
                
                if resolution_hours <= sla_hours:
                    within_sla += 1
                else:
                    breached_sla += 1
                
                total_resolution_hours += resolution_hours
            
            stats['sla_performance']['within_sla'] = within_sla
            stats['sla_performance']['breached_sla'] = breached_sla
            
            if resolved_grievances.count() > 0:
                stats['sla_performance']['average_resolution_hours'] = round(
                    total_resolution_hours / resolved_grievances.count(), 2
                )
                stats['resolution_rate'] = round(
                    (resolved_grievances.count() / grievances.count()) * 100, 2
                )
            
            # SEBI escalations
            stats['escalations_to_sebi'] = grievances.filter(escalated_to_sebi=True).count()
            
            return {
                'status': 'success',
                'statistics': stats,
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Grievance statistics generation failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Statistics generation failed: {str(e)}'
            }
    
    def _auto_assign_grievance(self, grievance: InvestorGrievance):
        """Auto-assign grievance based on type and workload"""
        # This is a placeholder - in production, you'd implement proper assignment logic
        # based on team availability, expertise, etc.
        pass
    
    def _send_grievance_confirmation_email(self, user: User, grievance: InvestorGrievance):
        """Send grievance confirmation email"""
        try:
            subject = f"Grievance Filed - Reference: {str(grievance.id)[:8].upper()}"
            message = f"""
Dear {user.get_full_name() or user.username},

Your grievance has been successfully filed with the following details:

Reference ID: {str(grievance.id)[:8].upper()}
Subject: {grievance.subject}
Type: {grievance.get_grievance_type_display()}
Filed on: {grievance.created_at.strftime('%Y-%m-%d %H:%M')}
Expected Resolution: {grievance.expected_resolution_date.strftime('%Y-%m-%d %H:%M')}

We will investigate your concerns and provide updates regularly. 

For urgent matters, please contact our support team.

Best regards,
ShareWise AI Compliance Team
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            
        except Exception as e:
            logger.error(f"Grievance confirmation email failed: {str(e)}")
    
    def _send_grievance_update_email(self, user: User, grievance: InvestorGrievance):
        """Send grievance status update email"""
        try:
            subject = f"Grievance Update - Reference: {str(grievance.id)[:8].upper()}"
            message = f"""
Dear {user.get_full_name() or user.username},

Your grievance status has been updated:

Reference ID: {str(grievance.id)[:8].upper()}
Subject: {grievance.subject}
New Status: {grievance.get_status_display()}
Updated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}

{grievance.resolution_notes if grievance.resolution_notes else ''}

Best regards,
ShareWise AI Compliance Team
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            
        except Exception as e:
            logger.error(f"Grievance update email failed: {str(e)}")
    
    def _send_escalation_notification_email(self, user: User, grievance: InvestorGrievance):
        """Send SEBI escalation notification email"""
        try:
            subject = f"Grievance Escalated to SEBI - Reference: {grievance.scores_reference}"
            message = f"""
Dear {user.get_full_name() or user.username},

Your grievance has been escalated to the SEBI SCORES (SEBI Complaints Redress System):

Reference ID: {str(grievance.id)[:8].upper()}
SEBI SCORES Reference: {grievance.scores_reference}
Subject: {grievance.subject}
Escalated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}

You will receive direct communication from SEBI regarding the resolution of this matter.

You can track the status on the SEBI SCORES portal: https://scores.gov.in

Best regards,
ShareWise AI Compliance Team
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            
        except Exception as e:
            logger.error(f"SEBI escalation email failed: {str(e)}")


class InvestorProtectionController:
    """Main investor protection system controller"""
    
    def __init__(self):
        self.education_system = InvestorEducationSystem()
        self.grievance_manager = GrievanceManager()
    
    def pre_trade_checks(self, user: User, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive pre-trade investor protection checks"""
        try:
            investment_amount = Decimal(str(trade_data.get('amount', 0)))
            investment_type = trade_data.get('segment', 'EQUITY')
            
            result = {
                'allowed': True,
                'warnings': [],
                'disclosures': [],
                'confirmations_required': []
            }
            
            # 1. Get risk disclosure
            risk_disclosure = self.education_system.get_risk_disclosure(user, investment_type)
            if risk_disclosure['status'] == 'success':
                result['disclosures'].append({
                    'type': 'RISK_DISCLOSURE',
                    'content': risk_disclosure['disclosure'],
                    'acknowledgment_required': True
                })
            
            # 2. Suitability assessment
            suitability = self.education_system.get_suitability_assessment(
                user, investment_amount, investment_type
            )
            
            if suitability['status'] == 'success':
                assessment = suitability['assessment']
                
                if not assessment['suitable']:
                    result['allowed'] = False
                    result['warnings'].extend(assessment['warnings'])
                    result['confirmations_required'].append({
                        'type': 'UNSUITABLE_INVESTMENT',
                        'message': 'This investment is not suitable for your profile. Do you want to proceed anyway?',
                        'requires_explicit_consent': True
                    })
                
                if assessment['warnings']:
                    result['warnings'].extend(assessment['warnings'])
                
                if assessment['overall_rating'] in ['SUITABLE_WITH_CAUTION', 'MARGINALLY_SUITABLE']:
                    result['confirmations_required'].append({
                        'type': 'CAUTION_REQUIRED',
                        'message': f'Investment rating: {assessment["overall_rating"]}. Please confirm you understand the risks.',
                        'requires_explicit_consent': True
                    })
            
            # 3. First-time investor protection
            profile = InvestorProfile.objects.get(user=user)
            if profile.trading_experience == 0:
                result['confirmations_required'].append({
                    'type': 'FIRST_TIME_INVESTOR',
                    'message': 'As a first-time investor, we recommend starting with small amounts and paper trading.',
                    'requires_explicit_consent': True
                })
            
            # 4. High-risk investment warnings
            if investment_type == 'DERIVATIVES':
                result['disclosures'].append({
                    'type': 'DERIVATIVES_WARNING',
                    'content': {
                        'title': 'DERIVATIVES TRADING WARNING',
                        'message': 'Derivatives trading can result in losses exceeding your initial investment. You may receive margin calls requiring additional funds.',
                        'key_points': [
                            'Leverage amplifies both gains and losses',
                            'Time decay affects option values',
                            'Margin calls can force position closure',
                            'Market volatility can cause rapid losses'
                        ]
                    },
                    'acknowledgment_required': True
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Pre-trade checks failed for user {user.id}: {str(e)}")
            return {
                'allowed': False,
                'error': f'Pre-trade protection checks failed: {str(e)}'
            }
    
    def monitor_investor_welfare(self) -> Dict[str, Any]:
        """Monitor overall investor welfare and protection metrics"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)  # Last 30 days
            
            welfare_metrics = {
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'protection_metrics': {
                    'total_active_investors': 0,
                    'kyc_completion_rate': 0,
                    'grievances_filed': 0,
                    'grievances_resolved_on_time': 0,
                    'risk_alerts_generated': 0,
                    'risk_alerts_resolved': 0,
                    'escalations_to_sebi': 0
                },
                'education_metrics': {
                    'risk_disclosures_shown': 0,
                    'suitability_assessments_done': 0,
                    'unsuitable_investments_prevented': 0
                },
                'welfare_score': 0,
                'areas_for_improvement': []
            }
            
            # Count active investors
            active_investors = InvestorProfile.objects.filter(
                user__audit_trails__timestamp__range=[start_date, end_date],
                user__audit_trails__action_type=AuditTrail.ActionType.TRADE_ORDER
            ).distinct().count()
            
            welfare_metrics['protection_metrics']['total_active_investors'] = active_investors
            
            # KYC completion rate
            total_profiles = InvestorProfile.objects.count()
            verified_profiles = InvestorProfile.objects.filter(
                kyc_status=KYCDocument.VerificationStatus.VERIFIED
            ).count()
            
            if total_profiles > 0:
                kyc_rate = (verified_profiles / total_profiles) * 100
                welfare_metrics['protection_metrics']['kyc_completion_rate'] = round(kyc_rate, 2)
            
            # Grievance statistics
            period_grievances = InvestorGrievance.objects.filter(
                created_at__range=[start_date, end_date]
            )
            
            welfare_metrics['protection_metrics']['grievances_filed'] = period_grievances.count()
            welfare_metrics['protection_metrics']['escalations_to_sebi'] = period_grievances.filter(
                escalated_to_sebi=True
            ).count()
            
            # On-time resolution
            resolved_grievances = period_grievances.filter(
                actual_resolution_date__isnull=False
            )
            
            on_time_count = 0
            for grievance in resolved_grievances:
                if grievance.actual_resolution_date <= grievance.expected_resolution_date:
                    on_time_count += 1
            
            welfare_metrics['protection_metrics']['grievances_resolved_on_time'] = on_time_count
            
            # Risk alerts
            period_alerts = TradingAlert.objects.filter(
                triggered_at__range=[start_date, end_date]
            )
            
            welfare_metrics['protection_metrics']['risk_alerts_generated'] = period_alerts.count()
            welfare_metrics['protection_metrics']['risk_alerts_resolved'] = period_alerts.filter(
                status=TradingAlert.AlertStatus.RESOLVED
            ).count()
            
            # Calculate welfare score (0-100)
            welfare_score = 100
            
            # KYC completion penalty
            if kyc_rate < 90:
                welfare_score -= (90 - kyc_rate) * 0.5
                welfare_metrics['areas_for_improvement'].append('Improve KYC completion rate')
            
            # Grievance resolution penalty
            if resolved_grievances.count() > 0:
                resolution_rate = (on_time_count / resolved_grievances.count()) * 100
                if resolution_rate < 80:
                    welfare_score -= (80 - resolution_rate) * 0.3
                    welfare_metrics['areas_for_improvement'].append('Improve grievance resolution time')
            
            # Risk alert resolution penalty
            if period_alerts.count() > 0:
                alert_resolution_rate = (welfare_metrics['protection_metrics']['risk_alerts_resolved'] / period_alerts.count()) * 100
                if alert_resolution_rate < 85:
                    welfare_score -= (85 - alert_resolution_rate) * 0.2
                    welfare_metrics['areas_for_improvement'].append('Improve risk alert resolution')
            
            # SEBI escalation penalty
            if welfare_metrics['protection_metrics']['escalations_to_sebi'] > active_investors * 0.01:
                welfare_score -= 10
                welfare_metrics['areas_for_improvement'].append('Reduce SEBI escalations through better internal resolution')
            
            welfare_metrics['welfare_score'] = max(0, round(welfare_score, 2))
            
            if not welfare_metrics['areas_for_improvement']:
                welfare_metrics['areas_for_improvement'].append('Continue current investor protection standards')
            
            return {
                'status': 'success',
                'metrics': welfare_metrics,
                'generated_at': end_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Investor welfare monitoring failed: {str(e)}")
            return {
                'status': 'error',
                'error': f'Welfare monitoring failed: {str(e)}'
            }