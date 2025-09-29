from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio(request):
    """Get user's portfolio summary"""
    try:
        from apps.trading.portfolio_aggregation import get_user_portfolio_summary
        portfolio_data = get_user_portfolio_summary(request.user)
        return Response(portfolio_data)
    except Exception as e:
        return Response(
            {'error': 'Unable to fetch portfolio data', 'detail': str(e)}, 
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_holdings(request):
    """Get user's current holdings"""
    try:
        from apps.trading.models import PortfolioPosition
        holdings = PortfolioPosition.objects.filter(
            user=request.user, 
            total_quantity__gt=0
        ).values('symbol', 'total_quantity', 'average_price', 'current_price', 'unrealized_pnl')
        return Response(list(holdings))
    except Exception as e:
        return Response(
            {'error': 'Unable to fetch holdings data', 'detail': str(e)}, 
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio_history(request):
    """Get portfolio performance history"""
    try:
        from apps.trading.models import PortfolioPosition
        from django.db.models import Sum
        from datetime import datetime, timedelta
        
        days = int(request.GET.get('days', 30))
        start_date = datetime.now() - timedelta(days=days)
        
        # This would ideally use a PortfolioSnapshot model to track daily values
        # For now, return current value as placeholder
        positions = PortfolioPosition.objects.filter(
            user=request.user,
            last_updated__gte=start_date
        )
        
        if not positions.exists():
            return Response([])
            
        current_value = sum(pos.current_value for pos in positions)
        
        return Response([{
            'date': datetime.now().strftime('%Y-%m-%d'),
            'portfolio_value': float(current_value)
        }])
    except Exception as e:
        return Response(
            {'error': 'Unable to fetch portfolio history', 'detail': str(e)}, 
            status=500
        )