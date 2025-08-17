import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class ModelReview(models.Model):
    """User reviews for published models"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey('MLModel', on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    review_text = models.TextField(blank=True)
    
    # Performance verification
    verified_performance = models.BooleanField(default=False)
    actual_win_rate = models.FloatField(null=True, blank=True)
    actual_returns = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['model', 'reviewer']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.reviewer.username} review for {self.model.name}"


class MarketplaceEarnings(models.Model):
    """Track earnings from marketplace transactions"""
    
    class TransactionType(models.TextChoices):
        LEASE_PAYMENT = 'LEASE_PAYMENT', 'Lease Payment'
        COMMISSION = 'COMMISSION', 'Platform Commission'
        REFUND = 'REFUND', 'Refund'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey('MLModel', on_delete=models.CASCADE, related_name='earnings')
    lease = models.ForeignKey('ModelLeasing', on_delete=models.CASCADE, related_name='earnings')
    
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    creator_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date']
    
    def save(self, *args, **kwargs):
        # Calculate 10% platform commission
        if self.transaction_type == self.TransactionType.LEASE_PAYMENT:
            self.platform_commission = self.amount * 0.10
            self.creator_earnings = self.amount * 0.90
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} for {self.model.name}"


class MLModel(models.Model):
    """Custom ML models created by users"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        TRAINING = 'TRAINING', 'Training'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED = 'ARCHIVED', 'Archived'
    
    class ModelType(models.TextChoices):
        CLASSIFICATION = 'CLASSIFICATION', 'Classification'
        REGRESSION = 'REGRESSION', 'Regression'
        ENSEMBLE = 'ENSEMBLE', 'Ensemble'
        NEURAL_NETWORK = 'NEURAL_NETWORK', 'Neural Network'
        RULE_BASED = 'RULE_BASED', 'Rule Based'
        OPTIONS_STRATEGY = 'OPTIONS_STRATEGY', 'Options Strategy'
        FUTURES_MOMENTUM = 'FUTURES_MOMENTUM', 'Futures Momentum'
        VOLATILITY_TRADING = 'VOLATILITY_TRADING', 'Volatility Trading'
        ARBITRAGE = 'ARBITRAGE', 'Arbitrage'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ml_models')
    
    # Basic Information
    name = models.CharField(max_length=200)
    description = models.TextField()
    model_type = models.CharField(max_length=50, choices=ModelType.choices, default=ModelType.CLASSIFICATION)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    # Training Configuration
    features = models.JSONField(default=list, help_text="List of features used for training")
    target_variable = models.CharField(max_length=100, default='signal_type')
    training_parameters = models.JSONField(default=dict, help_text="Training hyperparameters")
    
    # Data Configuration
    training_period_days = models.IntegerField(default=365, validators=[MinValueValidator(30), MaxValueValidator(3650)])
    validation_split = models.FloatField(default=0.2, validators=[MinValueValidator(0.1), MaxValueValidator(0.5)])
    
    # Model Files and Results
    model_file_path = models.CharField(max_length=500, blank=True, null=True)
    training_results = models.JSONField(default=dict, help_text="Training metrics and results")
    feature_importance = models.JSONField(default=dict, help_text="SHAP feature importance values")
    
    # Performance Metrics
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    auc_roc = models.FloatField(null=True, blank=True)
    
    # Backtest Results
    backtest_results = models.JSONField(default=dict, help_text="Backtest performance metrics")
    total_return = models.FloatField(null=True, blank=True)
    sharpe_ratio = models.FloatField(null=True, blank=True)
    sortino_ratio = models.FloatField(null=True, blank=True)
    max_drawdown = models.FloatField(null=True, blank=True)
    win_rate = models.FloatField(null=True, blank=True)
    
    # Marketplace
    is_published = models.BooleanField(default=False)
    monthly_lease_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_leases = models.IntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # F&O Specific Configuration
    instrument_types = models.JSONField(default=list, help_text="Supported F&O instruments (OPTIONS, FUTURES)")
    underlying_assets = models.JSONField(default=list, help_text="Underlying assets for F&O trading")
    option_strategies = models.JSONField(default=list, help_text="Supported options strategies")
    expiry_handling = models.CharField(max_length=50, blank=True, help_text="Expiry handling method")
    
    # F&O Performance Metrics
    max_profit_potential = models.FloatField(null=True, blank=True, help_text="Maximum profit potential")
    max_loss_potential = models.FloatField(null=True, blank=True, help_text="Maximum loss potential")
    breakeven_points = models.JSONField(default=list, help_text="Breakeven price points")
    implied_volatility_accuracy = models.FloatField(null=True, blank=True)
    delta_neutral_success = models.FloatField(null=True, blank=True)
    
    # Greeks Performance (for options models)
    delta_prediction_accuracy = models.FloatField(null=True, blank=True)
    gamma_prediction_accuracy = models.FloatField(null=True, blank=True)
    theta_prediction_accuracy = models.FloatField(null=True, blank=True)
    vega_prediction_accuracy = models.FloatField(null=True, blank=True)
    
    # Metadata
    training_started_at = models.DateTimeField(null=True, blank=True)
    training_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_studio_mlmodel'
        verbose_name = 'ML Model'
        verbose_name_plural = 'ML Models'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"
    
    def get_training_duration(self):
        """Calculate training duration in minutes"""
        if self.training_started_at and self.training_completed_at:
            duration = self.training_completed_at - self.training_started_at
            return duration.total_seconds() / 60
        return None
    
    def get_status_display_color(self):
        """Get color for status display"""
        color_map = {
            'DRAFT': '#6B7280',
            'TRAINING': '#F59E0B',
            'COMPLETED': '#10B981',
            'FAILED': '#EF4444',
            'PUBLISHED': '#3B82F6',
            'ARCHIVED': '#9CA3AF',
        }
        return color_map.get(self.status, '#6B7280')


class ModelLeasing(models.Model):
    """Model leasing transactions for marketplace"""
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        CANCELLED = 'CANCELLED', 'Cancelled'
        SUSPENDED = 'SUSPENDED', 'Suspended'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lessee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leased_models')
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='leases')
    
    # Lease Details
    lease_price = models.DecimalField(max_digits=10, decimal_places=2)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2)
    creator_earnings = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Lease Period
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    # Payment Information
    payment_id = models.CharField(max_length=200, blank=True, null=True)
    payment_status = models.CharField(max_length=50, default='pending')
    
    # Usage Statistics
    total_signals_generated = models.IntegerField(default=0)
    trades_executed = models.IntegerField(default=0)
    performance_metrics = models.JSONField(default=dict)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_studio_modelleasing'
        verbose_name = 'Model Leasing'
        verbose_name_plural = 'Model Leasings'
        unique_together = ['lessee', 'model', 'start_date']
    
    def __str__(self):
        return f"{self.lessee.email} leasing {self.model.name}"
    
    def is_active(self):
        """Check if lease is currently active"""
        from django.utils import timezone
        now = timezone.now()
        return (self.status == self.Status.ACTIVE and 
                self.start_date <= now <= self.end_date)


class TrainingJob(models.Model):
    """Asynchronous training jobs for ML models"""
    
    class Status(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        RUNNING = 'RUNNING', 'Running'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE, related_name='training_jobs')
    
    # Job Information
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Progress Information
    progress_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    current_step = models.CharField(max_length=200, blank=True)
    total_steps = models.IntegerField(default=1)
    
    # Results and Logs
    result_data = models.JSONField(default=dict)
    error_message = models.TextField(blank=True, null=True)
    training_logs = models.TextField(blank=True, null=True)
    
    # Timestamps
    queued_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_studio_trainingjob'
        verbose_name = 'Training Job'
        verbose_name_plural = 'Training Jobs'
        ordering = ['-queued_at']
    
    def __str__(self):
        return f"Training Job for {self.model.name} - {self.status}"
    
    def get_duration(self):
        """Get training duration"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None


class FnOStrategy(models.Model):
    """F&O specific strategies and templates"""
    
    class StrategyType(models.TextChoices):
        LONG_CALL = 'LONG_CALL', 'Long Call'
        LONG_PUT = 'LONG_PUT', 'Long Put'
        COVERED_CALL = 'COVERED_CALL', 'Covered Call'
        PROTECTIVE_PUT = 'PROTECTIVE_PUT', 'Protective Put'
        BULL_CALL_SPREAD = 'BULL_CALL_SPREAD', 'Bull Call Spread'
        BEAR_PUT_SPREAD = 'BEAR_PUT_SPREAD', 'Bear Put Spread'
        IRON_CONDOR = 'IRON_CONDOR', 'Iron Condor'
        BUTTERFLY_SPREAD = 'BUTTERFLY_SPREAD', 'Butterfly Spread'
        STRADDLE = 'STRADDLE', 'Long Straddle'
        STRANGLE = 'STRANGLE', 'Long Strangle'
        CALENDAR_SPREAD = 'CALENDAR_SPREAD', 'Calendar Spread'
        FUTURES_ARBITRAGE = 'FUTURES_ARBITRAGE', 'Futures Arbitrage'
        VOLATILITY_TRADING = 'VOLATILITY_TRADING', 'Volatility Trading'
    
    class RiskLevel(models.TextChoices):
        LOW = 'LOW', 'Low Risk'
        MEDIUM = 'MEDIUM', 'Medium Risk'
        HIGH = 'HIGH', 'High Risk'
        VERY_HIGH = 'VERY_HIGH', 'Very High Risk'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    strategy_type = models.CharField(max_length=50, choices=StrategyType.choices)
    description = models.TextField()
    
    # Strategy Configuration
    instruments_required = models.JSONField(default=list, help_text="Required instruments (CALL, PUT, FUTURE)")
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.MEDIUM)
    minimum_capital = models.DecimalField(max_digits=12, decimal_places=2)
    maximum_loss = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    maximum_profit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Market Conditions
    best_market_condition = models.CharField(max_length=100, help_text="Bullish, Bearish, Neutral, High Volatility, etc.")
    volatility_requirement = models.CharField(max_length=50, help_text="Low, Medium, High volatility")
    
    # Greeks Requirements
    delta_target_range = models.JSONField(default=dict, help_text="Target delta range")
    gamma_consideration = models.BooleanField(default=False)
    theta_strategy = models.BooleanField(default=False, help_text="Time decay strategy")
    vega_consideration = models.BooleanField(default=False, help_text="Volatility sensitive")
    
    # Entry/Exit Rules
    entry_conditions = models.JSONField(default=list)
    exit_conditions = models.JSONField(default=list)
    stop_loss_rules = models.JSONField(default=list)
    
    # Template Configuration
    is_template = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_studio_fnostrategy'
        verbose_name = 'F&O Strategy'
        verbose_name_plural = 'F&O Strategies'
        ordering = ['strategy_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.strategy_type})"


