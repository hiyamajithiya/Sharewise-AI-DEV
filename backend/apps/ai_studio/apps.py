from django.apps import AppConfig


class AiStudioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_studio'
    verbose_name = 'AI Model Studio'

    def ready(self):
        import apps.ai_studio.signals