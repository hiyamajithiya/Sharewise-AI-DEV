"""
Management command to update user role.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Update user role by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')
        parser.add_argument('role', type=str, choices=['USER', 'SALES', 'SUPPORT', 'SUPER_ADMIN'], help='New role')

    def handle(self, *args, **options):
        email = options['email']
        new_role = options['role']
        
        try:
            user = User.objects.get(email=email)
            old_role = user.role
            user.role = new_role
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {email} role from {old_role} to {new_role}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating user role: {e}')
            )