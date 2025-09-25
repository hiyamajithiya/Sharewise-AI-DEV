from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for existing viewsets (if they exist)
router = DefaultRouter()

app_name = 'market_data'

urlpatterns = [
    # Your working simple endpoints
    path('quote/<str:symbol>/', views.get_stock_quote, name='stock_quote'),
    path('search/', views.search_stocks, name='search_stocks'),
    path('news/', views.get_market_news, name='market_news'),
    
    # Include router URLs if viewsets exist
    path('', include(router.urls)),
]
