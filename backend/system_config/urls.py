from django.urls import path
from . import views

app_name = 'system_config'

urlpatterns = [
    path('email-configuration/', views.email_configuration, name='email_configuration'),
    path('test-email/', views.test_email_configuration, name='test_email'),
    path('system-configuration/', views.system_configuration, name='system_configuration'),
]