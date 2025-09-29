"""
Portfolio Aggregation System for ShareWise AI
Aggregates positions and data across multiple broker accounts
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict

from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import PortfolioPosition, TradingOrder, TradingSignal, AutomatedTradeExecution

User = get_user_model()
logger = logging.getLogger(__name__)


@dataclass
class BrokerPosition:
    """Individual broker position data"""
    broker_name: str
    broker_account_id: str
    symbol: str
    instrument_type: str
    quantity: int
    average_price: Decimal
    current_price: Optional[Decimal]
    market_value: Decimal
    pnl: Decimal
    pnl_percentage: float
    last_updated: datetime


@dataclass
class AggregatedPosition:
    """Aggregated position across all brokers"""
    symbol: str
    instrument_type: str
    total_quantity: int
    weighted_average_price: Decimal
    current_price: Optional[Decimal]
    total_market_value: Decimal
    total_pnl: Decimal
    pnl_percentage: float
    broker_breakdown: List[BrokerPosition]
    consolidation_opportunities: List[str]


@dataclass
class PortfolioSummary:
    """Complete portfolio summary"""
    total_value: Decimal
    total_pnl: Decimal
    total_pnl_percentage: float
    total_positions: int
    broker_count: int
    diversification_score: float
    concentration_risk: Dict[str, float]
    sector_allocation: Dict[str, float]
    broker_allocation: Dict[str, Decimal]


class BrokerDataProvider:
    """Base class for broker data providers"""
    
    def __init__(self, broker_name: str):
        self.broker_name = broker_name
    
    def fetch_positions(self, user: User, account_id: str = None) -> List[BrokerPosition]:
        """Fetch positions from broker API - to be implemented by specific brokers"""
        raise NotImplementedError("Each broker must implement fetch_positions")
    
    def fetch_current_prices(self, symbols: List[str]) -> Dict[str, Decimal]:
        """Fetch current market prices - to be implemented by specific brokers"""
        raise NotImplementedError("Each broker must implement fetch_current_prices")


# MockBrokerProvider removed - use real broker implementations only


class PortfolioAggregator:
    """Main portfolio aggregation service"""
    
    def __init__(self):
        # TODO: Initialize real broker provider implementations
        # Example: ZerodhaProvider, UpstoxProvider, etc.
        self.broker_providers = {
            # "zerodha": ZerodhaProvider("zerodha"),
            # "upstox": UpstoxProvider("upstox"),
            # "alice_blue": AliceBlueProvider("alice_blue"),
            # "kotak": KotakProvider("kotak"),
            # "icici_direct": ICICIDirectProvider("icici_direct")
        }
        
        # Industry sector mappings
        self.sector_mapping = {
            "RELIANCE": "Energy",
            "TCS": "Information Technology",
            "INFY": "Information Technology",
            "HDFCBANK": "Financial Services",
            "ICICIBANK": "Financial Services",
            "ADANIPORTS": "Infrastructure",
            "ASIANPAINT": "Consumer Goods",
            "BAJFINANCE": "Financial Services",
            "BHARTIARTL": "Telecommunications",
            "COALINDIA": "Mining",
            "DRREDDY": "Pharmaceuticals",
            "EICHERMOT": "Automotive",
            "GRASIM": "Chemicals",
            "HCLTECH": "Information Technology",
            "HEROMOTOCO": "Automotive",
            "HINDALCO": "Metals",
            "HINDUNILVR": "Consumer Goods",
            "ITC": "Consumer Goods",
            "JSWSTEEL": "Metals",
            "KOTAKBANK": "Financial Services",
            "LT": "Infrastructure",
            "M&M": "Automotive",
            "MARUTI": "Automotive",
            "NESTLEIND": "Consumer Goods",
            "NTPC": "Power",
            "ONGC": "Energy",
            "POWERGRID": "Power",
            "SBIN": "Financial Services",
            "SUNPHARMA": "Pharmaceuticals",
            "TATACONSUM": "Consumer Goods",
            "TATAMOTORS": "Automotive",
            "TATASTEEL": "Metals",
            "TECHM": "Information Technology",
            "TITAN": "Consumer Goods",
            "ULTRACEMCO": "Cement",
            "UPL": "Chemicals",
            "WIPRO": "Information Technology"
        }
    
    def get_user_broker_accounts(self, user: User) -> Dict[str, List[str]]:
        """Get user's broker accounts from their profile/connected accounts"""
        try:
            # TODO: Implement real broker account retrieval from user profile
            # This should fetch from BrokerAccount model or user profile
            broker_accounts = {}
            
            # Get user's connected broker accounts from database
            if hasattr(user, 'profile') and hasattr(user.profile, 'broker_accounts'):
                for account in user.profile.broker_accounts.all():
                    if account.broker_name not in broker_accounts:
                        broker_accounts[account.broker_name] = []
                    broker_accounts[account.broker_name].append(account.account_id)
            
            return broker_accounts
        except Exception as e:
            logger.error(f"Error fetching user broker accounts: {e}")
            return {}
    
    def fetch_all_positions(self, user: User) -> List[BrokerPosition]:
        """Fetch positions from all connected brokers"""
        all_positions = []
        broker_accounts = self.get_user_broker_accounts(user)
        
        for broker_name, account_ids in broker_accounts.items():
            if broker_name in self.broker_providers:
                provider = self.broker_providers[broker_name]
                
                for account_id in account_ids:
                    try:
                        positions = provider.fetch_positions(user, account_id)
                        all_positions.extend(positions)
                        logger.info(f"Fetched {len(positions)} positions from {broker_name} account {account_id}")
                    except Exception as e:
                        logger.error(f"Error fetching positions from {broker_name} account {account_id}: {e}")
        
        return all_positions
    
    def aggregate_positions_by_symbol(self, positions: List[BrokerPosition]) -> List[AggregatedPosition]:
        """Aggregate positions by symbol across all brokers"""
        symbol_groups = defaultdict(list)
        
        # Group positions by symbol and instrument type
        for position in positions:
            key = f"{position.symbol}_{position.instrument_type}"
            symbol_groups[key].append(position)
        
        aggregated_positions = []
        
        for key, broker_positions in symbol_groups.items():
            symbol = broker_positions[0].symbol
            instrument_type = broker_positions[0].instrument_type
            
            # Calculate totals
            total_quantity = sum(pos.quantity for pos in broker_positions)
            total_investment = sum(pos.quantity * pos.average_price for pos in broker_positions)
            total_market_value = sum(pos.market_value for pos in broker_positions)
            total_pnl = sum(pos.pnl for pos in broker_positions)
            
            # Calculate weighted average price
            weighted_avg_price = total_investment / total_quantity if total_quantity > 0 else Decimal('0')
            
            # Get current price (should be same across brokers)
            current_price = broker_positions[0].current_price
            
            # Calculate percentage P&L
            pnl_percentage = (float(total_pnl) / float(total_investment) * 100) if total_investment > 0 else 0
            
            # Identify consolidation opportunities
            consolidation_opportunities = []
            if len(broker_positions) > 1:
                broker_names = [pos.broker_name for pos in broker_positions]
                consolidation_opportunities.append(f"Position split across {len(broker_names)} brokers: {', '.join(broker_names)}")
                
                # Check for small positions that could be consolidated
                small_positions = [pos for pos in broker_positions if pos.market_value < 10000]  # Less than ₹10,000
                if small_positions:
                    consolidation_opportunities.append(f"{len(small_positions)} small positions could be consolidated")
            
            aggregated_position = AggregatedPosition(
                symbol=symbol,
                instrument_type=instrument_type,
                total_quantity=total_quantity,
                weighted_average_price=weighted_avg_price,
                current_price=current_price,
                total_market_value=total_market_value,
                total_pnl=total_pnl,
                pnl_percentage=pnl_percentage,
                broker_breakdown=broker_positions,
                consolidation_opportunities=consolidation_opportunities
            )
            
            aggregated_positions.append(aggregated_position)
        
        return aggregated_positions
    
    def calculate_portfolio_metrics(self, aggregated_positions: List[AggregatedPosition]) -> PortfolioSummary:
        """Calculate comprehensive portfolio metrics"""
        
        if not aggregated_positions:
            return PortfolioSummary(
                total_value=Decimal('0'),
                total_pnl=Decimal('0'),
                total_pnl_percentage=0.0,
                total_positions=0,
                broker_count=0,
                diversification_score=0.0,
                concentration_risk={},
                sector_allocation={},
                broker_allocation={}
            )
        
        # Basic metrics
        total_value = sum(pos.total_market_value for pos in aggregated_positions)
        total_pnl = sum(pos.total_pnl for pos in aggregated_positions)
        total_investment = total_value - total_pnl
        total_pnl_percentage = (float(total_pnl) / float(total_investment) * 100) if total_investment > 0 else 0
        
        # Count unique brokers
        all_brokers = set()
        for pos in aggregated_positions:
            for broker_pos in pos.broker_breakdown:
                all_brokers.add(broker_pos.broker_name)
        
        # Calculate sector allocation
        sector_values = defaultdict(Decimal)
        for pos in aggregated_positions:
            sector = self.sector_mapping.get(pos.symbol, "Other")
            sector_values[sector] += pos.total_market_value
        
        sector_allocation = {
            sector: float(value / total_value * 100)
            for sector, value in sector_values.items()
        }
        
        # Calculate broker allocation
        broker_values = defaultdict(Decimal)
        for pos in aggregated_positions:
            for broker_pos in pos.broker_breakdown:
                broker_values[broker_pos.broker_name] += broker_pos.market_value
        
        broker_allocation = {
            broker: value for broker, value in broker_values.items()
        }
        
        # Calculate concentration risk (top 5 positions as % of portfolio)
        sorted_positions = sorted(aggregated_positions, key=lambda x: x.total_market_value, reverse=True)
        concentration_risk = {}
        
        for i, pos in enumerate(sorted_positions[:5], 1):
            concentration_pct = float(pos.total_market_value / total_value * 100)
            concentration_risk[f"top_{i}"] = concentration_pct
        
        # Overall concentration (top 5 positions)
        top_5_concentration = sum(concentration_risk.values())
        concentration_risk["top_5_total"] = top_5_concentration
        
        # Calculate diversification score (simplified)
        # Based on number of positions, sector spread, and concentration
        position_score = min(len(aggregated_positions) / 20, 1.0) * 40  # Up to 40 points for 20+ positions
        sector_score = min(len(sector_allocation) / 8, 1.0) * 30  # Up to 30 points for 8+ sectors
        concentration_score = max(0, (100 - top_5_concentration) / 100) * 30  # Up to 30 points for low concentration
        
        diversification_score = position_score + sector_score + concentration_score
        
        return PortfolioSummary(
            total_value=total_value,
            total_pnl=total_pnl,
            total_pnl_percentage=total_pnl_percentage,
            total_positions=len(aggregated_positions),
            broker_count=len(all_brokers),
            diversification_score=diversification_score,
            concentration_risk=concentration_risk,
            sector_allocation=sector_allocation,
            broker_allocation=broker_allocation
        )
    
    @transaction.atomic
    def sync_portfolio_positions(self, user: User) -> int:
        """Sync aggregated positions to database"""
        
        # Fetch and aggregate positions
        broker_positions = self.fetch_all_positions(user)
        aggregated_positions = self.aggregate_positions_by_symbol(broker_positions)
        
        # Clear existing positions for user
        PortfolioPosition.objects.filter(user=user).delete()
        
        # Create new aggregated positions
        created_count = 0
        
        for agg_pos in aggregated_positions:
            portfolio_position = PortfolioPosition.objects.create(
                user=user,
                symbol=agg_pos.symbol,
                instrument_type=agg_pos.instrument_type,
                position_type=PortfolioPosition.PositionType.LONG,  # Simplified
                total_quantity=agg_pos.total_quantity,
                available_quantity=agg_pos.total_quantity,  # Simplified
                average_price=agg_pos.weighted_average_price,
                current_price=agg_pos.current_price,
                unrealized_pnl=agg_pos.total_pnl,
                realized_pnl=Decimal('0'),  # Would need trade history to calculate
                broker_positions={
                    "breakdown": [
                        {
                            "broker": pos.broker_name,
                            "account": pos.broker_account_id,
                            "quantity": pos.quantity,
                            "avg_price": float(pos.average_price),
                            "market_value": float(pos.market_value),
                            "pnl": float(pos.pnl)
                        }
                        for pos in agg_pos.broker_breakdown
                    ],
                    "consolidation_opportunities": agg_pos.consolidation_opportunities
                }
            )
            created_count += 1
        
        logger.info(f"Synced {created_count} aggregated positions for user {user.email}")
        return created_count
    
    def get_portfolio_analytics(self, user: User) -> Dict[str, Any]:
        """Get comprehensive portfolio analytics"""
        
        # Fetch fresh data
        broker_positions = self.fetch_all_positions(user)
        aggregated_positions = self.aggregate_positions_by_symbol(broker_positions)
        portfolio_summary = self.calculate_portfolio_metrics(aggregated_positions)
        
        # Prepare analytics data
        analytics = {
            "summary": {
                "total_value": float(portfolio_summary.total_value),
                "total_pnl": float(portfolio_summary.total_pnl),
                "total_pnl_percentage": round(portfolio_summary.total_pnl_percentage, 2),
                "total_positions": portfolio_summary.total_positions,
                "broker_count": portfolio_summary.broker_count,
                "diversification_score": round(portfolio_summary.diversification_score, 1)
            },
            "positions": [
                {
                    "symbol": pos.symbol,
                    "instrument_type": pos.instrument_type,
                    "quantity": pos.total_quantity,
                    "avg_price": float(pos.weighted_average_price),
                    "current_price": float(pos.current_price) if pos.current_price else None,
                    "market_value": float(pos.total_market_value),
                    "pnl": float(pos.total_pnl),
                    "pnl_percentage": round(pos.pnl_percentage, 2),
                    "broker_count": len(pos.broker_breakdown),
                    "consolidation_opportunities": pos.consolidation_opportunities
                }
                for pos in aggregated_positions
            ],
            "allocation": {
                "by_sector": portfolio_summary.sector_allocation,
                "by_broker": {k: float(v) for k, v in portfolio_summary.broker_allocation.items()}
            },
            "risk_metrics": {
                "concentration_risk": portfolio_summary.concentration_risk,
                "diversification_grade": self._get_diversification_grade(portfolio_summary.diversification_score)
            },
            "insights": self._generate_portfolio_insights(portfolio_summary, aggregated_positions),
            "last_updated": timezone.now().isoformat()
        }
        
        return analytics
    
    def _get_diversification_grade(self, score: float) -> Dict[str, str]:
        """Convert diversification score to grade"""
        if score >= 80:
            return {"grade": "A", "description": "Excellent diversification"}
        elif score >= 70:
            return {"grade": "B", "description": "Good diversification"}
        elif score >= 60:
            return {"grade": "C", "description": "Moderate diversification"}
        elif score >= 50:
            return {"grade": "D", "description": "Poor diversification"}
        else:
            return {"grade": "F", "description": "Very poor diversification - high concentration risk"}
    
    def _generate_portfolio_insights(self, summary: PortfolioSummary, positions: List[AggregatedPosition]) -> List[Dict[str, str]]:
        """Generate actionable portfolio insights"""
        insights = []
        
        # Concentration risk insights
        if summary.concentration_risk.get("top_5_total", 0) > 60:
            insights.append({
                "type": "risk",
                "title": "High Concentration Risk",
                "message": f"Top 5 positions represent {summary.concentration_risk['top_5_total']:.1f}% of portfolio. Consider diversifying.",
                "priority": "high"
            })
        
        # Sector concentration
        max_sector_allocation = max(summary.sector_allocation.values()) if summary.sector_allocation else 0
        if max_sector_allocation > 40:
            sector_name = max(summary.sector_allocation, key=summary.sector_allocation.get)
            insights.append({
                "type": "diversification",
                "title": "Sector Concentration",
                "message": f"{sector_name} sector represents {max_sector_allocation:.1f}% of portfolio. Consider sector diversification.",
                "priority": "medium"
            })
        
        # Consolidation opportunities
        consolidation_positions = [pos for pos in positions if pos.consolidation_opportunities]
        if consolidation_positions:
            insights.append({
                "type": "optimization",
                "title": "Consolidation Opportunities",
                "message": f"{len(consolidation_positions)} positions could benefit from broker consolidation to reduce complexity.",
                "priority": "low"
            })
        
        # Small positions
        small_positions = [pos for pos in positions if pos.total_market_value < 10000]
        if len(small_positions) > 5:
            insights.append({
                "type": "optimization",
                "title": "Too Many Small Positions",
                "message": f"{len(small_positions)} positions under ₹10,000. Consider consolidating or increasing position sizes.",
                "priority": "medium"
            })
        
        # Positive performance insight
        winning_positions = [pos for pos in positions if pos.total_pnl > 0]
        if len(winning_positions) / len(positions) > 0.7:
            insights.append({
                "type": "performance",
                "title": "Strong Performance",
                "message": f"{len(winning_positions)}/{len(positions)} positions are profitable. Great job!",
                "priority": "positive"
            })
        
        return insights


# Global instance
portfolio_aggregator = PortfolioAggregator()


# Utility functions
def get_user_portfolio_summary(user: User) -> Dict[str, Any]:
    """Get user's complete portfolio summary"""
    return portfolio_aggregator.get_portfolio_analytics(user)


def sync_user_portfolio(user: User) -> int:
    """Sync user's portfolio from all brokers"""
    return portfolio_aggregator.sync_portfolio_positions(user)


def get_consolidation_opportunities(user: User) -> List[Dict[str, Any]]:
    """Get specific consolidation opportunities for user"""
    broker_positions = portfolio_aggregator.fetch_all_positions(user)
    aggregated_positions = portfolio_aggregator.aggregate_positions_by_symbol(broker_positions)
    
    opportunities = []
    for pos in aggregated_positions:
        if pos.consolidation_opportunities:
            opportunities.append({
                "symbol": pos.symbol,
                "opportunities": pos.consolidation_opportunities,
                "broker_breakdown": [
                    {
                        "broker": bp.broker_name,
                        "quantity": bp.quantity,
                        "value": float(bp.market_value)
                    }
                    for bp in pos.broker_breakdown
                ]
            })
    
    return opportunities