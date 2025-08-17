"""
Usage Limits Enforcement for ShareWise AI Subscription Tiers
Tracks and enforces usage limits based on subscription plans
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from django.db import models, transaction
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import get_user_model

from .models import TradingSignal, TradingStrategy, AutomatedTradeExecution, LimitType, UsageTracker

User = get_user_model()
logger = logging.getLogger(__name__)


@dataclass
class SubscriptionLimits:
    """Subscription tier limits configuration"""
    tier: str
    daily_signals: int
    monthly_signals: int
    daily_backtests: int
    monthly_backtests: int
    active_strategies: int
    api_calls_daily: int
    portfolio_positions: int
    data_export_monthly: int
    features: list
    support_level: str


class UsageLimitExceeded(Exception):
    """Exception raised when usage limit is exceeded"""
    def __init__(self, limit_type: str, current_usage: int, limit: int, reset_time: datetime = None):
        self.limit_type = limit_type
        self.current_usage = current_usage
        self.limit = limit
        self.reset_time = reset_time
        super().__init__(f"Usage limit exceeded for {limit_type}: {current_usage}/{limit}")


class SubscriptionLimitService:
    """Service for managing subscription limits and enforcement"""
    
    # Define subscription tier limits
    SUBSCRIPTION_LIMITS = {
        'BASIC': SubscriptionLimits(
            tier='BASIC',
            daily_signals=5,
            monthly_signals=100,
            daily_backtests=5,
            monthly_backtests=50,
            active_strategies=2,
            api_calls_daily=100,
            portfolio_positions=10,
            data_export_monthly=2,
            features=['basic_signals', 'basic_backtesting'],
            support_level='email'
        ),
        'PRO': SubscriptionLimits(
            tier='PRO',
            daily_signals=100,
            monthly_signals=2000,
            daily_backtests=100,
            monthly_backtests=1000,
            active_strategies=10,
            api_calls_daily=2000,
            portfolio_positions=50,
            data_export_monthly=20,
            features=['advanced_signals', 'advanced_backtesting', 'portfolio_analytics', 'api_access'],
            support_level='priority_email'
        ),
        'ELITE': SubscriptionLimits(
            tier='ELITE',
            daily_signals=-1,  # Unlimited
            monthly_signals=-1,  # Unlimited
            daily_backtests=-1,  # Unlimited
            monthly_backtests=-1,  # Unlimited
            active_strategies=50,
            api_calls_daily=10000,
            portfolio_positions=200,
            data_export_monthly=-1,  # Unlimited
            features=['premium_signals', 'unlimited_backtesting', 'advanced_analytics', 'premium_api', 'custom_models'],
            support_level='phone_priority'
        )
    }
    
    def __init__(self):
        self.cache_timeout = 3600  # 1 hour cache
    
    def get_user_limits(self, user: User) -> SubscriptionLimits:
        """Get limits for a user based on their subscription tier"""
        tier = user.subscription_tier
        return self.SUBSCRIPTION_LIMITS.get(tier, self.SUBSCRIPTION_LIMITS['BASIC'])
    
    def get_or_create_tracker(self, user: User, limit_type: LimitType) -> UsageTracker:
        """Get or create usage tracker for user and limit type"""
        tracker, created = UsageTracker.objects.get_or_create(
            user=user,
            limit_type=limit_type,
            defaults={
                'daily_count': 0,
                'monthly_count': 0,
                'last_daily_reset': timezone.now().date(),
                'last_monthly_reset': timezone.now().date()
            }
        )
        
        # Reset counters if needed
        today = timezone.now().date()
        
        # Daily reset
        if tracker.last_daily_reset < today:
            tracker.daily_count = 0
            tracker.last_daily_reset = today
        
        # Monthly reset
        if tracker.last_monthly_reset.month != today.month or tracker.last_monthly_reset.year != today.year:
            tracker.monthly_count = 0
            tracker.last_monthly_reset = today
        
        if tracker.last_daily_reset != tracker.last_daily_reset or tracker.last_monthly_reset != tracker.last_monthly_reset:
            tracker.save()
        
        return tracker
    
    def check_limit(self, user: User, limit_type: LimitType, is_daily: bool = True) -> Tuple[bool, int, int]:
        """
        Check if user has exceeded limits
        Returns: (is_allowed, current_usage, limit)
        """
        limits = self.get_user_limits(user)
        tracker = self.get_or_create_tracker(user, limit_type)
        
        # Get the appropriate limit and current usage
        if is_daily:
            current_usage = tracker.daily_count
            if limit_type == LimitType.DAILY_SIGNALS:
                limit = limits.daily_signals
            elif limit_type == LimitType.DAILY_BACKTESTS:
                limit = limits.daily_backtests
            elif limit_type == LimitType.API_CALLS_DAILY:
                limit = limits.api_calls_daily
            else:
                limit = -1  # Default unlimited for daily
        else:
            current_usage = tracker.monthly_count
            if limit_type == LimitType.MONTHLY_SIGNALS:
                limit = limits.monthly_signals
            elif limit_type == LimitType.MONTHLY_BACKTESTS:
                limit = limits.monthly_backtests
            elif limit_type == LimitType.DATA_EXPORT_MONTHLY:
                limit = limits.data_export_monthly
            else:
                limit = -1  # Default unlimited for monthly
        
        # For non-time-based limits (like active strategies, portfolio positions)
        if limit_type == LimitType.ACTIVE_STRATEGIES:
            current_usage = TradingStrategy.objects.filter(
                user=user, 
                status=TradingStrategy.Status.ACTIVE
            ).count()
            limit = limits.active_strategies
        elif limit_type == LimitType.PORTFOLIO_POSITIONS:
            from .models import PortfolioPosition
            current_usage = PortfolioPosition.objects.filter(
                user=user,
                total_quantity__gt=0
            ).count()
            limit = limits.portfolio_positions
        
        # -1 means unlimited
        if limit == -1:
            return True, current_usage, limit
        
        return current_usage < limit, current_usage, limit
    
    def enforce_limit(self, user: User, limit_type: LimitType, is_daily: bool = True) -> None:
        """
        Enforce usage limit - raise exception if exceeded
        """
        is_allowed, current_usage, limit = self.check_limit(user, limit_type, is_daily)
        
        if not is_allowed:
            # Calculate reset time
            if is_daily:
                reset_time = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            else:
                next_month = timezone.now().replace(day=1) + timedelta(days=32)
                reset_time = next_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            raise UsageLimitExceeded(
                limit_type=limit_type.label,
                current_usage=current_usage,
                limit=limit,
                reset_time=reset_time
            )
    
    @transaction.atomic
    def increment_usage(self, user: User, limit_type: LimitType) -> UsageTracker:
        """
        Increment usage counter for user and limit type
        """
        tracker = self.get_or_create_tracker(user, limit_type)
        
        # Increment counters
        tracker.daily_count += 1
        tracker.monthly_count += 1
        tracker.save()
        
        return tracker
    
    def get_usage_summary(self, user: User) -> Dict[str, Any]:
        """Get complete usage summary for a user"""
        limits = self.get_user_limits(user)
        summary = {
            'subscription_tier': user.subscription_tier,
            'limits': {
                'daily_signals': limits.daily_signals,
                'monthly_signals': limits.monthly_signals,
                'daily_backtests': limits.daily_backtests,
                'monthly_backtests': limits.monthly_backtests,
                'active_strategies': limits.active_strategies,
                'api_calls_daily': limits.api_calls_daily,
                'portfolio_positions': limits.portfolio_positions,
                'data_export_monthly': limits.data_export_monthly
            },
            'current_usage': {},
            'features': limits.features,
            'support_level': limits.support_level
        }
        
        # Get current usage for all limit types
        for limit_type in LimitType:
            try:
                tracker = self.get_or_create_tracker(user, limit_type)
                
                # Get appropriate current usage
                if limit_type in [LimitType.DAILY_SIGNALS, LimitType.DAILY_BACKTESTS, LimitType.API_CALLS_DAILY]:
                    current = tracker.daily_count
                    is_daily, _, limit = self.check_limit(user, limit_type, is_daily=True)
                elif limit_type in [LimitType.MONTHLY_SIGNALS, LimitType.MONTHLY_BACKTESTS, LimitType.DATA_EXPORT_MONTHLY]:
                    current = tracker.monthly_count
                    is_daily, _, limit = self.check_limit(user, limit_type, is_daily=False)
                else:
                    is_daily, current, limit = self.check_limit(user, limit_type)
                
                summary['current_usage'][limit_type.value] = {
                    'current': current,
                    'limit': limit,
                    'percentage': (current / limit * 100) if limit > 0 else 0,
                    'is_unlimited': limit == -1
                }
            except Exception as e:
                logger.warning(f"Error getting usage for {limit_type}: {e}")
        
        return summary
    
    def reset_usage(self, user: User, limit_type: LimitType = None, reset_type: str = 'daily') -> None:
        """Reset usage counters (admin function)"""
        if limit_type:
            trackers = UsageTracker.objects.filter(user=user, limit_type=limit_type)
        else:
            trackers = UsageTracker.objects.filter(user=user)
        
        for tracker in trackers:
            if reset_type == 'daily':
                tracker.daily_count = 0
                tracker.last_daily_reset = timezone.now().date()
            elif reset_type == 'monthly':
                tracker.monthly_count = 0
                tracker.last_monthly_reset = timezone.now().date()
            elif reset_type == 'both':
                tracker.daily_count = 0
                tracker.monthly_count = 0
                tracker.last_daily_reset = timezone.now().date()
                tracker.last_monthly_reset = timezone.now().date()
            
            tracker.save()
    
    def check_feature_access(self, user: User, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        limits = self.get_user_limits(user)
        return feature in limits.features
    
    def get_next_reset_time(self, limit_type: LimitType, is_daily: bool = True) -> datetime:
        """Get next reset time for a limit type"""
        now = timezone.now()
        
        if is_daily:
            return now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        else:
            # Next month
            next_month = now.replace(day=1) + timedelta(days=32)
            return next_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


# Global instance
usage_service = SubscriptionLimitService()


# Decorator for enforcing limits
def enforce_usage_limit(limit_type: LimitType, is_daily: bool = True, increment: bool = True):
    """
    Decorator to enforce usage limits on views/functions
    """
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'user') or not request.user.is_authenticated:
                return func(request, *args, **kwargs)
            
            try:
                # Check limit before execution
                usage_service.enforce_limit(request.user, limit_type, is_daily)
                
                # Execute function
                result = func(request, *args, **kwargs)
                
                # Increment usage after successful execution
                if increment and hasattr(result, 'status_code') and 200 <= result.status_code < 300:
                    usage_service.increment_usage(request.user, limit_type)
                
                return result
                
            except UsageLimitExceeded as e:
                from rest_framework.response import Response
                from rest_framework import status
                
                return Response({
                    'error': 'Usage limit exceeded',
                    'message': str(e),
                    'limit_type': e.limit_type,
                    'current_usage': e.current_usage,
                    'limit': e.limit,
                    'reset_time': e.reset_time.isoformat() if e.reset_time else None,
                    'upgrade_message': f'Upgrade to Pro or Elite plan for higher limits'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        return wrapper
    return decorator


# Utility functions
def check_signal_generation_limit(user: User) -> bool:
    """Quick check for signal generation limit"""
    try:
        usage_service.enforce_limit(user, LimitType.DAILY_SIGNALS, is_daily=True)
        return True
    except UsageLimitExceeded:
        return False


def check_backtest_limit(user: User) -> bool:
    """Quick check for backtest limit"""
    try:
        usage_service.enforce_limit(user, LimitType.DAILY_BACKTESTS, is_daily=True)
        return True
    except UsageLimitExceeded:
        return False


def get_user_usage_status(user: User) -> Dict[str, Any]:
    """Get user's current usage status"""
    return usage_service.get_usage_summary(user)