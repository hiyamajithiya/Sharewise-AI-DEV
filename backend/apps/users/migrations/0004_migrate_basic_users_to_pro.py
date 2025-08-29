# Generated migration to migrate existing BASIC users to PRO tier

from django.db import migrations


def migrate_basic_to_pro(apps, schema_editor):
    """
    Migrate all existing users with BASIC subscription tier to PRO tier
    """
    CustomUser = apps.get_model('users', 'CustomUser')
    
    # Update all users with BASIC tier to PRO tier
    basic_users_count = CustomUser.objects.filter(subscription_tier='BASIC').count()
    CustomUser.objects.filter(subscription_tier='BASIC').update(subscription_tier='PRO')
    
    print(f"Migrated {basic_users_count} users from BASIC to PRO subscription tier")


def reverse_migrate_pro_to_basic(apps, schema_editor):
    """
    Reverse migration: This should not be needed since we're removing BASIC tier entirely
    """
    # We won't implement reverse since BASIC tier is being removed
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_remove_basic_subscription_tier'),
    ]

    operations = [
        migrations.RunPython(migrate_basic_to_pro, reverse_migrate_pro_to_basic),
    ]