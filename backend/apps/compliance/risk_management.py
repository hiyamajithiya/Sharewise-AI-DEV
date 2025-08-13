"""
Risk Management System for SEBI Compliance
Implements position limits, circuit breakers, and risk controls
"""
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta, time
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from django.conf import settings

from .models import RiskManagement, TradingAlert, AuditTrail, InvestorProfile
from apps.trading.models import TradingOrder  # Assuming this exists

User = get_user_model()
logger = logging.getLogger(__name__)


class PositionLimitManager:
    """Manage position limits as per SEBI guidelines"""
    
    def __init__(self):
        # SEBI position limits for different categories
        self.sebi_limits = {
            'EQUITY_INDIVIDUAL': {
                'single_stock_limit': Decimal('5000000'),  # ₹50 Lakhs per stock
                'total_equity_limit': Decimal('50000000'),  # ₹5 Crores total equity
                'sector_concentration': Decimal('0.25'),    # 25% in single sector
            },
            'EQUITY_HNI': {
                'single_stock_limit': Decimal('25000000'),  # ₹2.5 Crores per stock
                'total_equity_limit': Decimal('250000000'), # ₹25 Crores total equity
                'sector_concentration': Decimal('0.30'),    # 30% in single sector
            },
            'FNO_INDIVIDUAL': {
                'gross_position_limit': Decimal('10000000'), # ₹1 Crore gross exposure
                'net_position_limit': Decimal('5000000'),    # ₹50 Lakhs net exposure
                'single_underlying_limit': Decimal('0.10'),  # 10% of open interest
                'total_premium_limit': Decimal('2000000'),   # ₹20 Lakhs premium
            },
            'FNO_INSTITUTIONAL': {
                'gross_position_limit': Decimal('100000000'), # ₹10 Crores gross exposure
                'net_position_limit': Decimal('50000000'),    # ₹5 Crores net exposure
                'single_underlying_limit': Decimal('0.05'),   # 5% of open interest
                'total_premium_limit': Decimal('20000000'),   # ₹2 Crores premium
            }
        }
    
    def get_applicable_limits(self, user: User) -> Dict[str, Decimal]:
        """Get applicable limits for user based on profile"""
        try:
            profile = InvestorProfile.objects.get(user=user)
            risk_profile = profile.risk_profile
            category = profile.category
            
            # Determine limit category
            if category == 'INDIVIDUAL':
                # Check if HNI based on net worth
                if profile.net_worth and profile.net_worth >= Decimal('10000000'):  # ₹1 Crore
                    base_limits = self.sebi_limits['EQUITY_HNI']
                    fno_limits = self.sebi_limits['FNO_INSTITUTIONAL']
                else:
                    base_limits = self.sebi_limits['EQUITY_INDIVIDUAL']
                    fno_limits = self.sebi_limits['FNO_INDIVIDUAL']
            else:
                base_limits = self.sebi_limits['EQUITY_HNI']
                fno_limits = self.sebi_limits['FNO_INSTITUTIONAL']
            
            # Apply risk profile modifiers
            risk_multiplier = {
                'LOW': Decimal('0.5'),
                'MODERATE': Decimal('0.75'),
                'HIGH': Decimal('1.0'),
                'VERY_HIGH': Decimal('1.25')
            }.get(risk_profile, Decimal('0.5'))
            
            # Combine limits
            combined_limits = {}
            for key, value in base_limits.items():
                combined_limits[key] = value * risk_multiplier
            
            for key, value in fno_limits.items():
                combined_limits[f"fno_{key}"] = value * risk_multiplier
            
            return combined_limits
            
        except InvestorProfile.DoesNotExist:
            logger.warning(f"No investor profile found for user {user.id}")
            return self.sebi_limits['EQUITY_INDIVIDUAL']
        except Exception as e:
            logger.error(f"Error getting limits for user {user.id}: {str(e)}")
            return self.sebi_limits['EQUITY_INDIVIDUAL']
    
    def check_position_limit(self, user: User, symbol: str, quantity: int, 
                           price: Decimal, order_type: str) -> Dict[str, Any]:
        """Check if order violates position limits"""
        try:
            limits = self.get_applicable_limits(user)
            order_value = quantity * price
            
            result = {
                'allowed': True,
                'limit_breaches': [],
                'warnings': [],
                'current_exposure': {}
            }
            
            # Get current positions
            current_positions = self._get_current_positions(user)
            
            # Check single stock limit
            current_stock_value = current_positions.get(symbol, Decimal('0'))
            projected_stock_value = current_stock_value + order_value
            
            single_stock_limit = limits.get('single_stock_limit', Decimal('5000000'))
            
            if projected_stock_value > single_stock_limit:
                result['allowed'] = False
                result['limit_breaches'].append({
                    'type': 'SINGLE_STOCK_LIMIT',
                    'limit': float(single_stock_limit),
                    'current': float(current_stock_value),
                    'projected': float(projected_stock_value),
                    'message': f'Single stock limit of ₹{single_stock_limit:,.2f} exceeded'
                })
            
            # Check total equity limit
            total_equity_value = sum(current_positions.values())
            projected_total = total_equity_value + order_value
            
            total_limit = limits.get('total_equity_limit', Decimal('50000000'))
            
            if projected_total > total_limit:
                result['allowed'] = False
                result['limit_breaches'].append({
                    'type': 'TOTAL_EQUITY_LIMIT',
                    'limit': float(total_limit),
                    'current': float(total_equity_value),
                    'projected': float(projected_total),
                    'message': f'Total equity limit of ₹{total_limit:,.2f} exceeded'
                })
            
            # Warning if approaching limits (80% threshold)
            if projected_stock_value > single_stock_limit * Decimal('0.8'):
                result['warnings'].append({
                    'type': 'APPROACHING_SINGLE_STOCK_LIMIT',
                    'message': f'Approaching single stock limit (80% threshold)'
                })
            
            if projected_total > total_limit * Decimal('0.8'):
                result['warnings'].append({
                    'type': 'APPROACHING_TOTAL_LIMIT',
                    'message': f'Approaching total equity limit (80% threshold)'
                })
            
            result['current_exposure'] = {
                'single_stock': float(current_stock_value),
                'total_equity': float(total_equity_value),
                'projected_single_stock': float(projected_stock_value),
                'projected_total': float(projected_total)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Position limit check failed for user {user.id}: {str(e)}")
            return {
                'allowed': False,
                'error': f'Position limit check failed: {str(e)}'
            }
    
    def _get_current_positions(self, user: User) -> Dict[str, Decimal]:
        """Get current positions for user"""
        try:
            # This would integrate with your trading system
            # For now, return mock data
            positions = {}
            
            # Get executed orders for position calculation
            executed_orders = TradingOrder.objects.filter(
                user=user,
                status='EXECUTED'
            ).values('symbol').annotate(
                total_value=Sum('quantity') * Sum('executed_price')
            )
            
            for order in executed_orders:
                positions[order['symbol']] = Decimal(str(order['total_value']))
            
            return positions
            
        except Exception as e:
            logger.error(f"Error getting positions for user {user.id}: {str(e)}")
            return {}


class CircuitBreakerSystem:
    """Circuit breaker system for risk management"""
    
    def __init__(self):
        self.circuit_breaker_levels = {
            'LEVEL_1': {'threshold': Decimal('0.10'), 'cool_off': 15},  # 10%, 15 min
            'LEVEL_2': {'threshold': Decimal('0.15'), 'cool_off': 60},  # 15%, 1 hour
            'LEVEL_3': {'threshold': Decimal('0.20'), 'cool_off': 1440}, # 20%, 1 day
        }
    
    def check_circuit_breaker(self, user: User, current_loss: Decimal, 
                             max_loss_limit: Decimal) -> Dict[str, Any]:
        """Check if circuit breaker should be triggered"""
        try:
            loss_percentage = abs(current_loss) / max_loss_limit if max_loss_limit > 0 else Decimal('0')
            
            result = {
                'triggered': False,
                'level': None,
                'cool_off_minutes': 0,
                'loss_percentage': float(loss_percentage),
                'current_loss': float(current_loss),
                'limit': float(max_loss_limit)
            }
            
            # Check each level
            for level, config in self.circuit_breaker_levels.items():
                if loss_percentage >= config['threshold']:
                    result['triggered'] = True
                    result['level'] = level
                    result['cool_off_minutes'] = config['cool_off']
                    
                    # Create alert
                    TradingAlert.objects.create(
                        user=user,
                        alert_type=TradingAlert.AlertType.CIRCUIT_BREAKER,
                        severity='CRITICAL',
                        title=f'Circuit Breaker {level} Triggered',
                        description=f'Loss of {loss_percentage:.2%} triggered {level} circuit breaker',
                        trigger_value=current_loss,
                        threshold_value=max_loss_limit * config['threshold']
                    )
                    
                    # Create audit trail
                    AuditTrail.objects.create(
                        user=user,
                        action_type=AuditTrail.ActionType.SYSTEM_ALERT,
                        action_description=f'Circuit breaker {level} triggered due to {loss_percentage:.2%} loss',
                        ip_address='127.0.0.1',
                        user_agent='System',
                        metadata={
                            'level': level,
                            'loss_percentage': float(loss_percentage),
                            'cool_off_minutes': config['cool_off']
                        }
                    )
                    
                    break
            
            return result
            
        except Exception as e:
            logger.error(f"Circuit breaker check failed for user {user.id}: {str(e)}")
            return {
                'triggered': False,
                'error': f'Circuit breaker check failed: {str(e)}'
            }
    
    def is_trading_allowed(self, user: User) -> Dict[str, Any]:
        """Check if trading is allowed (not in circuit breaker cool-off)"""
        try:
            # Check for active circuit breaker alerts
            active_cb_alert = TradingAlert.objects.filter(
                user=user,
                alert_type=TradingAlert.AlertType.CIRCUIT_BREAKER,
                status=TradingAlert.AlertStatus.ACTIVE
            ).order_by('-triggered_at').first()
            
            if not active_cb_alert:
                return {'allowed': True}
            
            # Check if cool-off period has passed
            trigger_time = active_cb_alert.triggered_at
            level = active_cb_alert.title.split()[-2]  # Extract level from title
            cool_off_minutes = self.circuit_breaker_levels.get(f'LEVEL_{level.split("_")[-1]}', {}).get('cool_off', 0)
            
            cool_off_end = trigger_time + timedelta(minutes=cool_off_minutes)
            
            if timezone.now() >= cool_off_end:
                # Cool-off period ended, resolve alert
                active_cb_alert.status = TradingAlert.AlertStatus.RESOLVED
                active_cb_alert.resolved_at = timezone.now()
                active_cb_alert.resolution_notes = 'Cool-off period completed'
                active_cb_alert.save()
                
                return {'allowed': True}
            else:
                time_remaining = cool_off_end - timezone.now()
                return {
                    'allowed': False,
                    'reason': 'Circuit breaker cool-off period active',
                    'time_remaining_minutes': int(time_remaining.total_seconds() / 60),
                    'cool_off_end': cool_off_end.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Trading allowance check failed for user {user.id}: {str(e)}")
            return {
                'allowed': True,  # Allow trading in case of error
                'warning': f'Circuit breaker check failed: {str(e)}'
            }


class MarketTimingManager:
    """Manage trading hours and market timing restrictions"""
    
    def __init__(self):
        # Indian market timings
        self.market_timings = {
            'EQUITY': {
                'pre_open': {'start': time(9, 0), 'end': time(9, 15)},
                'normal': {'start': time(9, 15), 'end': time(15, 30)},
                'closing': {'start': time(15, 30), 'end': time(16, 0)},
            },
            'FNO': {
                'normal': {'start': time(9, 15), 'end': time(15, 30)},
            },
            'COMMODITY': {
                'normal': {'start': time(9, 0), 'end': time(23, 30)},
            }
        }
        
        # Market holidays (should be updated from exchange calendar)
        self.market_holidays = [
            '2024-01-26',  # Republic Day
            '2024-03-08',  # Holi
            '2024-08-15',  # Independence Day
            '2024-10-02',  # Gandhi Jayanti
            # Add more holidays
        ]
    
    def is_market_open(self, segment: str = 'EQUITY') -> Dict[str, Any]:
        """Check if market is open for trading"""
        try:
            now = timezone.now()
            current_time = now.time()
            current_date = now.date()
            
            # Check if it's a weekend
            if current_date.weekday() in [5, 6]:  # Saturday, Sunday
                return {
                    'open': False,
                    'reason': 'Weekend',
                    'next_opening': self._get_next_market_opening(segment)
                }
            
            # Check if it's a holiday
            if current_date.strftime('%Y-%m-%d') in self.market_holidays:
                return {
                    'open': False,
                    'reason': 'Market holiday',
                    'next_opening': self._get_next_market_opening(segment)
                }
            
            # Check segment-specific timings
            timings = self.market_timings.get(segment, self.market_timings['EQUITY'])
            
            for session, times in timings.items():
                if times['start'] <= current_time <= times['end']:
                    return {
                        'open': True,
                        'session': session,
                        'closes_at': times['end'].strftime('%H:%M')
                    }
            
            return {
                'open': False,
                'reason': 'Outside market hours',
                'next_opening': self._get_next_market_opening(segment)
            }
            
        except Exception as e:
            logger.error(f"Market timing check failed: {str(e)}")
            return {
                'open': False,
                'error': f'Market timing check failed: {str(e)}'
            }
    
    def _get_next_market_opening(self, segment: str) -> str:
        """Get next market opening time"""
        try:
            now = timezone.now()
            tomorrow = now + timedelta(days=1)
            
            # Find next working day
            while tomorrow.weekday() in [5, 6] or tomorrow.date().strftime('%Y-%m-%d') in self.market_holidays:
                tomorrow += timedelta(days=1)
            
            timings = self.market_timings.get(segment, self.market_timings['EQUITY'])
            opening_time = list(timings.values())[0]['start']
            
            next_opening = tomorrow.replace(
                hour=opening_time.hour,
                minute=opening_time.minute,
                second=0,
                microsecond=0
            )
            
            return next_opening.isoformat()
            
        except Exception as e:
            logger.error(f"Next market opening calculation failed: {str(e)}")
            return ''


class RiskController:
    """Main risk control system"""
    
    def __init__(self):
        self.position_manager = PositionLimitManager()
        self.circuit_breaker = CircuitBreakerSystem()
        self.market_timing = MarketTimingManager()
    
    def validate_order(self, user: User, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive order validation"""
        try:
            result = {
                'allowed': True,
                'checks': [],
                'warnings': [],
                'errors': []
            }
            
            symbol = order_data.get('symbol', '')
            quantity = int(order_data.get('quantity', 0))
            price = Decimal(str(order_data.get('price', 0)))
            order_type = order_data.get('order_type', '')
            segment = order_data.get('segment', 'EQUITY')
            
            # 1. Market timing check
            market_status = self.market_timing.is_market_open(segment)
            result['checks'].append({
                'type': 'MARKET_TIMING',
                'status': 'PASS' if market_status['open'] else 'FAIL',
                'details': market_status
            })
            
            if not market_status['open']:
                result['allowed'] = False
                result['errors'].append(f"Market closed: {market_status['reason']}")
            
            # 2. Circuit breaker check
            cb_status = self.circuit_breaker.is_trading_allowed(user)
            result['checks'].append({
                'type': 'CIRCUIT_BREAKER',
                'status': 'PASS' if cb_status['allowed'] else 'FAIL',
                'details': cb_status
            })
            
            if not cb_status['allowed']:
                result['allowed'] = False
                result['errors'].append(cb_status['reason'])
            
            # 3. Position limit check
            position_check = self.position_manager.check_position_limit(
                user, symbol, quantity, price, order_type
            )
            result['checks'].append({
                'type': 'POSITION_LIMITS',
                'status': 'PASS' if position_check['allowed'] else 'FAIL',
                'details': position_check
            })
            
            if not position_check['allowed']:
                result['allowed'] = False
                result['errors'].extend([breach['message'] for breach in position_check.get('limit_breaches', [])])
            
            if position_check.get('warnings'):
                result['warnings'].extend([warning['message'] for warning in position_check['warnings']])
            
            # 4. Order size validation
            order_value = quantity * price
            max_single_order = Decimal('1000000')  # ₹10 Lakhs
            
            if order_value > max_single_order:
                result['warnings'].append(f'Large order value: ₹{order_value:,.2f}')
                
                # Create alert for large order
                TradingAlert.objects.create(
                    user=user,
                    alert_type=TradingAlert.AlertType.LARGE_ORDER,
                    severity='MEDIUM',
                    title='Large Order Detected',
                    description=f'Order value of ₹{order_value:,.2f} for {symbol}',
                    trigger_value=order_value,
                    threshold_value=max_single_order
                )
            
            # 5. Rapid trading check
            recent_orders = AuditTrail.objects.filter(
                user=user,
                action_type=AuditTrail.ActionType.TRADE_ORDER,
                timestamp__gte=timezone.now() - timedelta(minutes=5)
            ).count()
            
            if recent_orders >= 10:  # More than 10 orders in 5 minutes
                result['warnings'].append('High frequency trading detected')
                
                TradingAlert.objects.create(
                    user=user,
                    alert_type=TradingAlert.AlertType.RAPID_TRADING,
                    severity='MEDIUM',
                    title='Rapid Trading Detected',
                    description=f'{recent_orders} orders in last 5 minutes',
                    trigger_value=Decimal(str(recent_orders))
                )
            
            result['checks'].append({
                'type': 'RAPID_TRADING',
                'status': 'PASS' if recent_orders < 10 else 'WARNING',
                'details': {'recent_orders': recent_orders}
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Order validation failed for user {user.id}: {str(e)}")
            return {
                'allowed': False,
                'error': f'Order validation failed: {str(e)}'
            }
    
    def monitor_portfolio_risk(self, user: User) -> Dict[str, Any]:
        """Monitor overall portfolio risk"""
        try:
            # Get user's risk management settings
            risk_mgmt = RiskManagement.objects.get(user=user)
            
            # Calculate current P&L
            current_pnl = self._calculate_current_pnl(user)
            daily_pnl = self._calculate_daily_pnl(user)
            
            result = {
                'portfolio_health': 'HEALTHY',
                'current_pnl': float(current_pnl),
                'daily_pnl': float(daily_pnl),
                'risk_alerts': [],
                'recommendations': []
            }
            
            # Check daily loss limit
            if daily_pnl < -risk_mgmt.max_daily_loss:
                result['portfolio_health'] = 'AT_RISK'
                result['risk_alerts'].append({
                    'type': 'DAILY_LOSS_LIMIT',
                    'severity': 'HIGH',
                    'message': f'Daily loss limit exceeded: ₹{abs(daily_pnl):,.2f}'
                })
                
                # Trigger circuit breaker check
                cb_result = self.circuit_breaker.check_circuit_breaker(
                    user, abs(daily_pnl), risk_mgmt.max_daily_loss
                )
                
                if cb_result['triggered']:
                    result['portfolio_health'] = 'CRITICAL'
                    result['risk_alerts'].append({
                        'type': 'CIRCUIT_BREAKER',
                        'severity': 'CRITICAL',
                        'message': f"Circuit breaker {cb_result['level']} triggered"
                    })
            
            # Check position concentration
            positions = self.position_manager._get_current_positions(user)
            total_value = sum(positions.values())
            
            if total_value > 0:
                for symbol, value in positions.items():
                    concentration = value / total_value
                    if concentration > Decimal('0.3'):  # More than 30% in single stock
                        result['recommendations'].append({
                            'type': 'DIVERSIFICATION',
                            'message': f'High concentration in {symbol}: {concentration:.1%}'
                        })
            
            return result
            
        except RiskManagement.DoesNotExist:
            return {
                'error': 'Risk management settings not found for user'
            }
        except Exception as e:
            logger.error(f"Portfolio risk monitoring failed for user {user.id}: {str(e)}")
            return {
                'error': f'Portfolio risk monitoring failed: {str(e)}'
            }
    
    def _calculate_current_pnl(self, user: User) -> Decimal:
        """Calculate current P&L (mock implementation)"""
        # This would integrate with your trading system
        return Decimal('0.00')
    
    def _calculate_daily_pnl(self, user: User) -> Decimal:
        """Calculate daily P&L (mock implementation)"""
        # This would integrate with your trading system
        return Decimal('0.00')
    
    def generate_risk_report(self, user: User, period_days: int = 30) -> Dict[str, Any]:
        """Generate comprehensive risk report"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get risk events in period
            alerts = TradingAlert.objects.filter(
                user=user,
                triggered_at__range=[start_date, end_date]
            ).order_by('-triggered_at')
            
            # Categorize alerts
            alert_summary = {}
            for alert in alerts:
                alert_type = alert.alert_type
                if alert_type not in alert_summary:
                    alert_summary[alert_type] = {'count': 0, 'last_occurrence': None}
                alert_summary[alert_type]['count'] += 1
                if not alert_summary[alert_type]['last_occurrence']:
                    alert_summary[alert_type]['last_occurrence'] = alert.triggered_at
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(user, alert_summary)
            
            return {
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'risk_score': risk_score,
                'alert_summary': alert_summary,
                'total_alerts': len(alerts),
                'risk_level': self._get_risk_level(risk_score),
                'recommendations': self._get_risk_recommendations(risk_score, alert_summary)
            }
            
        except Exception as e:
            logger.error(f"Risk report generation failed for user {user.id}: {str(e)}")
            return {
                'error': f'Risk report generation failed: {str(e)}'
            }
    
    def _calculate_risk_score(self, user: User, alert_summary: Dict) -> int:
        """Calculate risk score (0-100)"""
        score = 0
        
        # Weight different alert types
        weights = {
            'CIRCUIT_BREAKER': 30,
            'POSITION_LIMIT': 20,
            'DAILY_LOSS': 25,
            'UNUSUAL_ACTIVITY': 15,
            'RAPID_TRADING': 10
        }
        
        for alert_type, data in alert_summary.items():
            weight = weights.get(alert_type, 5)
            score += min(data['count'] * weight, weight * 3)  # Cap contribution
        
        return min(score, 100)
    
    def _get_risk_level(self, risk_score: int) -> str:
        """Get risk level based on score"""
        if risk_score >= 80:
            return 'VERY_HIGH'
        elif risk_score >= 60:
            return 'HIGH'
        elif risk_score >= 40:
            return 'MODERATE'
        elif risk_score >= 20:
            return 'LOW'
        else:
            return 'VERY_LOW'
    
    def _get_risk_recommendations(self, risk_score: int, alert_summary: Dict) -> List[str]:
        """Get risk management recommendations"""
        recommendations = []
        
        if risk_score >= 60:
            recommendations.append("Consider reducing position sizes")
            recommendations.append("Review and update stop-loss levels")
        
        if 'CIRCUIT_BREAKER' in alert_summary:
            recommendations.append("Take a trading break and review strategy")
        
        if 'RAPID_TRADING' in alert_summary:
            recommendations.append("Implement cooling-off periods between trades")
        
        if 'POSITION_LIMIT' in alert_summary:
            recommendations.append("Diversify portfolio to reduce concentration risk")
        
        if not recommendations:
            recommendations.append("Continue current risk management practices")
        
        return recommendations