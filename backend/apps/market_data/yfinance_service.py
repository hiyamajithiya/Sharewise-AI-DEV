"""
YFinance Market Data Service for Real-Time Data
"""
import yfinance as yf
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class YFinanceService:
    """Service for fetching real market data using yfinance"""
    
    @staticmethod
    async def get_live_quote(symbol: str) -> Optional[Dict]:
        """Get real-time quote for a symbol"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Get current price data
            quote_data = {
                'symbol': symbol.upper(),
                'price': info.get('currentPrice') or info.get('regularMarketPrice', 0),
                'previousClose': info.get('previousClose', 0),
                'open': info.get('open') or info.get('regularMarketOpen', 0),
                'dayHigh': info.get('dayHigh') or info.get('regularMarketDayHigh', 0),
                'dayLow': info.get('dayLow') or info.get('regularMarketDayLow', 0),
                'volume': info.get('volume') or info.get('regularMarketVolume', 0),
                'marketCap': info.get('marketCap', 0),
                'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
                'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
                'pe_ratio': info.get('trailingPE', 0),
                'dividendYield': info.get('dividendYield', 0),
                'timestamp': datetime.now().isoformat(),
                'source': 'yfinance'
            }
            
            # Calculate change and change percent
            if quote_data['price'] and quote_data['previousClose']:
                quote_data['change'] = quote_data['price'] - quote_data['previousClose']
                quote_data['changePercent'] = (quote_data['change'] / quote_data['previousClose']) * 100
            else:
                quote_data['change'] = 0
                quote_data['changePercent'] = 0
            
            return quote_data
            
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    async def get_bulk_quotes(symbols: List[str]) -> List[Dict]:
        """Get quotes for multiple symbols"""
        quotes = []
        for symbol in symbols:
            quote = await YFinanceService.get_live_quote(symbol)
            if quote:
                quotes.append(quote)
        return quotes
    
    @staticmethod
    async def get_historical_data(symbol: str, period: str = "1mo", interval: str = "1d") -> Optional[Dict]:
        """Get historical price data"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                return None
            
            return {
                'symbol': symbol.upper(),
                'period': period,
                'interval': interval,
                'data': hist.to_dict('records'),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    async def get_option_chain(underlying: str) -> Optional[Dict]:
        """Get options chain data"""
        try:
            ticker = yf.Ticker(underlying)
            
            # Get all expiration dates
            expirations = ticker.options
            
            if not expirations:
                return None
            
            # Get options for the nearest expiration
            opt = ticker.option_chain(expirations[0])
            
            return {
                'underlying': underlying.upper(),
                'expirations': expirations,
                'current_expiry': expirations[0],
                'calls': opt.calls.to_dict('records') if not opt.calls.empty else [],
                'puts': opt.puts.to_dict('records') if not opt.puts.empty else [],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching option chain for {underlying}: {str(e)}")
            return None
    
    @staticmethod
    async def get_market_movers() -> Dict:
        """Get market movers - top gainers and losers"""
        try:
            # Common indices and stocks
            symbols = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD']
            quotes = await YFinanceService.get_bulk_quotes(symbols)
            
            # Sort by change percent
            gainers = sorted([q for q in quotes if q.get('changePercent', 0) > 0], 
                           key=lambda x: x.get('changePercent', 0), reverse=True)[:5]
            losers = sorted([q for q in quotes if q.get('changePercent', 0) < 0], 
                          key=lambda x: x.get('changePercent', 0))[:5]
            
            return {
                'gainers': gainers,
                'losers': losers,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching market movers: {str(e)}")
            return {'gainers': [], 'losers': [], 'timestamp': datetime.now().isoformat()}


# Global service instance
yfinance_service = YFinanceService()