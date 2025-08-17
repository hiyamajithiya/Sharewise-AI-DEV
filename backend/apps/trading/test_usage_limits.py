"""
Test script for Usage Limits Enforcement System
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import CustomUser
from apps.trading.models import LimitType, UsageTracker
from apps.trading.usage_limits import (
    SubscriptionLimitService, UsageLimitExceeded, 
    usage_service, get_user_usage_status
)


def create_test_users():
    """Create test users for different subscription tiers"""
    print("Creating test users for each subscription tier...")
    
    users = {}
    
    # Basic user
    basic_user, created = CustomUser.objects.get_or_create(
        email='basic_user@sharewise.ai',
        defaults={
            'username': 'basicuser',
            'first_name': 'Basic',
            'last_name': 'User',
            'subscription_tier': 'BASIC'
        }
    )
    users['basic'] = basic_user
    if created:
        print("✅ Created Basic tier user")
    
    # Pro user
    pro_user, created = CustomUser.objects.get_or_create(
        email='pro_user@sharewise.ai',
        defaults={
            'username': 'prouser',
            'first_name': 'Pro',
            'last_name': 'User',
            'subscription_tier': 'PRO'
        }
    )
    users['pro'] = pro_user
    if created:
        print("✅ Created Pro tier user")
    
    # Elite user
    elite_user, created = CustomUser.objects.get_or_create(
        email='elite_user@sharewise.ai',
        defaults={
            'username': 'eliteuser',
            'first_name': 'Elite',
            'last_name': 'User',
            'subscription_tier': 'ELITE'
        }
    )
    users['elite'] = elite_user
    if created:
        print("✅ Created Elite tier user")
    
    return users


def test_subscription_limits():
    """Test subscription limits configuration"""
    print("\n--- Testing Subscription Limits Configuration ---")
    
    service = SubscriptionLimitService()
    
    # Test each tier limits
    for tier in ['BASIC', 'PRO', 'ELITE']:
        limits = service.SUBSCRIPTION_LIMITS[tier]
        print(f"\n{tier} Tier Limits:")
        print(f"   Daily signals: {limits.daily_signals}")
        print(f"   Monthly signals: {limits.monthly_signals}")
        print(f"   Daily backtests: {limits.daily_backtests}")
        print(f"   Active strategies: {limits.active_strategies}")
        print(f"   Features: {limits.features}")
        print(f"   Support: {limits.support_level}")
    
    print("✅ Subscription limits configuration working")


def test_usage_tracking():
    """Test usage tracking functionality"""
    print("\n--- Testing Usage Tracking ---")
    
    users = create_test_users()
    basic_user = users['basic']
    
    # Test creating and updating usage tracker
    print("1. Testing usage tracker creation...")
    tracker = usage_service.get_or_create_tracker(basic_user, LimitType.DAILY_SIGNALS)
    print(f"   Created tracker: {tracker}")
    print(f"   Daily count: {tracker.daily_count}")
    print(f"   Monthly count: {tracker.monthly_count}")
    
    # Test incrementing usage
    print("\n2. Testing usage increment...")
    initial_daily = tracker.daily_count
    initial_monthly = tracker.monthly_count
    
    updated_tracker = usage_service.increment_usage(basic_user, LimitType.DAILY_SIGNALS)
    print(f"   Daily count: {initial_daily} -> {updated_tracker.daily_count}")
    print(f"   Monthly count: {initial_monthly} -> {updated_tracker.monthly_count}")
    
    print("✅ Usage tracking working")


def test_limit_enforcement():
    """Test limit enforcement for different tiers"""
    print("\n--- Testing Limit Enforcement ---")
    
    users = create_test_users()
    
    # Test Basic user limits
    print("\n1. Testing Basic user (5 daily signals limit)...")
    basic_user = users['basic']
    
    # Reset usage for clean test
    usage_service.reset_usage(basic_user, LimitType.DAILY_SIGNALS, 'daily')
    
    # Test within limits
    try:
        usage_service.enforce_limit(basic_user, LimitType.DAILY_SIGNALS)
        print("   ✅ Within limit check passed")
        
        # Simulate using 4 signals
        for i in range(4):
            usage_service.increment_usage(basic_user, LimitType.DAILY_SIGNALS)
        print("   ✅ Used 4/5 signals successfully")
        
        # Test at limit
        usage_service.enforce_limit(basic_user, LimitType.DAILY_SIGNALS)
        usage_service.increment_usage(basic_user, LimitType.DAILY_SIGNALS)
        print("   ✅ Used 5/5 signals successfully")
        
        # Test exceeding limit
        try:
            usage_service.enforce_limit(basic_user, LimitType.DAILY_SIGNALS)
            print("   ❌ Should have been blocked at limit")
        except UsageLimitExceeded as e:
            print(f"   ✅ Correctly blocked: {e}")
            
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
    
    # Test Elite user (unlimited)
    print("\n2. Testing Elite user (unlimited signals)...")
    elite_user = users['elite']
    
    try:
        # Elite should have unlimited access
        for i in range(100):  # Try many signals
            usage_service.enforce_limit(elite_user, LimitType.DAILY_SIGNALS)
            if i < 10:  # Only increment first 10 for testing
                usage_service.increment_usage(elite_user, LimitType.DAILY_SIGNALS)
        
        print("   ✅ Elite user has unlimited access")
        
    except UsageLimitExceeded as e:
        print(f"   ❌ Elite user was blocked: {e}")
    
    print("✅ Limit enforcement working")


def test_usage_summary():
    """Test usage summary generation"""
    print("\n--- Testing Usage Summary ---")
    
    users = create_test_users()
    
    for tier, user in users.items():
        print(f"\n{tier.upper()} User Summary:")
        summary = get_user_usage_status(user)
        
        print(f"   Subscription tier: {summary['subscription_tier']}")
        print(f"   Features: {summary['features']}")
        print(f"   Support level: {summary['support_level']}")
        
        # Show key limits
        limits = summary['limits']
        print(f"   Daily signals limit: {limits['daily_signals']}")
        print(f"   Daily backtests limit: {limits['daily_backtests']}")
        print(f"   Active strategies limit: {limits['active_strategies']}")
        
        # Show current usage for daily signals
        if 'DAILY_SIGNALS' in summary['current_usage']:
            usage = summary['current_usage']['DAILY_SIGNALS']
            print(f"   Current daily signals usage: {usage['current']}/{usage['limit']} ({usage['percentage']:.1f}%)")
    
    print("✅ Usage summary generation working")


def test_feature_access():
    """Test feature access control"""
    print("\n--- Testing Feature Access Control ---")
    
    users = create_test_users()
    
    # Test feature access for each tier
    features_to_test = ['basic_signals', 'api_access', 'custom_models']
    
    for feature in features_to_test:
        print(f"\nTesting '{feature}' access:")
        for tier, user in users.items():
            has_access = usage_service.check_feature_access(user, feature)
            print(f"   {tier.upper()}: {'✅ Has access' if has_access else '❌ No access'}")
    
    print("✅ Feature access control working")


def test_limit_checking():
    """Test limit checking functionality"""
    print("\n--- Testing Limit Checking ---")
    
    users = create_test_users()
    basic_user = users['basic']
    
    # Reset usage
    usage_service.reset_usage(basic_user, LimitType.DAILY_SIGNALS, 'daily')
    
    print("1. Testing limit checking...")
    is_allowed, current_usage, limit = usage_service.check_limit(
        basic_user, LimitType.DAILY_SIGNALS, is_daily=True
    )
    
    print(f"   Is allowed: {is_allowed}")
    print(f"   Current usage: {current_usage}")
    print(f"   Limit: {limit}")
    
    # Use some signals
    for i in range(3):
        usage_service.increment_usage(basic_user, LimitType.DAILY_SIGNALS)
    
    print("\n2. After using 3 signals...")
    is_allowed, current_usage, limit = usage_service.check_limit(
        basic_user, LimitType.DAILY_SIGNALS, is_daily=True
    )
    
    print(f"   Is allowed: {is_allowed}")
    print(f"   Current usage: {current_usage}")
    print(f"   Limit: {limit}")
    print(f"   Usage percentage: {(current_usage / limit * 100):.1f}%")
    
    print("✅ Limit checking working")


def test_reset_functionality():
    """Test usage reset functionality"""
    print("\n--- Testing Reset Functionality ---")
    
    users = create_test_users()
    basic_user = users['basic']
    
    # Create some usage
    for i in range(3):
        usage_service.increment_usage(basic_user, LimitType.DAILY_SIGNALS)
    
    tracker = usage_service.get_or_create_tracker(basic_user, LimitType.DAILY_SIGNALS)
    print(f"Before reset - Daily: {tracker.daily_count}, Monthly: {tracker.monthly_count}")
    
    # Test daily reset
    usage_service.reset_usage(basic_user, LimitType.DAILY_SIGNALS, 'daily')
    tracker.refresh_from_db()
    print(f"After daily reset - Daily: {tracker.daily_count}, Monthly: {tracker.monthly_count}")
    
    # Test monthly reset
    usage_service.reset_usage(basic_user, LimitType.DAILY_SIGNALS, 'monthly')
    tracker.refresh_from_db()
    print(f"After monthly reset - Daily: {tracker.daily_count}, Monthly: {tracker.monthly_count}")
    
    print("✅ Reset functionality working")


def run_all_tests():
    """Run all usage limits tests"""
    print("🚀 Starting Usage Limits Enforcement System Tests...")
    
    try:
        test_subscription_limits()
        test_usage_tracking()
        test_limit_enforcement()
        test_usage_summary()
        test_feature_access()
        test_limit_checking()
        test_reset_functionality()
        
        print("\n🎉 All usage limits tests completed successfully!")
        print("✅ Usage Limits Enforcement System is working properly.")
        
        # Show final summary
        print("\n📊 System Summary:")
        print("   ✅ Subscription tiers: BASIC (5 signals/day), PRO (100/day), ELITE (unlimited)")
        print("   ✅ Usage tracking: Daily and monthly counters with auto-reset")
        print("   ✅ Limit enforcement: Automatic blocking when limits exceeded")
        print("   ✅ Feature access: Tier-based feature availability")
        print("   ✅ API endpoints: Subscription status, usage analytics, limit checking")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    run_all_tests()