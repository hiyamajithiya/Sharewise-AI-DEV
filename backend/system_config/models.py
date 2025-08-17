from django.db import models
from django.core.validators import EmailValidator
from cryptography.fernet import Fernet
from django.conf import settings
import base64


def generate_encryption_key():
    """Generate a new encryption key"""
    return base64.urlsafe_b64encode(Fernet.generate_key()).decode()


class EmailConfiguration(models.Model):
    """
    Stores email configuration settings for the system.
    Only one configuration should exist at a time.
    """
    
    class EmailProvider(models.TextChoices):
        GMAIL = 'GMAIL', 'Gmail'
        OUTLOOK = 'OUTLOOK', 'Outlook'
        SENDGRID = 'SENDGRID', 'SendGrid'
        MAILGUN = 'MAILGUN', 'Mailgun'
        AWS_SES = 'AWS_SES', 'Amazon SES'
        CUSTOM = 'CUSTOM', 'Custom SMTP'
    
    class AuthMethod(models.TextChoices):
        PASSWORD = 'PASSWORD', 'Username/Password'
        OAUTH2 = 'OAUTH2', 'OAuth2'
        API_KEY = 'API_KEY', 'API Key'
    
    # Basic Settings
    provider = models.CharField(
        max_length=20,
        choices=EmailProvider.choices,
        default=EmailProvider.GMAIL,
        help_text="Email service provider"
    )
    
    auth_method = models.CharField(
        max_length=20,
        choices=AuthMethod.choices,
        default=AuthMethod.PASSWORD,
        help_text="Authentication method"
    )
    
    is_active = models.BooleanField(
        default=False,
        help_text="Enable email sending"
    )
    
    # SMTP Settings
    smtp_host = models.CharField(
        max_length=255,
        default='smtp.gmail.com',
        help_text="SMTP server hostname"
    )
    
    smtp_port = models.IntegerField(
        default=587,
        help_text="SMTP server port (587 for TLS, 465 for SSL)"
    )
    
    use_tls = models.BooleanField(
        default=True,
        help_text="Use TLS encryption"
    )
    
    use_ssl = models.BooleanField(
        default=False,
        help_text="Use SSL encryption"
    )
    
    # Credentials
    email_address = models.EmailField(
        validators=[EmailValidator()],
        help_text="Email address to send from"
    )
    
    email_password = models.TextField(
        blank=True,
        null=True,
        help_text="Email password or app-specific password (encrypted)"
    )
    
    # OAuth2 Settings
    oauth2_client_id = models.TextField(
        blank=True,
        null=True,
        help_text="OAuth2 Client ID"
    )
    
    oauth2_client_secret = models.TextField(
        blank=True,
        null=True,
        help_text="OAuth2 Client Secret (encrypted)"
    )
    
    oauth2_refresh_token = models.TextField(
        blank=True,
        null=True,
        help_text="OAuth2 Refresh Token (encrypted)"
    )
    
    # API Key Settings
    api_key = models.TextField(
        blank=True,
        null=True,
        help_text="API Key for service providers (encrypted)"
    )
    
    # Display Settings
    from_name = models.CharField(
        max_length=100,
        default='ShareWise AI',
        help_text="Display name for emails"
    )
    
    # Test Settings
    test_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email address for testing configuration"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_configs'
    )
    
    class Meta:
        verbose_name = "Email Configuration"
        verbose_name_plural = "Email Configurations"
        ordering = ['-updated_at']
    
    def save(self, *args, **kwargs):
        # Ensure only one active configuration exists
        if self.is_active:
            EmailConfiguration.objects.exclude(pk=self.pk).update(is_active=False)
        
        # Encrypt sensitive fields before saving if they're not already encrypted
        if self.email_password and not self.is_field_encrypted(self.email_password):
            self.email_password = self.encrypt_field(self.email_password)
        
        if self.oauth2_client_secret and not self.is_field_encrypted(self.oauth2_client_secret):
            self.oauth2_client_secret = self.encrypt_field(self.oauth2_client_secret)
            
        if self.oauth2_refresh_token and not self.is_field_encrypted(self.oauth2_refresh_token):
            self.oauth2_refresh_token = self.encrypt_field(self.oauth2_refresh_token)
            
        if self.api_key and not self.is_field_encrypted(self.api_key):
            self.api_key = self.encrypt_field(self.api_key)
        
        super().save(*args, **kwargs)
    
    def encrypt_field(self, value):
        """Encrypt a sensitive field"""
        if not value:
            return value
        key = settings.EMAIL_ENCRYPTION_KEY if hasattr(settings, 'EMAIL_ENCRYPTION_KEY') else settings.SECRET_KEY[:32].encode()
        if isinstance(key, str):
            key = key.encode()
        # Ensure key is 32 bytes
        key = base64.urlsafe_b64encode(key.ljust(32)[:32])
        f = Fernet(key)
        return f.encrypt(value.encode()).decode()
    
    def decrypt_field(self, encrypted_value):
        """Decrypt a sensitive field"""
        if not encrypted_value:
            return ''
        
        try:
            key = settings.EMAIL_ENCRYPTION_KEY if hasattr(settings, 'EMAIL_ENCRYPTION_KEY') else settings.SECRET_KEY[:32].encode()
            if isinstance(key, str):
                key = key.encode()
            # Ensure key is 32 bytes
            key = base64.urlsafe_b64encode(key.ljust(32)[:32])
            f = Fernet(key)
            return f.decrypt(encrypted_value.encode()).decode()
        except Exception:
            return encrypted_value  # Return as-is if decryption fails
    
    def is_field_encrypted(self, value):
        """Check if a field is already encrypted"""
        if not value:
            return False
        try:
            # Try to decode as base64 (encrypted values are base64)
            base64.b64decode(value)
            return True
        except Exception:
            return False
    
    # Legacy methods for backward compatibility
    def encrypt_password(self, password):
        """Encrypt the email password (legacy method)"""
        return self.encrypt_field(password)
    
    def decrypt_password(self):
        """Decrypt the email password (legacy method)"""
        return self.decrypt_field(self.email_password)
    
    def is_password_encrypted(self):
        """Check if password is already encrypted (legacy method)"""
        return self.is_field_encrypted(self.email_password)
    
    # New methods for OAuth2 and API keys
    def decrypt_oauth2_client_secret(self):
        """Decrypt OAuth2 client secret"""
        return self.decrypt_field(self.oauth2_client_secret)
    
    def decrypt_oauth2_refresh_token(self):
        """Decrypt OAuth2 refresh token"""
        return self.decrypt_field(self.oauth2_refresh_token)
    
    def decrypt_api_key(self):
        """Decrypt API key"""
        return self.decrypt_field(self.api_key)
    
    def get_smtp_settings(self):
        """Get SMTP settings based on provider"""
        if self.provider == self.EmailProvider.GMAIL:
            return {
                'host': 'smtp.gmail.com',
                'port': 587,
                'use_tls': True,
                'use_ssl': False
            }
        elif self.provider == self.EmailProvider.OUTLOOK:
            return {
                'host': 'smtp-mail.outlook.com',
                'port': 587,
                'use_tls': True,
                'use_ssl': False
            }
        elif self.provider == self.EmailProvider.SENDGRID:
            return {
                'host': 'smtp.sendgrid.net',
                'port': 587,
                'use_tls': True,
                'use_ssl': False
            }
        elif self.provider == self.EmailProvider.MAILGUN:
            return {
                'host': 'smtp.mailgun.org',
                'port': 587,
                'use_tls': True,
                'use_ssl': False
            }
        elif self.provider == self.EmailProvider.AWS_SES:
            return {
                'host': 'email-smtp.us-east-1.amazonaws.com',
                'port': 587,
                'use_tls': True,
                'use_ssl': False
            }
        else:
            return {
                'host': self.smtp_host,
                'port': self.smtp_port,
                'use_tls': self.use_tls,
                'use_ssl': self.use_ssl
            }
    
    def get_from_email(self):
        """Get formatted from email address"""
        return f"{self.from_name} <{self.email_address}>"
    
    def __str__(self):
        return f"{self.provider} - {self.email_address} ({'Active' if self.is_active else 'Inactive'})"


class SystemConfiguration(models.Model):
    """
    General system configuration settings
    """
    
    # Site Settings
    site_name = models.CharField(
        max_length=100,
        default='ShareWise AI',
        help_text="Name of the platform"
    )
    
    site_url = models.URLField(
        default='http://localhost:3000',
        help_text="Frontend URL of the platform"
    )
    
    # Feature Toggles
    enable_user_registration = models.BooleanField(
        default=True,
        help_text="Allow new users to register"
    )
    
    require_email_verification = models.BooleanField(
        default=True,
        help_text="Require email verification for new users"
    )
    
    maintenance_mode = models.BooleanField(
        default=False,
        help_text="Enable maintenance mode"
    )
    
    maintenance_message = models.TextField(
        blank=True,
        default="The system is currently under maintenance. Please try again later.",
        help_text="Message to display during maintenance"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_configs'
    )
    
    class Meta:
        verbose_name = "System Configuration"
        verbose_name_plural = "System Configurations"
    
    def save(self, *args, **kwargs):
        # Ensure only one configuration exists
        if not self.pk and SystemConfiguration.objects.exists():
            # Update existing configuration instead of creating new
            existing = SystemConfiguration.objects.first()
            for field in self._meta.fields:
                if field.name not in ['id', 'created_at']:
                    setattr(existing, field.name, getattr(self, field.name))
            existing.save()
            return existing
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"System Configuration - {self.site_name}"