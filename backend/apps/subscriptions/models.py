import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class SubscriptionPlan(models.Model):
    """Subscription plans for ShareWise AI platform"""
    
    class PlanType(models.TextChoices):
        FREE = 'FREE', 'Free Plan'
        PRO = 'PRO', 'Pro Plan'
        ELITE = 'ELITE', 'Elite Plan'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    plan_type = models.CharField(max_length=10, choices=PlanType.choices, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    
    # Features
    backtests_per_day = models.IntegerField()
    live_strategies = models.IntegerField()
    ai_model_studio_access = models.BooleanField(default=False)
    marketplace_publishing = models.BooleanField(default=False)
    institutional_models = models.BooleanField(default=False)
    unlimited_backtests = models.BooleanField(default=False)
    unlimited_strategies = models.BooleanField(default=False)
    
    # Additional features
    priority_support = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    custom_indicators = models.BooleanField(default=False)
    
    description = models.TextField()
    features = models.JSONField(default=list, help_text="List of feature descriptions")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - ₹{self.price}/month"


class Subscription(models.Model):
    """User subscriptions"""
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        CANCELLED = 'CANCELLED', 'Cancelled'
        PENDING = 'PENDING', 'Pending Payment'
        TRIAL = 'TRIAL', 'Trial Period'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Dates
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Billing
    next_billing_date = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    
    # Usage tracking
    backtests_used_today = models.IntegerField(default=0)
    last_backtest_reset = models.DateField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"
    
    def is_active(self):
        """Check if subscription is currently active"""
        if self.status not in [self.Status.ACTIVE, self.Status.TRIAL]:
            return False
        
        if self.status == self.Status.TRIAL and self.trial_end_date:
            return timezone.now() <= self.trial_end_date
        
        if self.end_date:
            return timezone.now() <= self.end_date
        
        return True
    
    def activate(self, duration_days=30):
        """Activate the subscription"""
        self.status = self.Status.ACTIVE
        self.start_date = timezone.now()
        self.end_date = self.start_date + timedelta(days=duration_days)
        self.next_billing_date = self.end_date
        self.save()
    
    def cancel(self):
        """Cancel the subscription"""
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.auto_renew = False
        self.save()
    
    def can_use_backtest(self):
        """Check if user can perform another backtest today"""
        if not self.is_active():
            return False
        
        # Reset daily counter if needed
        today = timezone.now().date()
        if self.last_backtest_reset < today:
            self.backtests_used_today = 0
            self.last_backtest_reset = today
            self.save()
        
        # Check limits
        if self.plan.unlimited_backtests:
            return True
        
        return self.backtests_used_today < self.plan.backtests_per_day
    
    def use_backtest(self):
        """Record a backtest usage"""
        if self.can_use_backtest():
            self.backtests_used_today += 1
            self.save()
            return True
        return False


class Payment(models.Model):
    """Payment records for subscriptions"""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
    
    class PaymentMethod(models.TextChoices):
        RAZORPAY = 'RAZORPAY', 'Razorpay'
        STRIPE = 'STRIPE', 'Stripe'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        FREE_TRIAL = 'FREE_TRIAL', 'Free Trial'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    
    # Payment gateway details
    gateway_payment_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_order_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_signature = models.CharField(max_length=500, blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Invoice details
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    invoice_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    failure_reason = models.TextField(blank=True)
    refund_reason = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.invoice_number or self.id} - {self.amount} {self.currency} ({self.status})"
    
    def mark_successful(self, gateway_payment_id=None, gateway_signature=None):
        """Mark payment as successful"""
        self.status = self.Status.SUCCESS
        self.paid_at = timezone.now()
        if gateway_payment_id:
            self.gateway_payment_id = gateway_payment_id
        if gateway_signature:
            self.gateway_signature = gateway_signature
        
        # Generate invoice number
        if not self.invoice_number:
            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m')}-{str(self.id)[:8].upper()}"
            self.invoice_date = timezone.now()
        
        self.save()
        
        # Activate subscription
        if self.subscription.status == Subscription.Status.PENDING:
            self.subscription.activate()
    
    def mark_failed(self, reason=""):
        """Mark payment as failed"""
        self.status = self.Status.FAILED
        self.failed_at = timezone.now()
        self.failure_reason = reason
        self.save()


class UsageTracking(models.Model):
    """Track user usage of various features"""
    
    class FeatureType(models.TextChoices):
        BACKTEST = 'BACKTEST', 'Backtest'
        LIVE_STRATEGY = 'LIVE_STRATEGY', 'Live Strategy'
        MODEL_TRAINING = 'MODEL_TRAINING', 'Model Training'
        API_CALL = 'API_CALL', 'API Call'
        MARKET_DATA = 'MARKET_DATA', 'Market Data'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='usage_tracking')
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage_tracking')
    
    feature_type = models.CharField(max_length=20, choices=FeatureType.choices)
    usage_count = models.IntegerField(default=0)
    usage_date = models.DateField()
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'feature_type', 'usage_date']
        ordering = ['-usage_date', 'feature_type']
    
    def __str__(self):
        return f"{self.user.email} - {self.feature_type} on {self.usage_date}: {self.usage_count}"