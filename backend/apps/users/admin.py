from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'email_verified')
    
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'email_verified', 'role')
    
    search_fields = ('email', 'username', 'first_name', 'last_name')
    
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Account Info', {'fields': ('role', 'subscription_tier', 'phone_number', 'email_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Account Info', {'fields': ('role', 'subscription_tier', 'phone_number', 'email_verified')}),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'risk_tolerance', 'kyc_verified', 'created_at')
    list_filter = ('risk_tolerance', 'kyc_verified')
    search_fields = ('user__email', 'user__username', 'pan_number')
    readonly_fields = ('created_at', 'updated_at')