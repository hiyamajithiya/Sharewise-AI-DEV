from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@api_view(['POST'])
def google_signin(request):
    """
    Handle Google Sign-In
    Expects a Google ID token in the request body
    """
    try:
        token = request.data.get('credential')
        if not token:
            return Response(
                {'error': 'No credential provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the Google ID token
        try:
            # Get Google Client ID from settings
            CLIENT_ID = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
            if not CLIENT_ID:
                logger.error("GOOGLE_OAUTH_CLIENT_ID not configured in settings")
                return Response(
                    {'error': 'Google OAuth not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                CLIENT_ID
            )

            # Token is valid, extract user information
            email = idinfo.get('email')
            email_verified = idinfo.get('email_verified', False)
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            google_id = idinfo.get('sub')
            picture = idinfo.get('picture', '')

            if not email_verified:
                return Response(
                    {'error': 'Email not verified with Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if user:
                # Existing user - update their Google ID if not set
                if not hasattr(user, 'google_id') or not user.google_id:
                    user.google_id = google_id
                    user.save()
            else:
                # Create new user
                username = email.split('@')[0]
                # Ensure unique username
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    is_verified=True,  # Google users are pre-verified
                )
                
                # Set Google ID if model supports it
                if hasattr(user, 'google_id'):
                    user.google_id = google_id
                    user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Return user data and tokens
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': getattr(user, 'role', 'USER'),
                    'subscription_tier': getattr(user, 'subscription_tier', 'ELITE'),
                    'is_verified': True,
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'Successfully signed in with Google'
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            # Invalid token
            logger.error(f"Invalid Google token: {str(e)}")
            return Response(
                {'error': 'Invalid Google credential'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Google sign-in error: {str(e)}")
        return Response(
            {'error': 'An error occurred during sign-in'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def google_config(request):
    """
    Return Google OAuth configuration for frontend
    """
    CLIENT_ID = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
    
    if not CLIENT_ID:
        return Response(
            {'error': 'Google OAuth not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        'client_id': CLIENT_ID
    }, status=status.HTTP_200_OK)