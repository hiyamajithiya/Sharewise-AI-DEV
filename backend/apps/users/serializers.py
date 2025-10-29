from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser, UserProfile


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(min_length=3, max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class EmailVerificationSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    otp_code = serializers.CharField(min_length=6, max_length=6)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        help_text="Username or email address"
    )
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'pan_number', 'aadhar_number', 'risk_tolerance',
            'max_daily_loss', 'preferred_brokers', 'trading_preferences',
            'kyc_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'kyc_verified', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'subscription_tier', 'phone_number', 'is_active',
            'email_verified', 'date_joined', 'last_login', 'profile',
            'timezone', 'language', 'currency'
        ]
        read_only_fields = [
            'id', 'role', 'subscription_tier', 'is_active',
            'email_verified', 'date_joined', 'last_login'
        ]
    
    def update(self, instance, validated_data):
        # Handle profile updates if needed
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return data
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class RoleTestSerializer(serializers.Serializer):
    test_type = serializers.ChoiceField(
        choices=[('basic', 'Basic Tests'), ('advanced', 'Advanced Tests')],
        default='basic'
    )


class AdminUserCreationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(min_length=3, max_length=150)
    # Optional phone number (accept either phone_number or mobile_number from clients)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=50)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    role = serializers.ChoiceField(choices=CustomUser.Role.choices, default=CustomUser.Role.USER)
    subscription_tier = serializers.ChoiceField(choices=CustomUser.SubscriptionTier.choices, default=CustomUser.SubscriptionTier.PRO)
    is_active = serializers.BooleanField(default=True)
    email_verified = serializers.BooleanField(default=True)
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    subscription_tier_display = serializers.CharField(source='get_subscription_tier_display', read_only=True)
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'role_display', 'subscription_tier', 'subscription_tier_display',
            'permissions', 'is_active', 'email_verified', 'date_joined'
        ]
        read_only_fields = fields
    
    def get_permissions(self, obj):
        return {
            'is_super_admin': obj.is_super_admin(),
            'is_staff_member': obj.is_staff_member(),
            'has_admin_access': obj.has_admin_access(),
            'can_manage_users': obj.can_manage_users(),
            'can_view_analytics': obj.can_view_analytics(),
        }