from django.urls import path
from . import views

app_name = 'portfolios'

urlpatterns = [
    path('', views.get_portfolio, name='portfolio'),
    path('holdings/', views.get_holdings, name='holdings'),
    path('history/', views.get_portfolio_history, name='history'),
]