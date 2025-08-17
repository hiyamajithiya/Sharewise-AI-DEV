"""
Audit Trail App Configuration
"""

from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit'
    verbose_name = 'Audit Trail'
    
    def ready(self):
        """
        Import signal handlers when the app is ready
        """
        # Import any signal handlers here if needed
        pass