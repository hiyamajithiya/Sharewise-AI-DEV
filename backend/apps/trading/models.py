import uuid
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.users.models import CustomUser
from django.utils import timezone


class TradingSignal(models.Model):
    """AI-generated trading signals based on the specified structure"""
    
    class InstrumentType(models.TextChoices):
        EQUITY = 'EQUITY', 'Equity'
        FUTURES = 'FUTURES', 'Futures'
        OPTIONS = 'OPTIONS', 'Options'
        COMMODITY = 'COMMODITY', 'Commodity'
        CURRENCY = 'CURRENCY', 'Currency'
    
    class SignalType(models.TextChoices):
        BUY = 'BUY', 'Buy'
        SELL = 'SELL', 'Sell'
        SHORT = 'SHORT', 'Short'
        COVER = 'COVER', 'Cover'
        
    class OptionType(models.TextChoices):
        CALL = 'CALL', 'Call Option'
        PUT = 'PUT', 'Put Option'
    
    # Core fields from AI_Signal_Log_Structure.docx
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, 
                                   help_text="Time of signal generation")
    
    # Instrument details
    instrument_type = models.CharField(
        max_length=20,
        choices=InstrumentType.choices,
        default=InstrumentType.EQUITY,
        help_text="Type of financial instrument"
    )
    
    symbol = models.CharField(max_length=50, 
                            help_text="Stock or instrument name (e.g., NIFTY, RELIANCE)")
    
    # Futures and Options specific fields
    underlying_symbol = models.CharField(max_length=50, null=True, blank=True,
                                       help_text="Underlying asset for F&O (e.g., NIFTY for NIFTY24DEC19000CE)")
    
    expiry_date = models.DateField(null=True, blank=True,
                                 help_text="Expiry date for F&O instruments")
    
    strike_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                     help_text="Strike price for options")
    
    option_type = models.CharField(
        max_length=10,
        choices=OptionType.choices,
        null=True, blank=True,
        help_text="Call or Put for options"
    )
    
    lot_size = models.PositiveIntegerField(default=1,
                                         help_text="Lot size for F&O instruments")
    
    strategy_name = models.CharField(max_length=100,
                                   help_text="Strategy that generated the signal")
    
    signal_type = models.CharField(
        max_length=10,
        choices=SignalType.choices,
        help_text="Buy/Sell/Short/Cover"
    )
    
    confidence_score = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('1.00'))],
        help_text="Probability/Confidence of signal (0-1)"
    )
    
    entry_price = models.DecimalField(max_digits=12, decimal_places=2,
                                    help_text="Recommended entry price")
    
    target_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                     help_text="Target price for exit")
    
    stop_loss = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                  help_text="Stop loss for risk management")
    
    valid_until = models.DateTimeField(null=True, blank=True,
                                     help_text="Signal expiration time")
    
    backtest_result = models.JSONField(default=dict,
                                     help_text="Backtest metrics like win-rate, avg return")
    
    executed = models.BooleanField(default=False,
                                 help_text="Whether the trade was executed or not")
    
    executed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                       help_text="Price at which trade was executed (if any)")
    
    # Additional fields for platform functionality
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trading_signals')
    created_by_strategy_id = models.UUIDField(null=True, blank=True,
                                            help_text="References to strategy that generated this")
    
    market_data = models.JSONField(default=dict,
                                 help_text="Technical indicators, news sentiment")
    
    # Explainable AI (XAI) fields
    ai_justification = models.TextField(blank=True,
                                      help_text="Human-readable explanation of why this signal was generated")
    
    feature_importance = models.JSONField(default=dict,
                                        help_text="SHAP feature importance values explaining the signal")
    
    shap_values = models.JSONField(default=dict,
                                 help_text="SHAP values for each feature contributing to the decision")
    
    risk_reward_ratio = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                          help_text="Risk to reward ratio for this signal")
    
    probability_explanation = models.JSONField(default=dict,
                                             help_text="Breakdown of factors contributing to confidence score")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'trading_signal'
        verbose_name = 'Trading Signal'
        verbose_name_plural = 'Trading Signals'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['symbol', '-timestamp']),
            models.Index(fields=['executed', 'valid_until']),
        ]
    
    def __str__(self):
        if self.instrument_type == self.InstrumentType.OPTIONS:
            return f"{self.signal_type} {self.symbol} {self.option_type} {self.strike_price} @ {self.entry_price} ({self.confidence_score})"
        elif self.instrument_type == self.InstrumentType.FUTURES:
            return f"{self.signal_type} {self.symbol} FUT @ {self.entry_price} ({self.confidence_score})"
        else:
            return f"{self.signal_type} {self.symbol} @ {self.entry_price} ({self.confidence_score})"
    
    @property
    def is_valid(self):
        """Check if signal is still valid"""
        if self.valid_until is None:
            return True
        from django.utils import timezone
        return timezone.now() <= self.valid_until
    
    @property
    def risk_reward_ratio(self):
        """Calculate risk-reward ratio"""
        if not self.target_price or not self.stop_loss:
            return None
        
        if self.signal_type in ['BUY', 'COVER']:
            risk = abs(self.entry_price - self.stop_loss)
            reward = abs(self.target_price - self.entry_price)
        else:  # SELL, SHORT
            risk = abs(self.stop_loss - self.entry_price)
            reward = abs(self.entry_price - self.target_price)
        
        return reward / risk if risk > 0 else None


class TradingOrder(models.Model):
    """Trading orders placed through broker APIs"""
    
    class OrderType(models.TextChoices):
        MARKET = 'MARKET', 'Market Order'
        LIMIT = 'LIMIT', 'Limit Order'
        SL = 'SL', 'Stop Loss'
        SL_M = 'SL_M', 'Stop Loss Market'
        OCO = 'OCO', 'One Cancels Other'
        BRACKET = 'BRACKET', 'Bracket Order'
        COVER = 'COVER', 'Cover Order'
    
    class TransactionType(models.TextChoices):
        BUY = 'BUY', 'Buy'
        SELL = 'SELL', 'Sell'
        
    class InstrumentType(models.TextChoices):
        EQUITY = 'EQUITY', 'Equity'
        FUTURES = 'FUTURES', 'Futures'
        OPTIONS = 'OPTIONS', 'Options'
        COMMODITY = 'COMMODITY', 'Commodity'
        CURRENCY = 'CURRENCY', 'Currency'
        
    class PositionType(models.TextChoices):
        INTRADAY = 'INTRADAY', 'Intraday'
        DELIVERY = 'DELIVERY', 'Delivery'
        CARRY_FORWARD = 'CARRY_FORWARD', 'Carry Forward'
    
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        OPEN = 'OPEN', 'Open'
        COMPLETE = 'COMPLETE', 'Complete'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signal = models.ForeignKey(TradingSignal, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='orders')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trading_orders')
    
    # Broker information (will reference broker account when implemented)
    broker_order_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Order details
    symbol = models.CharField(max_length=50)
    instrument_type = models.CharField(
        max_length=20,
        choices=InstrumentType.choices,
        default=InstrumentType.EQUITY,
        help_text="Type of financial instrument"
    )
    order_type = models.CharField(max_length=20, choices=OrderType.choices)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    position_type = models.CharField(
        max_length=20,
        choices=PositionType.choices,
        default=PositionType.INTRADAY,
        help_text="Position holding type"
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    trigger_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # F&O specific fields
    underlying_symbol = models.CharField(max_length=50, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    strike_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    option_type = models.CharField(max_length=10, null=True, blank=True)
    lot_size = models.PositiveIntegerField(default=1)
    
    # Advanced order parameters
    disclosed_quantity = models.PositiveIntegerField(default=0,
                                                   help_text="Iceberg order disclosed quantity")
    validity = models.CharField(max_length=10, default='DAY',
                              help_text="Order validity (DAY, IOC, GTD)")
    
    # Bracket/Cover order fields
    target_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                     help_text="Target price for bracket orders")
    stoploss_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                       help_text="Stop loss price for bracket orders")
    trailing_stoploss = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                          help_text="Trailing stop loss percentage")
    
    # Status and execution
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    filled_quantity = models.PositiveIntegerField(default=0)
    average_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    order_timestamp = models.DateTimeField(auto_now_add=True)
    exchange_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    rejection_reason = models.TextField(null=True, blank=True)
    
    # Costs
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    taxes = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'trading_order'
        verbose_name = 'Trading Order'
        verbose_name_plural = 'Trading Orders'
        ordering = ['-order_timestamp']
        indexes = [
            models.Index(fields=['user', '-order_timestamp']),
            models.Index(fields=['status']),
            models.Index(fields=['symbol']),
        ]
    
    def __str__(self):
        if self.instrument_type == self.InstrumentType.OPTIONS:
            return f"{self.transaction_type} {self.quantity} {self.symbol} {self.option_type} {self.strike_price} @ {self.price} ({self.status})"
        elif self.instrument_type == self.InstrumentType.FUTURES:
            return f"{self.transaction_type} {self.quantity} {self.symbol} FUT @ {self.price} ({self.status})"
        else:
            return f"{self.transaction_type} {self.quantity} {self.symbol} @ {self.price} ({self.status})"
    
    @property
    def total_value(self):
        """Calculate total order value"""
        if self.average_price and self.filled_quantity:
            return self.average_price * self.filled_quantity
        elif self.price and self.quantity:
            return self.price * self.quantity
        return Decimal('0.00')
    
    @property
    def is_executed(self):
        """Check if order is fully executed"""
        return self.status == self.OrderStatus.COMPLETE and self.filled_quantity == self.quantity

    @property
    def total_lots(self):
        """Calculate total number of lots for F&O"""
        if self.instrument_type in [self.InstrumentType.FUTURES, self.InstrumentType.OPTIONS]:
            return self.quantity // self.lot_size if self.lot_size > 0 else 0
        return self.quantity
    
    @property
    def margin_required(self):
        """Calculate approximate margin required (placeholder)"""
        # This would be calculated based on instrument type, volatility, etc.
        if self.instrument_type == self.InstrumentType.FUTURES:
            return float(self.price * self.quantity * 0.10) if self.price else 0  # 10% margin
        elif self.instrument_type == self.InstrumentType.OPTIONS and self.transaction_type == 'SELL':
            return float(self.price * self.quantity * 0.15) if self.price else 0  # 15% for options selling
        return 0


class FuturesOptionsData(models.Model):
    """Store F&O master data and chain information"""
    
    class InstrumentType(models.TextChoices):
        FUTURES = 'FUTURES', 'Futures'
        OPTIONS = 'OPTIONS', 'Options'
    
    class OptionType(models.TextChoices):
        CALL = 'CALL', 'Call Option'
        PUT = 'PUT', 'Put Option'
    
    # Basic instrument details
    symbol = models.CharField(max_length=100, unique=True,
                            help_text="Full instrument symbol (e.g., NIFTY24DEC19000CE)")
    underlying_symbol = models.CharField(max_length=50,
                                       help_text="Underlying asset symbol")
    instrument_type = models.CharField(max_length=20, choices=InstrumentType.choices)
    
    # F&O specific details
    expiry_date = models.DateField()
    strike_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    option_type = models.CharField(max_length=10, choices=OptionType.choices, null=True, blank=True)
    lot_size = models.PositiveIntegerField(default=1)
    
    # Market data
    tick_size = models.DecimalField(max_digits=8, decimal_places=4, default=0.05)
    freeze_quantity = models.PositiveIntegerField(null=True, blank=True,
                                                help_text="Maximum quantity allowed in single order")
    
    # Status
    is_active = models.BooleanField(default=True)
    exchange = models.CharField(max_length=10, default='NSE')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'futures_options_data'
        verbose_name = 'F&O Instrument'
        verbose_name_plural = 'F&O Instruments'
        ordering = ['underlying_symbol', 'expiry_date', 'strike_price']
        indexes = [
            models.Index(fields=['underlying_symbol', 'expiry_date']),
            models.Index(fields=['symbol']),
            models.Index(fields=['instrument_type', 'is_active']),
        ]
    
    def __str__(self):
        if self.instrument_type == self.InstrumentType.OPTIONS:
            return f"{self.underlying_symbol} {self.expiry_date.strftime('%d%b%Y')} {self.strike_price} {self.option_type}"
        else:
            return f"{self.underlying_symbol} {self.expiry_date.strftime('%d%b%Y')} FUT"
    
    @property
    def days_to_expiry(self):
        """Calculate days to expiry"""
        from django.utils import timezone
        today = timezone.now().date()
        return (self.expiry_date - today).days
    
    @property
    def is_weekly_expiry(self):
        """Check if this is a weekly expiry"""
        return self.expiry_date.weekday() == 3  # Thursday
    
    @property
    def moneyness(self):
        """Calculate moneyness for options (requires current price)"""
        # This would need current underlying price to calculate ITM/OTM/ATM
        return None


class TradingStrategy(models.Model):
    """Trading strategies that can be assigned to specific broker accounts"""
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PAUSED = 'PAUSED', 'Paused'
        STOPPED = 'STOPPED', 'Stopped'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trading_strategies')
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Strategy assignment
    assigned_broker_account = models.CharField(max_length=100, blank=True, 
                                             help_text="Broker account ID for trade execution")
    
    # ML Model reference (if using AI Studio model)
    ml_model = models.ForeignKey('ai_studio.MLModel', on_delete=models.SET_NULL, 
                               null=True, blank=True, related_name='trading_strategies')
    
    # Strategy settings
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PAUSED)
    auto_execute = models.BooleanField(default=False, 
                                     help_text="Auto-execute trades without user approval")
    
    # Risk management
    max_position_size = models.DecimalField(max_digits=15, decimal_places=2, default=10000.00)
    max_daily_loss = models.DecimalField(max_digits=15, decimal_places=2, default=5000.00)
    max_open_positions = models.PositiveIntegerField(default=5)
    
    # Performance tracking
    total_trades = models.IntegerField(default=0)
    winning_trades = models.IntegerField(default=0)
    total_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Trading Strategy'
        verbose_name_plural = 'Trading Strategies'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"
    
    @property
    def win_rate(self):
        if self.total_trades == 0:
            return 0
        return (self.winning_trades / self.total_trades) * 100


class TradeApproval(models.Model):
    """Trade approval workflow for signals requiring user confirmation"""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'
        EXECUTED = 'EXECUTED', 'Executed'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signal = models.OneToOneField(TradingSignal, on_delete=models.CASCADE, related_name='approval')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trade_approvals')
    strategy = models.ForeignKey(TradingStrategy, on_delete=models.CASCADE, related_name='approvals')
    
    # Approval details
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Proposed trade details
    proposed_quantity = models.PositiveIntegerField()
    proposed_price = models.DecimalField(max_digits=12, decimal_places=2)
    proposed_broker_account = models.CharField(max_length=100)
    
    # User decision
    approved_quantity = models.PositiveIntegerField(null=True, blank=True)
    approved_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timing
    expires_at = models.DateTimeField()
    approved_at = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    
    # Notifications
    notification_sent = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Approval for {self.signal.symbol} - {self.status}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def time_remaining(self):
        if self.is_expired:
            return "Expired"
        remaining = self.expires_at - timezone.now()
        return f"{remaining.seconds // 60} minutes"


class AutomatedTradeExecution(models.Model):
    """Track automated trade executions and their lifecycle"""
    
    class ExecutionStatus(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued for Execution'
        EXECUTING = 'EXECUTING', 'Executing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signal = models.ForeignKey(TradingSignal, on_delete=models.CASCADE, related_name='executions')
    strategy = models.ForeignKey(TradingStrategy, on_delete=models.CASCADE, related_name='executions')
    approval = models.ForeignKey(TradeApproval, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Execution details
    status = models.CharField(max_length=20, choices=ExecutionStatus.choices, default=ExecutionStatus.QUEUED)
    
    # Entry order
    entry_order = models.OneToOneField(TradingOrder, on_delete=models.SET_NULL, 
                                     null=True, blank=True, related_name='entry_execution')
    
    # Exit orders (SL and Target)
    stop_loss_order = models.OneToOneField(TradingOrder, on_delete=models.SET_NULL, 
                                         null=True, blank=True, related_name='sl_execution')
    target_order = models.OneToOneField(TradingOrder, on_delete=models.SET_NULL, 
                                      null=True, blank=True, related_name='target_execution')
    
    # Execution results
    entry_executed_at = models.DateTimeField(null=True, blank=True)
    exit_executed_at = models.DateTimeField(null=True, blank=True)
    
    total_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    fees_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Execution for {self.signal.symbol} - {self.status}"
    
    @property
    def is_position_open(self):
        """Check if position is still open"""
        return (self.entry_order and self.entry_order.is_executed and 
                not (self.stop_loss_order and self.stop_loss_order.is_executed) and
                not (self.target_order and self.target_order.is_executed))


class PortfolioPosition(models.Model):
    """Aggregated portfolio positions across all brokers"""
    
    class PositionType(models.TextChoices):
        LONG = 'LONG', 'Long Position'
        SHORT = 'SHORT', 'Short Position'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='portfolio_positions')
    
    # Position details
    symbol = models.CharField(max_length=50)
    instrument_type = models.CharField(max_length=20)
    position_type = models.CharField(max_length=10, choices=PositionType.choices)
    
    # Quantities
    total_quantity = models.IntegerField(default=0)
    available_quantity = models.IntegerField(default=0)  # Available for sale
    
    # Pricing
    average_price = models.DecimalField(max_digits=12, decimal_places=2)
    current_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # P&L
    unrealized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    realized_pnl = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Broker allocation
    broker_positions = models.JSONField(default=dict, 
                                      help_text="Breakdown by broker account")
    
    # Metadata
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'symbol', 'instrument_type']
        ordering = ['-last_updated']
    
    def __str__(self):
        return f"{self.symbol} - {self.total_quantity} ({self.position_type})"
    
    @property
    def current_value(self):
        """Calculate current market value"""
        if self.current_price:
            return self.total_quantity * self.current_price
        return self.total_quantity * self.average_price
    
    @property
    def pnl_percentage(self):
        """Calculate P&L percentage"""
        if self.average_price > 0:
            return ((self.current_price or self.average_price) - self.average_price) / self.average_price * 100
        return 0


class LimitType(models.TextChoices):
    """Types of usage limits"""
    DAILY_SIGNALS = 'DAILY_SIGNALS', 'Daily Signal Generation'
    MONTHLY_SIGNALS = 'MONTHLY_SIGNALS', 'Monthly Signal Generation'
    DAILY_BACKTESTS = 'DAILY_BACKTESTS', 'Daily Backtests'
    MONTHLY_BACKTESTS = 'MONTHLY_BACKTESTS', 'Monthly Backtests'
    ACTIVE_STRATEGIES = 'ACTIVE_STRATEGIES', 'Active Strategies'
    API_CALLS_DAILY = 'API_CALLS_DAILY', 'Daily API Calls'
    PORTFOLIO_POSITIONS = 'PORTFOLIO_POSITIONS', 'Portfolio Positions'
    DATA_EXPORT_MONTHLY = 'DATA_EXPORT_MONTHLY', 'Monthly Data Exports'


class UsageTracker(models.Model):
    """Track usage for each user and limit type"""
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='usage_trackers')
    limit_type = models.CharField(max_length=30, choices=LimitType.choices)
    
    # Usage counters
    daily_count = models.PositiveIntegerField(default=0)
    monthly_count = models.PositiveIntegerField(default=0)
    
    # Reset tracking
    last_daily_reset = models.DateField(auto_now_add=True)
    last_monthly_reset = models.DateField(auto_now_add=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'limit_type']
        db_table = 'trading_usage_tracker'
        verbose_name = 'Usage Tracker'
        verbose_name_plural = 'Usage Trackers'
        indexes = [
            models.Index(fields=['user', 'limit_type']),
            models.Index(fields=['last_daily_reset']),
            models.Index(fields=['last_monthly_reset']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.limit_type}: {self.daily_count}/{self.monthly_count}"