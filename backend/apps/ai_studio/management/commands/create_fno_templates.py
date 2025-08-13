from django.core.management.base import BaseCommand
from apps.ai_studio.models import FnOStrategy
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create F&O strategy templates for AI Studio'

    def handle(self, *args, **options):
        strategies = [
            {
                'name': 'Bull Call Spread',
                'strategy_type': FnOStrategy.StrategyType.BULL_CALL_SPREAD,
                'description': 'Limited risk, limited profit strategy for moderately bullish outlook',
                'instruments_required': ['CALL'],
                'risk_level': FnOStrategy.RiskLevel.MEDIUM,
                'minimum_capital': Decimal('25000'),
                'maximum_loss': Decimal('5000'),
                'maximum_profit': Decimal('15000'),
                'best_market_condition': 'Moderately Bullish',
                'volatility_requirement': 'Low to Medium',
                'delta_target_range': {'min': 0.3, 'max': 0.7},
                'gamma_consideration': True,
                'theta_strategy': False,
                'vega_consideration': True,
                'entry_conditions': [
                    'Buy lower strike call',
                    'Sell higher strike call',
                    'Same expiry date'
                ],
                'exit_conditions': [
                    'Target profit: 50-70% of maximum profit',
                    'Stop loss: 20-30% of premium paid',
                    'Time decay: Close 30 days before expiry'
                ],
                'stop_loss_rules': [
                    'Close if underlying breaks below support',
                    'Exit if volatility drops significantly'
                ]
            },
            {
                'name': 'Iron Condor',
                'strategy_type': FnOStrategy.StrategyType.IRON_CONDOR,
                'description': 'Neutral strategy for range-bound markets with limited risk and reward',
                'instruments_required': ['CALL', 'PUT'],
                'risk_level': FnOStrategy.RiskLevel.MEDIUM,
                'minimum_capital': Decimal('50000'),
                'maximum_loss': Decimal('15000'),
                'maximum_profit': Decimal('8000'),
                'best_market_condition': 'Neutral/Range-bound',
                'volatility_requirement': 'High IV, expect decrease',
                'delta_target_range': {'min': -0.1, 'max': 0.1},
                'gamma_consideration': True,
                'theta_strategy': True,
                'vega_consideration': True,
                'entry_conditions': [
                    'Sell OTM call and put',
                    'Buy further OTM call and put',
                    'High implied volatility'
                ],
                'exit_conditions': [
                    'Target: 25-50% of maximum profit',
                    'Close if breakeven points breached',
                    'Exit 21 days before expiry'
                ],
                'stop_loss_rules': [
                    'Close one side if breached',
                    'Adjust strikes if necessary'
                ]
            },
            {
                'name': 'Long Straddle',
                'strategy_type': FnOStrategy.StrategyType.STRADDLE,
                'description': 'High volatility strategy for big moves in either direction',
                'instruments_required': ['CALL', 'PUT'],
                'risk_level': FnOStrategy.RiskLevel.HIGH,
                'minimum_capital': Decimal('40000'),
                'maximum_loss': Decimal('20000'),
                'maximum_profit': None,  # Unlimited
                'best_market_condition': 'High Volatility Expected',
                'volatility_requirement': 'Low IV, expect increase',
                'delta_target_range': {'min': -0.1, 'max': 0.1},
                'gamma_consideration': True,
                'theta_strategy': False,
                'vega_consideration': True,
                'entry_conditions': [
                    'Buy ATM call and put',
                    'Same strike and expiry',
                    'Before earnings or events'
                ],
                'exit_conditions': [
                    'Big move in underlying',
                    'Volatility spike achieved',
                    'Close before time decay accelerates'
                ],
                'stop_loss_rules': [
                    'Exit if volatility decreases',
                    'Time stop: 14 days before expiry'
                ]
            },
            {
                'name': 'Covered Call',
                'strategy_type': FnOStrategy.StrategyType.COVERED_CALL,
                'description': 'Income generation strategy for mildly bullish to neutral outlook',
                'instruments_required': ['CALL'],
                'risk_level': FnOStrategy.RiskLevel.LOW,
                'minimum_capital': Decimal('100000'),
                'maximum_loss': None,  # Stock price can go to zero
                'maximum_profit': Decimal('15000'),
                'best_market_condition': 'Mildly Bullish to Neutral',
                'volatility_requirement': 'High IV preferred',
                'delta_target_range': {'min': -0.3, 'max': -0.1},
                'gamma_consideration': False,
                'theta_strategy': True,
                'vega_consideration': True,
                'entry_conditions': [
                    'Own 100 shares of stock',
                    'Sell OTM call option',
                    'High implied volatility'
                ],
                'exit_conditions': [
                    'Buy back call before assignment',
                    'Roll up and out if needed',
                    'Let expire worthless for income'
                ],
                'stop_loss_rules': [
                    'Buy back if call goes deep ITM',
                    'Exit underlying if strong downtrend'
                ]
            },
            {
                'name': 'Futures Momentum',
                'strategy_type': FnOStrategy.StrategyType.FUTURES_ARBITRAGE,
                'description': 'Momentum-based futures trading using basis and rollover analysis',
                'instruments_required': ['FUTURE'],
                'risk_level': FnOStrategy.RiskLevel.HIGH,
                'minimum_capital': Decimal('200000'),
                'maximum_loss': Decimal('50000'),
                'maximum_profit': None,
                'best_market_condition': 'Trending Markets',
                'volatility_requirement': 'Medium to High',
                'delta_target_range': {'min': 0.8, 'max': 1.0},
                'gamma_consideration': False,
                'theta_strategy': False,
                'vega_consideration': False,
                'entry_conditions': [
                    'Strong momentum signal',
                    'Favorable basis',
                    'Volume confirmation'
                ],
                'exit_conditions': [
                    'Momentum reversal',
                    'Target profit achieved',
                    'Before rollover if needed'
                ],
                'stop_loss_rules': [
                    'Technical stop loss',
                    'Time-based exit',
                    'Volatility-based stops'
                ]
            },
            {
                'name': 'Volatility Trading',
                'strategy_type': FnOStrategy.StrategyType.VOLATILITY_TRADING,
                'description': 'Trade volatility premium using sophisticated vol analysis',
                'instruments_required': ['CALL', 'PUT'],
                'risk_level': FnOStrategy.RiskLevel.VERY_HIGH,
                'minimum_capital': Decimal('75000'),
                'maximum_loss': Decimal('25000'),
                'maximum_profit': Decimal('40000'),
                'best_market_condition': 'High IV Environment',
                'volatility_requirement': 'High current IV',
                'delta_target_range': {'min': -0.05, 'max': 0.05},
                'gamma_consideration': True,
                'theta_strategy': True,
                'vega_consideration': True,
                'entry_conditions': [
                    'High implied volatility',
                    'IV > HV by significant margin',
                    'Delta neutral position'
                ],
                'exit_conditions': [
                    'Volatility contraction',
                    'Target profit: 30-50%',
                    'Gamma scalping profits'
                ],
                'stop_loss_rules': [
                    'Volatility expansion beyond target',
                    'Delta hedge failures',
                    'Time decay acceleration'
                ]
            }
        ]

        for strategy_data in strategies:
            strategy, created = FnOStrategy.objects.get_or_create(
                name=strategy_data['name'],
                defaults=strategy_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created strategy: {strategy.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Strategy already exists: {strategy.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('F&O strategy templates creation completed!')
        )