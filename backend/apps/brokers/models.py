import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import json
from cryptography.fernet import Fernet
from django.conf import settings

User = get_user_model()


class BrokerAccount(models.Model):
    class Status(models.TextChoices):
        CONNECTING = 'CONNECTING', 'Connecting'
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        ERROR = 'ERROR', 'Error'
        EXPIRED = 'EXPIRED', 'Expired'

    class BrokerType(models.TextChoices):
        ZERODHA = 'ZERODHA', 'Zerodha'
        UPSTOX = 'UPSTOX', 'Upstox'
        ALICE_BLUE = 'ALICE_BLUE', 'Alice Blue'
        ANGEL_ONE = 'ANGEL_ONE', 'Angel One'
        IIFL = 'IIFL', 'IIFL'
        KOTAK = 'KOTAK', 'Kotak Securities'
        HDFC = 'HDFC', 'HDFC Securities'
        ICICI = 'ICICI', 'ICICI Direct'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='broker_accounts')
    broker_type = models.CharField(max_length=20, choices=BrokerType.choices)
    account_name = models.CharField(max_length=100, help_text="User-defined name for this account")
    broker_user_id = models.CharField(max_length=100, help_text="Broker's user ID")
    
    # Encrypted credentials
    encrypted_credentials = models.TextField(help_text="Encrypted API credentials")
    
    # Connection status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONNECTING)
    last_connected_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(null=True, blank=True)
    
    # Account details
    account_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    available_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    margin_used = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Settings
    is_primary = models.BooleanField(default=False, help_text="Primary account for trading")
    auto_sync = models.BooleanField(default=True, help_text="Auto sync positions and orders")
    risk_limit_enabled = models.BooleanField(default=True)
    daily_loss_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    position_size_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_accounts'
        verbose_name = 'Broker Account'
        verbose_name_plural = 'Broker Accounts'
        unique_together = ['user', 'broker_type', 'broker_user_id']

    def __str__(self):
        return f"{self.user.username} - {self.broker_type} ({self.account_name})"

    def set_credentials(self, credentials_dict):
        """Encrypt and store broker credentials"""
        if not hasattr(settings, 'BROKER_ENCRYPTION_KEY'):
            raise ValueError("BROKER_ENCRYPTION_KEY not configured")
        
        key = settings.BROKER_ENCRYPTION_KEY.encode()
        f = Fernet(key)
        credentials_json = json.dumps(credentials_dict)
        self.encrypted_credentials = f.encrypt(credentials_json.encode()).decode()

    def get_credentials(self):
        """Decrypt and return broker credentials"""
        if not self.encrypted_credentials:
            return {}
        
        if not hasattr(settings, 'BROKER_ENCRYPTION_KEY'):
            raise ValueError("BROKER_ENCRYPTION_KEY not configured")
        
        try:
            key = settings.BROKER_ENCRYPTION_KEY.encode()
            f = Fernet(key)
            decrypted_data = f.decrypt(self.encrypted_credentials.encode())
            return json.loads(decrypted_data.decode())
        except Exception:
            return {}

    def update_account_info(self, balance_data):
        """Update account balance and margin information"""
        self.account_balance = balance_data.get('net', 0)
        self.available_balance = balance_data.get('available', 0)
        self.margin_used = balance_data.get('utilised', 0)
        self.last_connected_at = timezone.now()
        self.status = self.Status.ACTIVE
        self.save()


class BrokerSession(models.Model):
    """Track active broker sessions for reconnection"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broker_account = models.OneToOneField(BrokerAccount, on_delete=models.CASCADE, related_name='session')
    session_token = models.TextField(help_text="Encrypted session token")
    access_token = models.TextField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_sessions'

    def is_valid(self):
        """Check if session is still valid"""
        if not self.expires_at:
            return True
        return timezone.now() < self.expires_at


class BrokerOrder(models.Model):
    """Track orders placed through brokers"""
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PLACED = 'PLACED', 'Placed'
        COMPLETE = 'COMPLETE', 'Complete'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'
        MODIFIED = 'MODIFIED', 'Modified'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broker_account = models.ForeignKey(BrokerAccount, on_delete=models.CASCADE, related_name='orders')
    trading_order = models.OneToOneField('trading.TradingOrder', on_delete=models.CASCADE, null=True, blank=True)
    
    # Broker specific details
    broker_order_id = models.CharField(max_length=100, null=True, blank=True)
    platform_order_id = models.CharField(max_length=100, help_text="Our internal order ID")
    
    # Order details
    symbol = models.CharField(max_length=50)
    exchange = models.CharField(max_length=10, default='NSE')
    order_type = models.CharField(max_length=20)  # MARKET, LIMIT, SL, SL_M
    transaction_type = models.CharField(max_length=10)  # BUY, SELL
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    trigger_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Execution details
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    filled_quantity = models.PositiveIntegerField(default=0)
    average_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    placed_at = models.DateTimeField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_orders'
        verbose_name = 'Broker Order'
        verbose_name_plural = 'Broker Orders'

    def __str__(self):
        return f"{self.symbol} - {self.transaction_type} {self.quantity} @ {self.price or 'MKT'}"


class BrokerPosition(models.Model):
    """Track positions from broker accounts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broker_account = models.ForeignKey(BrokerAccount, on_delete=models.CASCADE, related_name='positions')
    
    symbol = models.CharField(max_length=50)
    exchange = models.CharField(max_length=10, default='NSE')
    product = models.CharField(max_length=10)  # CNC, MIS, NRML
    
    # Position details
    quantity = models.IntegerField(help_text="Net quantity (positive for long, negative for short)")
    average_price = models.DecimalField(max_digits=10, decimal_places=2)
    last_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # P&L calculations
    unrealized_pnl = models.DecimalField(max_digits=12, decimal_places=2)
    realized_pnl = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_positions'
        verbose_name = 'Broker Position'
        verbose_name_plural = 'Broker Positions'
        unique_together = ['broker_account', 'symbol', 'exchange', 'product']

    def __str__(self):
        return f"{self.symbol} - {self.quantity} @ {self.average_price}"


class BrokerWebhook(models.Model):
    """Store webhook events from brokers"""
    class EventType(models.TextChoices):
        ORDER_UPDATE = 'ORDER_UPDATE', 'Order Update'
        POSITION_UPDATE = 'POSITION_UPDATE', 'Position Update'
        BALANCE_UPDATE = 'BALANCE_UPDATE', 'Balance Update'
        CONNECTION_STATUS = 'CONNECTION_STATUS', 'Connection Status'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broker_account = models.ForeignKey(BrokerAccount, on_delete=models.CASCADE, related_name='webhooks')
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    event_data = models.JSONField()
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'broker_webhooks'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.broker_account.broker_type} - {self.event_type} - {self.created_at}"


class BrokerAPILog(models.Model):
    """Log all broker API calls for debugging and monitoring"""
    class LogLevel(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        ERROR = 'ERROR', 'Error'
        DEBUG = 'DEBUG', 'Debug'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    broker_account = models.ForeignKey(BrokerAccount, on_delete=models.CASCADE, related_name='api_logs')
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10)  # GET, POST, PUT, DELETE
    request_data = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    level = models.CharField(max_length=10, choices=LogLevel.choices, default=LogLevel.INFO)
    message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'broker_api_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['broker_account', '-created_at']),
            models.Index(fields=['level', '-created_at']),
        ]