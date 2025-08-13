from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'ai_studio'

# Create router for viewsets
router = DefaultRouter()
router.register(r'models', views.MLModelViewSet, basename='models')
router.register(r'reviews', views.ModelReviewViewSet, basename='reviews')

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),
    
    # AI Studio Dashboard
    path('dashboard/', views.studio_dashboard, name='dashboard'),
    
    # Training Jobs
    path('training-jobs/', views.training_jobs, name='training_jobs'),
    path('training-jobs/<uuid:job_id>/', views.training_job_detail, name='training_job_detail'),
    
    # Marketplace
    path('marketplace/', views.MarketplaceViewSet.as_view(), name='marketplace'),
    path('marketplace/lease/<uuid:model_id>/', views.lease_model, name='lease_model'),
    path('my-leases/', views.my_leases, name='my_leases'),
    
    # Features and Configuration
    path('features/', views.available_features, name='available_features'),
    
    # F&O Specific Endpoints
    path('fno/strategies/', views.fno_strategies, name='fno_strategies'),
    path('fno/instruments/', views.fno_instruments, name='fno_instruments'),
    path('fno/model-types/', views.fno_model_types, name='fno_model_types'),
    path('fno/create-model/', views.create_fno_model, name='create_fno_model'),
    path('fno/performance-metrics/', views.fno_performance_metrics, name='fno_performance_metrics'),
    path('fno/backtest/<uuid:model_id>/', views.backtest_fno_strategy, name='backtest_fno_strategy'),
]