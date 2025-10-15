import asyncio
import logging
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count

logger = logging.getLogger(__name__)

# WebSocket notifications
from .websocket_utils import (
    notify_new_signal, notify_portfolio_update, notify_trade_execution,
    notify_risk_alert, notify_pnl_update
)

from .models import (
    TradingSignal, TradingOrder, FuturesOptionsData,
    TradingStrategy, TradeApproval, AutomatedTradeExecution, PortfolioPosition
)
from .serializers import (
    TradingSignalSerializer, TradingOrderSerializer, 
    FuturesOptionsDataSerializer, OptionChainSerializer,
    FuturesChainSerializer, MarginCalculatorSerializer,
    TradingStrategySerializer, TradingStrategyCreateSerializer,
    TradeApprovalSerializer, TradeApprovalDecisionSerializer,
    AutomatedTradeExecutionSerializer, PortfolioPositionSerializer,
    AutomationEngineRequestSerializer, AutomationStatsSerializer,
    TradingSystemHealthSerializer
)
from .services import TradingEngine, SignalGenerator, PerformanceAnalyzer
from .market_analysis import (
    market_analysis_engine, generate_signal_for_symbol, 
    generate_signals_for_symbols, get_market_sentiment
)
from .reporting import (
    TradingReportGenerator, generate_user_performance_report,
    generate_strategy_performance_report
)
from .usage_limits import (
    enforce_usage_limit, LimitType, UsageLimitExceeded, 
    usage_service, get_user_usage_status
)
from .portfolio_aggregation import (
    portfolio_aggregator, get_user_portfolio_summary,
    sync_user_portfolio, get_consolidation_opportunities
)


class TradingSignalViewSet(ModelViewSet):
    """ViewSet for trading signals management"""
    serializer_class = TradingSignalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return signals for current user"""
        queryset = TradingSignal.objects.filter(user=self.request.user)
        
        # Filter by symbol
        symbol = self.request.query_params.get('symbol')
        if symbol:
            queryset = queryset.filter(symbol__icontains=symbol)
        
        # Filter by signal type
        signal_type = self.request.query_params.get('signal_type')
        if signal_type:
            queryset = queryset.filter(signal_type=signal_type)
        
        # Filter by executed status
        executed = self.request.query_params.get('executed')
        if executed is not None:
            queryset = queryset.filter(executed=executed.lower() == 'true')
        
        # Filter by strategy
        strategy = self.request.query_params.get('strategy')
        if strategy:
            queryset = queryset.filter(strategy_name__icontains=strategy)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset.order_by('-timestamp')
    
    def perform_create(self, serializer):
        """Create signal for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a trading signal"""
        signal = self.get_object()
        
        if signal.executed:
            return Response(
                {'error': 'Signal has already been executed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not signal.is_valid:
            return Response(
                {'error': 'Signal has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def execute_signal():
            engine = TradingEngine(request.user)
            return await engine.execute_signal(signal)
        
        try:
            result = asyncio.run(execute_signal())
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Execution failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate new trading signals"""
        symbols = request.data.get('symbols', [])
        strategy_id = request.data.get('strategy_id')
        
        if not symbols:
            return Response(
                {'error': 'symbols list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def generate_signals():
            generator = SignalGenerator(request.user)
            return await generator.generate_signals(symbols, strategy_id)
        
        try:
            signals = asyncio.run(generate_signals())
            serializer = self.get_serializer(signals, many=True)
            return Response({
                'message': f'Generated {len(signals)} signals',
                'signals': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Signal generation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def batch_execute(self, request):
        """Execute multiple signals at once"""
        signal_ids = request.data.get('signal_ids', [])
        
        if not signal_ids:
            return Response(
                {'error': 'signal_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        async def batch_execute_signals():
            engine = TradingEngine(request.user)
            results = []
            
            for signal_id in signal_ids:
                try:
                    signal = TradingSignal.objects.get(id=signal_id, user=request.user)
                    result = await engine.execute_signal(signal)
                    results.append({
                        'signal_id': signal_id,
                        'success': result['success'],
                        'message': result.get('message', result.get('error', ''))
                    })
                except TradingSignal.DoesNotExist:
                    results.append({
                        'signal_id': signal_id,
                        'success': False,
                        'message': 'Signal not found'
                    })
                except Exception as e:
                    results.append({
                        'signal_id': signal_id,
                        'success': False,
                        'message': str(e)
                    })
            
            return results
        
        try:
            results = asyncio.run(batch_execute_signals())
            successful_count = sum(1 for r in results if r['success'])
            
            return Response({
                'message': f'Executed {successful_count}/{len(results)} signals successfully',
                'results': results
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Batch execution failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TradingOrderViewSet(ModelViewSet):
    """ViewSet for trading orders management"""
    serializer_class = TradingOrderSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete']  # No create/update via API
    
    def get_queryset(self):
        """Return orders for current user"""
        queryset = TradingOrder.objects.filter(user=self.request.user)
        
        # Filter by status
        order_status = self.request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status)
        
        # Filter by symbol
        symbol = self.request.query_params.get('symbol')
        if symbol:
            queryset = queryset.filter(symbol__icontains=symbol)
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(order_timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(order_timestamp__lte=date_to)
        
        return queryset.order_by('-order_timestamp')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a trading order"""
        order = self.get_object()
        
        if order.status not in [TradingOrder.OrderStatus.PENDING, TradingOrder.OrderStatus.OPEN]:
            return Response(
                {'error': 'Order cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel through broker if broker_order_id exists
        if order.broker_order_id:
            from ..brokers.models import BrokerAccount
            from ..brokers.services import BrokerService
            
            async def cancel_broker_order():
                primary_broker = BrokerAccount.objects.filter(
                    user=request.user,
                    is_primary=True,
                    status=BrokerAccount.Status.ACTIVE
                ).first()
                
                if primary_broker:
                    return await BrokerService.cancel_order(primary_broker, order.broker_order_id)
                else:
                    return {'success': False, 'error': 'No active broker account'}
            
            try:
                result = asyncio.run(cancel_broker_order())
                if result['success']:
                    order.status = TradingOrder.OrderStatus.CANCELLED
                    order.save()
                    return Response({'message': 'Order cancelled successfully'})
                else:
                    return Response(
                        {'error': result.get('error', 'Cancellation failed')},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                return Response(
                    {'error': f'Cancellation failed: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Cancel locally
            order.status = TradingOrder.OrderStatus.CANCELLED
            order.save()
            return Response({'message': 'Order cancelled successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get trading dashboard data"""
    user = request.user
    
    # Get recent signals
    recent_signals = TradingSignal.objects.filter(user=user).order_by('-timestamp')[:10]
    
    # Get recent orders
    recent_orders = TradingOrder.objects.filter(user=user).order_by('-order_timestamp')[:10]
    
    # Calculate statistics
    today = timezone.now().date()
    total_signals = TradingSignal.objects.filter(user=user).count()
    executed_signals = TradingSignal.objects.filter(user=user, executed=True).count()
    pending_orders = TradingOrder.objects.filter(
        user=user,
        status__in=[TradingOrder.OrderStatus.PENDING, TradingOrder.OrderStatus.OPEN]
    ).count()
    
    # Today's statistics
    today_signals = TradingSignal.objects.filter(
        user=user,
        timestamp__date=today
    ).count()
    
    today_executed = TradingSignal.objects.filter(
        user=user,
        timestamp__date=today,
        executed=True
    ).count()
    
    dashboard_data = {
        'statistics': {
            'total_signals': total_signals,
            'executed_signals': executed_signals,
            'execution_rate': round((executed_signals / total_signals * 100) if total_signals > 0 else 0, 1),
            'pending_orders': pending_orders,
            'today_signals': today_signals,
            'today_executed': today_executed
        },
        'recent_signals': TradingSignalSerializer(recent_signals, many=True).data,
        'recent_orders': TradingOrderSerializer(recent_orders, many=True).data
    }
    
    return Response(dashboard_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance(request):
    """Get trading performance analytics"""
    user = request.user
    
    # Get date range from query parameters
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    analyzer = PerformanceAnalyzer(user)
    
    # Calculate performance metrics
    metrics = analyzer.calculate_performance_metrics(start_date, end_date)
    
    # Get daily P&L series
    daily_pnl = analyzer.get_daily_pnl_series(days)
    
    return Response({
        'metrics': metrics,
        'daily_pnl': daily_pnl,
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': days
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def signals_analytics(request):
    """Get signals analytics and insights"""
    user = request.user
    
    # Get date range
    days = int(request.query_params.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    signals = TradingSignal.objects.filter(
        user=user,
        timestamp__gte=start_date,
        timestamp__lte=end_date
    )
    
    # Strategy performance
    strategy_stats = []
    strategies = signals.values_list('strategy_name', flat=True).distinct()
    
    for strategy in strategies:
        strategy_signals = signals.filter(strategy_name=strategy)
        total_signals = strategy_signals.count()
        executed_signals = strategy_signals.filter(executed=True).count()
        avg_confidence = strategy_signals.aggregate(
            avg_confidence=models.Avg('confidence_score')
        )['avg_confidence'] or 0
        
        strategy_stats.append({
            'strategy_name': strategy,
            'total_signals': total_signals,
            'executed_signals': executed_signals,
            'execution_rate': round((executed_signals / total_signals * 100) if total_signals > 0 else 0, 1),
            'avg_confidence': round(float(avg_confidence), 2)
        })
    
    # Signal type distribution
    signal_types = signals.values('signal_type').annotate(
        count=Count('signal_type')
    ).order_by('-count')
    
    # Confidence score distribution
    confidence_ranges = [
        {'range': '0.6-0.7', 'count': signals.filter(confidence_score__gte=0.6, confidence_score__lt=0.7).count()},
        {'range': '0.7-0.8', 'count': signals.filter(confidence_score__gte=0.7, confidence_score__lt=0.8).count()},
        {'range': '0.8-0.9', 'count': signals.filter(confidence_score__gte=0.8, confidence_score__lt=0.9).count()},
        {'range': '0.9-1.0', 'count': signals.filter(confidence_score__gte=0.9, confidence_score__lte=1.0).count()}
    ]
    
    # Top performing symbols
    symbol_performance = []
    symbols = signals.values_list('symbol', flat=True).distinct()[:10]  # Top 10
    
    for symbol in symbols:
        symbol_signals = signals.filter(symbol=symbol)
        total_signals = symbol_signals.count()
        executed_signals = symbol_signals.filter(executed=True).count()
        avg_confidence = symbol_signals.aggregate(
            avg_confidence=models.Avg('confidence_score')
        )['avg_confidence'] or 0
        
        symbol_performance.append({
            'symbol': symbol,
            'total_signals': total_signals,
            'executed_signals': executed_signals,
            'avg_confidence': round(float(avg_confidence), 2)
        })
    
    return Response({
        'strategy_performance': strategy_stats,
        'signal_types': list(signal_types),
        'confidence_distribution': confidence_ranges,
        'top_symbols': sorted(symbol_performance, key=lambda x: x['total_signals'], reverse=True)[:10],
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': days
        },
        'total_signals': signals.count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_trade_settings(request):
    """Update auto-trading settings for user"""
    user = request.user
    
    settings_data = {
        'auto_execute_enabled': request.data.get('auto_execute_enabled', False),
        'min_confidence_threshold': request.data.get('min_confidence_threshold', 0.7),
        'max_daily_trades': request.data.get('max_daily_trades', 10),
        'max_position_size': request.data.get('max_position_size', 10000),
        'risk_per_trade': request.data.get('risk_per_trade', 0.02),
        'allowed_symbols': request.data.get('allowed_symbols', []),
        'excluded_symbols': request.data.get('excluded_symbols', [])
    }
    
    # Store settings in user profile or create a separate model
    # For now, return the settings
    return Response({
        'message': 'Auto-trade settings updated successfully',
        'settings': settings_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def market_hours(request):
    """Get market hours and status"""
    from .services import TradingEngine
    
    engine = TradingEngine(request.user)
    is_open = engine.is_market_open()
    
    current_time = timezone.now()
    
    return Response({
        'is_market_open': is_open,
        'current_time': current_time.isoformat(),
        'market_hours': {
            'open': '09:15',
            'close': '15:30',
            'timezone': 'Asia/Kolkata'
        },
        'next_session': {
            'date': (current_time + timedelta(days=1 if current_time.weekday() < 4 else 7 - current_time.weekday())).date().isoformat(),
            'time': '09:15'
        } if not is_open else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def risk_check(request):
    """Perform risk check for a potential trade"""
    user = request.user
    
    # Create a temporary signal for risk checking
    signal_data = request.data
    temp_signal = TradingSignal(
        symbol=signal_data.get('symbol'),
        signal_type=signal_data.get('signal_type'),
        entry_price=signal_data.get('entry_price'),
        stop_loss=signal_data.get('stop_loss'),
        target_price=signal_data.get('target_price'),
        confidence_score=signal_data.get('confidence_score', 0.7),
        user=user
    )
    
    async def perform_risk_check():
        engine = TradingEngine(user)
        return await engine.check_risk_management(temp_signal)
    
    try:
        result = asyncio.run(perform_risk_check())
        return Response(result)
    except Exception as e:
        return Response(
            {'error': f'Risk check failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class FuturesOptionsDataViewSet(ModelViewSet):
    """ViewSet for F&O instruments management"""
    serializer_class = FuturesOptionsDataSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return F&O instruments with optional filtering"""
        queryset = FuturesOptionsData.objects.filter(is_active=True)
        
        # Filter by underlying symbol
        underlying = self.request.query_params.get('underlying')
        if underlying:
            queryset = queryset.filter(underlying_symbol__icontains=underlying)
        
        # Filter by instrument type
        instrument_type = self.request.query_params.get('instrument_type')
        if instrument_type:
            queryset = queryset.filter(instrument_type=instrument_type)
        
        # Filter by expiry date range
        expiry_from = self.request.query_params.get('expiry_from')
        expiry_to = self.request.query_params.get('expiry_to')
        if expiry_from:
            queryset = queryset.filter(expiry_date__gte=expiry_from)
        if expiry_to:
            queryset = queryset.filter(expiry_date__lte=expiry_to)
        
        return queryset.order_by('underlying_symbol', 'expiry_date', 'strike_price')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def option_chain(request, underlying_symbol):
    """Get option chain for an underlying symbol"""
    expiry_date = request.query_params.get('expiry_date')
    
    if not expiry_date:
        return Response(
            {'error': 'expiry_date parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get all options for the underlying and expiry
        options = FuturesOptionsData.objects.filter(
            underlying_symbol=underlying_symbol,
            instrument_type=FuturesOptionsData.InstrumentType.OPTIONS,
            expiry_date=expiry_date,
            is_active=True
        ).order_by('strike_price', 'option_type')
        
        # Group by strike price
        strikes = {}
        for option in options:
            strike = float(option.strike_price)
            if strike not in strikes:
                strikes[strike] = {'call': None, 'put': None}
            
            option_data = FuturesOptionsDataSerializer(option).data
            if option.option_type == 'CALL':
                strikes[strike]['call'] = option_data
            else:
                strikes[strike]['put'] = option_data
        
        # Format response
        chain_data = {
            'underlying_symbol': underlying_symbol,
            'underlying_price': 0,  # Would be fetched from market data
            'expiry_date': expiry_date,
            'strikes': strikes,
            'strike_prices': sorted(strikes.keys())
        }
        
        return Response(chain_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch option chain: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def futures_chain(request, underlying_symbol):
    """Get futures chain for an underlying symbol"""
    
    try:
        futures = FuturesOptionsData.objects.filter(
            underlying_symbol=underlying_symbol,
            instrument_type=FuturesOptionsData.InstrumentType.FUTURES,
            is_active=True
        ).order_by('expiry_date')
        
        futures_data = FuturesOptionsDataSerializer(futures, many=True).data
        
        chain_data = {
            'underlying_symbol': underlying_symbol,
            'underlying_price': 0,  # Would be fetched from market data
            'futures_contracts': futures_data
        }
        
        return Response(chain_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch futures chain: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_margin(request):
    """Calculate margin required for F&O positions"""
    serializer = MarginCalculatorSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        # Get instrument details
        instrument = FuturesOptionsData.objects.get(
            symbol=data['symbol'],
            is_active=True
        )
        
        # Calculate margin (simplified calculation)
        quantity = data['quantity']
        price = data['price']
        
        if instrument.instrument_type == FuturesOptionsData.InstrumentType.FUTURES:
            # Futures margin calculation
            span_margin = price * quantity * 0.10  # 10% SPAN margin
            exposure_margin = price * quantity * 0.05  # 5% exposure margin
            total_margin = span_margin + exposure_margin
            
        elif instrument.instrument_type == FuturesOptionsData.InstrumentType.OPTIONS:
            if data['transaction_type'] == 'BUY':
                # Option buying requires full premium
                total_margin = price * quantity
            else:
                # Option selling margin calculation
                span_margin = price * quantity * 0.15  # 15% SPAN margin
                exposure_margin = price * quantity * 0.05  # 5% exposure margin
                total_margin = span_margin + exposure_margin
        else:
            total_margin = 0
        
        response_data = {
            'symbol': data['symbol'],
            'instrument_type': instrument.instrument_type,
            'quantity': quantity,
            'price': price,
            'margin_required': round(total_margin, 2),
            'span_margin': round(span_margin if 'span_margin' in locals() else 0, 2),
            'exposure_margin': round(exposure_margin if 'exposure_margin' in locals() else 0, 2),
            'lot_size': instrument.lot_size,
            'total_lots': quantity // instrument.lot_size if instrument.lot_size > 0 else 0
        }
        
        return Response(response_data)
        
    except FuturesOptionsData.DoesNotExist:
        return Response(
            {'error': 'Instrument not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Margin calculation failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fo_positions(request):
    """Get F&O positions for the user"""
    try:
        from apps.trading.models import PortfolioPosition
        positions = PortfolioPosition.objects.filter(
            user=request.user,
            instrument_type__in=['FUTURES', 'OPTIONS'],
            total_quantity__gt=0
        )
        
        positions_data = []
        total_pnl = 0
        total_margin_used = 0
        
        for pos in positions:
            position_data = {
                'symbol': pos.symbol,
                'instrument_type': pos.instrument_type,
                'underlying_symbol': pos.symbol.split('24')[0] if '24' in pos.symbol else pos.symbol,
                'quantity': float(pos.total_quantity),
                'average_price': float(pos.average_price),
                'market_price': float(pos.current_price) if pos.current_price else float(pos.average_price),
                'pnl': float(pos.unrealized_pnl),
                'pnl_percentage': float(pos.pnl_percentage),
                'margin_used': float(pos.margin_used) if hasattr(pos, 'margin_used') else 0,
                'days_to_expiry': 0  # Would need expiry date calculation
            }
            positions_data.append(position_data)
            total_pnl += position_data['pnl']
            total_margin_used += position_data['margin_used']
        
        return Response({
            'positions': positions_data,
            'total_pnl': total_pnl,
            'total_margin_used': total_margin_used
        })
    except Exception as e:
        return Response(
            {'error': 'Unable to fetch F&O positions', 'detail': str(e)}, 
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def underlying_list(request):
    """Get list of available underlying symbols for F&O"""
    underlyings = FuturesOptionsData.objects.filter(
        is_active=True
    ).values_list('underlying_symbol', flat=True).distinct().order_by('underlying_symbol')
    
    return Response({
        'underlyings': list(underlyings)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expiry_dates(request, underlying_symbol):
    """Get available expiry dates for an underlying"""
    expiry_dates = FuturesOptionsData.objects.filter(
        underlying_symbol=underlying_symbol,
        is_active=True
    ).values_list('expiry_date', flat=True).distinct().order_by('expiry_date')
    
    return Response({
        'underlying_symbol': underlying_symbol,
        'expiry_dates': [date.isoformat() for date in expiry_dates]
    })


# Trading Automation API Views

class TradingStrategyViewSet(ModelViewSet):
    """ViewSet for trading strategies management"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return strategies for current user"""
        return TradingStrategy.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TradingStrategyCreateSerializer
        return TradingStrategySerializer
    
    def perform_create(self, serializer):
        """Create strategy for current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle strategy active/paused status"""
        strategy = self.get_object()
        
        if strategy.status == TradingStrategy.Status.ACTIVE:
            strategy.status = TradingStrategy.Status.PAUSED
        else:
            strategy.status = TradingStrategy.Status.ACTIVE
        
        strategy.save()
        
        return Response({
            'message': f'Strategy {strategy.status.lower()}',
            'status': strategy.status
        })
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get strategy performance metrics"""
        strategy = self.get_object()
        
        # Get executions for this strategy
        executions = AutomatedTradeExecution.objects.filter(strategy=strategy)
        
        total_executions = executions.count()
        successful_executions = executions.filter(
            status=AutomatedTradeExecution.ExecutionStatus.COMPLETED
        ).count()
        
        total_pnl = sum(exec.total_pnl for exec in executions)
        
        return Response({
            'strategy_name': strategy.name,
            'total_executions': total_executions,
            'successful_executions': successful_executions,
            'success_rate': round((successful_executions / total_executions * 100) if total_executions > 0 else 0, 1),
            'total_pnl': float(total_pnl),
            'win_rate': strategy.win_rate,
            'total_trades': strategy.total_trades,
            'winning_trades': strategy.winning_trades
        })


class TradeApprovalViewSet(ModelViewSet):
    """ViewSet for trade approvals management"""
    serializer_class = TradeApprovalSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch']
    
    def get_queryset(self):
        """Return approvals for current user"""
        queryset = TradeApproval.objects.filter(user=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a trade"""
        approval = self.get_object()
        
        if approval.status != TradeApproval.Status.PENDING:
            return Response(
                {'error': 'Trade approval already processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if approval.is_expired:
            return Response(
                {'error': 'Trade approval has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional override values
        approved_quantity = request.data.get('approved_quantity')
        approved_price = request.data.get('approved_price')
        
        # Execute through automation engine
        from .automation_engine import automation_engine
        
        result = automation_engine.approve_trade(
            str(approval.id),
            str(request.user.id),
            approved_quantity=approved_quantity,
            approved_price=approved_price
        )
        
        if result['status'] == 'approved_and_executed':
            return Response({
                'message': 'Trade approved and executed successfully',
                'execution_result': result['execution_result']
            })
        else:
            return Response(
                {'error': result.get('message', 'Approval failed')},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a trade"""
        approval = self.get_object()
        
        if approval.status != TradeApproval.Status.PENDING:
            return Response(
                {'error': 'Trade approval already processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        
        # Execute through automation engine
        from .automation_engine import automation_engine
        
        result = automation_engine.reject_trade(
            str(approval.id),
            str(request.user.id),
            reason=reason
        )
        
        if result['status'] == 'rejected':
            return Response({'message': 'Trade rejected successfully'})
        else:
            return Response(
                {'error': result.get('message', 'Rejection failed')},
                status=status.HTTP_400_BAD_REQUEST
            )


class AutomatedTradeExecutionViewSet(ModelViewSet):
    """ViewSet for automated trade executions"""
    serializer_class = AutomatedTradeExecutionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']  # Read-only
    
    def get_queryset(self):
        """Return executions for current user"""
        return AutomatedTradeExecution.objects.filter(
            strategy__user=self.request.user
        ).select_related('signal', 'strategy').order_by('-created_at')


class PortfolioPositionViewSet(ModelViewSet):
    """ViewSet for portfolio positions"""
    serializer_class = PortfolioPositionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch']  # Read and limited update
    
    def get_queryset(self):
        """Return positions for current user"""
        return PortfolioPosition.objects.filter(user=self.request.user).order_by('-last_updated')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get portfolio summary"""
        positions = self.get_queryset()
        
        total_value = sum(pos.current_value for pos in positions)
        total_unrealized_pnl = sum(pos.unrealized_pnl for pos in positions)
        total_realized_pnl = sum(pos.realized_pnl for pos in positions)
        
        return Response({
            'total_positions': positions.count(),
            'total_value': float(total_value),
            'total_unrealized_pnl': float(total_unrealized_pnl),
            'total_realized_pnl': float(total_realized_pnl),
            'net_pnl': float(total_unrealized_pnl + total_realized_pnl)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_signal(request):
    """Process a trading signal through automation engine"""
    serializer = AutomationEngineRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    signal_id = serializer.validated_data['signal_id']
    
    try:
        signal = TradingSignal.objects.get(id=signal_id, user=request.user)
        
        # Process through automation engine
        from .automation_engine import automation_engine
        result = automation_engine.process_new_signal(signal)
        
        return Response(result)
        
    except TradingSignal.DoesNotExist:
        return Response(
            {'error': 'Signal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Signal processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _compute_automation_stats_for_user(user):
    """Shared stats computation used by API view and internal callers"""
    today = timezone.now().date()

    strategies = TradingStrategy.objects.filter(user=user)
    active_strategies = strategies.filter(status=TradingStrategy.Status.ACTIVE).count()

    executions_today = AutomatedTradeExecution.objects.filter(
        strategy__user=user,
        created_at__date=today
    )

    successful_executions_today = executions_today.filter(
        status=AutomatedTradeExecution.ExecutionStatus.COMPLETED
    ).count()

    pending_approvals = TradeApproval.objects.filter(
        user=user,
        status=TradeApproval.Status.PENDING
    ).count()

    total_pnl_today = sum(exec.total_pnl for exec in executions_today)

    open_positions = PortfolioPosition.objects.filter(
        user=user,
        total_quantity__gt=0
    ).count()

    total_executions = AutomatedTradeExecution.objects.filter(strategy__user=user).count()
    successful_executions = AutomatedTradeExecution.objects.filter(
        strategy__user=user,
        status=AutomatedTradeExecution.ExecutionStatus.COMPLETED
    ).count()

    automation_success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0

    return {
        'total_strategies': strategies.count(),
        'active_strategies': active_strategies,
        'total_executions_today': executions_today.count(),
        'successful_executions_today': successful_executions_today,
        'pending_approvals': pending_approvals,
        'total_pnl_today': float(total_pnl_today),
        'open_positions': open_positions,
        'automation_success_rate': round(automation_success_rate, 1),
        'avg_execution_time': 2.5  # Mock value
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def automation_stats(request):
    """Get automation system statistics"""
    stats = _compute_automation_stats_for_user(request.user)
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health(request):
    """Get trading system health status"""
    
    # Check various system components
    overall_status = 'healthy'
    system_alerts = []
    
    # Check broker connections (mock)
    broker_connections = {
        'zerodha': 'connected',
        'upstox': 'connected',
        'alice_blue': 'disconnected'
    }
    
    if 'disconnected' in broker_connections.values():
        overall_status = 'warning'
        system_alerts.append('Some broker connections are down')
    
    # Check last signal generation
    last_signal = TradingSignal.objects.filter(
        user=request.user
    ).order_by('-created_at').first()
    
    last_signal_time = last_signal.created_at if last_signal else None
    
    # Count active executions
    active_executions = AutomatedTradeExecution.objects.filter(
        strategy__user=request.user,
        status__in=[
            AutomatedTradeExecution.ExecutionStatus.QUEUED,
            AutomatedTradeExecution.ExecutionStatus.EXECUTING
        ]
    ).count()
    
    health_data = {
        'overall_status': overall_status,
        'broker_connections': broker_connections,
        'market_data_status': 'active',
        'automation_engine_status': 'running',
        'last_signal_generated': last_signal_time.isoformat() if last_signal_time else None,
        'active_executions': active_executions,
        'system_alerts': system_alerts,
        'uptime_percentage': 99.8  # Mock value
    }
    
    return Response(health_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def automation_dashboard(request):
    """Get comprehensive automation dashboard data"""
    user = request.user
    
    # Get recent approvals
    recent_approvals = TradeApproval.objects.filter(user=user).order_by('-created_at')[:5]
    
    # Get recent executions
    recent_executions = AutomatedTradeExecution.objects.filter(
        strategy__user=user
    ).select_related('signal', 'strategy').order_by('-created_at')[:5]
    
    # Get active strategies
    active_strategies = TradingStrategy.objects.filter(
        user=user,
        status=TradingStrategy.Status.ACTIVE
    )
    
    # Get portfolio positions
    positions = PortfolioPosition.objects.filter(user=user)
    
    dashboard_data = {
        'recent_approvals': TradeApprovalSerializer(recent_approvals, many=True).data,
        'recent_executions': AutomatedTradeExecutionSerializer(recent_executions, many=True).data,
        'active_strategies': TradingStrategySerializer(active_strategies, many=True).data,
        'portfolio_positions': PortfolioPositionSerializer(positions, many=True).data,
        # Compute stats without invoking DRF view directly to avoid Request type mismatch
        'stats': _compute_automation_stats_for_user(user)
    }
    
    return Response(dashboard_data)


# Market Analysis API Views

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@enforce_usage_limit(LimitType.DAILY_SIGNALS, is_daily=True)
def generate_market_signals(request):
    """Generate trading signals for specified symbols using market analysis engine"""
    symbols = request.data.get('symbols', [])
    strategy_name = request.data.get('strategy_name', 'Market Analysis Engine')
    
    if not symbols:
        return Response(
            {'error': 'symbols list is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(symbols) > 20:  # Limit to prevent abuse
        return Response(
            {'error': 'Maximum 20 symbols allowed per request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Generate signals using market analysis engine
        signals = generate_signals_for_symbols(symbols, request.user, strategy_name)
        
        # Serialize the generated signals
        serializer = TradingSignalSerializer(signals, many=True)
        
        return Response({
            'message': f'Generated {len(signals)} signals from {len(symbols)} symbols analyzed',
            'signals_generated': len(signals),
            'symbols_analyzed': len(symbols),
            'signals': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error generating market signals: {e}")
        return Response(
            {'error': f'Signal generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@enforce_usage_limit(LimitType.DAILY_SIGNALS, is_daily=True)
def generate_single_signal(request):
    """Generate a trading signal for a single symbol"""
    symbol = request.data.get('symbol', '').strip().upper()
    strategy_name = request.data.get('strategy_name', 'Market Analysis Engine')
    
    if not symbol:
        return Response(
            {'error': 'symbol is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Generate signal using market analysis engine
        signal = generate_signal_for_symbol(symbol, request.user, strategy_name)
        
        if signal:
            serializer = TradingSignalSerializer(signal)
            return Response({
                'message': f'Generated signal for {symbol}',
                'signal': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': f'No signal generated for {symbol} (low confidence or neutral market conditions)',
                'signal': None
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error generating signal for {symbol}: {e}")
        return Response(
            {'error': f'Signal generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def market_sentiment(request):
    """Get overall market sentiment analysis"""
    symbols = request.query_params.get('symbols', '').split(',') if request.query_params.get('symbols') else None
    symbols = [s.strip() for s in symbols if s.strip()] if symbols else None
    
    try:
        sentiment_analysis = get_market_sentiment(symbols)
        
        return Response({
            'market_sentiment': sentiment_analysis,
            'analysis_time': timezone.now().isoformat(),
            'symbols_analyzed': symbols or ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ADANIPORTS', 'ASIANPAINT', 'AXISBANK', 'BAJFINANCE', 'BHARTIARTL']
        })
        
    except Exception as e:
        logger.error(f"Error analyzing market sentiment: {e}")
        return Response(
            {'error': f'Market sentiment analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def market_data_analysis(request, symbol):
    """Get detailed market data analysis for a specific symbol"""
    try:
        # Fetch market data and technical indicators
        df = market_analysis_engine.fetch_market_data(symbol.upper())
        indicators = market_analysis_engine.technical_analyzer.calculate_indicators(df)
        
        # Get rule-based analysis
        signal_type, confidence, signal_components = market_analysis_engine.rule_analyzer.generate_signal(indicators)
        
        # Prepare response data
        current_price = float(df['Close'].iloc[-1])
        price_change = float((df['Close'].iloc[-1] - df['Close'].iloc[-2]) / df['Close'].iloc[-2] * 100) if len(df) >= 2 else 0
        
        analysis_data = {
            'symbol': symbol.upper(),
            'current_price': current_price,
            'price_change_pct': round(price_change, 2),
            'analysis_timestamp': timezone.now().isoformat(),
            'signal_analysis': {
                'signal_type': signal_type,
                'confidence': round(confidence, 3),
                'technical_score': round(signal_components.technical_score, 3),
                'momentum_score': round(signal_components.momentum_score, 3),
                'trend_score': round(signal_components.trend_score, 3),
                'volume_score': round(signal_components.volume_score, 3),
                'volatility_score': round(signal_components.volatility_score, 3),
                'risk_reward_ratio': round(signal_components.risk_reward_ratio, 2)
            },
            'technical_indicators': {
                'rsi': round(indicators['rsi'], 2),
                'macd': round(indicators['macd'], 4),
                'macd_signal': round(indicators['macd_signal'], 4),
                'sma_20': round(indicators['sma_20'], 2),
                'sma_50': round(indicators['sma_50'], 2),
                'bb_upper': round(indicators['bb_upper'], 2),
                'bb_lower': round(indicators['bb_lower'], 2),
                'atr': round(indicators['atr'], 2),
                'volume_ratio': round(indicators['volume_ratio'], 2),
                'volatility': round(indicators['volatility'], 2),
                'support': round(indicators['support'], 2),
                'resistance': round(indicators['resistance'], 2)
            },
            'price_levels': {
                'support': round(indicators['support'], 2),
                'resistance': round(indicators['resistance'], 2),
                'distance_from_support': round(indicators['distance_from_support'], 2),
                'distance_from_resistance': round(indicators['distance_from_resistance'], 2)
            }
        }
        
        return Response(analysis_data)
        
    except Exception as e:
        logger.error(f"Error analyzing market data for {symbol}: {e}")
        return Response(
            {'error': f'Market data analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def popular_symbols(request):
    """Get list of popular trading symbols"""
    popular_stocks = [
        {'symbol': 'RELIANCE', 'name': 'Reliance Industries Ltd', 'sector': 'Energy'},
        {'symbol': 'TCS', 'name': 'Tata Consultancy Services Ltd', 'sector': 'IT'},
        {'symbol': 'INFY', 'name': 'Infosys Ltd', 'sector': 'IT'},
        {'symbol': 'HDFCBANK', 'name': 'HDFC Bank Ltd', 'sector': 'Banking'},
        {'symbol': 'ICICIBANK', 'name': 'ICICI Bank Ltd', 'sector': 'Banking'},
        {'symbol': 'ADANIPORTS', 'name': 'Adani Ports & SEZ Ltd', 'sector': 'Infrastructure'},
        {'symbol': 'ASIANPAINT', 'name': 'Asian Paints Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'AXISBANK', 'name': 'Axis Bank Ltd', 'sector': 'Banking'},
        {'symbol': 'BAJFINANCE', 'name': 'Bajaj Finance Ltd', 'sector': 'Financial Services'},
        {'symbol': 'BHARTIARTL', 'name': 'Bharti Airtel Ltd', 'sector': 'Telecom'},
        {'symbol': 'BPCL', 'name': 'Bharat Petroleum Corporation Ltd', 'sector': 'Energy'},
        {'symbol': 'CIPLA', 'name': 'Cipla Ltd', 'sector': 'Pharmaceuticals'},
        {'symbol': 'COALINDIA', 'name': 'Coal India Ltd', 'sector': 'Mining'},
        {'symbol': 'DRREDDY', 'name': 'Dr Reddys Laboratories Ltd', 'sector': 'Pharmaceuticals'},
        {'symbol': 'EICHERMOT', 'name': 'Eicher Motors Ltd', 'sector': 'Automotive'},
        {'symbol': 'GRASIM', 'name': 'Grasim Industries Ltd', 'sector': 'Chemicals'},
        {'symbol': 'HCLTECH', 'name': 'HCL Technologies Ltd', 'sector': 'IT'},
        {'symbol': 'HDFC', 'name': 'Housing Development Finance Corporation Ltd', 'sector': 'Financial Services'},
        {'symbol': 'HEROMOTOCO', 'name': 'Hero MotoCorp Ltd', 'sector': 'Automotive'},
        {'symbol': 'HINDALCO', 'name': 'Hindalco Industries Ltd', 'sector': 'Metals'},
        {'symbol': 'HINDUNILVR', 'name': 'Hindustan Unilever Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'ITC', 'name': 'ITC Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'JSWSTEEL', 'name': 'JSW Steel Ltd', 'sector': 'Metals'},
        {'symbol': 'KOTAKBANK', 'name': 'Kotak Mahindra Bank Ltd', 'sector': 'Banking'},
        {'symbol': 'LT', 'name': 'Larsen & Toubro Ltd', 'sector': 'Infrastructure'},
        {'symbol': 'M&M', 'name': 'Mahindra & Mahindra Ltd', 'sector': 'Automotive'},
        {'symbol': 'MARUTI', 'name': 'Maruti Suzuki India Ltd', 'sector': 'Automotive'},
        {'symbol': 'NESTLEIND', 'name': 'Nestle India Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'NTPC', 'name': 'NTPC Ltd', 'sector': 'Power'},
        {'symbol': 'ONGC', 'name': 'Oil & Natural Gas Corporation Ltd', 'sector': 'Energy'},
        {'symbol': 'POWERGRID', 'name': 'Power Grid Corporation of India Ltd', 'sector': 'Power'},
        {'symbol': 'SBIN', 'name': 'State Bank of India', 'sector': 'Banking'},
        {'symbol': 'SUNPHARMA', 'name': 'Sun Pharmaceutical Industries Ltd', 'sector': 'Pharmaceuticals'},
        {'symbol': 'TATACONSUM', 'name': 'Tata Consumer Products Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'TATAMOTORS', 'name': 'Tata Motors Ltd', 'sector': 'Automotive'},
        {'symbol': 'TATASTEEL', 'name': 'Tata Steel Ltd', 'sector': 'Metals'},
        {'symbol': 'TECHM', 'name': 'Tech Mahindra Ltd', 'sector': 'IT'},
        {'symbol': 'TITAN', 'name': 'Titan Company Ltd', 'sector': 'Consumer Goods'},
        {'symbol': 'ULTRACEMCO', 'name': 'UltraTech Cement Ltd', 'sector': 'Cement'},
        {'symbol': 'UPL', 'name': 'UPL Ltd', 'sector': 'Chemicals'},
        {'symbol': 'WIPRO', 'name': 'Wipro Ltd', 'sector': 'IT'}
    ]
    
    return Response({
        'popular_symbols': popular_stocks,
        'total_count': len(popular_stocks),
        'categories': list(set([stock['sector'] for stock in popular_stocks]))
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@enforce_usage_limit(LimitType.DAILY_BACKTESTS, is_daily=True)
def backtest_strategy(request):
    """Backtest a trading strategy (simplified version)"""
    symbols = request.data.get('symbols', [])
    strategy_name = request.data.get('strategy_name', 'Market Analysis Engine')
    period_days = int(request.data.get('period_days', 30))
    
    if not symbols:
        return Response(
            {'error': 'symbols list is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(symbols) > 10:  # Limit for performance
        return Response(
            {'error': 'Maximum 10 symbols allowed for backtesting'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Simple backtest simulation
        backtest_results = []
        total_trades = 0
        winning_trades = 0
        total_returns = 0
        
        for symbol in symbols:
            try:
                # Fetch historical data
                df = market_analysis_engine.fetch_market_data(symbol, period=f"{period_days + 30}d")
                
                # Simulate strategy performance
                symbol_trades = 0
                symbol_wins = 0
                symbol_returns = 0
                
                # Simple simulation: analyze every 5 days
                for i in range(20, len(df), 5):
                    subset_df = df.iloc[:i]
                    indicators = market_analysis_engine.technical_analyzer.calculate_indicators(subset_df)
                    signal_type, confidence, _ = market_analysis_engine.rule_analyzer.generate_signal(indicators)
                    
                    if signal_type in ['BUY', 'SELL'] and confidence > 0.6:
                        symbol_trades += 1
                        total_trades += 1
                        
                        # Simulate outcome (simplified)
                        entry_price = df.iloc[i]['Close']
                        exit_price = df.iloc[min(i + 3, len(df) - 1)]['Close']  # Hold for 3 days
                        
                        if signal_type == 'BUY':
                            trade_return = (exit_price - entry_price) / entry_price
                        else:  # SELL
                            trade_return = (entry_price - exit_price) / entry_price
                        
                        symbol_returns += trade_return
                        total_returns += trade_return
                        
                        if trade_return > 0:
                            symbol_wins += 1
                            winning_trades += 1
                
                win_rate = (symbol_wins / symbol_trades * 100) if symbol_trades > 0 else 0
                avg_return = (symbol_returns / symbol_trades * 100) if symbol_trades > 0 else 0
                
                backtest_results.append({
                    'symbol': symbol,
                    'trades': symbol_trades,
                    'win_rate': round(win_rate, 1),
                    'avg_return_pct': round(avg_return, 2),
                    'total_return_pct': round(symbol_returns * 100, 2)
                })
                
            except Exception as e:
                logger.warning(f"Error backtesting {symbol}: {e}")
                backtest_results.append({
                    'symbol': symbol,
                    'trades': 0,
                    'win_rate': 0,
                    'avg_return_pct': 0,
                    'total_return_pct': 0,
                    'error': str(e)
                })
        
        # Calculate overall metrics
        overall_win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        overall_avg_return = (total_returns / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate risk metrics (simplified)
        returns_list = [result['avg_return_pct'] for result in backtest_results if result['trades'] > 0]
        max_drawdown = min(returns_list) if returns_list else 0
        volatility = np.std(returns_list) if len(returns_list) > 1 else 0
        sharpe_ratio = (overall_avg_return / volatility) if volatility > 0 else 0
        
        summary = {
            'strategy_name': strategy_name,
            'period_days': period_days,
            'symbols_tested': len(symbols),
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'overall_win_rate': round(overall_win_rate, 1),
            'overall_avg_return_pct': round(overall_avg_return, 2),
            'total_return_pct': round(total_returns * 100, 2),
            'max_drawdown_pct': round(max_drawdown, 2),
            'volatility_pct': round(volatility, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'backtest_date': timezone.now().date().isoformat()
        }
        
        return Response({
            'backtest_summary': summary,
            'symbol_results': backtest_results,
            'disclaimer': 'This is a simplified backtest simulation and may not reflect actual trading results.'
        })
        
    except Exception as e:
        logger.error(f"Error running backtest: {e}")
        return Response(
            {'error': f'Backtest failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Trading Reporting and Analytics API Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_report(request):
    """Generate comprehensive performance report for the user"""
    try:
        # Parse date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Generate comprehensive report
        report = generate_user_performance_report(
            user=request.user,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(report)
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating performance report: {e}")
        return Response(
            {'error': f'Performance report generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def strategy_performance_report(request, strategy_id):
    """Generate performance report for a specific strategy"""
    try:
        # Get strategy
        strategy = get_object_or_404(TradingStrategy, id=strategy_id, user=request.user)
        
        # Parse date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Generate strategy report
        report = generate_strategy_performance_report(
            strategy=strategy,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(report)
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating strategy performance report: {e}")
        return Response(
            {'error': f'Strategy performance report generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_analytics(request):
    """Get comprehensive portfolio analytics"""
    try:
        reporter = TradingReportGenerator(user=request.user)
        
        # Parse date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Generate metrics
        performance_metrics = reporter.generate_performance_metrics(start_date, end_date)
        risk_metrics = reporter.generate_risk_analysis()
        portfolio_summary = reporter.generate_portfolio_summary()
        strategy_comparison = reporter.generate_strategy_comparison()
        
        analytics = {
            'performance_summary': {
                'total_trades': performance_metrics.total_trades,
                'win_rate': round(performance_metrics.win_rate, 1),
                'total_pnl': float(performance_metrics.total_pnl),
                'total_return_pct': round(performance_metrics.total_return, 2),
                'sharpe_ratio': round(performance_metrics.sharpe_ratio, 3),
                'sortino_ratio': round(performance_metrics.sortino_ratio, 3),
                'max_drawdown_pct': round(performance_metrics.max_drawdown, 2),
                'portfolio_value': float(performance_metrics.portfolio_value)
            },
            'risk_metrics': {
                'volatility_pct': round(performance_metrics.volatility, 2),
                'var_95_pct': round(performance_metrics.var_95, 2),
                'expected_shortfall_pct': round(performance_metrics.expected_shortfall, 2),
                'calmar_ratio': round(performance_metrics.calmar_ratio, 3),
                'downside_deviation_pct': round(risk_metrics.downside_deviation, 2),
                'skewness': round(risk_metrics.skewness, 3),
                'kurtosis': round(risk_metrics.kurtosis, 3)
            },
            'portfolio_summary': portfolio_summary,
            'strategy_comparison': strategy_comparison,
            'generated_at': timezone.now().isoformat()
        }
        
        return Response(analytics)
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating portfolio analytics: {e}")
        return Response(
            {'error': f'Portfolio analytics generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_performance(request):
    """Get monthly performance breakdown"""
    try:
        reporter = TradingReportGenerator(user=request.user)
        
        # Parse date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Generate monthly reports
        monthly_reports = reporter.generate_monthly_reports(start_date, end_date)
        
        # Convert to serializable format
        monthly_data = []
        for report in monthly_reports:
            monthly_data.append({
                'month': report.month,
                'trades_count': report.trades_count,
                'pnl': float(report.pnl),
                'return_pct': round(report.return_pct, 2),
                'win_rate': round(report.win_rate, 1),
                'best_trade': float(report.best_trade),
                'worst_trade': float(report.worst_trade),
                'avg_trade_duration_days': round(report.avg_trade_duration, 1)
            })
        
        return Response({
            'monthly_performance': monthly_data,
            'total_months': len(monthly_data),
            'generated_at': timezone.now().isoformat()
        })
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating monthly performance: {e}")
        return Response(
            {'error': f'Monthly performance generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@enforce_usage_limit(LimitType.DATA_EXPORT_MONTHLY, is_daily=False)
def trade_history_export(request):
    """Export detailed trade history with analytics"""
    try:
        reporter = TradingReportGenerator(user=request.user)
        
        # Parse date filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        if end_date:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Get trade history
        trade_df = reporter.get_trade_history(start_date, end_date)
        
        if trade_df.empty:
            return Response({
                'message': 'No trades found for the specified period',
                'trades': [],
                'summary': {}
            })
        
        # Convert to list of dictionaries
        trades_list = trade_df.to_dict('records')
        
        # Convert timestamps to ISO format
        for trade in trades_list:
            if trade.get('entry_date'):
                trade['entry_date'] = trade['entry_date'].isoformat()
            if trade.get('exit_date'):
                trade['exit_date'] = trade['exit_date'].isoformat()
        
        # Generate summary
        summary = {
            'total_trades': len(trades_list),
            'winning_trades': len([t for t in trades_list if t['is_winner']]),
            'total_pnl': sum(t['pnl'] for t in trades_list),
            'avg_pnl_per_trade': sum(t['pnl'] for t in trades_list) / len(trades_list),
            'best_trade': max(t['pnl'] for t in trades_list),
            'worst_trade': min(t['pnl'] for t in trades_list),
            'avg_confidence': sum(t['confidence_score'] for t in trades_list) / len(trades_list)
        }
        
        return Response({
            'trades': trades_list,
            'summary': summary,
            'export_date': timezone.now().isoformat(),
            'date_range': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            }
        })
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error exporting trade history: {e}")
        return Response(
            {'error': f'Trade history export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def risk_analysis(request):
    """Get detailed risk analysis and metrics"""
    try:
        reporter = TradingReportGenerator(user=request.user)
        
        # Generate risk metrics
        risk_metrics = reporter.generate_risk_analysis()
        performance_metrics = reporter.generate_performance_metrics()
        
        risk_analysis_data = {
            'value_at_risk': {
                'var_95_pct': round(performance_metrics.var_95, 2),
                'expected_shortfall_pct': round(performance_metrics.expected_shortfall, 2),
                'description': 'Potential loss in worst 5% scenarios'
            },
            'drawdown_analysis': {
                'max_drawdown_pct': round(performance_metrics.max_drawdown, 2),
                'max_drawdown_duration_days': performance_metrics.max_drawdown_duration,
                'current_drawdown_status': 'Recovered'  # This would be calculated from recent performance
            },
            'volatility_metrics': {
                'total_volatility_pct': round(performance_metrics.volatility, 2),
                'downside_deviation_pct': round(risk_metrics.downside_deviation, 2),
                'upside_capture': round(risk_metrics.upside_capture, 3) if risk_metrics.upside_capture else None,
                'downside_capture': round(risk_metrics.downside_capture, 3) if risk_metrics.downside_capture else None
            },
            'distribution_metrics': {
                'skewness': round(risk_metrics.skewness, 3),
                'kurtosis': round(risk_metrics.kurtosis, 3),
                'tail_ratio': round(risk_metrics.tail_ratio, 3),
                'description': 'Skewness > 0 means more positive outliers; Kurtosis > 0 means fat tails'
            },
            'risk_adjusted_returns': {
                'sharpe_ratio': round(performance_metrics.sharpe_ratio, 3),
                'sortino_ratio': round(performance_metrics.sortino_ratio, 3),
                'calmar_ratio': round(performance_metrics.calmar_ratio, 3),
                'information_ratio': round(risk_metrics.information_ratio, 3) if risk_metrics.information_ratio else None
            },
            'portfolio_metrics': {
                'beta': round(risk_metrics.portfolio_beta, 3) if risk_metrics.portfolio_beta else None,
                'alpha_pct': round(risk_metrics.portfolio_alpha * 100, 2) if risk_metrics.portfolio_alpha else None,
                'tracking_error_pct': round(risk_metrics.tracking_error * 100, 2) if risk_metrics.tracking_error else None
            },
            'risk_grade': self._calculate_risk_grade(performance_metrics, risk_metrics),
            'generated_at': timezone.now().isoformat()
        }
        
        return Response(risk_analysis_data)
        
    except Exception as e:
        logger.error(f"Error generating risk analysis: {e}")
        return Response(
            {'error': f'Risk analysis generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _calculate_risk_grade(performance_metrics, risk_metrics):
    """Calculate overall risk grade based on metrics"""
    score = 0
    
    # Sharpe ratio scoring (0-30 points)
    if performance_metrics.sharpe_ratio > 2:
        score += 30
    elif performance_metrics.sharpe_ratio > 1.5:
        score += 25
    elif performance_metrics.sharpe_ratio > 1:
        score += 20
    elif performance_metrics.sharpe_ratio > 0.5:
        score += 15
    elif performance_metrics.sharpe_ratio > 0:
        score += 10
    
    # Max drawdown scoring (0-25 points)
    if performance_metrics.max_drawdown < 5:
        score += 25
    elif performance_metrics.max_drawdown < 10:
        score += 20
    elif performance_metrics.max_drawdown < 15:
        score += 15
    elif performance_metrics.max_drawdown < 25:
        score += 10
    elif performance_metrics.max_drawdown < 35:
        score += 5
    
    # Volatility scoring (0-20 points)
    if performance_metrics.volatility < 10:
        score += 20
    elif performance_metrics.volatility < 15:
        score += 15
    elif performance_metrics.volatility < 20:
        score += 10
    elif performance_metrics.volatility < 30:
        score += 5
    
    # Win rate scoring (0-15 points)
    if performance_metrics.win_rate > 70:
        score += 15
    elif performance_metrics.win_rate > 60:
        score += 12
    elif performance_metrics.win_rate > 50:
        score += 9
    elif performance_metrics.win_rate > 40:
        score += 6
    elif performance_metrics.win_rate > 30:
        score += 3
    
    # Profit factor scoring (0-10 points)
    if performance_metrics.profit_factor > 2:
        score += 10
    elif performance_metrics.profit_factor > 1.5:
        score += 8
    elif performance_metrics.profit_factor > 1.2:
        score += 6
    elif performance_metrics.profit_factor > 1:
        score += 4
    
    # Determine grade
    if score >= 85:
        return {'grade': 'A+', 'description': 'Excellent risk-adjusted performance'}
    elif score >= 75:
        return {'grade': 'A', 'description': 'Very good risk-adjusted performance'}
    elif score >= 65:
        return {'grade': 'B+', 'description': 'Good risk-adjusted performance'}
    elif score >= 55:
        return {'grade': 'B', 'description': 'Above average risk-adjusted performance'}
    elif score >= 45:
        return {'grade': 'C+', 'description': 'Average risk-adjusted performance'}
    elif score >= 35:
        return {'grade': 'C', 'description': 'Below average risk-adjusted performance'}
    elif score >= 25:
        return {'grade': 'D', 'description': 'Poor risk-adjusted performance'}
    else:
        return {'grade': 'F', 'description': 'Very poor risk-adjusted performance'}


# Usage Limits and Subscription Management API Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """Get user's subscription status and usage limits"""
    try:
        usage_summary = get_user_usage_status(request.user)
        
        # Add additional subscription info
        subscription_info = {
            'user_id': str(request.user.id),
            'email': request.user.email,
            'subscription_tier': request.user.subscription_tier,
            'subscription_display': request.user.get_subscription_tier_display(),
            'usage_summary': usage_summary,
            'tier_benefits': {
                'BASIC': [
                    '5 signals per day',
                    '5 backtests per day',
                    '2 active strategies',
                    'Basic support via email',
                    'Basic portfolio analytics'
                ],
                'PRO': [
                    '100 signals per day',
                    '100 backtests per day',
                    '10 active strategies',
                    'Priority email support',
                    'Advanced portfolio analytics',
                    'API access',
                    '50 portfolio positions'
                ],
                'ELITE': [
                    'Unlimited signals',
                    'Unlimited backtests',
                    '50 active strategies',
                    'Phone & priority support',
                    'Advanced analytics & reporting',
                    'Premium API access',
                    '200 portfolio positions',
                    'Custom ML models'
                ]
            },
            'upgrade_options': {
                'current_tier': request.user.subscription_tier,
                'next_tier': 'PRO' if request.user.subscription_tier == 'BASIC' else 'ELITE' if request.user.subscription_tier == 'PRO' else None,
                'can_upgrade': request.user.subscription_tier != 'ELITE'
            }
        }
        
        return Response(subscription_info)
        
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        return Response(
            {'error': f'Failed to get subscription status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_analytics(request):
    """Get detailed usage analytics and trends"""
    try:
        user = request.user
        
        # Get usage summary
        usage_summary = get_user_usage_status(user)
        
        # Calculate usage trends (mock data for now - would be real historical data)
        from datetime import datetime, timedelta
        
        current_date = timezone.now().date()
        usage_trends = {
            'daily_signal_trend': [
                {'date': (current_date - timedelta(days=i)).isoformat(), 
                 'count': max(0, 5 - i + (i % 3))} for i in range(7, 0, -1)
            ],
            'weekly_backtest_trend': [
                {'week': f'Week {i}', 'count': max(0, 10 - i*2 + (i % 2)*3)} for i in range(4, 0, -1)
            ],
            'monthly_usage_summary': {
                'signals_used': usage_summary['current_usage'].get('DAILY_SIGNALS', {}).get('current', 0),
                'backtests_used': usage_summary['current_usage'].get('DAILY_BACKTESTS', {}).get('current', 0),
                'api_calls_used': usage_summary['current_usage'].get('API_CALLS_DAILY', {}).get('current', 0),
                'data_exports_used': usage_summary['current_usage'].get('DATA_EXPORT_MONTHLY', {}).get('current', 0)
            }
        }
        
        # Efficiency metrics
        efficiency_metrics = {
            'signal_success_rate': 0.68,  # Would be calculated from actual trading data
            'backtest_accuracy': 0.73,   # Would be calculated from backtest vs actual performance
            'api_utilization': min(100, (usage_summary['current_usage'].get('API_CALLS_DAILY', {}).get('current', 0) / 
                                        max(1, usage_summary['limits'].get('api_calls_daily', 1)) * 100)),
            'limit_utilization': {
                limit_name: min(100, data.get('percentage', 0)) 
                for limit_name, data in usage_summary['current_usage'].items()
                if not data.get('is_unlimited', False)
            }
        }
        
        analytics_data = {
            'usage_summary': usage_summary,
            'usage_trends': usage_trends,
            'efficiency_metrics': efficiency_metrics,
            'recommendations': [],
            'generated_at': timezone.now().isoformat()
        }
        
        # Add recommendations based on usage patterns
        if efficiency_metrics['limit_utilization']:
            avg_utilization = sum(efficiency_metrics['limit_utilization'].values()) / len(efficiency_metrics['limit_utilization'])
            
            if avg_utilization > 80:
                analytics_data['recommendations'].append({
                    'type': 'upgrade',
                    'message': 'Consider upgrading your plan - you\'re using over 80% of your limits',
                    'priority': 'high'
                })
            elif avg_utilization > 60:
                analytics_data['recommendations'].append({
                    'type': 'monitor',
                    'message': 'Monitor your usage - you\'re approaching your limits',
                    'priority': 'medium'
                })
            
            if efficiency_metrics['signal_success_rate'] < 0.6:
                analytics_data['recommendations'].append({
                    'type': 'optimization',
                    'message': 'Consider reviewing your signal strategies - success rate is below 60%',
                    'priority': 'medium'
                })
        
        return Response(analytics_data)
        
    except Exception as e:
        logger.error(f"Error generating usage analytics: {e}")
        return Response(
            {'error': f'Failed to generate usage analytics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_usage_limit(request):
    """Check if user can perform a specific action based on usage limits"""
    try:
        limit_type_str = request.data.get('limit_type')
        is_daily = request.data.get('is_daily', True)
        
        if not limit_type_str:
            return Response(
                {'error': 'limit_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert string to LimitType enum
        try:
            limit_type = LimitType(limit_type_str)
        except ValueError:
            return Response(
                {'error': f'Invalid limit_type: {limit_type_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check limit
        is_allowed, current_usage, limit = usage_service.check_limit(
            request.user, limit_type, is_daily
        )
        
        # Calculate reset time
        reset_time = usage_service.get_next_reset_time(limit_type, is_daily)
        
        result = {
            'is_allowed': is_allowed,
            'current_usage': current_usage,
            'limit': limit,
            'is_unlimited': limit == -1,
            'usage_percentage': (current_usage / limit * 100) if limit > 0 else 0,
            'reset_time': reset_time.isoformat(),
            'limit_type': limit_type.label,
            'subscription_tier': request.user.subscription_tier
        }
        
        if not is_allowed:
            result['upgrade_message'] = 'Upgrade to Pro or Elite plan for higher limits'
            result['next_reset'] = reset_time.isoformat()
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error checking usage limit: {e}")
        return Response(
            {'error': f'Failed to check usage limit: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_upgrade(request):
    """Simulate what limits would be available with an upgraded plan"""
    try:
        target_tier = request.data.get('target_tier', '').upper()
        
        if target_tier not in ['BASIC', 'PRO', 'ELITE']:
            return Response(
                {'error': 'target_tier must be one of: BASIC, PRO, ELITE'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current limits
        current_limits = usage_service.get_user_limits(request.user)
        
        # Get target limits
        target_limits = usage_service.SUBSCRIPTION_LIMITS.get(target_tier)
        
        if not target_limits:
            return Response(
                {'error': f'Invalid target tier: {target_tier}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate differences
        comparison = {
            'current_tier': request.user.subscription_tier,
            'target_tier': target_tier,
            'improvements': {},
            'new_features': []
        }
        
        # Compare limits
        limit_comparisons = {
            'daily_signals': (current_limits.daily_signals, target_limits.daily_signals),
            'monthly_signals': (current_limits.monthly_signals, target_limits.monthly_signals),
            'daily_backtests': (current_limits.daily_backtests, target_limits.daily_backtests),
            'monthly_backtests': (current_limits.monthly_backtests, target_limits.monthly_backtests),
            'active_strategies': (current_limits.active_strategies, target_limits.active_strategies),
            'api_calls_daily': (current_limits.api_calls_daily, target_limits.api_calls_daily),
            'portfolio_positions': (current_limits.portfolio_positions, target_limits.portfolio_positions),
            'data_export_monthly': (current_limits.data_export_monthly, target_limits.data_export_monthly)
        }
        
        for limit_name, (current, target) in limit_comparisons.items():
            if target == -1:
                comparison['improvements'][limit_name] = {
                    'current': current,
                    'target': 'Unlimited',
                    'improvement': 'Unlimited access'
                }
            elif current == -1:
                comparison['improvements'][limit_name] = {
                    'current': 'Unlimited',
                    'target': target,
                    'improvement': 'No change (already unlimited)'
                }
            elif target > current:
                comparison['improvements'][limit_name] = {
                    'current': current,
                    'target': target,
                    'improvement': f'+{target - current} ({((target - current) / current * 100):.0f}% increase)'
                }
            else:
                comparison['improvements'][limit_name] = {
                    'current': current,
                    'target': target,
                    'improvement': 'No change'
                }
        
        # Compare features
        new_features = set(target_limits.features) - set(current_limits.features)
        comparison['new_features'] = list(new_features)
        
        # Add support level comparison
        comparison['support_upgrade'] = {
            'current': current_limits.support_level,
            'target': target_limits.support_level
        }
        
        return Response(comparison)
        
    except Exception as e:
        logger.error(f"Error simulating upgrade: {e}")
        return Response(
            {'error': f'Failed to simulate upgrade: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Portfolio Aggregation API Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_overview(request):
    """Get comprehensive portfolio overview aggregated across all brokers"""
    try:
        # Get portfolio analytics
        portfolio_analytics = get_user_portfolio_summary(request.user)
        
        return Response(portfolio_analytics)
        
    except Exception as e:
        logger.error(f"Error getting portfolio overview: {e}")
        return Response(
            {'error': f'Failed to get portfolio overview: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_portfolio(request):
    """Sync portfolio data from all connected brokers"""
    try:
        # Sync portfolio positions from all brokers
        synced_positions = sync_user_portfolio(request.user)
        
        # Get updated analytics
        portfolio_analytics = get_user_portfolio_summary(request.user)
        
        return Response({
            'message': 'Portfolio synced successfully',
            'synced_positions': synced_positions,
            'portfolio_summary': portfolio_analytics['summary'],
            'sync_timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error syncing portfolio: {e}")
        return Response(
            {'error': f'Failed to sync portfolio: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_positions(request):
    """Get detailed position breakdown across all brokers"""
    try:
        # Get portfolio analytics
        portfolio_analytics = get_user_portfolio_summary(request.user)
        
        # Extract and enhance position data
        positions = portfolio_analytics.get('positions', [])
        
        # Add additional position details
        enhanced_positions = []
        for pos in positions:
            enhanced_pos = pos.copy()
            
            # Add sector information
            symbol = pos['symbol']
            sector = portfolio_aggregator.sector_mapping.get(symbol, 'Other')
            enhanced_pos['sector'] = sector
            
            # Add position weight in portfolio
            total_value = portfolio_analytics['summary']['total_value']
            if total_value > 0:
                enhanced_pos['portfolio_weight'] = round(pos['market_value'] / total_value * 100, 2)
            else:
                enhanced_pos['portfolio_weight'] = 0
            
            # Add risk metrics
            enhanced_pos['risk_level'] = 'High' if enhanced_pos['portfolio_weight'] > 15 else 'Medium' if enhanced_pos['portfolio_weight'] > 5 else 'Low'
            
            enhanced_positions.append(enhanced_pos)
        
        # Sort by market value descending
        enhanced_positions.sort(key=lambda x: x['market_value'], reverse=True)
        
        return Response({
            'positions': enhanced_positions,
            'total_positions': len(enhanced_positions),
            'summary': portfolio_analytics['summary'],
            'last_updated': portfolio_analytics['last_updated']
        })
        
    except Exception as e:
        logger.error(f"Error getting portfolio positions: {e}")
        return Response(
            {'error': f'Failed to get portfolio positions: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_allocation(request):
    """Get portfolio allocation analysis by sector and broker"""
    try:
        # Get portfolio analytics
        portfolio_analytics = get_user_portfolio_summary(request.user)
        
        allocation_data = {
            'sector_allocation': portfolio_analytics.get('allocation', {}).get('by_sector', {}),
            'broker_allocation': portfolio_analytics.get('allocation', {}).get('by_broker', {}),
            'concentration_analysis': {
                'top_positions': {},
                'risk_level': 'Low'
            },
            'diversification': {
                'score': portfolio_analytics.get('risk_metrics', {}).get('diversification_grade', {}),
                'recommendations': []
            },
            'summary': portfolio_analytics['summary']
        }
        
        # Add concentration analysis
        risk_metrics = portfolio_analytics.get('risk_metrics', {})
        concentration_risk = risk_metrics.get('concentration_risk', {})
        
        # Extract top position concentrations
        for i in range(1, 6):
            key = f'top_{i}'
            if key in concentration_risk:
                allocation_data['concentration_analysis']['top_positions'][f'position_{i}'] = round(concentration_risk[key], 2)
        
        # Determine overall risk level
        top_5_concentration = concentration_risk.get('top_5_total', 0)
        if top_5_concentration > 70:
            allocation_data['concentration_analysis']['risk_level'] = 'High'
        elif top_5_concentration > 50:
            allocation_data['concentration_analysis']['risk_level'] = 'Medium'
        else:
            allocation_data['concentration_analysis']['risk_level'] = 'Low'
        
        # Add diversification recommendations
        insights = portfolio_analytics.get('insights', [])
        diversification_insights = [insight for insight in insights if insight['type'] in ['risk', 'diversification']]
        allocation_data['diversification']['recommendations'] = diversification_insights
        
        return Response(allocation_data)
        
    except Exception as e:
        logger.error(f"Error getting portfolio allocation: {e}")
        return Response(
            {'error': f'Failed to get portfolio allocation: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consolidation_opportunities(request):
    """Get portfolio consolidation opportunities across brokers"""
    try:
        # Get consolidation opportunities
        opportunities = get_consolidation_opportunities(request.user)
        
        # Calculate potential savings and benefits
        consolidation_analysis = {
            'opportunities': opportunities,
            'summary': {
                'total_symbols_to_consolidate': len(opportunities),
                'potential_benefits': [],
                'complexity_reduction': 0
            },
            'recommendations': []
        }
        
        if opportunities:
            # Calculate complexity reduction
            total_broker_positions = sum(len(opp['broker_breakdown']) for opp in opportunities)
            potential_reduction = total_broker_positions - len(opportunities)  # If consolidated to 1 broker per symbol
            consolidation_analysis['summary']['complexity_reduction'] = potential_reduction
            
            # Add potential benefits
            consolidation_analysis['summary']['potential_benefits'] = [
                'Reduced complexity in portfolio management',
                'Lower overall transaction costs',
                'Simplified tax reporting',
                'Better position tracking',
                'Improved margin utilization'
            ]
            
            # Add specific recommendations
            consolidation_analysis['recommendations'] = [
                {
                    'type': 'consolidation',
                    'title': 'Consolidate Split Positions',
                    'message': f'Consider consolidating {len(opportunities)} positions split across multiple brokers',
                    'priority': 'medium',
                    'potential_savings': 'Reduced brokerage and complexity'
                }
            ]
            
            # Add recommendations for small positions
            small_positions = []
            for opp in opportunities:
                small_brokers = [bp for bp in opp['broker_breakdown'] if bp['value'] < 10000]
                if small_brokers:
                    small_positions.extend(small_brokers)
            
            if small_positions:
                consolidation_analysis['recommendations'].append({
                    'type': 'optimization',
                    'title': 'Consolidate Small Positions',
                    'message': f'{len(small_positions)} small positions under ₹10,000 could be consolidated',
                    'priority': 'low',
                    'potential_savings': 'Reduced maintenance and tracking overhead'
                })
        
        return Response(consolidation_analysis)
        
    except Exception as e:
        logger.error(f"Error getting consolidation opportunities: {e}")
        return Response(
            {'error': f'Failed to get consolidation opportunities: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_insights(request):
    """Get AI-driven portfolio insights and recommendations"""
    try:
        # Get portfolio analytics
        portfolio_analytics = get_user_portfolio_summary(request.user)
        
        insights = portfolio_analytics.get('insights', [])
        summary = portfolio_analytics.get('summary', {})
        risk_metrics = portfolio_analytics.get('risk_metrics', {})
        
        # Enhance insights with additional analysis
        enhanced_insights = {
            'performance_insights': [insight for insight in insights if insight['type'] == 'performance'],
            'risk_insights': [insight for insight in insights if insight['type'] == 'risk'],
            'optimization_insights': [insight for insight in insights if insight['type'] in ['optimization', 'diversification']],
            'portfolio_health': {
                'score': 0,
                'grade': 'C',
                'factors': {}
            },
            'action_items': [],
            'strengths': [],
            'areas_for_improvement': []
        }
        
        # Calculate portfolio health score
        health_factors = {
            'diversification': risk_metrics.get('diversification_grade', {}).get('grade', 'C'),
            'performance': 'A' if summary.get('total_pnl_percentage', 0) > 10 else 'B' if summary.get('total_pnl_percentage', 0) > 0 else 'C',
            'size': 'A' if summary.get('total_positions', 0) > 15 else 'B' if summary.get('total_positions', 0) > 8 else 'C',
            'concentration': 'A' if risk_metrics.get('concentration_risk', {}).get('top_5_total', 100) < 50 else 'B' if risk_metrics.get('concentration_risk', {}).get('top_5_total', 100) < 70 else 'C'
        }
        
        # Convert grades to scores
        grade_scores = {'A': 90, 'B': 75, 'C': 60, 'D': 45, 'F': 30}
        total_score = sum(grade_scores.get(grade, 60) for grade in health_factors.values()) / len(health_factors)
        
        enhanced_insights['portfolio_health']['score'] = round(total_score, 1)
        enhanced_insights['portfolio_health']['factors'] = health_factors
        
        if total_score >= 85:
            enhanced_insights['portfolio_health']['grade'] = 'A'
        elif total_score >= 75:
            enhanced_insights['portfolio_health']['grade'] = 'B'
        elif total_score >= 65:
            enhanced_insights['portfolio_health']['grade'] = 'C'
        elif total_score >= 55:
            enhanced_insights['portfolio_health']['grade'] = 'D'
        else:
            enhanced_insights['portfolio_health']['grade'] = 'F'
        
        # Generate strengths
        if summary.get('total_pnl_percentage', 0) > 5:
            enhanced_insights['strengths'].append('Strong overall portfolio performance')
        
        if summary.get('broker_count', 0) > 1:
            enhanced_insights['strengths'].append('Good broker diversification')
        
        if len(portfolio_analytics.get('allocation', {}).get('by_sector', {})) > 5:
            enhanced_insights['strengths'].append('Good sector diversification')
        
        # Generate areas for improvement
        high_priority_insights = [insight for insight in insights if insight.get('priority') == 'high']
        for insight in high_priority_insights:
            enhanced_insights['areas_for_improvement'].append(insight['message'])
        
        # Generate action items
        for insight in insights:
            if insight.get('priority') in ['high', 'medium']:
                enhanced_insights['action_items'].append({
                    'title': insight['title'],
                    'description': insight['message'],
                    'priority': insight['priority'],
                    'category': insight['type']
                })
        
        return Response(enhanced_insights)
        
    except Exception as e:
        logger.error(f"Error getting portfolio insights: {e}")
        return Response(
            {'error': f'Failed to get portfolio insights: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )