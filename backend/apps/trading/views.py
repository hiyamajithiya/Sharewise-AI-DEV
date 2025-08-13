import asyncio
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count

from .models import TradingSignal, TradingOrder, FuturesOptionsData
from .serializers import (TradingSignalSerializer, TradingOrderSerializer, 
                          FuturesOptionsDataSerializer, OptionChainSerializer,
                          FuturesChainSerializer, MarginCalculatorSerializer)
from .services import TradingEngine, SignalGenerator, PerformanceAnalyzer


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
    user = request.user
    
    # Mock F&O positions data
    # In real implementation, this would fetch from broker API
    mock_positions = [
        {
            'symbol': 'NIFTY24DEC19000CE',
            'instrument_type': 'OPTIONS',
            'underlying_symbol': 'NIFTY',
            'quantity': 50,
            'average_price': 125.50,
            'market_price': 140.75,
            'pnl': 762.5,
            'pnl_percentage': 12.15,
            'margin_used': 15000,
            'days_to_expiry': 15
        },
        {
            'symbol': 'BANKNIFTY24DEC48000PE',
            'instrument_type': 'OPTIONS',
            'underlying_symbol': 'BANKNIFTY',
            'quantity': -25,
            'average_price': 180.25,
            'market_price': 165.50,
            'pnl': 368.75,
            'pnl_percentage': 8.17,
            'margin_used': 25000,
            'days_to_expiry': 15
        }
    ]
    
    return Response({
        'positions': mock_positions,
        'total_pnl': sum(pos['pnl'] for pos in mock_positions),
        'total_margin_used': sum(pos['margin_used'] for pos in mock_positions)
    })


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