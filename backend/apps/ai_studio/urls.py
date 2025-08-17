from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .admin_views import (
    MarketplaceDashboardView, marketplace_analytics_api,
    export_marketplace_data, model_moderation_action
)

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
    path('training-jobs/<uuid:job_id>/progress/', views.training_progress, name='training_progress'),
    path('training-jobs/<uuid:job_id>/cancel/', views.cancel_training, name='cancel_training'),
    
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
    
    # Model Management and Deployment
    path('models/<uuid:model_id>/test/', views.test_model, name='test_model'),
    path('models/<uuid:model_id>/deploy/', views.deploy_model, name='deploy_model'),
    path('models/<uuid:model_id>/predict/', views.predict_with_model, name='predict_with_model'),
    path('models/<uuid:model_id>/monitor/', views.monitor_model, name='monitor_model'),
    path('models/<uuid:model_id>/health/', views.model_health, name='model_health'),
    
    # Advanced Model Creation
    path('advanced/create/', views.create_advanced_model, name='create_advanced_model'),
    path('advanced/model-types/', views.advanced_model_types, name='advanced_model_types'),
    
    # System Status
    path('system/status/', views.system_status, name='system_status'),
    
    # Celery Management
    path('celery/train/<uuid:model_id>/', views.start_celery_training, name='start_celery_training'),
    path('celery/workers/', views.celery_worker_status, name='celery_worker_status'),
    
    # Admin enhancement endpoints
    path('admin-dashboard/', MarketplaceDashboardView.as_view(), name='admin_marketplace_dashboard'),
    path('admin-analytics/', marketplace_analytics_api, name='admin_marketplace_analytics'),
    path('admin-export/', export_marketplace_data, name='admin_export_data'),
    path('admin-moderate/', model_moderation_action, name='admin_moderate_model'),
]