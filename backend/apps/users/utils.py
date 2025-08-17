import random
import string
import secrets
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))


def generate_verification_token():
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)


def get_email_config():
    """Get email configuration from database"""
    from system_config.models import EmailConfiguration
    return EmailConfiguration.objects.filter(is_active=True).first()


def send_email_via_config(to_email, subject, html_content, text_content):
    """Send email using database configuration"""
    config = get_email_config()
    
    if not config:
        # Fallback to Django's send_mail with console backend
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}")
        print(text_content)
        print(f"{'='*60}\n")
        return True
    
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
        msg['Subject'] = subject
        msg['From'] = config.get_from_email()
        msg['To'] = to_email
        
        # Attach parts
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email via config: {e}")
        # Fallback to console output
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}")
        print(text_content)
        print(f"{'='*60}\n")
        return True


def send_verification_email(user, otp_code):
    """Send email verification OTP to user"""
    subject = 'ShareWise AI - Verify Your Email Address'
    
    # Create HTML email content
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; background-color: #F8FAFC; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1); }}
            .header {{ background: linear-gradient(135deg, #0052CC 0%, #1976D2 100%); padding: 40px 30px; text-align: center; }}
            .logo {{ width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }}
            .logo-text {{ color: white; font-size: 24px; font-weight: 700; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 700; }}
            .header p {{ color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px; }}
            .content {{ padding: 40px 30px; }}
            .otp-container {{ background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 700; color: #0052CC; letter-spacing: 8px; margin: 16px 0; }}
            .otp-label {{ color: #6B7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }}
            .warning {{ background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 8px; }}
            .warning p {{ margin: 0; color: #92400E; font-size: 14px; }}
            .footer {{ background: #F9FAFB; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }}
            .button {{ background: linear-gradient(135deg, #0052CC 0%, #1976D2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block; margin: 16px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div class="logo-text">S</div>
                </div>
                <h1>ShareWise AI</h1>
                <p>Professional Trading Platform</p>
            </div>
            
            <div class="content">
                <h2 style="color: #1A1A1A; margin-bottom: 16px;">Welcome to ShareWise AI! 👋</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Thank you for signing up for ShareWise AI. To complete your registration and start your trading journey, 
                    please verify your email address using the OTP code below:
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">{otp_code}</div>
                    <p style="color: #6B7280; font-size: 14px; margin: 16px 0 0 0;">
                        This code will expire in 10 minutes
                    </p>
                </div>
                
                <div class="warning">
                    <p><strong>Security Notice:</strong> Never share this code with anyone. ShareWise AI will never ask for your verification code via phone or email.</p>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    If you didn't create an account with ShareWise AI, please ignore this email or contact our support team.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2025 ShareWise AI. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    plain_message = f"""
    Welcome to ShareWise AI!
    
    Thank you for signing up. Please verify your email address using this OTP code:
    
    {otp_code}
    
    This code will expire in 10 minutes.
    
    If you didn't create an account, please ignore this email.
    
    © 2025 ShareWise AI. All rights reserved.
    """
    
    # Use our custom email sending function
    return send_email_via_config(user.email, subject, html_message, plain_message)


def is_otp_valid(user, otp_code, max_age_minutes=10):
    """Check if the provided OTP is valid and not expired"""
    if not user.email_verification_token:
        return False
    
    if user.email_verification_token != otp_code:
        return False
    
    if not user.email_verification_sent_at:
        return False
    
    # Check if OTP is expired
    expiry_time = user.email_verification_sent_at + timedelta(minutes=max_age_minutes)
    if timezone.now() > expiry_time:
        return False
    
    return True


def send_welcome_email(user):
    """Send welcome email after successful verification"""
    subject = 'Welcome to ShareWise AI - Your Trading Journey Begins!'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; background-color: #F8FAFC; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1); }}
            .header {{ background: linear-gradient(135deg, #0052CC 0%, #1976D2 100%); padding: 40px 30px; text-align: center; }}
            .logo {{ width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }}
            .logo-text {{ color: white; font-size: 24px; font-weight: 700; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 700; }}
            .content {{ padding: 40px 30px; }}
            .feature-list {{ list-style: none; padding: 0; }}
            .feature-list li {{ padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #374151; }}
            .feature-list li:last-child {{ border-bottom: none; }}
            .cta-button {{ background: linear-gradient(135deg, #0052CC 0%, #1976D2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; display: inline-block; margin: 24px 0; }}
            .footer {{ background: #F9FAFB; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div class="logo-text">S</div>
                </div>
                <h1>Welcome to ShareWise AI! 🎉</h1>
            </div>
            
            <div class="content">
                <h2 style="color: #1A1A1A; margin-bottom: 16px;">Your account is now verified!</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Hi {user.first_name}, welcome to the future of algorithmic trading! Your ShareWise AI account is now ready to use.
                </p>
                
                <h3 style="color: #1A1A1A; margin: 32px 0 16px 0;">What you can do now:</h3>
                <ul class="feature-list">
                    <li>📊 Access AI-powered trading signals</li>
                    <li>🔗 Connect your broker accounts (Zerodha, AngelOne, Upstox)</li>
                    <li>📈 Create and backtest custom strategies</li>
                    <li>💰 Track your portfolio performance</li>
                    <li>🤖 Automate your trading with advanced algorithms</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="{settings.FRONTEND_URL}/login" class="cta-button">Start Trading Now</a>
                </div>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
                    Need help getting started? Check out our <a href="{settings.FRONTEND_URL}/help">help center</a> or contact our support team.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2025 ShareWise AI. All rights reserved.</p>
                <p>Happy Trading! 📈</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Welcome to ShareWise AI!
    
    Hi {user.first_name}, your account has been verified successfully!
    
    You can now:
    - Access AI-powered trading signals
    - Connect broker accounts
    - Create custom strategies
    - Track portfolio performance
    - Automate trading
    
    Start trading: {settings.FRONTEND_URL}/login
    
    © 2025 ShareWise AI. All rights reserved.
    """
    
    # Use our custom email sending function
    return send_email_via_config(user.email, subject, html_message, plain_message)