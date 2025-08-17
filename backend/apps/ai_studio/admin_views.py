"""
Custom Admin Views for Enhanced Marketplace Management
"""

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from datetime import datetime, timedelta
import json
import csv
from decimal import Decimal

from django.contrib.auth import get_user_model
from .models import MLModel, ModelLeasing, TrainingJob, FnOStrategy
from apps.trading.models import TradingSignal, TradingOrder
from apps.audit.models import AuditEvent

User = get_user_model()


@method_decorator(staff_member_required, name='dispatch')
class MarketplaceDashboardView(TemplateView):
    """Enhanced marketplace dashboard for admins"""
    template_name = 'admin/ai_studio/marketplace_dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Date ranges
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        last_30_days = now - timedelta(days=30)
        last_90_days = now - timedelta(days=90)
        
        # Model statistics
        context['total_models'] = MLModel.objects.count()
        context['published_models'] = MLModel.objects.filter(is_published=True).count()
        context['active_models'] = MLModel.objects.filter(
            status='TRAINED', is_published=True
        ).count()
        context['models_this_week'] = MLModel.objects.filter(
            created_at__gte=last_7_days
        ).count()
        
        # Leasing statistics
        context['total_leases'] = ModelLeasing.objects.count()
        context['active_leases'] = ModelLeasing.objects.filter(
            status='ACTIVE'
        ).count()
        context['leases_this_week'] = ModelLeasing.objects.filter(
            created_at__gte=last_7_days
        ).count()
        
        # Revenue statistics
        total_revenue = ModelLeasing.objects.aggregate(
            total=Sum('lease_price')
        )['total'] or Decimal('0')
        context['total_revenue'] = total_revenue
        
        platform_commission = ModelLeasing.objects.aggregate(
            total=Sum('platform_commission')
        )['total'] or Decimal('0')
        context['platform_revenue'] = platform_commission
        
        creator_earnings = ModelLeasing.objects.aggregate(
            total=Sum('creator_earnings')
        )['total'] or Decimal('0')
        context['creator_earnings'] = creator_earnings
        
        # User statistics
        context['total_users'] = User.objects.count()
        context['model_creators'] = User.objects.filter(
            created_models__isnull=False
        ).distinct().count()
        context['model_lessees'] = User.objects.filter(
            leased_models__isnull=False
        ).distinct().count()
        
        # Training job statistics
        context['total_training_jobs'] = TrainingJob.objects.count()
        context['completed_jobs'] = TrainingJob.objects.filter(
            status='COMPLETED'
        ).count()
        context['failed_jobs'] = TrainingJob.objects.filter(
            status='FAILED'
        ).count()
        context['running_jobs'] = TrainingJob.objects.filter(
            status='RUNNING'
        ).count()
        
        # F&O Strategy statistics
        context['total_fno_strategies'] = FnOStrategy.objects.count()
        context['active_fno_strategies'] = FnOStrategy.objects.filter(
            is_active=True
        ).count()
        
        # Top performing models
        context['top_models'] = MLModel.objects.filter(
            is_published=True
        ).annotate(
            lease_count=Count('leases')
        ).order_by('-lease_count', '-accuracy')[:5]
        
        # Recent activity
        context['recent_leases'] = ModelLeasing.objects.select_related(
            'model', 'lessee'
        ).order_by('-created_at')[:10]
        
        context['recent_models'] = MLModel.objects.select_related(
            'user'
        ).order_by('-created_at')[:10]
        
        # Performance trends (last 30 days)
        context['performance_data'] = self.get_performance_trends(last_30_days)
        
        return context
    
    def get_performance_trends(self, start_date):
        """Get performance trend data for charts"""
        
        # Daily model creation trend
        daily_models = []
        daily_leases = []
        daily_revenue = []
        
        for i in range(30):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            
            models_count = MLModel.objects.filter(
                created_at__range=[date, next_date]
            ).count()
            
            leases_count = ModelLeasing.objects.filter(
                created_at__range=[date, next_date]
            ).count()
            
            revenue = ModelLeasing.objects.filter(
                created_at__range=[date, next_date]
            ).aggregate(total=Sum('lease_price'))['total'] or Decimal('0')
            
            daily_models.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': models_count
            })
            
            daily_leases.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': leases_count
            })
            
            daily_revenue.append({
                'date': date.strftime('%Y-%m-%d'),
                'amount': float(revenue)
            })
        
        return {
            'models': daily_models,
            'leases': daily_leases,
            'revenue': daily_revenue
        }


@staff_member_required
def marketplace_analytics_api(request):
    """API endpoint for marketplace analytics data"""
    
    analytics_type = request.GET.get('type', 'overview')
    
    if analytics_type == 'model_performance':
        return JsonResponse(get_model_performance_data())
    elif analytics_type == 'user_activity':
        return JsonResponse(get_user_activity_data())
    elif analytics_type == 'revenue_breakdown':
        return JsonResponse(get_revenue_breakdown_data())
    elif analytics_type == 'geographic_distribution':
        return JsonResponse(get_geographic_distribution_data())
    else:
        return JsonResponse(get_overview_data())


def get_model_performance_data():
    """Get model performance analytics"""
    
    # Model performance by type
    performance_by_type = MLModel.objects.values('model_type').annotate(
        count=Count('id'),
        avg_accuracy=Avg('accuracy'),
        avg_sharpe=Avg('sharpe_ratio'),
        avg_return=Avg('total_return')
    )
    
    # Model status distribution
    status_distribution = MLModel.objects.values('status').annotate(
        count=Count('id')
    )
    
    # Top performing models
    top_models = MLModel.objects.filter(
        is_published=True
    ).annotate(
        lease_count=Count('leases'),
        total_earnings=Sum('leases__lease_price')
    ).order_by('-lease_count', '-accuracy')[:10]
    
    return {
        'performance_by_type': list(performance_by_type),
        'status_distribution': list(status_distribution),
        'top_models': [
            {
                'name': model.name,
                'accuracy': float(model.accuracy or 0),
                'sharpe_ratio': float(model.sharpe_ratio or 0),
                'lease_count': model.lease_count,
                'total_earnings': float(model.total_earnings or 0)
            }
            for model in top_models
        ]
    }


def get_user_activity_data():
    """Get user activity analytics"""
    
    # User registration trend (last 30 days)
    now = timezone.now()
    start_date = now - timedelta(days=30)
    
    daily_registrations = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        count = User.objects.filter(
            date_joined__range=[date, next_date]
        ).count()
        
        daily_registrations.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Most active users
    active_users = User.objects.annotate(
        model_count=Count('created_models'),
        lease_count=Count('leased_models'),
        total_activity=F('model_count') + F('lease_count')
    ).order_by('-total_activity')[:10]
    
    # User type distribution
    user_types = {
        'creators_only': User.objects.filter(
            created_models__isnull=False,
            leased_models__isnull=True
        ).distinct().count(),
        'lessees_only': User.objects.filter(
            created_models__isnull=True,
            leased_models__isnull=False
        ).distinct().count(),
        'both': User.objects.filter(
            created_models__isnull=False,
            leased_models__isnull=False
        ).distinct().count(),
        'inactive': User.objects.filter(
            created_models__isnull=True,
            leased_models__isnull=True
        ).count()
    }
    
    return {
        'daily_registrations': daily_registrations,
        'active_users': [
            {
                'email': user.email,
                'model_count': user.model_count,
                'lease_count': user.lease_count,
                'total_activity': user.total_activity
            }
            for user in active_users
        ],
        'user_types': user_types
    }


def get_revenue_breakdown_data():
    """Get revenue breakdown analytics"""
    
    # Revenue by model type
    revenue_by_type = ModelLeasing.objects.values(
        'model__model_type'
    ).annotate(
        total_revenue=Sum('lease_price'),
        lease_count=Count('id')
    ).order_by('-total_revenue')
    
    # Monthly revenue trend (last 12 months)
    now = timezone.now()
    monthly_revenue = []
    
    for i in range(12):
        month_start = (now - timedelta(days=30*i)).replace(day=1)
        next_month = (month_start + timedelta(days=32)).replace(day=1)
        
        revenue = ModelLeasing.objects.filter(
            created_at__range=[month_start, next_month]
        ).aggregate(total=Sum('lease_price'))['total'] or Decimal('0')
        
        monthly_revenue.append({
            'month': month_start.strftime('%Y-%m'),
            'revenue': float(revenue)
        })
    
    monthly_revenue.reverse()
    
    # Platform vs Creator earnings
    platform_total = ModelLeasing.objects.aggregate(
        total=Sum('platform_commission')
    )['total'] or Decimal('0')
    
    creator_total = ModelLeasing.objects.aggregate(
        total=Sum('creator_earnings')
    )['total'] or Decimal('0')
    
    return {
        'revenue_by_type': [
            {
                'model_type': item['model__model_type'],
                'total_revenue': float(item['total_revenue']),
                'lease_count': item['lease_count']
            }
            for item in revenue_by_type
        ],
        'monthly_revenue': monthly_revenue,
        'earnings_split': {
            'platform': float(platform_total),
            'creators': float(creator_total)
        }
    }


def get_geographic_distribution_data():
    """Get geographic distribution of users (mock data)"""
    
    # In a real implementation, this would use IP geolocation or user profiles
    # For now, we'll return mock data
    return {
        'countries': [
            {'country': 'India', 'users': 450, 'models': 89},
            {'country': 'United States', 'users': 234, 'models': 67},
            {'country': 'United Kingdom', 'users': 123, 'models': 34},
            {'country': 'Singapore', 'users': 89, 'models': 23},
            {'country': 'Canada', 'users': 67, 'models': 12},
            {'country': 'Australia', 'users': 45, 'models': 8},
            {'country': 'Others', 'users': 156, 'models': 32}
        ]
    }


def get_overview_data():
    """Get overview analytics data"""
    
    now = timezone.now()
    last_30_days = now - timedelta(days=30)
    
    # Basic counts
    total_models = MLModel.objects.count()
    total_users = User.objects.count()
    total_leases = ModelLeasing.objects.count()
    total_revenue = ModelLeasing.objects.aggregate(
        total=Sum('lease_price')
    )['total'] or Decimal('0')
    
    # Growth rates (30 days)
    models_last_month = MLModel.objects.filter(
        created_at__gte=last_30_days
    ).count()
    users_last_month = User.objects.filter(
        date_joined__gte=last_30_days
    ).count()
    leases_last_month = ModelLeasing.objects.filter(
        created_at__gte=last_30_days
    ).count()
    
    return {
        'totals': {
            'models': total_models,
            'users': total_users,
            'leases': total_leases,
            'revenue': float(total_revenue)
        },
        'growth': {
            'models_last_month': models_last_month,
            'users_last_month': users_last_month,
            'leases_last_month': leases_last_month
        }
    }


@staff_member_required
def export_marketplace_data(request):
    """Export marketplace data to CSV"""
    
    export_type = request.GET.get('type', 'models')
    
    response = HttpResponse(content_type='text/csv')
    
    if export_type == 'models':
        response['Content-Disposition'] = 'attachment; filename="marketplace_models.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Model Name', 'Creator Email', 'Model Type', 'Status', 'Accuracy',
            'Sharpe Ratio', 'Total Return', 'Is Published', 'Lease Price',
            'Total Leases', 'Total Earnings', 'Created At'
        ])
        
        models = MLModel.objects.select_related('user').all()
        for model in models:
            writer.writerow([
                model.name,
                model.user.email,
                model.model_type,
                model.status,
                model.accuracy or 0,
                model.sharpe_ratio or 0,
                model.total_return or 0,
                model.is_published,
                model.monthly_lease_price or 0,
                model.total_leases,
                model.total_earnings or 0,
                model.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
    
    elif export_type == 'leases':
        response['Content-Disposition'] = 'attachment; filename="marketplace_leases.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Model Name', 'Creator Email', 'Lessee Email', 'Lease Price',
            'Status', 'Start Date', 'End Date', 'Payment Status',
            'Platform Commission', 'Creator Earnings', 'Created At'
        ])
        
        leases = ModelLeasing.objects.select_related(
            'model', 'model__user', 'lessee'
        ).all()
        for lease in leases:
            writer.writerow([
                lease.model.name,
                lease.model.user.email,
                lease.lessee.email,
                lease.lease_price,
                lease.status,
                lease.start_date.strftime('%Y-%m-%d') if lease.start_date else '',
                lease.end_date.strftime('%Y-%m-%d') if lease.end_date else '',
                lease.payment_status,
                lease.platform_commission or 0,
                lease.creator_earnings or 0,
                lease.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
    
    elif export_type == 'users':
        response['Content-Disposition'] = 'attachment; filename="marketplace_users.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Email', 'First Name', 'Last Name', 'Date Joined', 'Is Active',
            'Models Created', 'Models Leased', 'Total Spent', 'Total Earned'
        ])
        
        users = User.objects.annotate(
            models_created=Count('created_models'),
            models_leased=Count('leased_models'),
            total_spent=Sum('leased_models__lease_price'),
            total_earned=Sum('created_models__leases__creator_earnings')
        ).all()
        
        for user in users:
            writer.writerow([
                user.email,
                user.first_name,
                user.last_name,
                user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                user.is_active,
                user.models_created,
                user.models_leased,
                user.total_spent or 0,
                user.total_earned or 0
            ])
    
    return response


@staff_member_required
def model_moderation_action(request):
    """Handle model moderation actions"""
    
    if request.method == 'POST':
        model_id = request.POST.get('model_id')
        action = request.POST.get('action')
        reason = request.POST.get('reason', '')
        
        try:
            model = MLModel.objects.get(id=model_id)
            
            if action == 'approve':
                model.is_published = True
                model.save()
                
                # Log the action
                AuditEvent.objects.create(
                    event_type='MODEL_PUBLISHED',
                    user=request.user,
                    description=f'Model {model.name} approved for publication',
                    details={
                        'model_id': str(model.id),
                        'model_name': model.name,
                        'creator': model.user.email,
                        'reason': reason
                    }
                )
                
                return JsonResponse({'success': True, 'message': 'Model approved'})
            
            elif action == 'reject':
                model.is_published = False
                model.save()
                
                # Log the action
                AuditEvent.objects.create(
                    event_type='MODEL_REJECTED',
                    user=request.user,
                    description=f'Model {model.name} rejected for publication',
                    details={
                        'model_id': str(model.id),
                        'model_name': model.name,
                        'creator': model.user.email,
                        'reason': reason
                    }
                )
                
                return JsonResponse({'success': True, 'message': 'Model rejected'})
            
            else:
                return JsonResponse({'success': False, 'message': 'Invalid action'})
                
        except MLModel.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Model not found'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})