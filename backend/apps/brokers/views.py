import logging
import asyncio
from django.shortcuts import get_object_or_404
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.shortcuts import redirect
from django.utils import timezone

from .models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerAPILog
from .serializers import (
    BrokerAccountSerializer, BrokerAccountCreateSerializer, BrokerConnectionTestSerializer,
    BrokerOrderSerializer, BrokerPositionSerializer, BrokerAPILogSerializer,
    BrokerAccountSummarySerializer
)
from .services import BrokerService, BrokerWebhookService

logger = logging.getLogger(__name__)


class BrokerAccountViewSet(ModelViewSet):
    """ViewSet for broker account management"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BrokerAccountCreateSerializer
        return BrokerAccountSerializer
    
    def get_queryset(self):
        """Return broker accounts for current user"""
        return BrokerAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create broker account for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def sync_data(self, request, pk=None):
        """Sync account data from broker API"""
        broker_account = self.get_object()
        
        try:
            from asgiref.sync import async_to_sync
            # Use async_to_sync to properly handle the async call
            result = async_to_sync(BrokerService.sync_account_data)(broker_account)
            
            if result["success"]:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Account sync failed for {broker_account.id}: {str(e)}")
            return Response(
                {"error": f"Sync failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        """Sync account data from broker API"""
        broker_account = self.get_object()
        
        async def sync_account():
            return await BrokerService.sync_account_data(broker_account)
        
        try:
            result = asyncio.run(sync_account())
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Sync failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def place_order(self, request, pk=None):
        """Place order through broker"""
        broker_account = self.get_object()
        
        required_fields = ['symbol', 'transaction_type', 'order_type', 'quantity']
        missing_fields = [field for field in required_fields if field not in request.data]
        
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def place_order():
            return await BrokerService.place_order(broker_account, request.data)
        
        try:
            result = asyncio.run(place_order())
            if result['success']:
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Order placement failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def modify_order(self, request, pk=None):
        """Modify existing order"""
        broker_account = self.get_object()
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def modify_order():
            return await BrokerService.modify_order(broker_account, order_id, request.data)
        
        try:
            result = asyncio.run(modify_order())
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Order modification failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        """Cancel existing order"""
        broker_account = self.get_object()
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def cancel_order():
            return await BrokerService.cancel_order(broker_account, order_id)
        
        try:
            result = asyncio.run(cancel_order())
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Order cancellation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def get_quotes(self, request, pk=None):
        """Get real-time quotes"""
        broker_account = self.get_object()
        symbols = request.data.get('symbols', [])
        
        if not symbols:
            return Response(
                {'error': 'symbols list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def get_quotes():
            return await BrokerService.get_quotes(broker_account, symbols)
        
        try:
            result = asyncio.run(get_quotes())
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Quote fetch failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        """Get positions for broker account"""
        broker_account = self.get_object()
        positions = BrokerPosition.objects.filter(
            broker_account=broker_account,
            quantity__ne=0
        )
        serializer = BrokerPositionSerializer(positions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """Get orders for broker account"""
        broker_account = self.get_object()
        orders = BrokerOrder.objects.filter(broker_account=broker_account)
        
        # Filter by status if provided
        order_status = request.query_params.get('status')
        if order_status:
            orders = orders.filter(status=order_status)
        
        # Filter by date range if provided
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        if from_date and to_date:
            orders = orders.filter(
                placed_at__date__gte=from_date,
                placed_at__date__lte=to_date
            )
        
        orders = orders.order_by('-created_at')
        serializer = BrokerOrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def api_logs(self, request, pk=None):
        """Get API logs for broker account"""
        broker_account = self.get_object()
        logs = BrokerAPILog.objects.filter(broker_account=broker_account)
        
        # Filter by log level if provided
        level = request.query_params.get('level')
        if level:
            logs = logs.filter(level=level.upper())
        
        logs = logs.order_by('-created_at')[:100]  # Limit to last 100 logs
        serializer = BrokerAPILogSerializer(logs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_connection(request):
    """Test broker connection with credentials"""
    serializer = BrokerConnectionTestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    broker_type = serializer.validated_data['broker_type']
    credentials = serializer.validated_data['credentials']
    
    async def test_broker_connection():
        return await BrokerService.test_connection(broker_type, credentials)
    
    try:
        result = asyncio.run(test_broker_connection())
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Connection test failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get broker accounts dashboard data"""
    user = request.user
    accounts = BrokerAccount.objects.filter(user=user)
    
    dashboard_data = {
        'total_accounts': accounts.count(),
        'active_accounts': accounts.filter(status=BrokerAccount.Status.ACTIVE).count(),
        'total_balance': sum(float(acc.account_balance) for acc in accounts),
        'total_pnl': 0,  # Would calculate from positions
        'accounts': BrokerAccountSummarySerializer(accounts, many=True).data
    }
    
    # Calculate total P&L from positions
    total_pnl = 0
    for account in accounts:
        positions = BrokerPosition.objects.filter(
            broker_account=account,
            quantity__ne=0
        )
        account_pnl = sum(float(pos.unrealized_pnl) for pos in positions)
        total_pnl += account_pnl
    
    dashboard_data['total_pnl'] = total_pnl
    
    return Response(dashboard_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supported_brokers(request):
    """Get list of supported brokers"""
    brokers = [
        {
            'type': 'ZERODHA',
            'name': 'Zerodha',
            'logo': '/static/broker_logos/zerodha.png',
            'features': ['Trading', 'Portfolio', 'Market Data', 'Webhooks'],
            'required_credentials': ['api_key', 'api_secret']
        },
        {
            'type': 'UPSTOX',
            'name': 'Upstox',
            'logo': '/static/broker_logos/upstox.png',
            'features': ['Trading', 'Portfolio', 'Market Data'],
            'required_credentials': ['api_key', 'api_secret']
        },
        {
            'type': 'ALICE_BLUE',
            'name': 'Alice Blue',
            'logo': '/static/broker_logos/alice_blue.png',
            'features': ['Trading', 'Portfolio'],
            'required_credentials': ['user_id', 'api_key']
        },
        {
            'type': 'ANGEL_ONE',
            'name': 'Angel One',
            'logo': '/static/broker_logos/angel_one.png',
            'features': ['Trading', 'Portfolio'],
            'required_credentials': ['client_code', 'password', 'totp_secret']
        }
    ]
    
    return Response({'brokers': brokers}, status=status.HTTP_200_OK)


@api_view(['POST'])
def broker_webhook(request, broker_type, account_id):
    """Handle incoming webhooks from brokers"""
    try:
        broker_account = BrokerAccount.objects.get(
            id=account_id,
            broker_type=broker_type.upper()
        )
        
        event_type = request.data.get('event_type', 'UNKNOWN')
        event_data = request.data.get('data', {})
        
        BrokerWebhookService.process_webhook(broker_account, event_type, event_data)
        
        return Response({'status': 'success'}, status=status.HTTP_200_OK)
        
    except BrokerAccount.DoesNotExist:
        return Response(
            {'error': 'Broker account not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aggregated_portfolio(request):
    """Get aggregated portfolio across all broker accounts"""
    user = request.user
    accounts = BrokerAccount.objects.filter(user=user, status=BrokerAccount.Status.ACTIVE)
    
    portfolio_data = {
        'total_value': 0,
        'total_pnl': 0,
        'positions': [],
        'accounts_summary': []
    }
    
    for account in accounts:
        positions = BrokerPosition.objects.filter(
            broker_account=account,
            quantity__ne=0
        )
        
        account_value = sum(
            float(pos.last_price) * abs(pos.quantity) 
            for pos in positions
        )
        account_pnl = sum(float(pos.unrealized_pnl) for pos in positions)
        
        portfolio_data['total_value'] += account_value
        portfolio_data['total_pnl'] += account_pnl
        
        portfolio_data['accounts_summary'].append({
            'account_id': str(account.id),
            'broker_type': account.broker_type,
            'account_name': account.account_name,
            'value': account_value,
            'pnl': account_pnl,
            'positions_count': positions.count()
        })
        
        # Add positions to aggregated list
        for position in positions:
            portfolio_data['positions'].append({
                'symbol': position.symbol,
                'exchange': position.exchange,
                'quantity': position.quantity,
                'average_price': float(position.average_price),
                'last_price': float(position.last_price),
                'pnl': float(position.unrealized_pnl),
                'broker_account': account.account_name
            })
    
    return Response(portfolio_data, status=status.HTTP_200_OK)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def zerodha_login_url(request):
    """Get Zerodha OAuth login URL"""
    api_key = request.query_params.get('api_key')
    
    if not api_key:
        return Response(
            {'error': 'api_key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from kiteconnect import KiteConnect
        kite = KiteConnect(api_key=api_key)
        login_url = kite.login_url()
        
        return Response({
            'login_url': login_url,
            'message': 'Redirect user to this URL for authentication'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def zerodha_callback(request):
    """Handle Zerodha OAuth callback"""
    request_token = request.query_params.get('request_token')
    status_param = request.query_params.get('status')
    
    logger.info(f"=== Zerodha Callback Received ===")
    logger.info(f"request_token: {request_token}")
    logger.info(f"status: {status_param}")
    logger.info(f"Full URL: {request.build_absolute_uri()}")
    
    # Build frontend URL with token
    frontend_url = 'https://sharewise.chinmaytechnosoft.com/broker-integration'
    
    if status_param == 'error' or not request_token:
        error_url = f"{frontend_url}?error=authentication_failed"
        logger.warning(f"Redirecting to error: {error_url}")
        return redirect(error_url)
    
    success_url = f"{frontend_url}?request_token={request_token}&status=success"
    logger.info(f"Redirecting to success: {success_url}")
    return redirect(success_url)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_zerodha_setup(request):
    """Complete Zerodha broker setup with request token"""
    api_key = request.data.get('api_key')
    api_secret = request.data.get('api_secret')
    request_token = request.data.get('request_token')
    account_name = request.data.get('account_name', 'Zerodha Account')
    
    if not all([api_key, api_secret, request_token]):
        return Response(
            {'error': 'api_key, api_secret, and request_token are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from kiteconnect import KiteConnect
        
        # Generate session
        kite = KiteConnect(api_key=api_key)
        data = kite.generate_session(request_token, api_secret=api_secret)
        access_token = data["access_token"]
        user_id = data["user_id"]
        
        # Create broker account
        credentials = {
            'api_key': api_key,
            'api_secret': api_secret,
            'access_token': access_token,
            'user_id': user_id
        }
        
        broker_account = BrokerAccount.objects.create(
            user=request.user,
            broker_type='ZERODHA',
            account_name=account_name,
            broker_user_id=user_id,
            status=BrokerAccount.Status.ACTIVE
        )
        
        # Encrypt and store credentials
        broker_account.set_credentials(credentials)
        broker_account.save()
        
        # Sync initial data
        from asgiref.sync import async_to_sync
        try:
            async_to_sync(BrokerService.sync_account_data)(broker_account)
        except Exception as e:
            logger.warning(f"Initial sync failed: {str(e)}")
        
        serializer = BrokerAccountSerializer(broker_account)
        return Response({
            'success': True,
            'message': 'Zerodha account connected successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Zerodha setup failed: {str(e)}")
        return Response(
            {'error': f'Setup failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
