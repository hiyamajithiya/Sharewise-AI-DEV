from django.core.management.base import BaseCommand
from django.core.management import CommandError
from apps.users.models import CustomUser
import getpass

class Command(BaseCommand):
    help = 'Create a ShareWise super admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', help='Email address for the super admin')
        parser.add_argument('--username', help='Username for the super admin')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')
        
        if not email:
            email = input('Email address: ')
        
        if not username:
            username = input('Username: ')
            
        if CustomUser.objects.filter(email=email).exists():
            raise CommandError(f'User with email {email} already exists.')
            
        password = getpass.getpass('Password: ')
        password2 = getpass.getpass('Password (again): ')
        
        if password != password2:
            raise CommandError('Passwords do not match.')
            
        user = CustomUser.objects.create_user(
            email=email,
            username=username,
            password=password,
            role=CustomUser.Role.SUPER_ADMIN,
            subscription_tier=CustomUser.SubscriptionTier.ELITE,
            is_superuser=True,
            is_staff=True,
            email_verified=True
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'ShareWise Super Admin "{username}" created successfully with SUPER_ADMIN role.')
        )
