from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .services import get_market_data_service
import asyncio
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stock_quote(request, symbol):
    """Get stock quote for given symbol"""
    try:
        # Use asyncio to call the async service
        async def fetch_quote():
            service = await get_market_data_service()
            if 'finnhub' in service.providers:
                return await service.providers['finnhub'].get_quote(symbol)
            return None

        quote_data = asyncio.run(fetch_quote())
        
        if quote_data:
            return Response({
                'status': 'success',
                'symbol': symbol,
                'data': {
                    'symbol': quote_data['symbol'],
                    'last_price': float(quote_data['last_price']),
                    'change': float(quote_data['change']),
                    'change_percent': float(quote_data['change_percent']),
                    'open_price': float(quote_data['open_price']),
                    'high_price': float(quote_data['high_price']),
                    'low_price': float(quote_data['low_price']),
                    'previous_close': float(quote_data['previous_close']),
                    'timestamp': quote_data['timestamp'].isoformat(),
                    'data_source': quote_data['data_source']
                }
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Unable to fetch quote data'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Error fetching stock quote for {symbol}: {e}")
        return Response({
            'status': 'error',
            'message': 'Failed to fetch quote data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_stocks(request):
    """Search stocks"""
    query = request.GET.get('q', '')
    if not query:
        return Response({
            'status': 'error',
            'message': 'Query parameter required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        return Response({
            'status': 'success',
            'query': query,
            'results': [
                {'symbol': 'AAPL', 'name': 'Apple Inc.', 'exchange': 'NASDAQ'},
                {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'exchange': 'NASDAQ'},
                {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'exchange': 'NASDAQ'},
            ]
        })
    except Exception as e:
        logger.error(f"Error searching stocks: {e}")
        return Response({
            'status': 'error',
            'message': 'Search failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_market_news(request):
    """Get market news"""
    return Response({
        'status': 'success',
        'news': [
            {'title': 'Market Update', 'summary': 'Latest market movements'}
        ]
    })
