from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio(request):
    """Get user's portfolio summary"""
    # TODO: Implement actual portfolio logic
    return Response({
        'total_value': 100000.0,
        'total_pnl': 5000.0,
        'day_pnl': 500.0,
        'holdings_count': 5
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_holdings(request):
    """Get user's current holdings"""
    # TODO: Implement actual holdings logic
    return Response([
        {
            'symbol': 'AAPL',
            'quantity': 100,
            'avg_price': 150.0,
            'current_price': 155.0,
            'pnl': 500.0
        }
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_portfolio_history(request):
    """Get portfolio performance history"""
    # TODO: Implement actual history logic
    return Response([
        {
            'date': '2024-01-01',
            'portfolio_value': 95000.0
        },
        {
            'date': '2024-01-02',
            'portfolio_value': 100000.0
        }
    ])