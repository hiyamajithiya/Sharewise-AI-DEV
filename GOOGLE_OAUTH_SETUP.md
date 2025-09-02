# Google OAuth Setup Guide for ShareWise AI

## Overview
This guide will help you set up Google Sign-In functionality for the ShareWise AI platform.

## Prerequisites
- Google Cloud Console account
- Access to backend settings configuration

## Setup Steps

### 1. Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in the required application information
   - Add your email to test users if in development

### 2. Configure OAuth Client

1. For **Application type**, select **Web application**
2. Name your OAuth 2.0 client (e.g., "ShareWise AI Web Client")
3. Add Authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-domain.com`
4. Add Authorized redirect URIs:
   - For development: `http://localhost:3000/login`
   - For production: `https://your-domain.com/login`
5. Click **CREATE**
6. Copy the **Client ID** from the credentials page

### 3. Configure Backend Settings

Add the following to your backend `.env` file:

```env
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Or add to your Django settings:

```python
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID = 'your-client-id-here.apps.googleusercontent.com'
```

### 4. Install Required Dependencies

#### Backend (Already added to requirements.txt):
```bash
cd backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

#### Frontend (Already added to package.json):
```bash
cd frontend
npm install @react-oauth/google
```

### 5. Update User Model (Optional)

If you want to store Google IDs, add this field to your User model:

```python
# In backend/apps/users/models.py
class User(AbstractUser):
    # ... existing fields ...
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
```

Then run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Test the Integration

1. Start both backend and frontend servers
2. Navigate to the login page
3. Click "Sign in with Google"
4. Complete the Google authentication flow
5. You should be redirected to the dashboard

## Security Considerations

1. **Never commit** your Google Client ID secret to version control
2. **Use environment variables** for sensitive configuration
3. **Restrict origins** in Google Console to your actual domains
4. **Enable 2FA** on your Google Cloud account
5. **Review permissions** regularly in Google Cloud Console

## Troubleshooting

### "Google OAuth not configured" error
- Ensure GOOGLE_OAUTH_CLIENT_ID is set in backend settings
- Restart the backend server after adding the configuration

### "Invalid credential" error
- Verify the Client ID matches exactly
- Check that the domain is in the authorized origins list
- Ensure the OAuth consent screen is configured

### Users can't sign in
- Add test users in Google Console if in development mode
- Verify the OAuth app is published for production use

## API Endpoints

The following endpoints are available for Google OAuth:

- `POST /api/auth/google/signin/` - Handle Google sign-in
- `GET /api/auth/google/config/` - Get Google OAuth configuration

## Support

For issues with Google OAuth setup, check:
- [Google Identity Documentation](https://developers.google.com/identity)
- [Google Cloud Console](https://console.cloud.google.com/)

---

© 2024 All Rights Reserved by Chinmay Technosoft Pvt Ltd