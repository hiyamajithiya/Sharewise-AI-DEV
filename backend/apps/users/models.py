import uuid
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class CustomUser(AbstractUser):
    """Custom user model for ShareWise AI platform"""
    
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    
    class SubscriptionTier(models.TextChoices):
        ELITE = 'ELITE', 'Elite Plan'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(regex=r'^\+?[\d\s\-\(\)]{9,20}$', 
                               message="Phone number must contain 9-20 digits and can include +, spaces, dashes, and parentheses.")
    phone_number = models.CharField(validators=[phone_regex], max_length=25, blank=True)
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    
    subscription_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.ELITE
    )
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    
    # Additional profile fields
    timezone = models.CharField(max_length=50, default='Asia/Kolkata', blank=True)
    language = models.CharField(max_length=20, default='English', blank=True)
    currency = models.CharField(max_length=10, default='INR', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as username but allow login with username or email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users_customuser'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    def is_super_admin(self):
        """Check if user is a super admin"""
        return self.role == self.Role.SUPER_ADMIN
    
    def is_tenant_admin(self):
        """Check if user is a tenant admin"""
        return self.role == self.Role.TENANT_ADMIN
    
    def is_staff_member(self):
        """Check if user is staff (super admin only)"""
        return self.role == self.Role.SUPER_ADMIN
    
    def get_role_display_name(self):
        """Get human-readable role name"""
        return self.get_role_display()
    
    def has_admin_access(self):
        """Check if user has admin panel access"""
        return self.role == self.Role.SUPER_ADMIN
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role == self.Role.SUPER_ADMIN
    
    def can_view_analytics(self):
        """Check if user can view system analytics"""
        return self.role == self.Role.SUPER_ADMIN


class UserProfile(models.Model):
    """Extended user profile information"""
    
    class RiskTolerance(models.TextChoices):
        LOW = 'LOW', 'Conservative'
        MEDIUM = 'MEDIUM', 'Moderate'  
        HIGH = 'HIGH', 'Aggressive'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    
    # KYC Information
    pan_number = models.CharField(max_length=10, blank=True, null=True,
                                validators=[RegexValidator(regex=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', 
                                          message="Enter a valid PAN number")])
    aadhar_number = models.CharField(max_length=12, blank=True, null=True,
                                   validators=[RegexValidator(regex=r'^\d{12}$', 
                                             message="Enter a valid 12-digit Aadhar number")])
    
    # Trading Preferences
    risk_tolerance = models.CharField(
        max_length=20,
        choices=RiskTolerance.choices,
        default=RiskTolerance.MEDIUM
    )
    
    max_daily_loss = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00,
                                       help_text="Maximum daily loss limit in INR")
    
    preferred_brokers = models.JSONField(default=list, 
                                       help_text="List of preferred broker names")
    
    trading_preferences = models.JSONField(default=dict,
                                         help_text="User's trading configuration preferences")
    
    # Status
    kyc_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users_userprofile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.email} Profile"