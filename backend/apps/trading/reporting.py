"""
Comprehensive Trading Reporting and Analytics Module
Provides P&L analysis, risk metrics, and performance statistics
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import logging

from django.db.models import Q, Sum, Avg, Count, Max, Min
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import (
    TradingSignal, TradingOrder, AutomatedTradeExecution, 
    PortfolioPosition, TradingStrategy
)

User = get_user_model()
logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Container for performance metrics"""
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_pnl: Decimal
    total_return: float
    average_win: Decimal
    average_loss: Decimal
    profit_factor: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    max_drawdown_duration: int
    volatility: float
    var_95: float  # Value at Risk 95%
    expected_shortfall: float  # Conditional VaR
    portfolio_value: Decimal
    returns_series: List[float]


@dataclass
class RiskMetrics:
    """Container for risk analysis metrics"""
    portfolio_beta: float
    portfolio_alpha: float
    tracking_error: float
    information_ratio: float
    downside_deviation: float
    upside_capture: float
    downside_capture: float
    tail_ratio: float
    skewness: float
    kurtosis: float


@dataclass
class MonthlyReport:
    """Monthly performance summary"""
    month: str
    trades_count: int
    pnl: Decimal
    return_pct: float
    win_rate: float
    best_trade: Decimal
    worst_trade: Decimal
    avg_trade_duration: float


class TradingReportGenerator:
    """Main class for generating trading performance reports"""
    
    def __init__(self, user: User = None, strategy: TradingStrategy = None):
        self.user = user
        self.strategy = strategy
        self.risk_free_rate = 0.06  # 6% annual risk-free rate (can be made configurable)
    
    def get_trade_history(self, start_date: datetime = None, end_date: datetime = None) -> pd.DataFrame:
        """Get historical trade data as pandas DataFrame"""
        
        # Build base queryset
        queryset = AutomatedTradeExecution.objects.filter(
            status=AutomatedTradeExecution.ExecutionStatus.COMPLETED
        ).select_related('signal', 'entry_order', 'stop_loss_order', 'target_order')
        
        if self.user:
            queryset = queryset.filter(signal__user=self.user)
        
        if self.strategy:
            queryset = queryset.filter(strategy=self.strategy)
        
        if start_date:
            queryset = queryset.filter(entry_executed_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(entry_executed_at__lte=end_date)
        
        # Convert to DataFrame
        trades_data = []
        for execution in queryset:
            if execution.entry_order and execution.entry_order.is_executed:
                trade_data = {
                    'execution_id': str(execution.id),
                    'symbol': execution.signal.symbol,
                    'signal_type': execution.signal.signal_type,
                    'entry_date': execution.entry_executed_at,
                    'exit_date': execution.exit_executed_at,
                    'entry_price': float(execution.entry_order.average_price or execution.entry_order.price),
                    'exit_price': None,
                    'quantity': execution.entry_order.filled_quantity,
                    'pnl': float(execution.total_pnl),
                    'fees': float(execution.fees_paid),
                    'duration_days': None,
                    'strategy': execution.strategy.name if execution.strategy else 'Unknown',
                    'confidence_score': float(execution.signal.confidence_score),
                    'is_winner': execution.total_pnl > 0
                }
                
                # Calculate exit price and duration
                if execution.exit_executed_at:
                    duration = execution.exit_executed_at - execution.entry_executed_at
                    trade_data['duration_days'] = duration.days + (duration.seconds / 86400)
                
                # Get exit price from executed orders
                if execution.stop_loss_order and execution.stop_loss_order.is_executed:
                    trade_data['exit_price'] = float(execution.stop_loss_order.average_price or execution.stop_loss_order.price)
                elif execution.target_order and execution.target_order.is_executed:
                    trade_data['exit_price'] = float(execution.target_order.average_price or execution.target_order.price)
                
                trades_data.append(trade_data)
        
        return pd.DataFrame(trades_data)
    
    def calculate_returns_series(self, trade_df: pd.DataFrame, initial_capital: float = 100000) -> List[float]:
        """Calculate cumulative returns series from trade data"""
        if trade_df.empty:
            return [0.0]
        
        # Sort by entry date
        trade_df = trade_df.sort_values('entry_date')
        
        # Calculate daily returns
        returns = []
        portfolio_value = initial_capital
        
        for _, trade in trade_df.iterrows():
            if pd.notna(trade['pnl']):
                daily_return = float(trade['pnl']) / portfolio_value
                returns.append(daily_return)
                portfolio_value += float(trade['pnl'])
        
        return returns
    
    def calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = None) -> float:
        """Calculate Sharpe ratio from returns series"""
        if not returns or len(returns) < 2:
            return 0.0
        
        if risk_free_rate is None:
            risk_free_rate = self.risk_free_rate
        
        returns_array = np.array(returns)
        excess_returns = returns_array - (risk_free_rate / 252)  # Daily risk-free rate
        
        if np.std(excess_returns) == 0:
            return 0.0
        
        return float(np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252))
    
    def calculate_sortino_ratio(self, returns: List[float], risk_free_rate: float = None) -> float:
        """Calculate Sortino ratio (focuses on downside deviation)"""
        if not returns or len(returns) < 2:
            return 0.0
        
        if risk_free_rate is None:
            risk_free_rate = self.risk_free_rate
        
        returns_array = np.array(returns)
        excess_returns = returns_array - (risk_free_rate / 252)
        
        # Calculate downside deviation (only negative returns)
        negative_returns = excess_returns[excess_returns < 0]
        if len(negative_returns) == 0:
            return float('inf')  # All positive returns
        
        downside_deviation = np.sqrt(np.mean(negative_returns**2))
        
        if downside_deviation == 0:
            return 0.0
        
        return float(np.mean(excess_returns) / downside_deviation * np.sqrt(252))
    
    def calculate_max_drawdown(self, returns: List[float]) -> Tuple[float, int]:
        """Calculate maximum drawdown and duration"""
        if not returns:
            return 0.0, 0
        
        # Calculate cumulative returns
        cumulative = np.cumprod(1 + np.array(returns))
        
        # Calculate running maximum
        running_max = np.maximum.accumulate(cumulative)
        
        # Calculate drawdown
        drawdown = (cumulative - running_max) / running_max
        
        # Find maximum drawdown
        max_drawdown = float(np.min(drawdown))
        
        # Calculate drawdown duration
        max_dd_duration = 0
        current_duration = 0
        
        for dd in drawdown:
            if dd < 0:
                current_duration += 1
                max_dd_duration = max(max_dd_duration, current_duration)
            else:
                current_duration = 0
        
        return abs(max_drawdown), max_dd_duration
    
    def calculate_calmar_ratio(self, returns: List[float]) -> float:
        """Calculate Calmar ratio (annual return / max drawdown)"""
        if not returns:
            return 0.0
        
        annual_return = (np.prod(1 + np.array(returns)) ** (252 / len(returns))) - 1
        max_drawdown, _ = self.calculate_max_drawdown(returns)
        
        if max_drawdown == 0:
            return float('inf')
        
        return float(annual_return / max_drawdown)
    
    def calculate_var_and_es(self, returns: List[float], confidence_level: float = 0.95) -> Tuple[float, float]:
        """Calculate Value at Risk and Expected Shortfall"""
        if not returns:
            return 0.0, 0.0
        
        returns_array = np.array(returns)
        sorted_returns = np.sort(returns_array)
        
        # Value at Risk (VaR)
        var_index = int((1 - confidence_level) * len(sorted_returns))
        var = float(sorted_returns[var_index]) if var_index < len(sorted_returns) else 0.0
        
        # Expected Shortfall (Conditional VaR)
        tail_returns = sorted_returns[:var_index+1] if var_index >= 0 else []
        expected_shortfall = float(np.mean(tail_returns)) if len(tail_returns) > 0 else 0.0
        
        return abs(var), abs(expected_shortfall)
    
    def generate_performance_metrics(self, start_date: datetime = None, end_date: datetime = None, 
                                   initial_capital: float = 100000) -> PerformanceMetrics:
        """Generate comprehensive performance metrics"""
        
        # Get trade history
        trade_df = self.get_trade_history(start_date, end_date)
        
        if trade_df.empty:
            return PerformanceMetrics(
                total_trades=0, winning_trades=0, losing_trades=0, win_rate=0.0,
                total_pnl=Decimal('0.00'), total_return=0.0, average_win=Decimal('0.00'),
                average_loss=Decimal('0.00'), profit_factor=0.0, sharpe_ratio=0.0,
                sortino_ratio=0.0, calmar_ratio=0.0, max_drawdown=0.0, max_drawdown_duration=0,
                volatility=0.0, var_95=0.0, expected_shortfall=0.0, portfolio_value=Decimal(str(initial_capital)),
                returns_series=[]
            )
        
        # Basic metrics
        total_trades = len(trade_df)
        winning_trades = len(trade_df[trade_df['is_winner'] == True])
        losing_trades = total_trades - winning_trades
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0
        
        # P&L metrics
        total_pnl = Decimal(str(trade_df['pnl'].sum()))
        total_return = float(total_pnl) / initial_capital * 100
        
        winning_trades_df = trade_df[trade_df['is_winner'] == True]
        losing_trades_df = trade_df[trade_df['is_winner'] == False]
        
        average_win = Decimal(str(winning_trades_df['pnl'].mean())) if len(winning_trades_df) > 0 else Decimal('0.00')
        average_loss = Decimal(str(abs(losing_trades_df['pnl'].mean()))) if len(losing_trades_df) > 0 else Decimal('0.00')
        
        # Profit factor
        gross_profit = winning_trades_df['pnl'].sum() if len(winning_trades_df) > 0 else 0
        gross_loss = abs(losing_trades_df['pnl'].sum()) if len(losing_trades_df) > 0 else 0
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Calculate returns series
        returns_series = self.calculate_returns_series(trade_df, initial_capital)
        
        # Risk metrics
        sharpe_ratio = self.calculate_sharpe_ratio(returns_series)
        sortino_ratio = self.calculate_sortino_ratio(returns_series)
        calmar_ratio = self.calculate_calmar_ratio(returns_series)
        max_drawdown, max_dd_duration = self.calculate_max_drawdown(returns_series)
        volatility = float(np.std(returns_series) * np.sqrt(252)) if returns_series else 0.0
        var_95, expected_shortfall = self.calculate_var_and_es(returns_series)
        
        return PerformanceMetrics(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            total_pnl=total_pnl,
            total_return=total_return,
            average_win=average_win,
            average_loss=average_loss,
            profit_factor=profit_factor,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            max_drawdown=max_drawdown * 100,  # Convert to percentage
            max_drawdown_duration=max_dd_duration,
            volatility=volatility * 100,  # Convert to percentage
            var_95=var_95 * 100,  # Convert to percentage
            expected_shortfall=expected_shortfall * 100,  # Convert to percentage
            portfolio_value=Decimal(str(initial_capital + float(total_pnl))),
            returns_series=returns_series
        )
    
    def generate_monthly_reports(self, start_date: datetime = None, end_date: datetime = None) -> List[MonthlyReport]:
        """Generate monthly performance reports"""
        
        trade_df = self.get_trade_history(start_date, end_date)
        
        if trade_df.empty:
            return []
        
        trade_df['entry_month'] = pd.to_datetime(trade_df['entry_date']).dt.to_period('M')
        monthly_reports = []
        
        for month, group in trade_df.groupby('entry_month'):
            trades_count = len(group)
            pnl = Decimal(str(group['pnl'].sum()))
            return_pct = group['pnl'].sum() / 100000 * 100  # Assuming 100k base
            win_rate = len(group[group['is_winner'] == True]) / trades_count * 100
            best_trade = Decimal(str(group['pnl'].max()))
            worst_trade = Decimal(str(group['pnl'].min()))
            avg_duration = group['duration_days'].mean() if 'duration_days' in group.columns else 0
            
            monthly_reports.append(MonthlyReport(
                month=str(month),
                trades_count=trades_count,
                pnl=pnl,
                return_pct=return_pct,
                win_rate=win_rate,
                best_trade=best_trade,
                worst_trade=worst_trade,
                avg_trade_duration=avg_duration
            ))
        
        return monthly_reports
    
    def generate_strategy_comparison(self) -> Dict[str, Any]:
        """Compare performance across different strategies"""
        
        trade_df = self.get_trade_history()
        
        if trade_df.empty:
            return {}
        
        strategy_performance = {}
        
        for strategy_name, group in trade_df.groupby('strategy'):
            returns = self.calculate_returns_series(group)
            
            strategy_performance[strategy_name] = {
                'total_trades': len(group),
                'win_rate': len(group[group['is_winner'] == True]) / len(group) * 100,
                'total_pnl': float(group['pnl'].sum()),
                'avg_pnl_per_trade': float(group['pnl'].mean()),
                'sharpe_ratio': self.calculate_sharpe_ratio(returns),
                'max_drawdown': self.calculate_max_drawdown(returns)[0] * 100,
                'profit_factor': (
                    group[group['pnl'] > 0]['pnl'].sum() / 
                    abs(group[group['pnl'] < 0]['pnl'].sum())
                ) if group[group['pnl'] < 0]['pnl'].sum() < 0 else float('inf')
            }
        
        return strategy_performance
    
    def generate_risk_analysis(self, benchmark_returns: List[float] = None) -> RiskMetrics:
        """Generate detailed risk analysis metrics"""
        
        trade_df = self.get_trade_history()
        returns = self.calculate_returns_series(trade_df)
        
        if not returns:
            return RiskMetrics(
                portfolio_beta=0.0, portfolio_alpha=0.0, tracking_error=0.0,
                information_ratio=0.0, downside_deviation=0.0, upside_capture=0.0,
                downside_capture=0.0, tail_ratio=0.0, skewness=0.0, kurtosis=0.0
            )
        
        returns_array = np.array(returns)
        
        # Basic statistics
        skewness = float(self._calculate_skewness(returns_array))
        kurtosis = float(self._calculate_kurtosis(returns_array))
        
        # Downside deviation
        negative_returns = returns_array[returns_array < 0]
        downside_deviation = float(np.sqrt(np.mean(negative_returns**2))) if len(negative_returns) > 0 else 0.0
        
        # Tail ratio (95th percentile / 5th percentile)
        p95 = np.percentile(returns_array, 95)
        p5 = np.percentile(returns_array, 5)
        tail_ratio = float(abs(p95 / p5)) if p5 != 0 else 0.0
        
        # If benchmark provided, calculate beta, alpha, etc.
        portfolio_beta = 0.0
        portfolio_alpha = 0.0
        tracking_error = 0.0
        information_ratio = 0.0
        upside_capture = 0.0
        downside_capture = 0.0
        
        if benchmark_returns and len(benchmark_returns) == len(returns):
            benchmark_array = np.array(benchmark_returns)
            
            # Beta calculation
            covariance = np.cov(returns_array, benchmark_array)[0, 1]
            benchmark_variance = np.var(benchmark_array)
            portfolio_beta = float(covariance / benchmark_variance) if benchmark_variance != 0 else 0.0
            
            # Alpha calculation (Jensen's alpha)
            portfolio_return = np.mean(returns_array)
            benchmark_return = np.mean(benchmark_array)
            portfolio_alpha = float(portfolio_return - (self.risk_free_rate/252 + portfolio_beta * (benchmark_return - self.risk_free_rate/252)))
            
            # Tracking error
            tracking_error = float(np.std(returns_array - benchmark_array))
            
            # Information ratio
            excess_return = np.mean(returns_array - benchmark_array)
            information_ratio = float(excess_return / tracking_error) if tracking_error != 0 else 0.0
            
            # Upside/Downside capture
            up_periods = benchmark_array > 0
            down_periods = benchmark_array < 0
            
            if np.any(up_periods):
                upside_capture = float(np.mean(returns_array[up_periods]) / np.mean(benchmark_array[up_periods]))
            
            if np.any(down_periods):
                downside_capture = float(np.mean(returns_array[down_periods]) / np.mean(benchmark_array[down_periods]))
        
        return RiskMetrics(
            portfolio_beta=portfolio_beta,
            portfolio_alpha=portfolio_alpha * 252,  # Annualized
            tracking_error=tracking_error * np.sqrt(252),  # Annualized
            information_ratio=information_ratio * np.sqrt(252),  # Annualized
            downside_deviation=downside_deviation * np.sqrt(252),  # Annualized
            upside_capture=upside_capture,
            downside_capture=downside_capture,
            tail_ratio=tail_ratio,
            skewness=skewness,
            kurtosis=kurtosis
        )
    
    def _calculate_skewness(self, returns: np.ndarray) -> float:
        """Calculate skewness of returns"""
        if len(returns) < 3:
            return 0.0
        
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.0
        
        return np.mean(((returns - mean_return) / std_return) ** 3)
    
    def _calculate_kurtosis(self, returns: np.ndarray) -> float:
        """Calculate kurtosis of returns"""
        if len(returns) < 4:
            return 0.0
        
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.0
        
        return np.mean(((returns - mean_return) / std_return) ** 4) - 3  # Excess kurtosis
    
    def generate_portfolio_summary(self) -> Dict[str, Any]:
        """Generate current portfolio summary"""
        
        if not self.user:
            return {}
        
        # Get current positions
        positions = PortfolioPosition.objects.filter(user=self.user)
        
        total_portfolio_value = Decimal('0.00')
        total_unrealized_pnl = Decimal('0.00')
        total_realized_pnl = Decimal('0.00')
        
        position_details = []
        
        for position in positions:
            position_value = position.current_value
            total_portfolio_value += position_value
            total_unrealized_pnl += position.unrealized_pnl
            total_realized_pnl += position.realized_pnl
            
            position_details.append({
                'symbol': position.symbol,
                'quantity': position.total_quantity,
                'avg_price': float(position.average_price),
                'current_price': float(position.current_price) if position.current_price else None,
                'current_value': float(position_value),
                'unrealized_pnl': float(position.unrealized_pnl),
                'pnl_percentage': position.pnl_percentage
            })
        
        return {
            'total_portfolio_value': float(total_portfolio_value),
            'total_unrealized_pnl': float(total_unrealized_pnl),
            'total_realized_pnl': float(total_realized_pnl),
            'total_positions': len(positions),
            'position_details': position_details
        }


# Utility functions for easy access
def generate_user_performance_report(user: User, start_date: datetime = None, 
                                   end_date: datetime = None) -> Dict[str, Any]:
    """Generate complete performance report for a user"""
    
    reporter = TradingReportGenerator(user=user)
    
    # Generate all metrics
    performance_metrics = reporter.generate_performance_metrics(start_date, end_date)
    monthly_reports = reporter.generate_monthly_reports(start_date, end_date)
    strategy_comparison = reporter.generate_strategy_comparison()
    risk_metrics = reporter.generate_risk_analysis()
    portfolio_summary = reporter.generate_portfolio_summary()
    
    return {
        'performance_metrics': asdict(performance_metrics),
        'monthly_reports': monthly_reports,
        'strategy_comparison': strategy_comparison,
        'risk_metrics': risk_metrics,
        'portfolio_summary': portfolio_summary,
        'generated_at': timezone.now().isoformat()
    }


def generate_strategy_performance_report(strategy: TradingStrategy, start_date: datetime = None,
                                       end_date: datetime = None) -> Dict[str, Any]:
    """Generate performance report for a specific strategy"""
    
    reporter = TradingReportGenerator(strategy=strategy)
    
    performance_metrics = reporter.generate_performance_metrics(start_date, end_date)
    monthly_reports = reporter.generate_monthly_reports(start_date, end_date)
    risk_metrics = reporter.generate_risk_analysis()
    
    return {
        'strategy_name': strategy.name,
        'performance_metrics': asdict(performance_metrics),
        'monthly_reports': monthly_reports,
        'risk_metrics': risk_metrics,
        'generated_at': timezone.now().isoformat()
    }