import asyncio
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Any
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Avg, Sum, Count
from django.conf import settings

from .models import TradingSignal, TradingOrder
from ..brokers.models import BrokerAccount
from ..brokers.services import BrokerService
from ..ai_studio.models import MLModel

logger = logging.getLogger(__name__)


class TradingEngine:
    """Core trading engine for signal processing and order management"""
    
    def __init__(self, user):
        self.user = user
        self.logger = logging.getLogger(f"{self.__class__.__name__}.{user.id}")
    
    async def process_signal(self, signal: TradingSignal, auto_execute: bool = False) -> Dict[str, Any]:
        """Process a trading signal and optionally execute it"""
        try:
            # Validate signal
            validation_result = self.validate_signal(signal)
            if not validation_result['valid']:
                return {
                    'success': False,
                    'error': validation_result['reason'],
                    'signal_id': str(signal.id)
                }
            
            # Check risk management
            risk_check = await self.check_risk_management(signal)
            if not risk_check['allowed']:
                return {
                    'success': False,
                    'error': risk_check['reason'],
                    'signal_id': str(signal.id)
                }
            
            # If auto-execute is enabled, place the order
            if auto_execute:
                execution_result = await self.execute_signal(signal)
                return execution_result
            else:
                return {
                    'success': True,
                    'message': 'Signal processed and validated successfully',
                    'signal_id': str(signal.id),
                    'auto_executed': False
                }
                
        except Exception as e:
            self.logger.error(f"Signal processing failed for {signal.id}: {str(e)}")
            return {
                'success': False,
                'error': f'Signal processing failed: {str(e)}',
                'signal_id': str(signal.id)
            }
    
    def validate_signal(self, signal: TradingSignal) -> Dict[str, Any]:
        """Validate trading signal before processing"""
        try:
            # Check if signal is still valid
            if not signal.is_valid:
                return {
                    'valid': False,
                    'reason': 'Signal has expired'
                }
            
            # Check confidence threshold
            min_confidence = Decimal('0.60')  # 60% minimum confidence
            if signal.confidence_score < min_confidence:
                return {
                    'valid': False,
                    'reason': f'Confidence score {signal.confidence_score} below minimum {min_confidence}'
                }
            
            # Check if signal was already executed
            if signal.executed:
                return {
                    'valid': False,
                    'reason': 'Signal has already been executed'
                }
            
            # Validate risk-reward ratio if targets are set
            if signal.risk_reward_ratio and signal.risk_reward_ratio < 1.5:
                return {
                    'valid': False,
                    'reason': f'Risk-reward ratio {signal.risk_reward_ratio:.2f} below minimum 1.5'
                }
            
            # Check trading hours
            if not self.is_market_open():
                return {
                    'valid': False,
                    'reason': 'Market is currently closed'
                }
            
            return {
                'valid': True,
                'reason': 'Signal validation passed'
            }
            
        except Exception as e:
            self.logger.error(f"Signal validation failed: {str(e)}")
            return {
                'valid': False,
                'reason': f'Validation error: {str(e)}'
            }
    
    async def check_risk_management(self, signal: TradingSignal) -> Dict[str, Any]:
        """Check risk management rules before executing signal"""
        try:
            # Check daily loss limit
            today_pnl = await self.calculate_daily_pnl()
            if today_pnl < -5000:  # ₹5000 daily loss limit
                return {
                    'allowed': False,
                    'reason': 'Daily loss limit exceeded'
                }
            
            # Check maximum concurrent positions
            open_positions = await self.get_open_positions_count()
            if open_positions >= 10:  # Maximum 10 open positions
                return {
                    'allowed': False,
                    'reason': 'Maximum concurrent positions limit reached'
                }
            
            # Check position sizing
            max_position_size = Decimal('10000')  # ₹10000 per position
            position_value = signal.entry_price * 100  # Assuming 100 quantity
            if position_value > max_position_size:
                return {
                    'allowed': False,
                    'reason': 'Position size exceeds maximum limit'
                }
            
            # Check if user has active broker account
            primary_broker = await self.get_primary_broker_account()
            if not primary_broker:
                return {
                    'allowed': False,
                    'reason': 'No active broker account found'
                }
            
            return {
                'allowed': True,
                'reason': 'Risk management checks passed'
            }
            
        except Exception as e:
            self.logger.error(f"Risk management check failed: {str(e)}")
            return {
                'allowed': False,
                'reason': f'Risk check error: {str(e)}'
            }
    
    async def execute_signal(self, signal: TradingSignal) -> Dict[str, Any]:
        """Execute trading signal by placing order through broker"""
        try:
            # Get primary broker account
            broker_account = await self.get_primary_broker_account()
            if not broker_account:
                return {
                    'success': False,
                    'error': 'No primary broker account found'
                }
            
            # Calculate position size
            position_size = self.calculate_position_size(signal)
            
            # Create order data
            order_data = {
                'symbol': signal.symbol,
                'exchange': 'NSE',  # Default to NSE
                'transaction_type': 'BUY' if signal.signal_type in ['BUY', 'COVER'] else 'SELL',
                'order_type': 'LIMIT' if signal.entry_price else 'MARKET',
                'quantity': position_size,
                'price': float(signal.entry_price) if signal.entry_price else None,
                'product': 'CNC',  # Cash and Carry
                'validity': 'DAY',
                'platform_order_id': str(signal.id)
            }
            
            # Place order through broker service
            broker_result = await BrokerService.place_order(broker_account, order_data)
            
            if not broker_result['success']:
                return {
                    'success': False,
                    'error': f"Broker order failed: {broker_result.get('error', 'Unknown error')}",
                    'signal_id': str(signal.id)
                }
            
            # Create internal trading order record
            with transaction.atomic():
                trading_order = TradingOrder.objects.create(
                    signal=signal,
                    user=self.user,
                    broker_order_id=broker_result['data']['broker_order_id'],
                    symbol=signal.symbol,
                    order_type=TradingOrder.OrderType.LIMIT if signal.entry_price else TradingOrder.OrderType.MARKET,
                    transaction_type=TradingOrder.TransactionType.BUY if signal.signal_type in ['BUY', 'COVER'] else TradingOrder.TransactionType.SELL,
                    quantity=position_size,
                    price=signal.entry_price,
                    status=TradingOrder.OrderStatus.OPEN
                )
                
                # Mark signal as executed
                signal.executed = True
                signal.executed_price = signal.entry_price
                signal.save()
            
            # Schedule stop-loss and target orders if specified
            if signal.stop_loss or signal.target_price:
                await self.schedule_exit_orders(signal, trading_order, broker_account)
            
            return {
                'success': True,
                'message': 'Signal executed successfully',
                'data': {
                    'signal_id': str(signal.id),
                    'order_id': str(trading_order.id),
                    'broker_order_id': broker_result['data']['broker_order_id'],
                    'quantity': position_size,
                    'price': float(signal.entry_price) if signal.entry_price else None
                }
            }
            
        except Exception as e:
            self.logger.error(f"Signal execution failed: {str(e)}")
            return {
                'success': False,
                'error': f'Execution failed: {str(e)}',
                'signal_id': str(signal.id)
            }
    
    async def schedule_exit_orders(self, signal: TradingSignal, entry_order: TradingOrder, 
                                 broker_account: BrokerAccount) -> None:
        """Schedule stop-loss and target orders"""
        try:
            exit_quantity = entry_order.quantity
            opposite_transaction = TradingOrder.TransactionType.SELL if entry_order.transaction_type == TradingOrder.TransactionType.BUY else TradingOrder.TransactionType.BUY
            
            # Place stop-loss order
            if signal.stop_loss:
                sl_order_data = {
                    'symbol': signal.symbol,
                    'exchange': 'NSE',
                    'transaction_type': opposite_transaction,
                    'order_type': 'SL',
                    'quantity': exit_quantity,
                    'price': float(signal.stop_loss),
                    'trigger_price': float(signal.stop_loss),
                    'product': 'CNC',
                    'validity': 'DAY',
                    'tag': f'SL_{entry_order.id}'
                }
                
                sl_result = await BrokerService.place_order(broker_account, sl_order_data)
                if sl_result['success']:
                    TradingOrder.objects.create(
                        signal=signal,
                        user=self.user,
                        broker_order_id=sl_result['data']['broker_order_id'],
                        symbol=signal.symbol,
                        order_type=TradingOrder.OrderType.SL,
                        transaction_type=opposite_transaction,
                        quantity=exit_quantity,
                        price=signal.stop_loss,
                        trigger_price=signal.stop_loss,
                        status=TradingOrder.OrderStatus.OPEN
                    )
            
            # Place target order
            if signal.target_price:
                target_order_data = {
                    'symbol': signal.symbol,
                    'exchange': 'NSE',
                    'transaction_type': opposite_transaction,
                    'order_type': 'LIMIT',
                    'quantity': exit_quantity,
                    'price': float(signal.target_price),
                    'product': 'CNC',
                    'validity': 'DAY',
                    'tag': f'TARGET_{entry_order.id}'
                }
                
                target_result = await BrokerService.place_order(broker_account, target_order_data)
                if target_result['success']:
                    TradingOrder.objects.create(
                        signal=signal,
                        user=self.user,
                        broker_order_id=target_result['data']['broker_order_id'],
                        symbol=signal.symbol,
                        order_type=TradingOrder.OrderType.LIMIT,
                        transaction_type=opposite_transaction,
                        quantity=exit_quantity,
                        price=signal.target_price,
                        status=TradingOrder.OrderStatus.OPEN
                    )
                    
        except Exception as e:
            self.logger.error(f"Failed to schedule exit orders: {str(e)}")
    
    def calculate_position_size(self, signal: TradingSignal) -> int:
        """Calculate position size based on risk management"""
        try:
            # Simple position sizing: 2% risk per trade
            account_balance = 100000  # Would get from broker account
            risk_per_trade = account_balance * 0.02  # 2% risk
            
            if signal.stop_loss and signal.entry_price:
                risk_per_share = abs(signal.entry_price - signal.stop_loss)
                if risk_per_share > 0:
                    position_size = int(risk_per_trade / risk_per_share)
                    return min(position_size, 1000)  # Cap at 1000 shares
            
            # Default position size if no stop-loss
            return int(risk_per_trade / signal.entry_price) if signal.entry_price else 100
            
        except Exception as e:
            self.logger.error(f"Position sizing calculation failed: {str(e)}")
            return 100  # Default to 100 shares
    
    async def get_primary_broker_account(self) -> Optional[BrokerAccount]:
        """Get user's primary broker account"""
        try:
            return BrokerAccount.objects.filter(
                user=self.user,
                is_primary=True,
                status=BrokerAccount.Status.ACTIVE
            ).first()
        except Exception:
            return None
    
    async def calculate_daily_pnl(self) -> Decimal:
        """Calculate today's P&L from completed orders"""
        try:
            today = timezone.now().date()
            completed_orders = TradingOrder.objects.filter(
                user=self.user,
                status=TradingOrder.OrderStatus.COMPLETE,
                exchange_timestamp__date=today
            )
            
            total_pnl = Decimal('0')
            for order in completed_orders:
                # Simple P&L calculation (would be more complex in reality)
                if order.average_price and order.filled_quantity:
                    order_value = order.average_price * order.filled_quantity
                    if order.transaction_type == TradingOrder.TransactionType.SELL:
                        total_pnl += order_value
                    else:
                        total_pnl -= order_value
            
            return total_pnl
        except Exception:
            return Decimal('0')
    
    async def get_open_positions_count(self) -> int:
        """Get count of open positions"""
        try:
            return TradingOrder.objects.filter(
                user=self.user,
                status=TradingOrder.OrderStatus.OPEN
            ).count()
        except Exception:
            return 0
    
    def is_market_open(self) -> bool:
        """Check if market is currently open"""
        try:
            now = timezone.now()
            current_time = now.time()
            
            # Check if it's a weekday (Monday = 0, Sunday = 6)
            if now.weekday() >= 5:  # Saturday or Sunday
                return False
            
            # Indian market hours: 9:15 AM to 3:30 PM
            market_open = timezone.datetime.strptime('09:15', '%H:%M').time()
            market_close = timezone.datetime.strptime('15:30', '%H:%M').time()
            
            return market_open <= current_time <= market_close
        except Exception:
            # Default to market closed on errors
            return False


class SignalGenerator:
    """Generate trading signals using AI models and technical analysis"""
    
    def __init__(self, user):
        self.user = user
        self.logger = logging.getLogger(f"{self.__class__.__name__}.{user.id}")
    
    async def generate_signals(self, symbols: List[str], strategy_id: Optional[str] = None) -> List[TradingSignal]:
        """Generate trading signals for given symbols"""
        signals = []
        
        try:
            for symbol in symbols:
                # Get market data
                market_data = await self.get_market_data(symbol)
                if not market_data:
                    continue
                
                # Generate signal using ML model if available
                if strategy_id:
                    signal = await self.generate_ml_signal(symbol, market_data, strategy_id)
                else:
                    signal = await self.generate_technical_signal(symbol, market_data)
                
                if signal:
                    signals.append(signal)
                    
        except Exception as e:
            self.logger.error(f"Signal generation failed: {str(e)}")
        
        return signals
    
    async def generate_ml_signal(self, symbol: str, market_data: Dict, strategy_id: str) -> Optional[TradingSignal]:
        """Generate signal using trained ML model"""
        try:
            # Get ML model
            ml_model = MLModel.objects.filter(
                id=strategy_id,
                user=self.user,
                status=MLModel.Status.COMPLETED
            ).first()
            
            if not ml_model:
                return None
            
            # Prepare features for model prediction
            features = self.prepare_features(market_data, ml_model.features)
            
            # Make prediction (simplified - would use actual model)
            prediction = self.make_prediction(features, ml_model)
            
            if prediction['confidence'] < 0.6:  # 60% threshold
                return None
            
            # Create signal
            signal = TradingSignal(
                symbol=symbol,
                strategy_name=ml_model.name,
                signal_type=prediction['signal_type'],
                confidence_score=Decimal(str(prediction['confidence'])),
                entry_price=Decimal(str(market_data['close'])),
                target_price=Decimal(str(prediction.get('target_price', 0))) if prediction.get('target_price') else None,
                stop_loss=Decimal(str(prediction.get('stop_loss', 0))) if prediction.get('stop_loss') else None,
                valid_until=timezone.now() + timedelta(hours=24),
                user=self.user,
                created_by_strategy_id=ml_model.id,
                market_data=market_data,
                backtest_result=ml_model.backtest_results or {}
            )
            
            signal.save()
            return signal
            
        except Exception as e:
            self.logger.error(f"ML signal generation failed for {symbol}: {str(e)}")
            return None
    
    async def generate_technical_signal(self, symbol: str, market_data: Dict) -> Optional[TradingSignal]:
        """Generate signal using technical analysis"""
        try:
            # Simple technical analysis example
            close = market_data['close']
            rsi = market_data.get('rsi', 50)
            macd = market_data.get('macd', 0)
            sma_20 = market_data.get('sma_20', close)
            
            signal_type = None
            confidence = 0.5
            
            # RSI-based signals
            if rsi < 30 and close > sma_20 and macd > 0:
                signal_type = TradingSignal.SignalType.BUY
                confidence = 0.75
            elif rsi > 70 and close < sma_20 and macd < 0:
                signal_type = TradingSignal.SignalType.SELL
                confidence = 0.75
            
            if not signal_type or confidence < 0.6:
                return None
            
            # Calculate target and stop-loss
            atr = market_data.get('atr', close * 0.02)  # 2% ATR default
            
            if signal_type == TradingSignal.SignalType.BUY:
                target_price = close + (2 * atr)
                stop_loss = close - atr
            else:
                target_price = close - (2 * atr)
                stop_loss = close + atr
            
            signal = TradingSignal(
                symbol=symbol,
                strategy_name='Technical Analysis',
                signal_type=signal_type,
                confidence_score=Decimal(str(confidence)),
                entry_price=Decimal(str(close)),
                target_price=Decimal(str(target_price)),
                stop_loss=Decimal(str(stop_loss)),
                valid_until=timezone.now() + timedelta(hours=4),
                user=self.user,
                market_data=market_data,
                backtest_result={
                    'win_rate': 0.65,
                    'avg_return': 0.03,
                    'max_drawdown': 0.15
                }
            )
            
            signal.save()
            return signal
            
        except Exception as e:
            self.logger.error(f"Technical signal generation failed for {symbol}: {str(e)}")
            return None
    
    def prepare_features(self, market_data: Dict, feature_names: List[str]) -> Dict:
        """Prepare features for ML model prediction"""
        features = {}
        for feature_name in feature_names:
            features[feature_name] = market_data.get(feature_name, 0)
        return features
    
    def make_prediction(self, features: Dict, ml_model: MLModel) -> Dict:
        """Make prediction using ML model (simplified)"""
        # This would use the actual trained model
        # For now, return mock prediction
        return {
            'signal_type': TradingSignal.SignalType.BUY,
            'confidence': 0.75,
            'target_price': features.get('close', 100) * 1.02,
            'stop_loss': features.get('close', 100) * 0.98
        }
    
    async def get_market_data(self, symbol: str) -> Optional[Dict]:
        """Get current market data for symbol"""
        try:
            # Mock market data - would integrate with data provider
            import random
            
            base_price = random.uniform(100, 3000)
            return {
                'symbol': symbol,
                'close': base_price,
                'high': base_price * 1.02,
                'low': base_price * 0.98,
                'volume': random.randint(10000, 1000000),
                'rsi': random.uniform(20, 80),
                'macd': random.uniform(-10, 10),
                'sma_20': base_price * random.uniform(0.95, 1.05),
                'ema_12': base_price * random.uniform(0.95, 1.05),
                'atr': base_price * 0.02,
                'bollinger_upper': base_price * 1.02,
                'bollinger_lower': base_price * 0.98,
                'news_sentiment': random.uniform(-1, 1)
            }
        except Exception as e:
            self.logger.error(f"Failed to get market data for {symbol}: {str(e)}")
            return None


class PerformanceAnalyzer:
    """Analyze trading performance and generate reports"""
    
    def __init__(self, user):
        self.user = user
    
    def calculate_performance_metrics(self, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
        """Calculate comprehensive performance metrics"""
        try:
            # Filter orders by date range
            orders_query = TradingOrder.objects.filter(
                user=self.user,
                status=TradingOrder.OrderStatus.COMPLETE
            )
            
            if start_date:
                orders_query = orders_query.filter(exchange_timestamp__gte=start_date)
            if end_date:
                orders_query = orders_query.filter(exchange_timestamp__lte=end_date)
            
            orders = orders_query.order_by('exchange_timestamp')
            
            if not orders.exists():
                return self.get_empty_metrics()
            
            # Calculate metrics
            total_trades = orders.count()
            winning_trades = 0
            losing_trades = 0
            total_pnl = Decimal('0')
            total_fees = Decimal('0')
            
            for order in orders:
                if order.average_price and order.filled_quantity:
                    # Simplified P&L calculation
                    trade_value = order.average_price * order.filled_quantity
                    total_fees += order.fees + order.taxes
                    
                    # This is simplified - real calculation would track entry/exit pairs
                    if order.transaction_type == TradingOrder.TransactionType.SELL:
                        total_pnl += trade_value
                        winning_trades += 1
                    else:
                        total_pnl -= trade_value
            
            # Calculate ratios
            win_rate = (winning_trades / total_trades) if total_trades > 0 else 0
            avg_win = total_pnl / winning_trades if winning_trades > 0 else 0
            avg_loss = total_pnl / losing_trades if losing_trades > 0 else 0
            
            # Calculate Sharpe ratio (simplified)
            returns = [float(total_pnl / total_trades)] if total_trades > 0 else [0]
            sharpe_ratio = (sum(returns) / len(returns)) / (0.1) if returns else 0  # Using 0.1 as std dev
            
            return {
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate': round(win_rate * 100, 2),
                'total_pnl': float(total_pnl),
                'total_fees': float(total_fees),
                'net_pnl': float(total_pnl - total_fees),
                'avg_win': float(avg_win),
                'avg_loss': float(avg_loss),
                'profit_factor': float(abs(avg_win / avg_loss)) if avg_loss != 0 else 0,
                'sharpe_ratio': round(sharpe_ratio, 2),
                'max_drawdown': 0,  # Would calculate properly
                'calmar_ratio': 0,  # Would calculate properly
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            }
            
        except Exception as e:
            logger.error(f"Performance calculation failed: {str(e)}")
            return self.get_empty_metrics()
    
    def get_empty_metrics(self) -> Dict[str, Any]:
        """Return empty metrics structure"""
        return {
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'win_rate': 0,
            'total_pnl': 0,
            'total_fees': 0,
            'net_pnl': 0,
            'avg_win': 0,
            'avg_loss': 0,
            'profit_factor': 0,
            'sharpe_ratio': 0,
            'max_drawdown': 0,
            'calmar_ratio': 0,
            'start_date': None,
            'end_date': None
        }
    
    def get_daily_pnl_series(self, days: int = 30) -> List[Dict]:
        """Get daily P&L series for charting"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # This would aggregate daily P&L properly
            # For now, return mock data
            daily_data = []
            current_date = start_date.date()
            
            while current_date <= end_date.date():
                # Mock daily P&L
                import random
                daily_pnl = random.uniform(-1000, 1000)
                
                daily_data.append({
                    'date': current_date.isoformat(),
                    'pnl': round(daily_pnl, 2),
                    'cumulative_pnl': sum(d['pnl'] for d in daily_data) + daily_pnl
                })
                
                current_date += timedelta(days=1)
            
            return daily_data
            
        except Exception as e:
            logger.error(f"Daily P&L series calculation failed: {str(e)}")
            return []