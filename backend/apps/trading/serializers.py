from rest_framework import serializers
from decimal import Decimal
from .models import TradingSignal, TradingOrder, FuturesOptionsData


class TradingSignalSerializer(serializers.ModelSerializer):
    """Serializer for trading signals"""
    risk_reward_ratio = serializers.ReadOnlyField()
    is_valid = serializers.ReadOnlyField()
    execution_status = serializers.SerializerMethodField()
    
    class Meta:
        model = TradingSignal
        fields = [
            'id', 'timestamp', 'instrument_type', 'symbol', 'underlying_symbol',
            'expiry_date', 'strike_price', 'option_type', 'lot_size',
            'strategy_name', 'signal_type', 'confidence_score', 'entry_price', 
            'target_price', 'stop_loss', 'valid_until', 'backtest_result', 
            'executed', 'executed_price', 'created_by_strategy_id', 'market_data', 
            'created_at', 'updated_at', 'risk_reward_ratio', 'is_valid', 'execution_status'
        ]
        read_only_fields = [
            'id', 'timestamp', 'executed', 'executed_price', 'created_at', 
            'updated_at', 'risk_reward_ratio', 'is_valid'
        ]

    def get_execution_status(self, obj):
        """Get execution status with details"""
        if not obj.executed:
            return {
                'status': 'pending',
                'message': 'Signal not executed yet'
            }
        
        # Get related orders
        orders = obj.orders.all()
        if not orders.exists():
            return {
                'status': 'executed',
                'message': 'Signal executed but no order details available'
            }
        
        entry_order = orders.filter(
            transaction_type='BUY' if obj.signal_type in ['BUY', 'COVER'] else 'SELL'
        ).first()
        
        if entry_order:
            return {
                'status': 'executed',
                'order_id': str(entry_order.id),
                'order_status': entry_order.status,
                'executed_price': float(entry_order.average_price) if entry_order.average_price else None,
                'quantity': entry_order.filled_quantity or entry_order.quantity
            }
        
        return {
            'status': 'executed',
            'message': 'Signal executed'
        }

    def validate_confidence_score(self, value):
        """Validate confidence score is between 0 and 1"""
        if not (0 <= value <= 1):
            raise serializers.ValidationError("Confidence score must be between 0 and 1")
        return value

    def validate(self, data):
        """Validate signal data"""
        # Check that target and stop loss make sense
        entry_price = data.get('entry_price')
        target_price = data.get('target_price')
        stop_loss = data.get('stop_loss')
        signal_type = data.get('signal_type')
        
        if entry_price and target_price and stop_loss:
            if signal_type in ['BUY', 'COVER']:
                if target_price <= entry_price:
                    raise serializers.ValidationError(
                        "For BUY signals, target price must be higher than entry price"
                    )
                if stop_loss >= entry_price:
                    raise serializers.ValidationError(
                        "For BUY signals, stop loss must be lower than entry price"
                    )
            else:  # SELL, SHORT
                if target_price >= entry_price:
                    raise serializers.ValidationError(
                        "For SELL signals, target price must be lower than entry price"
                    )
                if stop_loss <= entry_price:
                    raise serializers.ValidationError(
                        "For SELL signals, stop loss must be higher than entry price"
                    )
        
        return data


class TradingSignalCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating trading signals"""
    
    class Meta:
        model = TradingSignal
        fields = [
            'instrument_type', 'symbol', 'underlying_symbol', 'expiry_date',
            'strike_price', 'option_type', 'lot_size', 'strategy_name', 
            'signal_type', 'confidence_score', 'entry_price', 'target_price', 
            'stop_loss', 'valid_until', 'backtest_result', 'market_data'
        ]

    def validate_symbol(self, value):
        """Validate symbol format"""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Symbol is required")
        return value.upper().strip()

    def validate_confidence_score(self, value):
        """Validate confidence score"""
        if value < Decimal('0.50'):
            raise serializers.ValidationError(
                "Confidence score must be at least 0.50 (50%)"
            )
        return value


class TradingOrderSerializer(serializers.ModelSerializer):
    """Serializer for trading orders"""
    total_value = serializers.ReadOnlyField()
    is_executed = serializers.ReadOnlyField()
    signal_details = serializers.SerializerMethodField()
    execution_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = TradingOrder
        fields = [
            'id', 'signal', 'broker_order_id', 'symbol', 'instrument_type',
            'underlying_symbol', 'expiry_date', 'strike_price', 'option_type',
            'lot_size', 'order_type', 'transaction_type', 'position_type',
            'quantity', 'price', 'trigger_price', 'target_price', 'stoploss_price',
            'trailing_stoploss', 'disclosed_quantity', 'validity', 'status', 
            'filled_quantity', 'average_price', 'order_timestamp', 'exchange_timestamp', 
            'rejection_reason', 'fees', 'taxes', 'created_at', 'updated_at', 
            'total_value', 'is_executed', 'signal_details', 'execution_summary'
        ]
        read_only_fields = [
            'id', 'broker_order_id', 'status', 'filled_quantity', 'average_price',
            'exchange_timestamp', 'rejection_reason', 'created_at', 'updated_at',
            'total_value', 'is_executed'
        ]

    def get_signal_details(self, obj):
        """Get related signal details"""
        if not obj.signal:
            return None
        
        return {
            'id': str(obj.signal.id),
            'strategy_name': obj.signal.strategy_name,
            'signal_type': obj.signal.signal_type,
            'confidence_score': float(obj.signal.confidence_score),
            'target_price': float(obj.signal.target_price) if obj.signal.target_price else None,
            'stop_loss': float(obj.signal.stop_loss) if obj.signal.stop_loss else None
        }

    def get_execution_summary(self, obj):
        """Get order execution summary"""
        if obj.status != TradingOrder.OrderStatus.COMPLETE:
            return {
                'status': obj.status,
                'filled_percentage': 0,
                'remaining_quantity': obj.quantity
            }
        
        filled_percentage = (obj.filled_quantity / obj.quantity * 100) if obj.quantity > 0 else 0
        
        return {
            'status': obj.status,
            'filled_percentage': round(filled_percentage, 1),
            'remaining_quantity': obj.quantity - obj.filled_quantity,
            'total_cost': float(obj.average_price * obj.filled_quantity) if obj.average_price else 0,
            'total_fees': float(obj.fees + obj.taxes)
        }


class TradingOrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating trading orders (limited fields)"""
    
    class Meta:
        model = TradingOrder
        fields = ['quantity', 'price', 'trigger_price']

    def validate(self, data):
        """Validate order update data"""
        order = self.instance
        
        if order and order.status not in [TradingOrder.OrderStatus.PENDING, TradingOrder.OrderStatus.OPEN]:
            raise serializers.ValidationError(
                "Cannot modify orders that are not in PENDING or OPEN status"
            )
        
        return data


class SignalAnalyticsSerializer(serializers.Serializer):
    """Serializer for signal analytics data"""
    total_signals = serializers.IntegerField()
    executed_signals = serializers.IntegerField()
    execution_rate = serializers.FloatField()
    avg_confidence = serializers.FloatField()
    top_strategies = serializers.ListField()
    signal_distribution = serializers.DictField()


class PerformanceMetricsSerializer(serializers.Serializer):
    """Serializer for performance metrics"""
    total_trades = serializers.IntegerField()
    winning_trades = serializers.IntegerField()
    losing_trades = serializers.IntegerField()
    win_rate = serializers.FloatField()
    total_pnl = serializers.FloatField()
    total_fees = serializers.FloatField()
    net_pnl = serializers.FloatField()
    avg_win = serializers.FloatField()
    avg_loss = serializers.FloatField()
    profit_factor = serializers.FloatField()
    sharpe_ratio = serializers.FloatField()
    max_drawdown = serializers.FloatField()
    calmar_ratio = serializers.FloatField()
    start_date = serializers.DateTimeField(allow_null=True)
    end_date = serializers.DateTimeField(allow_null=True)


class AutoTradeSettingsSerializer(serializers.Serializer):
    """Serializer for auto-trade settings"""
    auto_execute_enabled = serializers.BooleanField(default=False)
    min_confidence_threshold = serializers.DecimalField(
        max_digits=3, decimal_places=2, 
        min_value=Decimal('0.50'), max_value=Decimal('1.00'),
        default=Decimal('0.70')
    )
    max_daily_trades = serializers.IntegerField(min_value=1, max_value=100, default=10)
    max_position_size = serializers.DecimalField(
        max_digits=10, decimal_places=2, 
        min_value=Decimal('1000'), default=Decimal('10000')
    )
    risk_per_trade = serializers.DecimalField(
        max_digits=4, decimal_places=3,
        min_value=Decimal('0.001'), max_value=Decimal('0.100'),
        default=Decimal('0.020')
    )
    allowed_symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False, default=list
    )
    excluded_symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False, default=list
    )

    def validate_allowed_symbols(self, value):
        """Validate and normalize symbol list"""
        return [symbol.upper().strip() for symbol in value if symbol.strip()]

    def validate_excluded_symbols(self, value):
        """Validate and normalize excluded symbols"""
        return [symbol.upper().strip() for symbol in value if symbol.strip()]


class RiskCheckSerializer(serializers.Serializer):
    """Serializer for risk check requests"""
    symbol = serializers.CharField(max_length=50)
    signal_type = serializers.ChoiceField(choices=TradingSignal.SignalType.choices)
    entry_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    stop_loss = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    target_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    confidence_score = serializers.DecimalField(
        max_digits=3, decimal_places=2, 
        min_value=Decimal('0.00'), max_value=Decimal('1.00'),
        default=Decimal('0.70')
    )
    quantity = serializers.IntegerField(min_value=1, default=100)

    def validate_symbol(self, value):
        """Normalize symbol"""
        return value.upper().strip()


class SignalGenerationRequestSerializer(serializers.Serializer):
    """Serializer for signal generation requests"""
    symbols = serializers.ListField(
        child=serializers.CharField(max_length=50),
        min_length=1, max_length=50
    )
    strategy_id = serializers.UUIDField(required=False)
    
    def validate_symbols(self, value):
        """Validate and normalize symbols"""
        normalized = [symbol.upper().strip() for symbol in value if symbol.strip()]
        if not normalized:
            raise serializers.ValidationError("At least one valid symbol is required")
        return normalized


class BatchExecuteSerializer(serializers.Serializer):
    """Serializer for batch signal execution"""
    signal_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1, max_length=20
    )


class MarketHoursSerializer(serializers.Serializer):
    """Serializer for market hours information"""
    is_market_open = serializers.BooleanField()
    current_time = serializers.DateTimeField()
    market_hours = serializers.DictField()
    next_session = serializers.DictField(allow_null=True)


class FuturesOptionsDataSerializer(serializers.ModelSerializer):
    """Serializer for F&O instrument data"""
    days_to_expiry = serializers.ReadOnlyField()
    is_weekly_expiry = serializers.ReadOnlyField()
    
    class Meta:
        model = FuturesOptionsData
        fields = [
            'id', 'symbol', 'underlying_symbol', 'instrument_type',
            'expiry_date', 'strike_price', 'option_type', 'lot_size',
            'tick_size', 'freeze_quantity', 'is_active', 'exchange',
            'days_to_expiry', 'is_weekly_expiry', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OptionChainSerializer(serializers.Serializer):
    """Serializer for options chain data"""
    underlying_symbol = serializers.CharField()
    underlying_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    expiry_date = serializers.DateField()
    call_options = serializers.ListField()
    put_options = serializers.ListField()
    strike_prices = serializers.ListField()


class FuturesChainSerializer(serializers.Serializer):
    """Serializer for futures chain data"""
    underlying_symbol = serializers.CharField()
    underlying_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    futures_contracts = serializers.ListField()


class MarginCalculatorSerializer(serializers.Serializer):
    """Serializer for margin calculation requests"""
    instrument_type = serializers.ChoiceField(choices=TradingSignal.InstrumentType.choices)
    symbol = serializers.CharField(max_length=100)
    transaction_type = serializers.ChoiceField(choices=['BUY', 'SELL'])
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    product_type = serializers.ChoiceField(choices=['INTRADAY', 'DELIVERY', 'CARRY_FORWARD'], default='INTRADAY')


class FOPositionSerializer(serializers.Serializer):
    """Serializer for F&O position data"""
    symbol = serializers.CharField()
    instrument_type = serializers.CharField()
    underlying_symbol = serializers.CharField()
    quantity = serializers.IntegerField()
    average_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    market_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    pnl = serializers.DecimalField(max_digits=12, decimal_places=2)
    pnl_percentage = serializers.FloatField()
    margin_used = serializers.DecimalField(max_digits=12, decimal_places=2)
    days_to_expiry = serializers.IntegerField()


class StrategyBuilderSerializer(serializers.Serializer):
    """Serializer for F&O strategy builder"""
    strategy_name = serializers.CharField(max_length=100)
    underlying_symbol = serializers.CharField(max_length=50)
    strategy_type = serializers.ChoiceField(choices=[
        'COVERED_CALL', 'PROTECTIVE_PUT', 'LONG_STRADDLE', 'SHORT_STRADDLE',
        'LONG_STRANGLE', 'SHORT_STRANGLE', 'BULL_CALL_SPREAD', 'BEAR_PUT_SPREAD',
        'IRON_CONDOR', 'BUTTERFLY'
    ])
    legs = serializers.ListField()
    max_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    max_loss = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    breakeven_points = serializers.ListField(read_only=True)


class TradingDashboardSerializer(serializers.Serializer):
    """Serializer for trading dashboard data"""
    statistics = serializers.DictField()
    recent_signals = TradingSignalSerializer(many=True)
    recent_orders = TradingOrderSerializer(many=True)
    fo_positions = FOPositionSerializer(many=True, required=False)