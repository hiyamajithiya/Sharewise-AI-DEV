import asyncio
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from asgiref.sync import sync_to_async

from .models import (NSEAPIConfiguration, LiveMarketData, DataSubscription,
                     WebSocketConnection, MarketDataLog, MarketDataCache)
from .serializers import (NSEAPIConfigurationSerializer, NSEAPIConfigurationCreateSerializer,
                          LiveMarketDataSerializer, DataSubscriptionSerializer,
                          DataSubscriptionUpdateSerializer, WebSocketConnectionSerializer,
                          MarketDataLogSerializer, MarketQuoteSerializer,
                          OptionChainRequestSerializer, BulkQuoteRequestSerializer,
                          HistoricalDataRequestSerializer, MarketDataStatsSerializer)
from .services import get_market_data_service
from apps.users.models import CustomUser


class NSEAPIConfigurationViewSet(ModelViewSet):
    """ViewSet for NSE API Configuration - Super Admin only"""
    
    queryset = NSEAPIConfiguration.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NSEAPIConfigurationCreateSerializer
        return NSEAPIConfigurationSerializer
    
    def perform_create(self, serializer):
        """Create API configuration with current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test API connection"""
        config = self.get_object()
        
        async def test_api():
            try:
                from .services import NSEDataProvider
                provider = NSEDataProvider(config)
                
                # Test with a simple quote
                quote = await provider.get_quote('RELIANCE')
                
                if quote:
                    config.status = NSEAPIConfiguration.Status.ACTIVE
                    config.last_health_check = timezone.now()
                    config.error_message = ''
                else:
                    config.status = NSEAPIConfiguration.Status.ERROR
                    config.error_message = 'Failed to fetch test quote'
                
                await sync_to_async(config.save)()
                
                return quote is not None
                
            except Exception as e:
                config.status = NSEAPIConfiguration.Status.ERROR
                config.error_message = str(e)
                await sync_to_async(config.save)()
                return False
        
        try:
            success = asyncio.run(test_api())
            
            if success:
                return Response({
                    'status': 'success',
                    'message': 'API connection test successful'
                })
            else:
                return Response({
                    'status': 'error',
                    'message': config.error_message or 'Connection test failed'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """Set this configuration as primary"""
        config = self.get_object()
        
        # Deactivate other primary configs
        NSEAPIConfiguration.objects.exclude(pk=config.pk).update(is_primary=False)
        
        # Set this as primary
        config.is_primary = True
        config.save()
        
        return Response({
            'status': 'success',
            'message': 'Configuration set as primary'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get API usage statistics"""
        total_configs = NSEAPIConfiguration.objects.count()
        active_configs = NSEAPIConfiguration.objects.filter(
            status=NSEAPIConfiguration.Status.ACTIVE
        ).count()
        
        # Get primary config stats
        primary_config = NSEAPIConfiguration.get_primary_config()
        
        stats = {
            'total_configurations': total_configs,
            'active_configurations': active_configs,
            'has_primary': primary_config is not None,
            'primary_provider': primary_config.get_provider_display() if primary_config else None,
            'daily_api_calls': primary_config.daily_api_calls if primary_config else 0,
            'monthly_api_calls': primary_config.monthly_api_calls if primary_config else 0,
        }
        
        return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_live_quote(request, symbol):
    """Get live quote for a symbol"""
    
    async def fetch_quote():
        market_service = await get_market_data_service()
        return await market_service.get_live_quote(symbol.upper())
    
    try:
        quote_data = asyncio.run(fetch_quote())
        
        if quote_data:
            return Response({
                'status': 'success',
                'data': quote_data
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to fetch quote data'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error fetching quote: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_bulk_quotes(request):
    """Get quotes for multiple symbols"""
    serializer = BulkQuoteRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    symbols = serializer.validated_data['symbols']
    
    async def fetch_bulk_quotes():
        market_service = await get_market_data_service()
        quotes = {}
        
        # Fetch quotes concurrently
        tasks = []
        for symbol in symbols:
            tasks.append(market_service.get_live_quote(symbol))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            symbol = symbols[i]
            if isinstance(result, dict):
                quotes[symbol] = result
            else:
                quotes[symbol] = {'error': str(result)}
        
        return quotes
    
    try:
        quotes = asyncio.run(fetch_bulk_quotes())
        
        return Response({
            'status': 'success',
            'data': quotes
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error fetching bulk quotes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_option_chain(request, underlying):
    """Get options chain for an underlying"""
    expiry = request.query_params.get('expiry')
    
    async def fetch_option_chain():
        market_service = await get_market_data_service()
        return await market_service.get_option_chain(underlying.upper(), expiry)
    
    try:
        option_data = asyncio.run(fetch_option_chain())
        
        if option_data:
            return Response({
                'status': 'success',
                'data': option_data
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to fetch options chain'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Error fetching options chain: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataSubscriptionViewSet(ModelViewSet):
    """ViewSet for managing user data subscriptions"""
    
    serializer_class = DataSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return subscriptions for current user"""
        return DataSubscription.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return DataSubscriptionUpdateSerializer
        return DataSubscriptionSerializer
    
    def perform_create(self, serializer):
        """Create subscription for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_symbols(self, request, pk=None):
        """Add symbols to subscription"""
        subscription = self.get_object()
        symbols = request.data.get('symbols', [])
        
        if not isinstance(symbols, list):
            return Response({
                'error': 'symbols must be a list'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        added_symbols = []
        failed_symbols = []
        
        for symbol in symbols:
            if subscription.add_symbol(symbol.upper()):
                added_symbols.append(symbol.upper())
            else:
                failed_symbols.append(symbol.upper())
        
        return Response({
            'status': 'success',
            'added_symbols': added_symbols,
            'failed_symbols': failed_symbols,
            'total_symbols': len(subscription.symbols)
        })
    
    @action(detail=True, methods=['post'])
    def remove_symbols(self, request, pk=None):
        """Remove symbols from subscription"""
        subscription = self.get_object()
        symbols = request.data.get('symbols', [])
        
        if not isinstance(symbols, list):
            return Response({
                'error': 'symbols must be a list'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        removed_symbols = []
        not_found_symbols = []
        
        for symbol in symbols:
            if subscription.remove_symbol(symbol.upper()):
                removed_symbols.append(symbol.upper())
            else:
                not_found_symbols.append(symbol.upper())
        
        return Response({
            'status': 'success',
            'removed_symbols': removed_symbols,
            'not_found_symbols': not_found_symbols,
            'total_symbols': len(subscription.symbols)
        })
    
    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        """Get current user's subscription details"""
        try:
            subscription = DataSubscription.objects.get(user=request.user)
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except DataSubscription.DoesNotExist:
            return Response({
                'status': 'no_subscription',
                'message': 'No data subscription found'
            }, status=status.HTTP_404_NOT_FOUND)


class LiveMarketDataViewSet(ModelViewSet):
    """ViewSet for live market data"""
    
    serializer_class = LiveMarketDataSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']  # Read-only
    
    def get_queryset(self):
        """Return filtered market data"""
        queryset = LiveMarketData.objects.all()
        
        # Filter by symbol
        symbol = self.request.query_params.get('symbol')
        if symbol:
            queryset = queryset.filter(symbol__icontains=symbol)
        
        # Filter by instrument type
        instrument_type = self.request.query_params.get('instrument_type')
        if instrument_type:
            queryset = queryset.filter(instrument_type=instrument_type)
        
        # Filter by underlying (for F&O)
        underlying = self.request.query_params.get('underlying')
        if underlying:
            queryset = queryset.filter(underlying_symbol__icontains=underlying)
        
        return queryset.order_by('-timestamp')[:100]  # Limit results
    
    @action(detail=False, methods=['get'])
    def top_gainers(self, request):
        """Get top gainers"""
        gainers = LiveMarketData.objects.filter(
            instrument_type=LiveMarketData.InstrumentType.EQUITY,
            change__gt=0
        ).order_by('-change_percent')[:10]
        
        serializer = self.get_serializer(gainers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_losers(self, request):
        """Get top losers"""
        losers = LiveMarketData.objects.filter(
            instrument_type=LiveMarketData.InstrumentType.EQUITY,
            change__lt=0
        ).order_by('change_percent')[:10]
        
        serializer = self.get_serializer(losers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def most_active(self, request):
        """Get most active stocks by volume"""
        active = LiveMarketData.objects.filter(
            instrument_type=LiveMarketData.InstrumentType.EQUITY
        ).order_by('-volume')[:10]
        
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)


class WebSocketConnectionViewSet(ModelViewSet):
    """ViewSet for WebSocket connection management - Admin only"""
    
    serializer_class = WebSocketConnectionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ['get', 'delete']
    
    def get_queryset(self):
        """Return all WebSocket connections"""
        return WebSocketConnection.objects.all().order_by('-updated_at')
    
    @action(detail=False, methods=['get'])
    def active_connections(self, request):
        """Get active connections"""
        active = WebSocketConnection.objects.filter(
            status=WebSocketConnection.Status.CONNECTED
        )
        
        serializer = self.get_serializer(active, many=True)
        return Response({
            'count': active.count(),
            'connections': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def connection_stats(self, request):
        """Get connection statistics"""
        total_connections = WebSocketConnection.objects.count()
        active_connections = WebSocketConnection.objects.filter(
            status=WebSocketConnection.Status.CONNECTED
        ).count()
        
        # Group by status
        status_stats = WebSocketConnection.objects.values('status').annotate(
            count=Count('id')
        )
        
        return Response({
            'total_connections': total_connections,
            'active_connections': active_connections,
            'status_breakdown': list(status_stats)
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def market_data_dashboard(request):
    """Get market data dashboard statistics for admin"""
    
    # API call statistics
    today = timezone.now().date()
    primary_config = NSEAPIConfiguration.get_primary_config()
    
    # Connection statistics
    total_connections = WebSocketConnection.objects.count()
    active_connections = WebSocketConnection.objects.filter(
        status=WebSocketConnection.Status.CONNECTED
    ).count()
    
    # Subscription statistics
    subscription_stats = DataSubscription.objects.values('subscription_type').annotate(
        count=Count('id')
    )
    
    # Error statistics
    error_logs_today = MarketDataLog.objects.filter(
        level=MarketDataLog.LogLevel.ERROR,
        created_at__date=today
    ).count()
    
    # Cache statistics
    cached_symbols = MarketDataCache.objects.filter(
        expires_at__gt=timezone.now()
    ).count()
    
    # Top subscribed symbols
    all_subscriptions = DataSubscription.objects.filter(is_active=True)
    symbol_counts = {}
    for sub in all_subscriptions:
        for symbol in sub.symbols:
            symbol_counts[symbol] = symbol_counts.get(symbol, 0) + 1
    
    top_symbols = sorted(symbol_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    stats = {
        'api_stats': {
            'daily_calls': primary_config.daily_api_calls if primary_config else 0,
            'monthly_calls': primary_config.monthly_api_calls if primary_config else 0,
            'provider_status': primary_config.get_status_display() if primary_config else 'Not configured',
            'last_health_check': primary_config.last_health_check if primary_config else None
        },
        'connection_stats': {
            'total_connections': total_connections,
            'active_connections': active_connections,
            'error_logs_today': error_logs_today
        },
        'subscription_stats': list(subscription_stats),
        'cache_stats': {
            'cached_symbols': cached_symbols
        },
        'top_symbols': [{'symbol': symbol, 'subscribers': count} for symbol, count in top_symbols]
    }
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_to_symbols(request):
    """Subscribe to real-time data for symbols"""
    symbols = request.data.get('symbols', [])
    
    if not isinstance(symbols, list):
        return Response({
            'error': 'symbols must be a list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get or create user subscription
        subscription, created = DataSubscription.objects.get_or_create(
            user=request.user,
            defaults={
                'subscription_type': DataSubscription.SubscriptionType.BASIC,
                'max_symbols': 20
            }
        )
        
        # Add symbols
        added_symbols = []
        failed_symbols = []
        
        for symbol in symbols:
            symbol = symbol.upper().strip()
            if subscription.add_symbol(symbol):
                added_symbols.append(symbol)
            else:
                failed_symbols.append(symbol)
        
        return Response({
            'status': 'success',
            'added_symbols': added_symbols,
            'failed_symbols': failed_symbols,
            'subscription_type': subscription.get_subscription_type_display(),
            'total_symbols': len(subscription.symbols),
            'max_symbols': subscription.max_symbols
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_symbols(request):
    """Search for symbols"""
    query = request.query_params.get('q', '').strip()
    
    if len(query) < 2:
        return Response({
            'error': 'Query must be at least 2 characters'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # This would typically search a symbols database
    # For now, return mock data
    mock_results = [
        {'symbol': 'RELIANCE', 'name': 'Reliance Industries Ltd', 'exchange': 'NSE'},
        {'symbol': 'TCS', 'name': 'Tata Consultancy Services Ltd', 'exchange': 'NSE'},
        {'symbol': 'INFY', 'name': 'Infosys Ltd', 'exchange': 'NSE'},
        {'symbol': 'HDFC', 'name': 'HDFC Ltd', 'exchange': 'NSE'},
        {'symbol': 'HDFCBANK', 'name': 'HDFC Bank Ltd', 'exchange': 'NSE'},
    ]
    
    # Filter results based on query
    filtered_results = [
        result for result in mock_results
        if query.upper() in result['symbol'].upper() or query.upper() in result['name'].upper()
    ]
    
    return Response({
        'status': 'success',
        'query': query,
        'results': filtered_results[:10]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_market_status(request):
    """Get current market status"""
    import pytz
    
    # Indian market hours (9:15 AM to 3:30 PM IST)
    ist = pytz.timezone('Asia/Kolkata')
    now = timezone.now().astimezone(ist)
    
    # Check if it's a weekday
    is_weekday = now.weekday() < 5
    
    # Market hours
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    is_market_open = (
        is_weekday and 
        market_open <= now <= market_close
    )
    
    # Pre-market and post-market sessions
    pre_market_start = now.replace(hour=9, minute=0, second=0, microsecond=0)
    post_market_end = now.replace(hour=16, minute=0, second=0, microsecond=0)
    
    is_pre_market = is_weekday and pre_market_start <= now < market_open
    is_post_market = is_weekday and market_close < now <= post_market_end
    
    return Response({
        'is_market_open': is_market_open,
        'is_pre_market': is_pre_market,
        'is_post_market': is_post_market,
        'current_time': now.isoformat(),
        'market_open_time': market_open.isoformat() if is_weekday else None,
        'market_close_time': market_close.isoformat() if is_weekday else None,
        'next_market_open': market_open.isoformat() if not is_weekday else None,
        'timezone': 'Asia/Kolkata'
    })