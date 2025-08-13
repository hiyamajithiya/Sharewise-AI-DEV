#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def create_superadmin():
    email = 'chinmaytechnosoft@gmail.com'
    password = 'Chinmay123'
    
    try:
        with transaction.atomic():
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                print(f"User with email {email} already exists. Updating...")
                user = User.objects.get(email=email)
                user.set_password(password)
                user.is_staff = True
                user.is_superuser = True
                user.role = 'SUPER_ADMIN'
                user.subscription_tier = 'ELITE'
                user.is_active = True
                user.save()
                print(f"Successfully updated superadmin user: {email}")
            else:
                # Create new superadmin user
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    username='superadmin',
                    first_name='Super',
                    last_name='Admin',
                    is_staff=True,
                    is_superuser=True,
                    role='SUPER_ADMIN',
                    subscription_tier='ELITE',
                    is_active=True
                )
                print(f"Successfully created superadmin user: {email}")
            
            print("User details:")
            print(f"  Email: {user.email}")
            print(f"  Username: {user.username}")
            print(f"  Role: {user.role}")
            print(f"  Subscription Tier: {user.subscription_tier}")
            print(f"  Is Staff: {user.is_staff}")
            print(f"  Is Superuser: {user.is_superuser}")
            print(f"  Is Active: {user.is_active}")
            
            return True
            
    except Exception as e:
        print(f"Error creating superadmin user: {str(e)}")
        return False

if __name__ == '__main__':
    success = create_superadmin()
    sys.exit(0 if success else 1)