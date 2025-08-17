# Email Configuration Setup for ShareWise AI

## Overview
To enable email verification for user registration, you need to configure SMTP settings in the backend.

## Gmail SMTP Configuration (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. Select "Mail" from the dropdown
3. Select "Other" and name it "ShareWise AI"
4. Click "Generate"
5. Copy the 16-character password (remove spaces)

### Step 3: Update .env File
Edit the `backend/.env` file with your Gmail credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=ShareWise AI <your-email@gmail.com>
```

### Step 4: Restart the Backend Server
```bash
cd backend
python manage.py runserver
```

## Alternative Email Providers

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=ShareWise AI <noreply@yourdomain.com>
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@yourdomain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=ShareWise AI <noreply@yourdomain.com>
```

### Amazon SES
```env
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-ses-smtp-username
EMAIL_HOST_PASSWORD=your-ses-smtp-password
DEFAULT_FROM_EMAIL=ShareWise AI <noreply@yourdomain.com>
```

## Testing Email Configuration

### 1. Django Shell Test
```bash
cd backend
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test email from ShareWise AI.',
    settings.DEFAULT_FROM_EMAIL,
    ['test@example.com'],
    fail_silently=False,
)
```

### 2. Console Backend (Development Only)
If you don't want to configure real email during development, the system will automatically fall back to console backend, which prints emails to the terminal instead of sending them.

## User Registration Flow

1. **New users are registered as Tenant Admin** by default
2. **Email verification is required** before login
3. **OTP codes expire after 10 minutes**
4. **Users can request new OTP codes** if needed

## Troubleshooting

### Common Issues:

1. **"Failed to send verification email"**
   - Check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env
   - Ensure you're using an App Password, not your regular Gmail password
   - Check internet connectivity

2. **"SMTPAuthenticationError"**
   - Verify your App Password is correct (no spaces)
   - Ensure 2FA is enabled on your Google account
   - Try regenerating the App Password

3. **Emails going to spam**
   - Add SPF/DKIM records if using custom domain
   - Use a reputable email service (SendGrid, Mailgun, etc.)
   - Ensure FROM email matches your domain

## Security Notes

- **Never commit .env file** to version control
- **Use environment variables** in production
- **Rotate App Passwords** regularly
- **Monitor email sending** for abuse

## Support

For issues with email configuration, check:
1. Django logs in the terminal
2. Email provider's dashboard for sending logs
3. Spam/Junk folder for test emails