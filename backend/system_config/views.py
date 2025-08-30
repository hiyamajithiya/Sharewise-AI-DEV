from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.core.cache import cache
from .models import EmailConfiguration, SystemConfiguration
from .serializers import (
    EmailConfigurationSerializer,
    SystemConfigurationSerializer,
    EmailTestSerializer
)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def email_configuration(request):
    """
    Get, create or update email configuration
    Only super admins can access this
    """
    user = request.user
    
    # Check if user is super admin
    if not user.is_super_admin():
        return Response({
            'error': 'Only super admins can manage email configuration'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Check cache first for email configuration
        cache_key = "email_configuration_active"
        cached_config = cache.get(cache_key)
        
        if cached_config:
            return Response(cached_config)
        
        # Get current email configuration from database
        config = EmailConfiguration.objects.filter(is_active=True).first()
        if config:
            serializer = EmailConfigurationSerializer(config)
            config_data = serializer.data
            
            # Cache for 30 minutes (config doesn't change often)
            cache.set(cache_key, config_data, timeout=1800)
            
            return Response(config_data)
        else:
            # Return empty configuration
            empty_config = {
                'is_active': False,
                'provider': 'GMAIL',
                'message': 'No email configuration found'
            }
            
            # Cache empty response for shorter time (5 minutes)
            cache.set(cache_key, empty_config, timeout=300)
            
            return Response(empty_config)
    
    elif request.method == 'POST':
        # Create new email configuration
        serializer = EmailConfigurationSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Email configuration created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        # Update existing configuration
        config = EmailConfiguration.objects.filter(is_active=True).first()
        
        if not config:
            # Create new if doesn't exist
            serializer = EmailConfigurationSerializer(
                data=request.data,
                context={'request': request}
            )
        else:
            # Update existing
            serializer = EmailConfigurationSerializer(
                config,
                data=request.data,
                partial=True,
                context={'request': request}
            )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Email configuration updated successfully',
                'data': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email_configuration(request):
    """
    Test email configuration by sending a test email
    """
    user = request.user
    
    # Check if user is super admin
    if not user.is_super_admin():
        return Response({
            'error': 'Only super admins can test email configuration'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = EmailTestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Get active email configuration
    config = EmailConfiguration.objects.filter(is_active=True).first()
    
    if not config:
        return Response({
            'error': 'No active email configuration found. Please configure email settings first.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    test_email = serializer.validated_data['test_email']
    test_message = serializer.validated_data.get('test_message', 'This is a test email from ShareWise AI')
    
    try:
        # Get SMTP settings
        smtp_settings = config.get_smtp_settings()
        
        # Create SMTP connection
        if smtp_settings['use_ssl']:
            server = smtplib.SMTP_SSL(smtp_settings['host'], smtp_settings['port'])
        else:
            server = smtplib.SMTP(smtp_settings['host'], smtp_settings['port'])
            if smtp_settings['use_tls']:
                server.starttls()
        
        # Login to SMTP server
        server.login(config.email_address, config.decrypt_password())
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Test Email - ShareWise AI Configuration'
        msg['From'] = config.get_from_email()
        msg['To'] = test_email
        
        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
                .success {{ color: #28a745; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>ShareWise AI - Email Configuration Test</h2>
                </div>
                <div class="content">
                    <p class="success">✅ Email configuration is working successfully!</p>
                    <p>{test_message}</p>
                    <hr>
                    <p><strong>Configuration Details:</strong></p>
                    <ul>
                        <li>Provider: {config.provider}</li>
                        <li>From Email: {config.email_address}</li>
                        <li>SMTP Host: {smtp_settings['host']}</li>
                        <li>SMTP Port: {smtp_settings['port']}</li>
                    </ul>
                    <p>You can now send emails from ShareWise AI platform.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text content
        text_content = f"""
        ShareWise AI - Email Configuration Test
        
        ✅ Email configuration is working successfully!
        
        {test_message}
        
        Configuration Details:
        - Provider: {config.provider}
        - From Email: {config.email_address}
        - SMTP Host: {smtp_settings['host']}
        - SMTP Port: {smtp_settings['port']}
        
        You can now send emails from ShareWise AI platform.
        """
        
        # Attach parts
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        return Response({
            'success': True,
            'message': f'Test email sent successfully to {test_email}'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to send test email: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def system_configuration(request):
    """
    Get or update system configuration
    Only super admins can access this
    """
    user = request.user
    
    # Check if user is super admin
    if not user.is_super_admin():
        return Response({
            'error': 'Only super admins can manage system configuration'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Get or create system configuration
        config, created = SystemConfiguration.objects.get_or_create(
            defaults={'updated_by': user}
        )
        serializer = SystemConfigurationSerializer(config)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Update system configuration
        config, created = SystemConfiguration.objects.get_or_create(
            defaults={'updated_by': user}
        )
        
        serializer = SystemConfigurationSerializer(
            config,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'System configuration updated successfully',
                'data': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_email_backend():
    """
    Get email backend configuration from database
    Returns a dictionary with email settings
    """
    config = EmailConfiguration.objects.filter(is_active=True).first()
    
    if not config:
        # Return default settings from Django settings
        return {
            'EMAIL_BACKEND': getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend'),
            'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', ''),
            'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', 587),
            'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', True),
            'EMAIL_USE_SSL': getattr(settings, 'EMAIL_USE_SSL', False),
            'EMAIL_HOST_USER': getattr(settings, 'EMAIL_HOST_USER', ''),
            'EMAIL_HOST_PASSWORD': getattr(settings, 'EMAIL_HOST_PASSWORD', ''),
            'DEFAULT_FROM_EMAIL': getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@sharewise-ai.com'),
        }
    
    # Get SMTP settings based on provider
    smtp_settings = config.get_smtp_settings()
    
    return {
        'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'EMAIL_HOST': smtp_settings['host'],
        'EMAIL_PORT': smtp_settings['port'],
        'EMAIL_USE_TLS': smtp_settings['use_tls'],
        'EMAIL_USE_SSL': smtp_settings['use_ssl'],
        'EMAIL_HOST_USER': config.email_address,
        'EMAIL_HOST_PASSWORD': config.decrypt_password(),
        'DEFAULT_FROM_EMAIL': config.get_from_email(),
    }