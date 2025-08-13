from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'subscription_tier', 'is_active', 'date_joined']
    list_filter = ['role', 'subscription_tier', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'subscription_tier', 'phone_number')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'role', 'subscription_tier', 'phone_number')}),
    )
    
    inlines = [UserProfileInline]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'risk_tolerance', 'max_daily_loss', 'kyc_verified', 'created_at']
    list_filter = ['risk_tolerance', 'kyc_verified', 'created_at']
    search_fields = ['user__email', 'user__username', 'pan_number']
    readonly_fields = ['created_at', 'updated_at']