from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superadmin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email for the superadmin user')
        parser.add_argument('--password', type=str, help='Password for the superadmin user')
        parser.add_argument('--force', action='store_true', help='Force create even if user exists')

    def handle(self, *args, **options):
        email = options.get('email') or 'chinmaytechnosoft@gmail.com'
        password = options.get('password') or 'Chinmay123'
        force = options.get('force', False)

        try:
            with transaction.atomic():
                # Check if user already exists
                if User.objects.filter(email=email).exists():
                    if not force:
                        self.stdout.write(
                            self.style.WARNING(f'User with email {email} already exists. Use --force to update.')
                        )
                        return
                    else:
                        # Update existing user
                        user = User.objects.get(email=email)
                        user.set_password(password)
                        user.is_staff = True
                        user.is_superuser = True
                        user.role = 'SUPER_ADMIN'
                        user.subscription_tier = 'ELITE'
                        user.is_active = True
                        user.save()
                        self.stdout.write(
                            self.style.SUCCESS(f'Successfully updated superadmin user: {email}')
                        )
                        return

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

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created superadmin user: {email}')
                )
                self.stdout.write(
                    self.style.SUCCESS('User details:')
                )
                self.stdout.write(f'  Email: {user.email}')
                self.stdout.write(f'  Username: {user.username}')
                self.stdout.write(f'  Role: {user.role}')
                self.stdout.write(f'  Subscription Tier: {user.subscription_tier}')
                self.stdout.write(f'  Is Staff: {user.is_staff}')
                self.stdout.write(f'  Is Superuser: {user.is_superuser}')
                self.stdout.write(f'  Is Active: {user.is_active}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superadmin user: {str(e)}')
            )
            raise e