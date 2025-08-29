"""
Management command to create test users with different roles for testing the role system.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users with different roles for testing the role system'

    def handle(self, *args, **options):
        # Create Super Admin user
        if not User.objects.filter(email='admin@sharewise.ai').exists():
            super_admin = User.objects.create_user(
                email='admin@sharewise.ai',
                username='superadmin',
                password='AdminPass123!',
                first_name='Super',
                last_name='Admin',
                role=User.Role.SUPER_ADMIN,
                subscription_tier=User.SubscriptionTier.ELITE,
                is_active=True,
                email_verified=True
            )
            UserProfile.objects.get_or_create(user=super_admin, defaults={'kyc_verified': True})
            self.stdout.write(
                self.style.SUCCESS(f'Super Admin created: {super_admin.email}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Super Admin already exists: admin@sharewise.ai')
            )

        # Create Support Team user
        if not User.objects.filter(email='support@sharewise.ai').exists():
            support_user = User.objects.create_user(
                email='support@sharewise.ai',
                username='supportteam',
                password='SupportPass123!',
                first_name='Support',
                last_name='Team',
                role=User.Role.SUPPORT,
                subscription_tier=User.SubscriptionTier.PRO,
                is_active=True,
                email_verified=True
            )
            UserProfile.objects.get_or_create(user=support_user, defaults={'kyc_verified': True})
            self.stdout.write(
                self.style.SUCCESS(f'Support Team user created: {support_user.email}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Support Team user already exists: support@sharewise.ai')
            )

        # Create Sales Team user
        if not User.objects.filter(email='sales@sharewise.ai').exists():
            sales_user = User.objects.create_user(
                email='sales@sharewise.ai',
                username='salesteam',
                password='SalesPass123!',
                first_name='Sales',
                last_name='Team',
                role=User.Role.SALES,
                subscription_tier=User.SubscriptionTier.PRO,
                is_active=True,
                email_verified=True
            )
            UserProfile.objects.get_or_create(user=sales_user, defaults={'kyc_verified': False})
            self.stdout.write(
                self.style.SUCCESS(f'Sales Team user created: {sales_user.email}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Sales Team user already exists: sales@sharewise.ai')
            )

        # Create Regular User
        if not User.objects.filter(email='user@sharewise.ai').exists():
            regular_user = User.objects.create_user(
                email='user@sharewise.ai',
                username='regularuser',
                password='UserPass123!',
                first_name='Regular',
                last_name='User',
                role=User.Role.USER,
                subscription_tier=User.SubscriptionTier.PRO,
                is_active=True,
                email_verified=True
            )
            UserProfile.objects.get_or_create(user=regular_user, defaults={'kyc_verified': False})
            self.stdout.write(
                self.style.SUCCESS(f'Regular user created: {regular_user.email}')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Regular user already exists: user@sharewise.ai')
            )

        self.stdout.write(
            self.style.SUCCESS('\n=== Test Users Created ===')
        )
        self.stdout.write('Super Admin: admin@sharewise.ai / AdminPass123!')
        self.stdout.write('Support Team: support@sharewise.ai / SupportPass123!')  
        self.stdout.write('Sales Team: sales@sharewise.ai / SalesPass123!')
        self.stdout.write('Regular User: user@sharewise.ai / UserPass123!')
        self.stdout.write(
            self.style.SUCCESS('\nYou can now test the role system with these users!')
        )