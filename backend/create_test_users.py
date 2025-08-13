#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import CustomUser, UserProfile

def create_test_users():
    """Create test users for different roles and subscription tiers"""
    
    test_users = [
        # SUPPORT user
        {
            'email': 'support.test@sharewise.ai',
            'username': 'supporttest',
            'first_name': 'Sarah',
            'last_name': 'Support',
            'password': 'TestPass123',
            'role': 'SUPPORT',
            'subscription_tier': 'PRO',
            'is_active': True,
            'email_verified': True,
        },
        
        # SALES user
        {
            'email': 'sales.test@sharewise.ai',
            'username': 'salestest',
            'first_name': 'Mike',
            'last_name': 'Sales',
            'password': 'TestPass123',
            'role': 'SALES',
            'subscription_tier': 'BASIC',
            'is_active': True,
            'email_verified': True,
        },
        
        # USER - Basic tier
        {
            'email': 'user.basic@sharewise.ai',
            'username': 'userbasic',
            'first_name': 'John',
            'last_name': 'Basic',
            'password': 'TestPass123',
            'role': 'USER',
            'subscription_tier': 'BASIC',
            'is_active': True,
            'email_verified': True,
        },
        
        # USER - Pro tier
        {
            'email': 'user.pro@sharewise.ai',
            'username': 'userpro',
            'first_name': 'Emma',
            'last_name': 'Pro',
            'password': 'TestPass123',
            'role': 'USER',
            'subscription_tier': 'PRO',
            'is_active': True,
            'email_verified': True,
        },
        
        # USER - Elite tier
        {
            'email': 'user.elite@sharewise.ai',
            'username': 'userelite',
            'first_name': 'Alex',
            'last_name': 'Elite',
            'password': 'TestPass123',
            'role': 'USER',
            'subscription_tier': 'ELITE',
            'is_active': True,
            'email_verified': True,
        },
    ]
    
    created_users = []
    
    for user_data in test_users:
        # Check if user already exists
        if CustomUser.objects.filter(email=user_data['email']).exists():
            print(f"User {user_data['email']} already exists, skipping...")
            continue
            
        # Create user
        user = CustomUser.objects.create_user(
            email=user_data['email'],
            username=user_data['username'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            password=user_data['password'],
            role=user_data['role'],
            subscription_tier=user_data['subscription_tier'],
            is_active=user_data['is_active'],
            email_verified=user_data['email_verified'],
        )
        
        # Update profile with additional details based on subscription tier
        profile = user.profile
        if user_data['subscription_tier'] == 'BASIC':
            profile.max_daily_loss = '5000.00'
        elif user_data['subscription_tier'] == 'PRO':
            profile.max_daily_loss = '15000.00'
        elif user_data['subscription_tier'] == 'ELITE':
            profile.max_daily_loss = '50000.00'
            
        profile.save()
        
        created_users.append(user)
        print(f"[SUCCESS] Created {user_data['role']} user: {user_data['first_name']} {user_data['last_name']} ({user_data['subscription_tier']})")
    
    print(f"\n[SUCCESS] Successfully created {len(created_users)} test users!")
    print("\nAll test users:")
    for user in CustomUser.objects.all().order_by('role', 'subscription_tier'):
        print(f"- {user.first_name} {user.last_name} ({user.role}) - {user.subscription_tier} | {user.email}")

if __name__ == '__main__':
    create_test_users()