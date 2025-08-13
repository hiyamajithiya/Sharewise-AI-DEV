from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register_user, name='register'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile endpoints
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    
    # Role management endpoints
    path('roles/', views.get_user_roles, name='user_roles'),
    path('roles/test/', views.test_role_permissions, name='test_role_permissions'),
    path('system/info/', views.get_system_info, name='system_info'),
    
    # Admin endpoints
    path('admin/all-users/', views.get_all_users, name='get_all_users'),
]