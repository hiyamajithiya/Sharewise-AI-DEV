"""
SEBI Compliance Models for ShareWise AI Trading Platform
Implements regulatory requirements as per SEBI guidelines
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import json

User = get_user_model()


class SEBICompliance(models.Model):
    """Track overall SEBI compliance status"""
    
    class ComplianceStatus(models.TextChoices):
        COMPLIANT = 'COMPLIANT', 'Compliant'
        NON_COMPLIANT = 'NON_COMPLIANT', 'Non-Compliant'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        PENDING = 'PENDING', 'Pending'

    platform_name = models.CharField(max_length=200, default="ShareWise AI")
    registration_number = models.CharField(max_length=100, blank=True, null=True)
    license_type = models.CharField(max_length=100, default="Investment Adviser")
    status = models.CharField(max_length=20, choices=ComplianceStatus.choices, default=ComplianceStatus.PENDING)
    last_audit_date = models.DateTimeField(null=True, blank=True)
    next_audit_date = models.DateTimeField(null=True, blank=True)
    compliance_officer = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_sebi_status'
        verbose_name = 'SEBI Compliance Status'


class KYCDocument(models.Model):
    """KYC Documents as per SEBI requirements"""
    
    class DocumentType(models.TextChoices):
        PAN_CARD = 'PAN', 'PAN Card'
        AADHAAR = 'AADHAAR', 'Aadhaar Card'
        PASSPORT = 'PASSPORT', 'Passport'
        DRIVING_LICENSE = 'DL', 'Driving License'
        VOTER_ID = 'VOTER_ID', 'Voter ID'
        BANK_STATEMENT = 'BANK_STMT', 'Bank Statement'
        INCOME_PROOF = 'INCOME', 'Income Proof'
        ADDRESS_PROOF = 'ADDRESS', 'Address Proof'
        PHOTOGRAPH = 'PHOTO', 'Photograph'
        SIGNATURE = 'SIGNATURE', 'Signature'
    
    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    document_number = models.CharField(max_length=100)
    document_file = models.FileField(upload_to='kyc_documents/', null=True, blank=True)
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_kyc_documents')
    verification_date = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_kyc_documents'
        unique_together = ['user', 'document_type']


class InvestorProfile(models.Model):
    """Investor Profile as per SEBI KYC requirements"""
    
    class InvestorCategory(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', 'Individual'
        HUF = 'HUF', 'Hindu Undivided Family'
        COMPANY = 'COMPANY', 'Company'
        PARTNERSHIP = 'PARTNERSHIP', 'Partnership Firm'
        TRUST = 'TRUST', 'Trust'
        FPI = 'FPI', 'Foreign Portfolio Investor'
        NRI = 'NRI', 'Non-Resident Indian'
    
    class RiskProfile(models.TextChoices):
        LOW = 'LOW', 'Low Risk'
        MODERATE = 'MODERATE', 'Moderate Risk'
        HIGH = 'HIGH', 'High Risk'
        VERY_HIGH = 'VERY_HIGH', 'Very High Risk'
    
    class IncomeRange(models.TextChoices):
        BELOW_1L = '<100000', 'Below ₹1 Lakh'
        L1_L5 = '100000-500000', '₹1-5 Lakhs'
        L5_L10 = '500000-1000000', '₹5-10 Lakhs'
        L10_L25 = '1000000-2500000', '₹10-25 Lakhs'
        L25_L50 = '2500000-5000000', '₹25-50 Lakhs'
        L50_L1C = '5000000-10000000', '₹50 Lakhs - 1 Crore'
        ABOVE_1C = '>10000000', 'Above ₹1 Crore'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='investor_profile')
    
    # Basic Information
    pan_number = models.CharField(max_length=10, unique=True)
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    category = models.CharField(max_length=20, choices=InvestorCategory.choices, default=InvestorCategory.INDIVIDUAL)
    
    # Contact Information
    mobile_number = models.CharField(max_length=15)
    email_verified = models.BooleanField(default=False)
    
    # Address
    address_line1 = models.CharField(max_length=200)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    country = models.CharField(max_length=100, default='India')
    
    # Financial Information
    annual_income = models.CharField(max_length=20, choices=IncomeRange.choices)
    net_worth = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    source_of_funds = models.TextField()
    
    # Trading Information
    trading_experience = models.PositiveIntegerField(help_text="Years of trading experience")
    risk_profile = models.CharField(max_length=20, choices=RiskProfile.choices)
    investment_objectives = models.TextField()
    
    # Compliance Status
    kyc_status = models.CharField(max_length=20, choices=KYCDocument.VerificationStatus.choices, default=KYCDocument.VerificationStatus.PENDING)
    kyc_completion_date = models.DateTimeField(null=True, blank=True)
    last_kyc_update = models.DateTimeField(null=True, blank=True)
    
    # FATCA/CRS Compliance
    is_us_person = models.BooleanField(default=False)
    tax_residency = models.CharField(max_length=100, default='India')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_investor_profile'


class RiskManagement(models.Model):
    """Risk Management as per SEBI guidelines"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='risk_management')
    
    # Position Limits
    max_position_size = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('100000'))
    max_daily_loss = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('10000'))
    max_monthly_loss = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('50000'))
    
    # Leverage Limits
    max_leverage_equity = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'))
    max_leverage_fno = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'))
    
    # Trading Limits
    max_orders_per_day = models.PositiveIntegerField(default=100)
    max_turnover_per_day = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('1000000'))
    
    # Circuit Breaker
    enable_circuit_breaker = models.BooleanField(default=True)
    circuit_breaker_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10.00'))
    
    # Cool-off Period
    cool_off_period_minutes = models.PositiveIntegerField(default=30)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_risk_management'


class AuditTrail(models.Model):
    """Comprehensive audit trail for SEBI compliance"""
    
    class ActionType(models.TextChoices):
        LOGIN = 'LOGIN', 'User Login'
        LOGOUT = 'LOGOUT', 'User Logout'
        TRADE_ORDER = 'TRADE_ORDER', 'Trade Order'
        TRADE_EXECUTION = 'TRADE_EXECUTION', 'Trade Execution'
        TRADE_CANCELLATION = 'TRADE_CANCELLATION', 'Trade Cancellation'
        FUND_TRANSFER = 'FUND_TRANSFER', 'Fund Transfer'
        KYC_UPDATE = 'KYC_UPDATE', 'KYC Update'
        PROFILE_UPDATE = 'PROFILE_UPDATE', 'Profile Update'
        ADVISORY_VIEW = 'ADVISORY_VIEW', 'Advisory View'
        RESEARCH_DOWNLOAD = 'RESEARCH_DOWNLOAD', 'Research Download'
        SYSTEM_ALERT = 'SYSTEM_ALERT', 'System Alert'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_trails')
    action_type = models.CharField(max_length=30, choices=ActionType.choices)
    action_description = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    session_id = models.CharField(max_length=100, blank=True)
    
    # Additional Data
    metadata = models.JSONField(default=dict, blank=True)
    
    # Compliance Fields
    compliance_status = models.CharField(max_length=20, default='COMPLIANT')
    alert_triggered = models.BooleanField(default=False)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'compliance_audit_trail'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['compliance_status']),
        ]


class TradingAlert(models.Model):
    """Trading alerts for compliance monitoring"""
    
    class AlertType(models.TextChoices):
        POSITION_LIMIT = 'POSITION_LIMIT', 'Position Limit Breach'
        DAILY_LOSS = 'DAILY_LOSS', 'Daily Loss Limit'
        UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY', 'Unusual Trading Activity'
        RAPID_TRADING = 'RAPID_TRADING', 'Rapid Trading'
        LARGE_ORDER = 'LARGE_ORDER', 'Large Order Size'
        CIRCUIT_BREAKER = 'CIRCUIT_BREAKER', 'Circuit Breaker Triggered'
        KYC_EXPIRED = 'KYC_EXPIRED', 'KYC Documents Expired'
        REGULATORY = 'REGULATORY', 'Regulatory Violation'
    
    class AlertStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        RESOLVED = 'RESOLVED', 'Resolved'
        FALSE_POSITIVE = 'FALSE_POSITIVE', 'False Positive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trading_alerts')
    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    severity = models.CharField(max_length=10, choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')])
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Alert Data
    trigger_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    threshold_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=AlertStatus.choices, default=AlertStatus.ACTIVE)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolution_notes = models.TextField(blank=True)
    
    # Timestamps
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'compliance_trading_alerts'


class RegulatoryReporting(models.Model):
    """Regulatory reporting requirements"""
    
    class ReportType(models.TextChoices):
        DAILY_TRADES = 'DAILY_TRADES', 'Daily Trading Report'
        MONTHLY_CLIENT = 'MONTHLY_CLIENT', 'Monthly Client Report'
        QUARTERLY_COMPLIANCE = 'QUARTERLY_COMPLIANCE', 'Quarterly Compliance Report'
        ANNUAL_RETURN = 'ANNUAL_RETURN', 'Annual Return'
        INCIDENT_REPORT = 'INCIDENT_REPORT', 'Incident Report'
        AML_REPORT = 'AML_REPORT', 'AML Suspicious Transaction Report'
    
    class ReportStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        GENERATED = 'GENERATED', 'Generated'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        ACKNOWLEDGED = 'ACKNOWLEDGED', 'Acknowledged'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    report_period_start = models.DateTimeField()
    report_period_end = models.DateTimeField()
    
    # Report Content
    report_data = models.JSONField(default=dict)
    report_file = models.FileField(upload_to='regulatory_reports/', null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.DRAFT)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    submission_reference = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    generated_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'compliance_regulatory_reporting'


class InvestorGrievance(models.Model):
    """Investor grievance mechanism as per SEBI requirements"""
    
    class GrievanceType(models.TextChoices):
        TRADING_ISSUE = 'TRADING_ISSUE', 'Trading Issue'
        SETTLEMENT_DELAY = 'SETTLEMENT_DELAY', 'Settlement Delay'
        UNAUTHORIZED_TRADE = 'UNAUTHORIZED_TRADE', 'Unauthorized Trade'
        SYSTEM_ISSUE = 'SYSTEM_ISSUE', 'System/Technical Issue'
        ADVISORY_COMPLAINT = 'ADVISORY_COMPLAINT', 'Advisory Complaint'
        BILLING_ISSUE = 'BILLING_ISSUE', 'Billing Issue'
        KYC_ISSUE = 'KYC_ISSUE', 'KYC Issue'
        OTHER = 'OTHER', 'Other'
    
    class GrievanceStatus(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'
        ESCALATED = 'ESCALATED', 'Escalated to SEBI'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complainant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grievances')
    
    # Grievance Details
    grievance_type = models.CharField(max_length=30, choices=GrievanceType.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    # Supporting Documents
    supporting_documents = models.JSONField(default=list, blank=True)
    
    # Status and Resolution
    status = models.CharField(max_length=20, choices=GrievanceStatus.choices, default=GrievanceStatus.OPEN)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_grievances')
    resolution_notes = models.TextField(blank=True)
    
    # SLA Compliance
    expected_resolution_date = models.DateTimeField()
    actual_resolution_date = models.DateTimeField(null=True, blank=True)
    
    # SCORES (SEBI Complaint Redress System) Integration
    scores_reference = models.CharField(max_length=100, blank=True)
    escalated_to_sebi = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_investor_grievance'


class ComplianceChecklist(models.Model):
    """Daily compliance checklist"""
    
    date = models.DateField(unique=True)
    
    # Daily Checks
    kyc_verification_completed = models.BooleanField(default=False)
    risk_limits_monitored = models.BooleanField(default=False)
    unusual_activity_checked = models.BooleanField(default=False)
    system_alerts_reviewed = models.BooleanField(default=False)
    client_complaints_addressed = models.BooleanField(default=False)
    regulatory_updates_reviewed = models.BooleanField(default=False)
    
    # Data Integrity
    trade_data_verified = models.BooleanField(default=False)
    client_data_backed_up = models.BooleanField(default=False)
    audit_logs_generated = models.BooleanField(default=False)
    
    # Reports
    daily_reports_generated = models.BooleanField(default=False)
    exception_reports_reviewed = models.BooleanField(default=False)
    
    # Sign-off
    compliance_officer_signoff = models.BooleanField(default=False)
    signed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sign_off_time = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compliance_daily_checklist'
        ordering = ['-date']