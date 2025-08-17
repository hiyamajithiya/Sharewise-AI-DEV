"""
Security app configuration for ShareWise AI
"""

from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.security'
    verbose_name = 'Security'
    
    def ready(self):
        """Initialize app when Django starts"""
        pass