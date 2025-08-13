from rest_framework import serializers
from .models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerWebhook, BrokerAPILog


class BrokerAccountSerializer(serializers.ModelSerializer):
    """Serializer for broker account information (without sensitive data)"""
    
    class Meta:
        model = BrokerAccount
        fields = [
            'id', 'broker_type', 'account_name', 'broker_user_id',
            'status', 'last_connected_at', 'account_balance', 
            'available_balance', 'margin_used', 'is_primary',
            'auto_sync', 'risk_limit_enabled', 'daily_loss_limit',
            'position_size_limit', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'last_connected_at', 'account_balance',
            'available_balance', 'margin_used', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        # Ensure only one primary account per user
        if data.get('is_primary'):
            user = self.context['request'].user
            existing_primary = BrokerAccount.objects.filter(
                user=user, is_primary=True
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing_primary.exists():
                raise serializers.ValidationError(
                    "Only one primary broker account is allowed per user."
                )
        
        return data


class BrokerAccountCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating broker accounts with credentials"""
    credentials = serializers.JSONField(write_only=True)
    
    class Meta:
        model = BrokerAccount
        fields = [
            'broker_type', 'account_name', 'broker_user_id',
            'credentials', 'is_primary', 'auto_sync',
            'risk_limit_enabled', 'daily_loss_limit', 'position_size_limit'
        ]

    def create(self, validated_data):
        credentials = validated_data.pop('credentials')
        user = self.context['request'].user
        
        broker_account = BrokerAccount.objects.create(
            user=user,
            **validated_data
        )
        
        # Encrypt and store credentials
        broker_account.set_credentials(credentials)
        broker_account.save()
        
        return broker_account

    def validate_credentials(self, value):
        """Validate credentials based on broker type"""
        broker_type = self.initial_data.get('broker_type')
        
        required_fields = {
            'ZERODHA': ['api_key', 'api_secret'],
            'UPSTOX': ['api_key', 'api_secret'],
            'ALICE_BLUE': ['user_id', 'api_key'],
            'ANGEL_ONE': ['client_code', 'password', 'totp_secret'],
            'IIFL': ['app_key', 'app_secret', 'user_id'],
            'KOTAK': ['consumer_key', 'consumer_secret', 'user_id'],
            'HDFC': ['api_key', 'api_secret'],
            'ICICI': ['api_key', 'api_secret']
        }
        
        if broker_type in required_fields:
            missing_fields = []
            for field in required_fields[broker_type]:
                if field not in value or not value[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                raise serializers.ValidationError(
                    f"Missing required fields for {broker_type}: {', '.join(missing_fields)}"
                )
        
        return value


class BrokerOrderSerializer(serializers.ModelSerializer):
    """Serializer for broker orders"""
    
    class Meta:
        model = BrokerOrder
        fields = [
            'id', 'broker_order_id', 'platform_order_id', 'symbol',
            'exchange', 'order_type', 'transaction_type', 'quantity',
            'price', 'trigger_price', 'status', 'filled_quantity',
            'average_price', 'placed_at', 'executed_at', 'cancelled_at',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'broker_order_id', 'status', 'filled_quantity',
            'average_price', 'placed_at', 'executed_at', 'cancelled_at',
            'error_message', 'created_at', 'updated_at'
        ]


class BrokerPositionSerializer(serializers.ModelSerializer):
    """Serializer for broker positions"""
    pnl_percentage = serializers.SerializerMethodField()
    market_value = serializers.SerializerMethodField()
    
    class Meta:
        model = BrokerPosition
        fields = [
            'id', 'symbol', 'exchange', 'product', 'quantity',
            'average_price', 'last_price', 'unrealized_pnl',
            'realized_pnl', 'pnl_percentage', 'market_value',
            'created_at', 'updated_at', 'last_synced_at'
        ]
        read_only_fields = [
            'id', 'unrealized_pnl', 'realized_pnl', 'created_at',
            'updated_at', 'last_synced_at'
        ]

    def get_pnl_percentage(self, obj):
        """Calculate P&L percentage"""
        if obj.average_price and obj.average_price != 0:
            return (obj.unrealized_pnl / (abs(obj.quantity) * obj.average_price)) * 100
        return 0

    def get_market_value(self, obj):
        """Calculate current market value"""
        return abs(obj.quantity) * obj.last_price


class BrokerWebhookSerializer(serializers.ModelSerializer):
    """Serializer for broker webhook events"""
    
    class Meta:
        model = BrokerWebhook
        fields = [
            'id', 'event_type', 'event_data', 'processed',
            'processed_at', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'processed', 'processed_at', 'created_at']


class BrokerAPILogSerializer(serializers.ModelSerializer):
    """Serializer for broker API logs"""
    
    class Meta:
        model = BrokerAPILog
        fields = [
            'id', 'endpoint', 'method', 'status_code',
            'response_time_ms', 'level', 'message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        """Hide sensitive request/response data in API responses"""
        data = super().to_representation(instance)
        # Only include request/response data for debug logs if user has permission
        request = self.context.get('request')
        if not (request and request.user.is_staff):
            data.pop('request_data', None)
            data.pop('response_data', None)
        return data


class BrokerConnectionTestSerializer(serializers.Serializer):
    """Serializer for testing broker connection"""
    broker_type = serializers.ChoiceField(choices=BrokerAccount.BrokerType.choices)
    credentials = serializers.JSONField()

    def validate_credentials(self, value):
        """Validate credentials format"""
        broker_type = self.initial_data.get('broker_type')
        
        required_fields = {
            'ZERODHA': ['api_key', 'api_secret'],
            'UPSTOX': ['api_key', 'api_secret'],
            'ALICE_BLUE': ['user_id', 'api_key'],
            'ANGEL_ONE': ['client_code', 'password', 'totp_secret'],
            'IIFL': ['app_key', 'app_secret', 'user_id'],
            'KOTAK': ['consumer_key', 'consumer_secret', 'user_id'],
            'HDFC': ['api_key', 'api_secret'],
            'ICICI': ['api_key', 'api_secret']
        }
        
        if broker_type in required_fields:
            missing_fields = []
            for field in required_fields[broker_type]:
                if field not in value or not value[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                raise serializers.ValidationError(
                    f"Missing required fields: {', '.join(missing_fields)}"
                )
        
        return value


class BrokerAccountSummarySerializer(serializers.ModelSerializer):
    """Summary serializer for broker account dashboard"""
    total_positions = serializers.SerializerMethodField()
    total_pnl = serializers.SerializerMethodField()
    open_orders = serializers.SerializerMethodField()
    
    class Meta:
        model = BrokerAccount
        fields = [
            'id', 'broker_type', 'account_name', 'status',
            'account_balance', 'available_balance', 'margin_used',
            'total_positions', 'total_pnl', 'open_orders',
            'last_connected_at'
        ]

    def get_total_positions(self, obj):
        """Get total number of positions"""
        return obj.positions.filter(quantity__ne=0).count()

    def get_total_pnl(self, obj):
        """Get total unrealized P&L"""
        positions = obj.positions.filter(quantity__ne=0)
        return sum(pos.unrealized_pnl for pos in positions)

    def get_open_orders(self, obj):
        """Get number of open orders"""
        return obj.orders.filter(
            status__in=[BrokerOrder.OrderStatus.PENDING, BrokerOrder.OrderStatus.PLACED]
        ).count()