from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, UserProfile
from .utils import generate_otp, generate_verification_token, send_verification_email, is_otp_valid, send_welcome_email
from .serializers import UserRegistrationSerializer, UserSerializer, EmailVerificationSerializer, LoginSerializer

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and send email verification OTP
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        # Check if user already exists
        email = serializer.validated_data['email']
        username = serializer.validated_data['username']
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'A user with this email already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'A user with this username already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user but don't activate yet
        user = User.objects.create_user(
            email=email,
            username=username,
            password=serializer.validated_data['password'],
            first_name=serializer.validated_data['first_name'],
            last_name=serializer.validated_data['last_name'],
            is_active=False,  # User inactive until email verified
            email_verified=False
        )
        
        # Generate and send OTP
        otp_code = generate_otp()
        verification_token = generate_verification_token()
        
        user.email_verification_token = otp_code
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Send verification email
        email_sent = send_verification_email(user, otp_code)
        
        if email_sent:
            return Response({
                'message': 'Registration successful! Please check your email for the verification code.',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        else:
            # Delete user if email failed to send
            user.delete()
            return Response({
                'error': 'Failed to send verification email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify email with OTP code
    """
    serializer = EmailVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        user_id = serializer.validated_data['user_id']
        otp_code = serializer.validated_data['otp_code']
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.email_verified:
            return Response({
                'error': 'Email is already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP
        if is_otp_valid(user, otp_code):
            # Activate user
            user.is_active = True
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_sent_at = None
            user.save()
            
            # Send welcome email
            send_welcome_email(user)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'message': 'Email verified successfully! Welcome to ShareWise AI!',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid or expired verification code.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """
    Resend verification OTP
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'User with this email does not exist.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if user.email_verified:
        return Response({
            'error': 'Email is already verified.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new OTP
    otp_code = generate_otp()
    user.email_verification_token = otp_code
    user.email_verification_sent_at = timezone.now()
    user.save()
    
    # Send verification email
    email_sent = send_verification_email(user, otp_code)
    
    if email_sent:
        return Response({
            'message': 'Verification code sent successfully!'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Failed to send verification email. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Login user with email or username
    """
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        username_or_email = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        # Authenticate using custom backend
        user = authenticate(
            request=request,
            username=username_or_email,
            password=password
        )
        
        if user:
            if not user.is_active:
                return Response({
                    'error': 'Account is not active. Please verify your email first.',
                    'requires_verification': True,
                    'email': user.email
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.email_verified:
                return Response({
                    'error': 'Please verify your email before logging in.',
                    'requires_verification': True,
                    'email': user.email
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            return Response({
                'message': 'Login successful!',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """
    Logout user by blacklisting refresh token
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Logged out successfully!'
        }, status=status.HTTP_200_OK)
    except Exception:
        return Response({
            'error': 'Invalid token.'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """
    Update user profile
    """
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully!',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_roles(request):
    """
    Get current user role information and permissions
    """
    user = request.user
    
    role_info = {
        'user_id': str(user.id),
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'role_display': user.get_role_display(),
        'permissions': {
            'is_super_admin': user.is_super_admin(),
            'is_support_team': user.is_support_team(),
            'is_staff_member': user.is_staff_member(),
            'has_admin_access': user.has_admin_access(),
            'can_manage_users': user.can_manage_users(),
            'can_view_analytics': user.can_view_analytics(),
        },
        'subscription_tier': user.subscription_tier,
        'subscription_tier_display': user.get_subscription_tier_display(),
    }
    
    return Response(role_info, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_role_permissions(request):
    """
    Test specific role permissions - only for super admin and support team
    """
    user = request.user
    
    if not user.is_staff_member():
        return Response({
            'error': 'Access denied. This endpoint is only available for staff members.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    test_type = request.data.get('test_type', 'basic')
    
    test_results = {
        'user_role': user.role,
        'test_type': test_type,
        'timestamp': timezone.now().isoformat(),
        'tests': {}
    }
    
    if test_type == 'basic':
        # Basic role tests
        test_results['tests'] = {
            'authentication': True,
            'role_verification': user.is_staff_member(),
            'admin_access': user.has_admin_access(),
            'support_access': user.is_support_team() or user.is_super_admin(),
            'user_management': user.can_manage_users(),
            'analytics_access': user.can_view_analytics(),
        }
    
    elif test_type == 'advanced' and user.is_super_admin():
        # Advanced tests only for super admin
        test_results['tests'] = {
            'database_access': True,  # Could test actual DB queries
            'system_health': True,   # Could check system status
            'user_count': User.objects.count(),
            'staff_count': User.objects.filter(role__in=[User.Role.SUPER_ADMIN, User.Role.SUPPORT]).count(),
            'recent_registrations': User.objects.filter(created_at__gte=timezone.now() - timezone.timedelta(days=7)).count(),
        }
    
    elif test_type == 'support' and (user.is_support_team() or user.is_super_admin()):
        # Support-specific tests
        test_results['tests'] = {
            'ticket_access': True,
            'user_lookup': True,
            'analytics_read': user.can_view_analytics(),
            'user_assistance': True,
        }
    
    else:
        return Response({
            'error': 'Invalid test type or insufficient permissions'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(test_results, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_info(request):
    """
    Get system information - only for super admin and support team
    """
    user = request.user
    
    if not user.is_staff_member():
        return Response({
            'error': 'Access denied. This endpoint is only available for staff members.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    system_info = {
        'total_users': User.objects.count(),
        'verified_users': User.objects.filter(email_verified=True).count(),
        'super_admins': User.objects.filter(role=User.Role.SUPER_ADMIN).count(),
        'support_team': User.objects.filter(role=User.Role.SUPPORT).count(),
        'regular_users': User.objects.filter(role=User.Role.USER).count(),
        'sales_team': User.objects.filter(role=User.Role.SALES).count(),
    }
    
    # Additional info for super admin only
    if user.is_super_admin():
        system_info.update({
            'recent_registrations_24h': User.objects.filter(
                created_at__gte=timezone.now() - timezone.timedelta(hours=24)
            ).count(),
            'recent_registrations_7d': User.objects.filter(
                created_at__gte=timezone.now() - timezone.timedelta(days=7)
            ).count(),
            'subscription_breakdown': {
                'basic': User.objects.filter(subscription_tier=User.SubscriptionTier.BASIC).count(),
                'pro': User.objects.filter(subscription_tier=User.SubscriptionTier.PRO).count(),
                'enterprise': User.objects.filter(subscription_tier=User.SubscriptionTier.ENTERPRISE).count(),
            }
        })
    
    return Response(system_info, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """
    Get all users - only for super admin and support team
    """
    user = request.user
    
    # Only super admin and support staff can access this
    if not (user.is_super_admin() or user.is_support_team()):
        return Response({
            'error': 'Access denied. This endpoint is only available for super admin and support staff.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get all users with their profiles
    users = User.objects.select_related('profile').all().order_by('-date_joined')
    
    users_data = []
    for u in users:
        user_data = {
            'id': str(u.id),
            'email': u.email,
            'username': u.username,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'subscription_tier': u.subscription_tier,
            'is_active': u.is_active,
            'email_verified': u.email_verified,
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
        }
        users_data.append(user_data)
    
    return Response({
        'count': len(users_data),
        'results': users_data
    }, status=status.HTTP_200_OK)