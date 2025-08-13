"""
F&O-specific analytics and backtesting utilities for AI Studio
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
import math


class FnOBacktester:
    """Backtesting engine specialized for F&O strategies"""
    
    def __init__(self):
        self.results = {}
        self.trades = []
        self.portfolio_history = []
    
    def calculate_option_greeks(self, spot: float, strike: float, time_to_expiry: float, 
                               volatility: float, risk_free_rate: float = 0.05, 
                               option_type: str = 'call') -> Dict[str, float]:
        """
        Calculate Black-Scholes Greeks for options
        """
        from scipy.stats import norm
        import math
        
        # Black-Scholes calculations
        d1 = (math.log(spot / strike) + (risk_free_rate + 0.5 * volatility ** 2) * time_to_expiry) / (volatility * math.sqrt(time_to_expiry))
        d2 = d1 - volatility * math.sqrt(time_to_expiry)
        
        if option_type.lower() == 'call':
            delta = norm.cdf(d1)
            option_price = spot * norm.cdf(d1) - strike * math.exp(-risk_free_rate * time_to_expiry) * norm.cdf(d2)
        else:  # put
            delta = -norm.cdf(-d1)
            option_price = strike * math.exp(-risk_free_rate * time_to_expiry) * norm.cdf(-d2) - spot * norm.cdf(-d1)
        
        gamma = norm.pdf(d1) / (spot * volatility * math.sqrt(time_to_expiry))
        theta = -(spot * norm.pdf(d1) * volatility) / (2 * math.sqrt(time_to_expiry)) - \
                risk_free_rate * strike * math.exp(-risk_free_rate * time_to_expiry) * norm.cdf(d2 if option_type.lower() == 'call' else -d2)
        vega = spot * norm.pdf(d1) * math.sqrt(time_to_expiry)
        rho = strike * time_to_expiry * math.exp(-risk_free_rate * time_to_expiry) * norm.cdf(d2 if option_type.lower() == 'call' else -d2)
        
        return {
            'price': option_price,
            'delta': delta,
            'gamma': gamma,
            'theta': theta / 365,  # Per day
            'vega': vega / 100,    # Per 1% volatility change
            'rho': rho / 100       # Per 1% interest rate change
        }
    
    def backtest_options_strategy(self, strategy_config: Dict, market_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Backtest options strategies with Greeks tracking
        """
        results = {
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'total_pnl': 0,
            'max_drawdown': 0,
            'sharpe_ratio': 0,
            'win_rate': 0,
            'avg_win': 0,
            'avg_loss': 0,
            'max_profit': 0,
            'max_loss': 0,
            'greeks_performance': {
                'delta_accuracy': 0,
                'gamma_effectiveness': 0,
                'theta_capture': 0,
                'vega_hedge_success': 0
            },
            'strategy_specific': {
                'breakeven_accuracy': 0,
                'early_exit_success': 0,
                'expiry_profit_rate': 0,
                'implied_vol_edge': 0
            }
        }
        
        portfolio_value = []
        daily_returns = []
        current_portfolio_value = strategy_config.get('initial_capital', 100000)
        
        for i, row in market_data.iterrows():
            # Simulate strategy execution
            trade_pnl = self._simulate_strategy_day(strategy_config, row)
            current_portfolio_value += trade_pnl
            portfolio_value.append(current_portfolio_value)
            
            if i > 0:
                daily_return = (current_portfolio_value - portfolio_value[i-1]) / portfolio_value[i-1]
                daily_returns.append(daily_return)
        
        # Calculate performance metrics
        if daily_returns:
            results['total_pnl'] = current_portfolio_value - strategy_config.get('initial_capital', 100000)
            results['sharpe_ratio'] = np.mean(daily_returns) / np.std(daily_returns) * np.sqrt(252) if np.std(daily_returns) > 0 else 0
            results['max_drawdown'] = self._calculate_max_drawdown(portfolio_value)
            results['total_trades'] = len([t for t in self.trades if t['pnl'] != 0])
            
            winning_trades = [t for t in self.trades if t['pnl'] > 0]
            losing_trades = [t for t in self.trades if t['pnl'] < 0]
            
            results['winning_trades'] = len(winning_trades)
            results['losing_trades'] = len(losing_trades)
            results['win_rate'] = len(winning_trades) / len(self.trades) if self.trades else 0
            results['avg_win'] = np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0
            results['avg_loss'] = np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0
            results['max_profit'] = max([t['pnl'] for t in self.trades]) if self.trades else 0
            results['max_loss'] = min([t['pnl'] for t in self.trades]) if self.trades else 0
        
        return results
    
    def _simulate_strategy_day(self, strategy_config: Dict, market_row: pd.Series) -> float:
        """
        Simulate one day of strategy execution
        """
        # This is a simplified simulation - in reality would be much more complex
        daily_pnl = 0
        
        # Simulate based on strategy type
        strategy_type = strategy_config.get('strategy_type', '')
        
        if 'STRADDLE' in strategy_type:
            # Long straddle profits from big moves
            price_change = abs(market_row.get('price_change', 0))
            if price_change > 0.02:  # 2% move
                daily_pnl = price_change * 10000  # Simplified
            else:
                daily_pnl = -50  # Time decay
        
        elif 'IRON_CONDOR' in strategy_type:
            # Iron condor profits from low volatility
            price_change = abs(market_row.get('price_change', 0))
            if price_change < 0.01:  # Low volatility
                daily_pnl = 100  # Time decay profit
            else:
                daily_pnl = -price_change * 15000  # Loss from movement
        
        # Add to trades history
        self.trades.append({
            'date': market_row.name,
            'strategy': strategy_type,
            'pnl': daily_pnl,
            'underlying_price': market_row.get('close', 0)
        })
        
        return daily_pnl
    
    def _calculate_max_drawdown(self, portfolio_values: List[float]) -> float:
        """
        Calculate maximum drawdown from portfolio values
        """
        if not portfolio_values:
            return 0
        
        peak = portfolio_values[0]
        max_drawdown = 0
        
        for value in portfolio_values:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        return max_drawdown


class FnOPerformanceAnalyzer:
    """Performance analysis specialized for F&O strategies"""
    
    def __init__(self):
        self.metrics = {}
    
    def analyze_options_performance(self, trades_data: pd.DataFrame, model_predictions: pd.DataFrame) -> Dict[str, float]:
        """
        Analyze options-specific performance metrics
        """
        metrics = {}
        
        # Delta prediction accuracy
        if 'predicted_delta' in model_predictions.columns and 'actual_delta' in model_predictions.columns:
            delta_accuracy = 1 - np.mean(np.abs(model_predictions['predicted_delta'] - model_predictions['actual_delta']))
            metrics['delta_prediction_accuracy'] = max(0, delta_accuracy)
        
        # Gamma effectiveness
        if 'gamma_pnl' in trades_data.columns:
            total_gamma_pnl = trades_data['gamma_pnl'].sum()
            total_pnl = trades_data['total_pnl'].sum()
            metrics['gamma_effectiveness'] = total_gamma_pnl / total_pnl if total_pnl != 0 else 0
        
        # Theta capture rate
        if 'theta_pnl' in trades_data.columns:
            expected_theta = trades_data['expected_theta'].sum()
            actual_theta = trades_data['theta_pnl'].sum()
            metrics['theta_capture_rate'] = actual_theta / expected_theta if expected_theta != 0 else 0
        
        # Vega hedge efficiency
        if 'vega_pnl' in trades_data.columns:
            vega_hedge_success = 1 - (np.std(trades_data['vega_pnl']) / np.mean(np.abs(trades_data['vega_pnl'])))
            metrics['vega_hedge_efficiency'] = max(0, vega_hedge_success)
        
        # Implied volatility edge
        if 'entry_iv' in trades_data.columns and 'realized_vol' in trades_data.columns:
            iv_edge = np.mean(trades_data['entry_iv'] - trades_data['realized_vol'])
            metrics['implied_volatility_edge'] = iv_edge
        
        return metrics
    
    def analyze_futures_performance(self, trades_data: pd.DataFrame) -> Dict[str, float]:
        """
        Analyze futures-specific performance metrics
        """
        metrics = {}
        
        # Basis prediction accuracy
        if 'predicted_basis' in trades_data.columns and 'actual_basis' in trades_data.columns:
            basis_accuracy = 1 - np.mean(np.abs(trades_data['predicted_basis'] - trades_data['actual_basis']))
            metrics['basis_prediction_accuracy'] = max(0, basis_accuracy)
        
        # Rollover timing success
        rollover_trades = trades_data[trades_data['trade_type'] == 'rollover']
        if not rollover_trades.empty:
            successful_rollovers = rollover_trades[rollover_trades['pnl'] > 0]
            metrics['rollover_timing_success'] = len(successful_rollovers) / len(rollover_trades)
        
        # Contango/backwardation signal accuracy
        curve_trades = trades_data[trades_data['strategy'].str.contains('curve', case=False, na=False)]
        if not curve_trades.empty:
            correct_signals = curve_trades[curve_trades['pnl'] > 0]
            metrics['curve_signal_accuracy'] = len(correct_signals) / len(curve_trades)
        
        # Margin efficiency
        if 'margin_used' in trades_data.columns and 'pnl' in trades_data.columns:
            total_margin = trades_data['margin_used'].sum()
            total_pnl = trades_data['pnl'].sum()
            metrics['margin_efficiency'] = total_pnl / total_margin if total_margin > 0 else 0
        
        return metrics
    
    def calculate_risk_metrics(self, portfolio_data: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate F&O-specific risk metrics
        """
        risk_metrics = {}
        
        # Portfolio Greeks
        if all(col in portfolio_data.columns for col in ['delta', 'gamma', 'theta', 'vega']):
            risk_metrics['max_portfolio_delta'] = portfolio_data['delta'].abs().max()
            risk_metrics['max_portfolio_gamma'] = portfolio_data['gamma'].abs().max()
            risk_metrics['max_portfolio_theta'] = portfolio_data['theta'].min()  # Most negative
            risk_metrics['max_portfolio_vega'] = portfolio_data['vega'].abs().max()
        
        # Value at Risk (VaR) - simplified calculation
        if 'daily_pnl' in portfolio_data.columns:
            daily_returns = portfolio_data['daily_pnl'].pct_change().dropna()
            if not daily_returns.empty:
                var_95 = np.percentile(daily_returns, 5)
                risk_metrics['var_95_daily'] = var_95
                risk_metrics['var_95_annual'] = var_95 * np.sqrt(252)
        
        # Maximum margin utilization
        if 'margin_used' in portfolio_data.columns and 'available_margin' in portfolio_data.columns:
            margin_utilization = portfolio_data['margin_used'] / portfolio_data['available_margin']
            risk_metrics['max_margin_utilization'] = margin_utilization.max()
        
        return risk_metrics
    
    def generate_fno_report(self, model_id: str, backtest_results: Dict, 
                           performance_metrics: Dict) -> Dict[str, Any]:
        """
        Generate comprehensive F&O performance report
        """
        report = {
            'model_id': model_id,
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_return': backtest_results.get('total_pnl', 0),
                'sharpe_ratio': backtest_results.get('sharpe_ratio', 0),
                'max_drawdown': backtest_results.get('max_drawdown', 0),
                'win_rate': backtest_results.get('win_rate', 0),
                'total_trades': backtest_results.get('total_trades', 0)
            },
            'options_performance': {
                'delta_accuracy': performance_metrics.get('delta_prediction_accuracy', 0),
                'gamma_effectiveness': performance_metrics.get('gamma_effectiveness', 0),
                'theta_capture': performance_metrics.get('theta_capture_rate', 0),
                'vega_hedge_efficiency': performance_metrics.get('vega_hedge_efficiency', 0),
                'iv_edge': performance_metrics.get('implied_volatility_edge', 0)
            },
            'futures_performance': {
                'basis_accuracy': performance_metrics.get('basis_prediction_accuracy', 0),
                'rollover_success': performance_metrics.get('rollover_timing_success', 0),
                'curve_accuracy': performance_metrics.get('curve_signal_accuracy', 0),
                'margin_efficiency': performance_metrics.get('margin_efficiency', 0)
            },
            'risk_analysis': {
                'max_delta_exposure': performance_metrics.get('max_portfolio_delta', 0),
                'max_gamma_risk': performance_metrics.get('max_portfolio_gamma', 0),
                'var_95': performance_metrics.get('var_95_daily', 0),
                'margin_efficiency': performance_metrics.get('max_margin_utilization', 0)
            },
            'recommendations': self._generate_recommendations(backtest_results, performance_metrics)
        }
        
        return report
    
    def _generate_recommendations(self, backtest_results: Dict, performance_metrics: Dict) -> List[str]:
        """
        Generate actionable recommendations based on performance
        """
        recommendations = []
        
        # Sharpe ratio recommendations
        sharpe = backtest_results.get('sharpe_ratio', 0)
        if sharpe < 1.0:
            recommendations.append("Consider improving risk-adjusted returns by optimizing position sizing")
        elif sharpe > 2.0:
            recommendations.append("Excellent Sharpe ratio - consider scaling up the strategy")
        
        # Win rate recommendations
        win_rate = backtest_results.get('win_rate', 0)
        if win_rate < 0.4:
            recommendations.append("Low win rate detected - review entry criteria and signal quality")
        
        # Greeks performance
        delta_accuracy = performance_metrics.get('delta_prediction_accuracy', 0)
        if delta_accuracy < 0.7:
            recommendations.append("Delta prediction accuracy is low - consider more sophisticated volatility models")
        
        # Drawdown recommendations
        max_dd = backtest_results.get('max_drawdown', 0)
        if max_dd > 0.2:
            recommendations.append("High maximum drawdown - implement better risk management and position sizing")
        
        return recommendations