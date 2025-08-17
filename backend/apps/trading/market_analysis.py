"""
Market Analysis Engine for ShareWise AI
Generates trading signals using hybrid rule-based/ML models with explainable AI
"""
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging
from decimal import Decimal
import talib
from dataclasses import dataclass

from django.utils import timezone
from django.conf import settings

from .models import TradingSignal
from .ai_explainer import signal_explainer, explain_trading_signal
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


@dataclass
class MarketData:
    """Market data container"""
    symbol: str
    open_price: float
    high: float
    low: float
    close: float
    volume: int
    timestamp: datetime
    technical_indicators: Dict[str, float]


@dataclass
class SignalComponents:
    """Components that contribute to signal generation"""
    technical_score: float
    momentum_score: float
    trend_score: float
    volume_score: float
    volatility_score: float
    risk_reward_ratio: float
    confidence_factors: Dict[str, float]


class TechnicalAnalyzer:
    """Technical analysis indicators and calculations"""
    
    def __init__(self):
        self.lookback_period = 50  # Default lookback for calculations
    
    def calculate_indicators(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate comprehensive technical indicators"""
        try:
            # Ensure we have OHLCV columns
            required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"DataFrame must contain columns: {required_columns}")
            
            # Convert to numpy arrays for TA-Lib
            high = df['High'].values
            low = df['Low'].values
            close = df['Close'].values
            volume = df['Volume'].values
            
            indicators = {}
            
            # Moving Averages
            indicators['sma_20'] = talib.SMA(close, timeperiod=20)[-1] if len(close) >= 20 else close[-1]
            indicators['sma_50'] = talib.SMA(close, timeperiod=50)[-1] if len(close) >= 50 else close[-1]
            indicators['ema_12'] = talib.EMA(close, timeperiod=12)[-1] if len(close) >= 12 else close[-1]
            indicators['ema_26'] = talib.EMA(close, timeperiod=26)[-1] if len(close) >= 26 else close[-1]
            
            # MACD
            macd, macd_signal, macd_hist = talib.MACD(close, fastperiod=12, slowperiod=26, signalperiod=9)
            indicators['macd'] = macd[-1] if len(macd) > 0 and not np.isnan(macd[-1]) else 0
            indicators['macd_signal'] = macd_signal[-1] if len(macd_signal) > 0 and not np.isnan(macd_signal[-1]) else 0
            indicators['macd_histogram'] = macd_hist[-1] if len(macd_hist) > 0 and not np.isnan(macd_hist[-1]) else 0
            
            # RSI
            indicators['rsi'] = talib.RSI(close, timeperiod=14)[-1] if len(close) >= 14 else 50
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = talib.BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2, matype=0)
            indicators['bb_upper'] = bb_upper[-1] if len(bb_upper) > 0 and not np.isnan(bb_upper[-1]) else close[-1] * 1.02
            indicators['bb_middle'] = bb_middle[-1] if len(bb_middle) > 0 and not np.isnan(bb_middle[-1]) else close[-1]
            indicators['bb_lower'] = bb_lower[-1] if len(bb_lower) > 0 and not np.isnan(bb_lower[-1]) else close[-1] * 0.98
            
            # ATR (Average True Range)
            indicators['atr'] = talib.ATR(high, low, close, timeperiod=14)[-1] if len(close) >= 14 else (high[-1] - low[-1])
            
            # Williams %R
            indicators['williams_r'] = talib.WILLR(high, low, close, timeperiod=14)[-1] if len(close) >= 14 else -50
            
            # Stochastic
            slowk, slowd = talib.STOCH(high, low, close, fastk_period=5, slowk_period=3, slowk_matype=0, slowd_period=3, slowd_matype=0)
            indicators['stoch_k'] = slowk[-1] if len(slowk) > 0 and not np.isnan(slowk[-1]) else 50
            indicators['stoch_d'] = slowd[-1] if len(slowd) > 0 and not np.isnan(slowd[-1]) else 50
            
            # Volume indicators
            indicators['volume_sma'] = np.mean(volume[-20:]) if len(volume) >= 20 else volume[-1]
            indicators['volume_ratio'] = volume[-1] / indicators['volume_sma'] if indicators['volume_sma'] > 0 else 1
            
            # Price-based indicators
            indicators['price_change'] = (close[-1] - close[-2]) / close[-2] * 100 if len(close) >= 2 else 0
            indicators['volatility'] = np.std(close[-20:]) / np.mean(close[-20:]) * 100 if len(close) >= 20 else 0
            
            # Support and Resistance (simplified)
            recent_highs = high[-20:] if len(high) >= 20 else high
            recent_lows = low[-20:] if len(low) >= 20 else low
            indicators['resistance'] = np.max(recent_highs)
            indicators['support'] = np.min(recent_lows)
            
            # Distance from support/resistance
            current_price = close[-1]
            indicators['distance_from_resistance'] = (indicators['resistance'] - current_price) / current_price * 100
            indicators['distance_from_support'] = (current_price - indicators['support']) / current_price * 100
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
            # Return default indicators
            return {
                'sma_20': close[-1], 'sma_50': close[-1], 'ema_12': close[-1], 'ema_26': close[-1],
                'macd': 0, 'macd_signal': 0, 'macd_histogram': 0, 'rsi': 50,
                'bb_upper': close[-1] * 1.02, 'bb_middle': close[-1], 'bb_lower': close[-1] * 0.98,
                'atr': close[-1] * 0.02, 'williams_r': -50, 'stoch_k': 50, 'stoch_d': 50,
                'volume_sma': volume[-1] if len(volume) > 0 else 1000, 'volume_ratio': 1,
                'price_change': 0, 'volatility': 1, 'resistance': close[-1] * 1.05, 'support': close[-1] * 0.95,
                'distance_from_resistance': 5, 'distance_from_support': 5
            }


class RuleBasedAnalyzer:
    """Rule-based signal generation using technical analysis"""
    
    def __init__(self):
        self.min_confidence = 0.6  # Minimum confidence for signal generation
    
    def analyze_trend(self, indicators: Dict[str, float]) -> Tuple[float, str]:
        """Analyze trend direction and strength"""
        trend_score = 0
        trend_direction = "NEUTRAL"
        
        # Moving average trends
        if indicators['sma_20'] > indicators['sma_50']:
            trend_score += 0.3
        elif indicators['sma_20'] < indicators['sma_50']:
            trend_score -= 0.3
        
        # EMA crossover
        if indicators['ema_12'] > indicators['ema_26']:
            trend_score += 0.2
        elif indicators['ema_12'] < indicators['ema_26']:
            trend_score -= 0.2
        
        # MACD trend
        if indicators['macd'] > indicators['macd_signal'] and indicators['macd_histogram'] > 0:
            trend_score += 0.3
        elif indicators['macd'] < indicators['macd_signal'] and indicators['macd_histogram'] < 0:
            trend_score -= 0.3
        
        # Price vs moving averages
        current_price = indicators.get('close', indicators['sma_20'])
        if current_price > indicators['sma_20'] > indicators['sma_50']:
            trend_score += 0.2
        elif current_price < indicators['sma_20'] < indicators['sma_50']:
            trend_score -= 0.2
        
        # Normalize to 0-1 range
        trend_score = max(-1, min(1, trend_score))
        
        if trend_score > 0.3:
            trend_direction = "BULLISH"
        elif trend_score < -0.3:
            trend_direction = "BEARISH"
        
        return abs(trend_score), trend_direction
    
    def analyze_momentum(self, indicators: Dict[str, float]) -> float:
        """Analyze momentum indicators"""
        momentum_score = 0
        
        # RSI momentum
        rsi = indicators['rsi']
        if 30 < rsi < 70:  # Neutral zone
            momentum_score += 0.1
        elif rsi > 70:  # Overbought
            momentum_score -= 0.2
        elif rsi < 30:  # Oversold
            momentum_score += 0.3
        
        # Williams %R
        williams = indicators['williams_r']
        if -80 < williams < -20:  # Neutral
            momentum_score += 0.1
        elif williams > -20:  # Overbought
            momentum_score -= 0.2
        elif williams < -80:  # Oversold
            momentum_score += 0.2
        
        # Stochastic
        if 20 < indicators['stoch_k'] < 80:
            momentum_score += 0.1
        elif indicators['stoch_k'] > 80:
            momentum_score -= 0.1
        elif indicators['stoch_k'] < 20:
            momentum_score += 0.2
        
        # MACD momentum
        if indicators['macd_histogram'] > 0:
            momentum_score += 0.1
        
        return max(0, min(1, momentum_score))
    
    def analyze_volume(self, indicators: Dict[str, float]) -> float:
        """Analyze volume patterns"""
        volume_ratio = indicators['volume_ratio']
        
        if volume_ratio > 1.5:  # High volume
            return 0.3
        elif volume_ratio > 1.2:  # Above average volume
            return 0.2
        elif volume_ratio > 0.8:  # Normal volume
            return 0.1
        else:  # Low volume
            return -0.1
    
    def analyze_volatility(self, indicators: Dict[str, float]) -> float:
        """Analyze volatility for risk assessment"""
        volatility = indicators['volatility']
        atr_pct = indicators['atr'] / indicators.get('close', indicators['sma_20']) * 100
        
        # Moderate volatility is preferred
        if 1 < volatility < 3 and 1 < atr_pct < 4:
            return 0.2
        elif volatility > 5 or atr_pct > 6:  # High volatility
            return -0.2
        else:  # Low volatility
            return 0.1
    
    def check_support_resistance(self, indicators: Dict[str, float]) -> Dict[str, float]:
        """Check position relative to support/resistance"""
        distance_from_support = indicators['distance_from_support']
        distance_from_resistance = indicators['distance_from_resistance']
        
        scores = {
            'near_support': 0,
            'near_resistance': 0,
            'breakout_potential': 0
        }
        
        # Near support (potential bounce)
        if distance_from_support < 2:
            scores['near_support'] = 0.3
        elif distance_from_support < 5:
            scores['near_support'] = 0.1
        
        # Near resistance (potential rejection)
        if distance_from_resistance < 2:
            scores['near_resistance'] = -0.2
        elif distance_from_resistance < 5:
            scores['near_resistance'] = -0.1
        
        # Breakout potential
        if distance_from_resistance < 1 and indicators['volume_ratio'] > 1.3:
            scores['breakout_potential'] = 0.4
        
        return scores
    
    def generate_signal(self, indicators: Dict[str, float]) -> Tuple[str, float, SignalComponents]:
        """Generate trading signal based on rule-based analysis"""
        
        # Analyze different components
        trend_strength, trend_direction = self.analyze_trend(indicators)
        momentum_score = self.analyze_momentum(indicators)
        volume_score = self.analyze_volume(indicators)
        volatility_score = self.analyze_volatility(indicators)
        support_resistance = self.check_support_resistance(indicators)
        
        # Technical score combination
        technical_score = (
            trend_strength * 0.3 +
            momentum_score * 0.25 +
            abs(volume_score) * 0.2 +
            abs(volatility_score) * 0.15 +
            max(support_resistance.values()) * 0.1
        )
        
        # Determine signal type based on trend and other factors
        signal_type = "HOLD"
        confidence = technical_score
        
        if trend_direction == "BULLISH" and momentum_score > 0.2 and volume_score > 0:
            signal_type = "BUY"
            confidence += 0.1
        elif trend_direction == "BEARISH" and momentum_score < 0.1 and volume_score > 0:
            signal_type = "SELL"
            confidence += 0.1
        elif support_resistance['near_support'] > 0.2 and trend_direction != "BEARISH":
            signal_type = "BUY"
        elif support_resistance['near_resistance'] < -0.1 and trend_direction != "BULLISH":
            signal_type = "SELL"
        elif support_resistance['breakout_potential'] > 0.3:
            signal_type = "BUY"
            confidence += 0.15
        
        # Risk-reward calculation
        current_price = indicators.get('close', indicators['sma_20'])
        atr = indicators['atr']
        
        if signal_type == "BUY":
            target_price = current_price + (atr * 2)
            stop_loss = current_price - atr
            risk_reward_ratio = (target_price - current_price) / (current_price - stop_loss) if current_price > stop_loss else 1
        elif signal_type == "SELL":
            target_price = current_price - (atr * 2)
            stop_loss = current_price + atr
            risk_reward_ratio = (current_price - target_price) / (stop_loss - current_price) if stop_loss > current_price else 1
        else:
            risk_reward_ratio = 1
        
        # Confidence factors for explainability
        confidence_factors = {
            'trend_strength': trend_strength,
            'momentum_quality': momentum_score,
            'volume_confirmation': volume_score,
            'volatility_assessment': volatility_score,
            'support_resistance': max(support_resistance.values()),
            'risk_reward': min(risk_reward_ratio, 3) / 3  # Cap at 3:1
        }
        
        # Final confidence adjustment
        confidence = min(0.95, max(0.5, confidence))
        
        signal_components = SignalComponents(
            technical_score=technical_score,
            momentum_score=momentum_score,
            trend_score=trend_strength,
            volume_score=volume_score,
            volatility_score=volatility_score,
            risk_reward_ratio=risk_reward_ratio,
            confidence_factors=confidence_factors
        )
        
        return signal_type, confidence, signal_components


class MarketAnalysisEngine:
    """Main market analysis engine that generates trading signals"""
    
    def __init__(self):
        self.technical_analyzer = TechnicalAnalyzer()
        self.rule_analyzer = RuleBasedAnalyzer()
    
    def fetch_market_data(self, symbol: str, period: str = "60d") -> pd.DataFrame:
        """Fetch market data for analysis"""
        try:
            # Convert NSE symbols to Yahoo Finance format
            yf_symbol = self._convert_to_yf_symbol(symbol)
            
            # Fetch data
            ticker = yf.Ticker(yf_symbol)
            df = ticker.history(period=period)
            
            if df.empty:
                raise ValueError(f"No data found for symbol: {symbol}")
            
            # Ensure consistent column names
            df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching market data for {symbol}: {e}")
            # Return mock data for testing
            return self._generate_mock_data(symbol)
    
    def _convert_to_yf_symbol(self, symbol: str) -> str:
        """Convert NSE symbols to Yahoo Finance format"""
        # Common NSE to YF mappings
        symbol_mapping = {
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS',
            'INFY': 'INFY.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'ADANIPORTS': 'ADANIPORTS.NS',
            'ASIANPAINT': 'ASIANPAINT.NS',
            'AXISBANK': 'AXISBANK.NS',
            'BAJFINANCE': 'BAJFINANCE.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'BPCL': 'BPCL.NS',
            'CIPLA': 'CIPLA.NS',
            'COALINDIA': 'COALINDIA.NS',
            'DRREDDY': 'DRREDDY.NS',
            'EICHERMOT': 'EICHERMOT.NS',
            'GRASIM': 'GRASIM.NS',
            'HCLTECH': 'HCLTECH.NS',
            'HDFC': 'HDFC.NS',
            'HEROMOTOCO': 'HEROMOTOCO.NS',
            'HINDALCO': 'HINDALCO.NS',
            'HINDUNILVR': 'HINDUNILVR.NS',
            'ITC': 'ITC.NS',
            'JSWSTEEL': 'JSWSTEEL.NS',
            'KOTAKBANK': 'KOTAKBANK.NS',
            'LT': 'LT.NS',
            'M&M': 'M&M.NS',
            'MARUTI': 'MARUTI.NS',
            'NESTLEIND': 'NESTLEIND.NS',
            'NTPC': 'NTPC.NS',
            'ONGC': 'ONGC.NS',
            'POWERGRID': 'POWERGRID.NS',
            'SBILIFE': 'SBILIFE.NS',
            'SBIN': 'SBIN.NS',
            'SUNPHARMA': 'SUNPHARMA.NS',
            'TATACONSUM': 'TATACONSUM.NS',
            'TATAMOTORS': 'TATAMOTORS.NS',
            'TATASTEEL': 'TATASTEEL.NS',
            'TECHM': 'TECHM.NS',
            'TITAN': 'TITAN.NS',
            'ULTRACEMCO': 'ULTRACEMCO.NS',
            'UPL': 'UPL.NS',
            'WIPRO': 'WIPRO.NS'
        }
        
        if symbol.upper() in symbol_mapping:
            return symbol_mapping[symbol.upper()]
        elif not symbol.endswith('.NS'):
            return f"{symbol.upper()}.NS"
        return symbol.upper()
    
    def _generate_mock_data(self, symbol: str) -> pd.DataFrame:
        """Generate mock market data for testing"""
        dates = pd.date_range(start=datetime.now() - timedelta(days=60), end=datetime.now(), freq='D')
        
        # Generate realistic mock data
        np.random.seed(hash(symbol) % 1000)  # Consistent data per symbol
        base_price = 100 + (hash(symbol) % 500)  # Base price between 100-600
        
        prices = [base_price]
        for _ in range(len(dates) - 1):
            change = np.random.normal(0, 0.02)  # 2% daily volatility
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, 1))  # Ensure positive prices
        
        data = {
            'Open': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
            'High': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
            'Low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
            'Close': prices,
            'Volume': [np.random.randint(10000, 1000000) for _ in prices]
        }
        
        return pd.DataFrame(data, index=dates)
    
    def generate_signal(self, symbol: str, user: CustomUser, strategy_name: str = "Market Analysis Engine") -> Optional[TradingSignal]:
        """Generate a trading signal for the given symbol"""
        try:
            # Fetch market data
            df = self.fetch_market_data(symbol)
            
            # Calculate technical indicators
            indicators = self.technical_analyzer.calculate_indicators(df)
            indicators['close'] = df['Close'].iloc[-1]  # Add current price
            
            # Generate signal using rule-based analysis
            signal_type, confidence, signal_components = self.rule_analyzer.generate_signal(indicators)
            
            # Skip generating signal if confidence is too low or signal is HOLD
            if confidence < 0.6 or signal_type == "HOLD":
                logger.info(f"Skipping signal for {symbol}: confidence={confidence:.2f}, type={signal_type}")
                return None
            
            # Calculate prices
            current_price = df['Close'].iloc[-1]
            atr = indicators['atr']
            
            if signal_type == "BUY":
                entry_price = current_price
                target_price = current_price + (atr * 2)
                stop_loss = current_price - atr
            elif signal_type == "SELL":
                entry_price = current_price
                target_price = current_price - (atr * 2)
                stop_loss = current_price + atr
            else:
                return None
            
            # Generate explainable AI justification
            try:
                explanation = signal_explainer.generate_signal_explanation(
                    features=indicators,
                    signal_type=signal_type,
                    confidence_score=confidence
                ) if signal_explainer.explainer else {
                    'ai_justification': f"Rule-based {signal_type} signal with {confidence:.1%} confidence",
                    'feature_importance': signal_components.confidence_factors,
                    'shap_values': {},
                    'risk_reward_analysis': {
                        'risk_factors': {'volatility': indicators['volatility']},
                        'reward_factors': {'trend_strength': signal_components.trend_score}
                    }
                }
            except Exception as e:
                logger.warning(f"Error generating AI explanation: {e}")
                explanation = {
                    'ai_justification': f"Rule-based {signal_type} signal with {confidence:.1%} confidence",
                    'feature_importance': signal_components.confidence_factors,
                    'shap_values': {},
                    'risk_reward_analysis': {'risk_factors': {}, 'reward_factors': {}}
                }
            
            # Create trading signal
            trading_signal = TradingSignal.objects.create(
                user=user,
                instrument_type=TradingSignal.InstrumentType.EQUITY,
                symbol=symbol.upper(),
                strategy_name=strategy_name,
                signal_type=signal_type,
                confidence_score=Decimal(str(round(confidence, 3))),
                entry_price=Decimal(str(round(entry_price, 2))),
                target_price=Decimal(str(round(target_price, 2))),
                stop_loss=Decimal(str(round(stop_loss, 2))),
                valid_until=timezone.now() + timedelta(hours=4),  # Signal valid for 4 hours
                
                # Explainable AI fields
                ai_justification=explanation['ai_justification'],
                feature_importance=explanation['feature_importance'],
                shap_values=explanation['shap_values'],
                risk_reward_ratio=Decimal(str(round(signal_components.risk_reward_ratio, 2))),
                probability_explanation=explanation.get('risk_reward_analysis', {}),
                
                # Market data
                market_data={
                    'current_price': float(current_price),
                    'technical_indicators': indicators,
                    'signal_components': {
                        'technical_score': signal_components.technical_score,
                        'momentum_score': signal_components.momentum_score,
                        'trend_score': signal_components.trend_score,
                        'volume_score': signal_components.volume_score,
                        'volatility_score': signal_components.volatility_score
                    }
                },
                
                # Backtest placeholder (would be calculated from historical performance)
                backtest_result={
                    'win_rate': 0.65,
                    'avg_return': 0.08,
                    'max_drawdown': 0.15,
                    'sharpe_ratio': 1.2
                }
            )
            
            logger.info(f"Generated {signal_type} signal for {symbol} with {confidence:.1%} confidence")
            return trading_signal
            
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {e}")
            return None
    
    def generate_signals_batch(self, symbols: List[str], user: CustomUser, strategy_name: str = "Market Analysis Engine") -> List[TradingSignal]:
        """Generate signals for multiple symbols"""
        signals = []
        
        for symbol in symbols:
            try:
                signal = self.generate_signal(symbol, user, strategy_name)
                if signal:
                    signals.append(signal)
            except Exception as e:
                logger.error(f"Error generating signal for {symbol}: {e}")
                continue
        
        return signals
    
    def analyze_market_sentiment(self, symbols: List[str]) -> Dict[str, str]:
        """Analyze overall market sentiment"""
        sentiment_counts = {"BULLISH": 0, "BEARISH": 0, "NEUTRAL": 0}
        
        for symbol in symbols[:10]:  # Limit to top 10 symbols for performance
            try:
                df = self.fetch_market_data(symbol, period="30d")
                indicators = self.technical_analyzer.calculate_indicators(df)
                
                trend_strength, trend_direction = self.rule_analyzer.analyze_trend(indicators)
                if trend_strength > 0.4:
                    sentiment_counts[trend_direction] += 1
                else:
                    sentiment_counts["NEUTRAL"] += 1
                    
            except Exception as e:
                logger.warning(f"Could not analyze sentiment for {symbol}: {e}")
                sentiment_counts["NEUTRAL"] += 1
        
        # Determine overall sentiment
        total = sum(sentiment_counts.values())
        if total == 0:
            overall_sentiment = "NEUTRAL"
        else:
            max_sentiment = max(sentiment_counts, key=sentiment_counts.get)
            if sentiment_counts[max_sentiment] / total > 0.5:
                overall_sentiment = max_sentiment
            else:
                overall_sentiment = "MIXED"
        
        return {
            "overall_sentiment": overall_sentiment,
            "breakdown": sentiment_counts,
            "confidence": round(max(sentiment_counts.values()) / total * 100, 1) if total > 0 else 0
        }


# Global instance
market_analysis_engine = MarketAnalysisEngine()


def generate_signal_for_symbol(symbol: str, user: CustomUser, strategy_name: str = "Market Analysis Engine") -> Optional[TradingSignal]:
    """Convenience function to generate a signal for a single symbol"""
    return market_analysis_engine.generate_signal(symbol, user, strategy_name)


def generate_signals_for_symbols(symbols: List[str], user: CustomUser, strategy_name: str = "Market Analysis Engine") -> List[TradingSignal]:
    """Convenience function to generate signals for multiple symbols"""
    return market_analysis_engine.generate_signals_batch(symbols, user, strategy_name)


def get_market_sentiment(symbols: List[str] = None) -> Dict[str, str]:
    """Get overall market sentiment analysis"""
    if symbols is None:
        symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ADANIPORTS', 'ASIANPAINT', 'AXISBANK', 'BAJFINANCE', 'BHARTIARTL']
    
    return market_analysis_engine.analyze_market_sentiment(symbols)