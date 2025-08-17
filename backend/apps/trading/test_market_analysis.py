"""
Test script for Market Analysis Engine
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.trading.market_analysis import market_analysis_engine, generate_signal_for_symbol
from apps.users.models import CustomUser


def test_market_analysis():
    """Test the market analysis engine"""
    print("Testing Market Analysis Engine...")
    
    try:
        # Get or create a test user
        user, created = CustomUser.objects.get_or_create(
            email='test@sharewise.ai',
            defaults={'username': 'testuser', 'first_name': 'Test', 'last_name': 'User'}
        )
        if created:
            print("Created test user")
        
        # Test market data fetching
        print("\n1. Testing market data fetching...")
        df = market_analysis_engine.fetch_market_data('RELIANCE', period='30d')
        print(f"   Fetched {len(df)} days of data for RELIANCE")
        print(f"   Latest close price: ₹{df['Close'].iloc[-1]:.2f}")
        
        # Test technical indicators
        print("\n2. Testing technical analysis...")
        indicators = market_analysis_engine.technical_analyzer.calculate_indicators(df)
        print(f"   RSI: {indicators['rsi']:.2f}")
        print(f"   MACD: {indicators['macd']:.4f}")
        print(f"   SMA 20: ₹{indicators['sma_20']:.2f}")
        print(f"   Support: ₹{indicators['support']:.2f}")
        print(f"   Resistance: ₹{indicators['resistance']:.2f}")
        
        # Test signal generation
        print("\n3. Testing signal generation...")
        signal_type, confidence, signal_components = market_analysis_engine.rule_analyzer.generate_signal(indicators)
        print(f"   Signal Type: {signal_type}")
        print(f"   Confidence: {confidence:.3f}")
        print(f"   Technical Score: {signal_components.technical_score:.3f}")
        print(f"   Risk-Reward Ratio: {signal_components.risk_reward_ratio:.2f}")
        
        # Test full signal creation
        print("\n4. Testing full signal creation...")
        signal = generate_signal_for_symbol('RELIANCE', user, 'Test Strategy')
        if signal:
            print(f"   ✅ Generated {signal.signal_type} signal for {signal.symbol}")
            print(f"   Entry Price: ₹{signal.entry_price}")
            print(f"   Target: ₹{signal.target_price}")
            print(f"   Stop Loss: ₹{signal.stop_loss}")
            print(f"   Confidence: {signal.confidence_score}")
            print(f"   AI Justification: {signal.ai_justification[:100]}...")
        else:
            print("   ⚠️ No signal generated (low confidence or neutral conditions)")
        
        # Test market sentiment
        print("\n5. Testing market sentiment analysis...")
        from apps.trading.market_analysis import get_market_sentiment
        sentiment = get_market_sentiment(['RELIANCE', 'TCS', 'INFY'])
        print(f"   Overall Sentiment: {sentiment['overall_sentiment']}")
        print(f"   Confidence: {sentiment['confidence']}%")
        print(f"   Breakdown: {sentiment['breakdown']}")
        
        print("\n✅ All tests completed successfully!")
        print("Market Analysis Engine is working properly.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    test_market_analysis()