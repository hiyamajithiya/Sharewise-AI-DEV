from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.support_dashboard, name='support_dashboard'),
    path('metrics/', views.support_metrics, name='support_metrics'),
    path('tickets/', views.support_tickets, name='support_tickets'),
    path('tickets/<uuid:ticket_id>/', views.support_ticket_detail, name='support_ticket_detail'),
    path('tickets/<uuid:ticket_id>/messages/', views.ticket_messages, name='ticket_messages'),
]