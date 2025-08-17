"""
Management command to set up marketplace demo data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
import random
from decimal import Decimal

from apps.ai_studio.models import MLModel, ModelLeasing, TrainingJob, FnOStrategy
from apps.audit.services import audit_logger

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up marketplace demo data for admin panel testing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=20,
            help='Number of demo users to create'
        )
        parser.add_argument(
            '--models',
            type=int,
            default=50,
            help='Number of demo models to create'
        )
        parser.add_argument(
            '--leases',
            type=int,
            default=30,
            help='Number of demo leases to create'
        )
        parser.add_argument(
            '--training-jobs',
            type=int,
            default=15,
            help='Number of training jobs to create'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up marketplace demo data...'))
        
        # Create demo users
        users = self.create_demo_users(options['users'])
        if not users:
            # Use existing users if no new ones were created
            users = list(User.objects.all()[:options['users']])
        self.stdout.write(f'Using {len(users)} demo users')
        
        # Create demo models
        models = self.create_demo_models(users, options['models'])
        self.stdout.write(f'Created {len(models)} demo models')
        
        # Create demo leases
        leases = self.create_demo_leases(users, models, options['leases'])
        self.stdout.write(f'Created {len(leases)} demo leases')
        
        # Create demo training jobs
        jobs = self.create_demo_training_jobs(models, options['training_jobs'])
        self.stdout.write(f'Created {len(jobs)} demo training jobs')
        
        # Create F&O strategies
        strategies = self.create_demo_fno_strategies()
        self.stdout.write(f'Created {len(strategies)} F&O strategies')
        
        self.stdout.write(self.style.SUCCESS('Marketplace demo setup completed!'))
    
    def create_demo_users(self, count):
        """Create demo users with realistic data"""
        users = []
        
        # Predefined user data for consistency
        user_data = [
            ('raj.sharma', 'Raj', 'Sharma'),
            ('priya.patel', 'Priya', 'Patel'),
            ('amit.kumar', 'Amit', 'Kumar'),
            ('neha.gupta', 'Neha', 'Gupta'),
            ('vikram.singh', 'Vikram', 'Singh'),
            ('anita.mehta', 'Anita', 'Mehta'),
            ('rohit.agarwal', 'Rohit', 'Agarwal'),
            ('kavya.reddy', 'Kavya', 'Reddy'),
            ('suresh.nair', 'Suresh', 'Nair'),
            ('deepika.joshi', 'Deepika', 'Joshi'),
            ('rahul.verma', 'Rahul', 'Verma'),
            ('pooja.rao', 'Pooja', 'Rao'),
            ('arjun.malhotra', 'Arjun', 'Malhotra'),
            ('sneha.kapoor', 'Sneha', 'Kapoor'),
            ('kiran.desai', 'Kiran', 'Desai'),
            ('manish.jain', 'Manish', 'Jain'),
            ('ruchi.bansal', 'Ruchi', 'Bansal'),
            ('naveen.iyer', 'Naveen', 'Iyer'),
            ('swati.saxena', 'Swati', 'Saxena'),
            ('vivek.chopra', 'Vivek', 'Chopra')
        ]
        
        for i in range(min(count, len(user_data))):
            username, first_name, last_name = user_data[i]
            
            user, created = User.objects.get_or_create(
                email=f'{username}@sharewise.ai',
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True,
                    'date_joined': timezone.now() - timedelta(days=random.randint(1, 365))
                }
            )
            
            if created:
                users.append(user)
        
        return users
    
    def create_demo_models(self, users, count):
        """Create demo ML models with realistic performance data"""
        models = []
        
        model_names = [
            'NIFTY Momentum Predictor', 'Bank NIFTY Swing Trader', 'Small Cap Value Hunter',
            'Options Premium Decay Model', 'FII/DII Flow Analyzer', 'Sector Rotation Strategy',
            'Volatility Breakout System', 'Support Resistance Bot', 'Earnings Season Predictor',
            'Technical Pattern Scanner', 'Market Sentiment Analyzer', 'Intraday Scalping Model',
            'Long Term Wealth Builder', 'Commodity Correlation Model', 'Currency Hedge Strategy',
            'Dividend Aristocrat Picker', 'Growth Stock Screener', 'Value Trap Detector',
            'Merger Arbitrage System', 'IPO Performance Predictor', 'F&O Greeks Optimizer',
            'Multi-Timeframe Analyzer', 'News Impact Predictor', 'Social Sentiment Tracker',
            'Risk Parity Allocator', 'Mean Reversion Engine', 'Trend Following Master',
            'Pairs Trading System', 'Calendar Spread Strategy', 'Credit Spread Optimizer'
        ]
        
        model_types = ['TECHNICAL_ANALYSIS', 'FUNDAMENTAL_ANALYSIS', 'SENTIMENT_ANALYSIS', 'FNO_STRATEGY']
        statuses = ['TRAINING', 'TRAINED', 'FAILED']
        
        for i in range(count):
            if i < len(model_names):
                name = model_names[i]
            else:
                name = f'Model_{i+1}_{random.choice(["Alpha", "Beta", "Gamma", "Delta"])}'
            
            user = random.choice(users)
            model_type = random.choice(model_types)
            status = random.choice(statuses)
            
            # Generate realistic performance metrics
            if status == 'TRAINED':
                accuracy = random.uniform(0.55, 0.85)
                precision = random.uniform(0.50, 0.80)
                recall = random.uniform(0.45, 0.75)
                f1_score = 2 * (precision * recall) / (precision + recall)
                total_return = random.uniform(-20, 150)
                sharpe_ratio = random.uniform(-0.5, 3.5)
                sortino_ratio = random.uniform(0, 4.0)
                max_drawdown = random.uniform(-30, -5)
                win_rate = random.uniform(0.45, 0.75)
                is_published = random.choice([True, False])
                monthly_lease_price = random.randint(500, 5000) if is_published else 0
            else:
                accuracy = precision = recall = f1_score = None
                total_return = sharpe_ratio = sortino_ratio = max_drawdown = win_rate = None
                is_published = False
                monthly_lease_price = 0
            
            model = MLModel.objects.create(
                user=user,
                name=name,
                description=f'Advanced {model_type.replace("_", " ").title()} model for {name}',
                model_type=model_type,
                status=status,
                features=['price', 'volume', 'technical_indicators'],
                target_variable='future_return',
                training_parameters={
                    'algorithm': random.choice(['RandomForest', 'XGBoost', 'GradientBoosting']),
                    'max_depth': random.randint(5, 15),
                    'n_estimators': random.randint(100, 500)
                },
                accuracy=accuracy,
                precision=precision,
                recall=recall,
                f1_score=f1_score,
                total_return=total_return,
                sharpe_ratio=sharpe_ratio,
                sortino_ratio=sortino_ratio,
                max_drawdown=max_drawdown,
                win_rate=win_rate,
                is_published=is_published,
                monthly_lease_price=monthly_lease_price,
                created_at=timezone.now() - timedelta(days=random.randint(1, 180))
            )
            
            models.append(model)
        
        return models
    
    def create_demo_leases(self, users, models, count):
        """Create demo model leases"""
        leases = []
        published_models = [m for m in models if m.is_published]
        
        if not published_models:
            return leases
        
        statuses = ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']
        payment_statuses = ['PAID', 'PENDING', 'FAILED']
        
        for i in range(count):
            model = random.choice(published_models)
            lessee = random.choice([u for u in users if u != model.user])
            
            status = random.choice(statuses)
            payment_status = random.choice(payment_statuses)
            
            lease_price = model.monthly_lease_price
            platform_commission = lease_price * Decimal('0.20')  # 20% platform fee
            creator_earnings = lease_price - platform_commission
            
            start_date = timezone.now() - timedelta(days=random.randint(1, 90))
            end_date = start_date + timedelta(days=30)
            
            lease = ModelLeasing.objects.create(
                model=model,
                lessee=lessee,
                lease_price=lease_price,
                status=status,
                payment_status=payment_status,
                start_date=start_date,
                end_date=end_date,
                platform_commission=platform_commission,
                creator_earnings=creator_earnings,
                total_signals_generated=random.randint(10, 200),
                trades_executed=random.randint(5, 100),
                performance_metrics={
                    'total_return': random.uniform(-10, 25),
                    'win_rate': random.uniform(0.4, 0.8),
                    'sharpe_ratio': random.uniform(0.5, 2.5)
                },
                created_at=start_date
            )
            
            # Update model statistics
            model.total_leases = ModelLeasing.objects.filter(model=model).count()
            model.total_earnings = ModelLeasing.objects.filter(
                model=model, payment_status='PAID'
            ).aggregate(total=Sum('creator_earnings'))['total'] or 0
            model.save()
            
            leases.append(lease)
        
        return leases
    
    def create_demo_training_jobs(self, models, count):
        """Create demo training jobs"""
        jobs = []
        
        statuses = ['COMPLETED', 'RUNNING', 'FAILED', 'QUEUED']
        
        for i in range(count):
            model = random.choice(models)
            status = random.choice(statuses)
            
            progress_percentage = 100.0 if status == 'COMPLETED' else random.uniform(0, 95)
            
            steps = [
                'Data preprocessing', 'Feature engineering', 'Model training',
                'Hyperparameter tuning', 'Model validation', 'Performance evaluation'
            ]
            
            if status == 'COMPLETED':
                current_step = 'Completed'
            elif status == 'FAILED':
                current_step = f'Failed at: {random.choice(steps)}'
            else:
                current_step = random.choice(steps)
            
            queued_at = timezone.now() - timedelta(hours=random.randint(1, 72))
            started_at = queued_at + timedelta(minutes=random.randint(1, 30)) if status != 'QUEUED' else None
            completed_at = started_at + timedelta(hours=random.randint(1, 8)) if status == 'COMPLETED' else None
            
            job = TrainingJob.objects.create(
                model=model,
                status=status,
                progress_percentage=progress_percentage,
                current_step=current_step,
                total_steps=len(steps),
                celery_task_id=f'task_{i}_{random.randint(1000, 9999)}',
                queued_at=queued_at,
                started_at=started_at,
                completed_at=completed_at
            )
            
            jobs.append(job)
        
        return jobs
    
    def create_demo_fno_strategies(self):
        """Create demo F&O strategies"""
        strategies = []
        
        strategy_data = [
            {
                'name': 'Bull Call Spread',
                'strategy_type': 'SPREAD',
                'risk_level': 'MEDIUM',
                'description': 'Bullish strategy using call options at different strikes',
                'minimum_capital': 50000,
                'maximum_loss': -15000,
                'maximum_profit': 10000,
                'best_market_condition': 'MODERATELY_BULLISH'
            },
            {
                'name': 'Iron Condor',
                'strategy_type': 'NEUTRAL',
                'risk_level': 'LOW',
                'description': 'Range-bound strategy for sideways market',
                'minimum_capital': 75000,
                'maximum_loss': -25000,
                'maximum_profit': 8000,
                'best_market_condition': 'SIDEWAYS'
            },
            {
                'name': 'Protective Put',
                'strategy_type': 'HEDGING',
                'risk_level': 'LOW',
                'description': 'Hedging strategy for downside protection',
                'minimum_capital': 100000,
                'maximum_loss': -10000,
                'maximum_profit': 999999,
                'best_market_condition': 'UNCERTAIN'
            },
            {
                'name': 'Short Straddle',
                'strategy_type': 'VOLATILITY',
                'risk_level': 'HIGH',
                'description': 'High-risk strategy betting on low volatility',
                'minimum_capital': 80000,
                'maximum_loss': -999999,
                'maximum_profit': 15000,
                'best_market_condition': 'LOW_VOLATILITY'
            },
            {
                'name': 'Butterfly Spread',
                'strategy_type': 'SPREAD',
                'risk_level': 'MEDIUM',
                'description': 'Limited risk and reward strategy',
                'minimum_capital': 60000,
                'maximum_loss': -20000,
                'maximum_profit': 12000,
                'best_market_condition': 'SIDEWAYS'
            }
        ]
        
        for data in strategy_data:
            strategy = FnOStrategy.objects.create(
                name=data['name'],
                strategy_type=data['strategy_type'],
                risk_level=data['risk_level'],
                description=data['description'],
                minimum_capital=data['minimum_capital'],
                maximum_loss=data['maximum_loss'],
                maximum_profit=data['maximum_profit'],
                best_market_condition=data['best_market_condition'],
                instruments_required=['NIFTY', 'BANKNIFTY'],
                volatility_requirement='MEDIUM',
                is_template=True,
                is_active=True,
                usage_count=random.randint(5, 50)
            )
            strategies.append(strategy)
        
        return strategies