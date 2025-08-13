from django.apps import AppConfig


class BrokersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.brokers'
    verbose_name = 'Brokers'

    def ready(self):
        import apps.brokers.signals