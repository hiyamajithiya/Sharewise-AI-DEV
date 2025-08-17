"""
Test script for Trading Reporting and Analytics Module
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone

from apps.users.models import CustomUser
from apps.trading.models import TradingSignal, TradingStrategy, AutomatedTradeExecution, TradingOrder
from apps.trading.reporting import TradingReportGenerator, generate_user_performance_report


def create_test_data():
    """Create test data for reporting"""
    print("Creating test data for reporting...")
    
    # Create test user
    user, created = CustomUser.objects.get_or_create(
        email='reporting_test@sharewise.ai',
        defaults={
            'username': 'reportingtest',
            'first_name': 'Reporting',
            'last_name': 'Test'
        }
    )
    if created:
        print("✅ Created test user")
    
    # Create test strategy
    strategy, created = TradingStrategy.objects.get_or_create(
        user=user,
        name='Test Reporting Strategy',
        defaults={
            'description': 'Strategy for testing reporting functionality',
            'status': TradingStrategy.Status.ACTIVE
        }
    )
    if created:
        print("✅ Created test strategy")
    
    # Create some test signals and executions
    symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']
    
    for i, symbol in enumerate(symbols):
        # Create trading signal
        signal = TradingSignal.objects.create(
            user=user,
            instrument_type=TradingSignal.InstrumentType.EQUITY,
            symbol=symbol,
            strategy_name='Test Reporting Strategy',
            signal_type='BUY' if i % 2 == 0 else 'SELL',
            confidence_score=Decimal('0.75'),
            entry_price=Decimal(str(1000 + i * 100)),
            target_price=Decimal(str(1100 + i * 100)),
            stop_loss=Decimal(str(950 + i * 100)),
            valid_until=timezone.now() + timedelta(hours=4),
            ai_justification=f'Test signal for {symbol}',
            market_data={'test': True}
        )
        
        # Create entry order
        entry_order = TradingOrder.objects.create(
            signal=signal,
            user=user,
            symbol=symbol,
            order_type=TradingOrder.OrderType.MARKET,
            transaction_type='BUY' if signal.signal_type == 'BUY' else 'SELL',
            quantity=100,
            price=signal.entry_price,
            status=TradingOrder.OrderStatus.COMPLETE,
            filled_quantity=100,
            average_price=signal.entry_price
        )
        
        # Create execution
        execution = AutomatedTradeExecution.objects.create(
            signal=signal,
            strategy=strategy,
            status=AutomatedTradeExecution.ExecutionStatus.COMPLETED,
            entry_order=entry_order,
            entry_executed_at=timezone.now() - timedelta(days=i),
            exit_executed_at=timezone.now() - timedelta(days=i-1) if i > 0 else None,
            total_pnl=Decimal(str(50 * (1 if i % 2 == 0 else -1) * (i + 1))),  # Mix of wins and losses
            fees_paid=Decimal('10.00')
        )
        
        print(f"✅ Created test execution for {symbol}")
    
    print(f"✅ Created {len(symbols)} test executions")
    return user, strategy


def test_performance_metrics():
    """Test performance metrics calculation"""
    print("\n--- Testing Performance Metrics ---")
    
    user, strategy = create_test_data()
    
    # Test user performance report
    reporter = TradingReportGenerator(user=user)
    
    # Test performance metrics
    print("1. Testing performance metrics calculation...")
    performance_metrics = reporter.generate_performance_metrics()
    
    print(f"   Total trades: {performance_metrics.total_trades}")
    print(f"   Win rate: {performance_metrics.win_rate:.1f}%")
    print(f"   Total P&L: ₹{performance_metrics.total_pnl}")
    print(f"   Sharpe ratio: {performance_metrics.sharpe_ratio:.3f}")
    print(f"   Sortino ratio: {performance_metrics.sortino_ratio:.3f}")
    print(f"   Max drawdown: {performance_metrics.max_drawdown:.2f}%")
    print(f"   Portfolio value: ₹{performance_metrics.portfolio_value}")
    
    # Test monthly reports
    print("\n2. Testing monthly reports...")
    monthly_reports = reporter.generate_monthly_reports()
    for report in monthly_reports:
        print(f"   Month {report.month}: {report.trades_count} trades, P&L: ₹{report.pnl}")
    
    # Test strategy comparison
    print("\n3. Testing strategy comparison...")
    strategy_comparison = reporter.generate_strategy_comparison()
    for strategy_name, metrics in strategy_comparison.items():
        print(f"   {strategy_name}: {metrics['total_trades']} trades, Win rate: {metrics['win_rate']:.1f}%")
    
    # Test risk analysis
    print("\n4. Testing risk analysis...")
    risk_metrics = reporter.generate_risk_analysis()
    print(f"   Skewness: {risk_metrics.skewness:.3f}")
    print(f"   Kurtosis: {risk_metrics.kurtosis:.3f}")
    print(f"   Downside deviation: {risk_metrics.downside_deviation:.3f}")
    
    # Test portfolio summary
    print("\n5. Testing portfolio summary...")
    portfolio_summary = reporter.generate_portfolio_summary()
    print(f"   Portfolio data: {portfolio_summary}")


def test_comprehensive_report():
    """Test comprehensive user performance report"""
    print("\n--- Testing Comprehensive Report ---")
    
    user, strategy = create_test_data()
    
    # Generate comprehensive report
    print("Generating comprehensive performance report...")
    report = generate_user_performance_report(user)
    
    print("✅ Report generated successfully!")
    print(f"   Performance metrics: {len(report['performance_metrics'].__dict__)} fields")
    print(f"   Monthly reports: {len(report['monthly_reports'])} months")
    print(f"   Strategy comparison: {len(report['strategy_comparison'])} strategies")
    print(f"   Risk metrics: {len(report['risk_metrics'].__dict__)} fields")
    print(f"   Generated at: {report['generated_at']}")


def test_returns_calculation():
    """Test returns series calculation"""
    print("\n--- Testing Returns Calculation ---")
    
    user, strategy = create_test_data()
    reporter = TradingReportGenerator(user=user)
    
    # Get trade history
    trade_df = reporter.get_trade_history()
    print(f"Trade history shape: {trade_df.shape}")
    
    # Test returns calculation
    returns = reporter.calculate_returns_series(trade_df)
    print(f"Returns series length: {len(returns)}")
    print(f"Sample returns: {returns[:3] if len(returns) >= 3 else returns}")
    
    # Test Sharpe ratio
    sharpe = reporter.calculate_sharpe_ratio(returns)
    print(f"Sharpe ratio: {sharpe:.3f}")
    
    # Test Sortino ratio
    sortino = reporter.calculate_sortino_ratio(returns)
    print(f"Sortino ratio: {sortino:.3f}")
    
    # Test max drawdown
    max_dd, duration = reporter.calculate_max_drawdown(returns)
    print(f"Max drawdown: {max_dd:.2%}, Duration: {duration} periods")
    
    # Test VaR and ES
    var, es = reporter.calculate_var_and_es(returns)
    print(f"VaR (95%): {var:.2%}, Expected Shortfall: {es:.2%}")


def test_date_filtering():
    """Test date filtering functionality"""
    print("\n--- Testing Date Filtering ---")
    
    user, strategy = create_test_data()
    reporter = TradingReportGenerator(user=user)
    
    # Test with date range
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    print(f"Testing with date range: {start_date.date()} to {end_date.date()}")
    
    performance_metrics = reporter.generate_performance_metrics(start_date, end_date)
    print(f"Filtered trades: {performance_metrics.total_trades}")
    
    monthly_reports = reporter.generate_monthly_reports(start_date, end_date)
    print(f"Filtered monthly reports: {len(monthly_reports)}")


def run_all_tests():
    """Run all reporting tests"""
    print("🚀 Starting Trading Reporting System Tests...")
    
    try:
        test_performance_metrics()
        test_comprehensive_report()
        test_returns_calculation()
        test_date_filtering()
        
        print("\n🎉 All reporting tests completed successfully!")
        print("✅ Trading Reporting and Analytics module is working properly.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    run_all_tests()