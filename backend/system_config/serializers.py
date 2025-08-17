from rest_framework import serializers
from .models import EmailConfiguration, SystemConfiguration


class EmailConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for EmailConfiguration"""
    
    # Don't send the actual password to frontend, only whether it's set
    has_password = serializers.SerializerMethodField()
    # Allow password to be write-only
    email_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = EmailConfiguration
        fields = [
            'id', 'provider', 'is_active', 'smtp_host', 'smtp_port',
            'use_tls', 'use_ssl', 'email_address', 'email_password',
            'from_name', 'test_email', 'has_password', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_has_password(self, obj):
        """Check if password is set"""
        return bool(obj.email_password)
    
    def create(self, validated_data):
        """Create email configuration"""
        # Set the user who created this
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update email configuration"""
        # Set the user who updated this
        validated_data['updated_by'] = self.context['request'].user
        
        # If password is not provided or is empty, keep the existing password
        if 'email_password' in validated_data and not validated_data['email_password']:
            validated_data.pop('email_password')
        
        return super().update(instance, validated_data)


class EmailTestSerializer(serializers.Serializer):
    """Serializer for testing email configuration"""
    test_email = serializers.EmailField(required=True)
    test_message = serializers.CharField(required=False, default="This is a test email from ShareWise AI")


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for SystemConfiguration"""
    
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'site_name', 'site_url', 'enable_user_registration',
            'require_email_verification', 'maintenance_mode',
            'maintenance_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create system configuration"""
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update system configuration"""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)