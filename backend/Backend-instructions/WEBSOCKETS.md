# WebSocket Real-Time Communication

## Overview

ShareWise AI implements comprehensive WebSocket support using Django Channels for real-time communication across trading signals, portfolio updates, AI model training progress, and system monitoring.

## Architecture

### Channel Layers
- **Development**: In-memory channel layer (no Redis required)
- **Production**: Redis channel layer for scalability
- **Fallback**: Automatic fallback to in-memory if Redis unavailable

### WebSocket Consumers

#### Trading App (`apps.trading.consumers`)
- **TradingSignalsConsumer**: Real-time trading signals and recommendations
- **PortfolioUpdatesConsumer**: Portfolio and position updates
- **TradeExecutionConsumer**: Trade execution notifications
- **MarketSentimentConsumer**: Market sentiment updates
- **RiskAlertsConsumer**: Risk alerts and notifications
- **LivePnLConsumer**: Real-time P&L updates
- **FnOUpdatesConsumer**: F&O Greeks and volatility updates

#### AI Studio App (`apps.ai_studio.consumers`)
- **ModelTrainingConsumer**: Model training progress updates
- **ModelMonitoringConsumer**: Model performance monitoring
- **StudioDashboardConsumer**: AI Studio dashboard updates
- **MarketplaceNotificationsConsumer**: Marketplace notifications
- **ModelPredictionsConsumer**: Model predictions stream
- **BacktestProgressConsumer**: Backtesting progress
- **SystemHealthConsumer**: System health and worker status

## WebSocket Endpoints

### Trading Endpoints
```
ws://localhost:8000/ws/trading/signals/          # Trading signals
ws://localhost:8000/ws/trading/portfolio/        # Portfolio updates
ws://localhost:8000/ws/trading/executions/       # Trade executions
ws://localhost:8000/ws/trading/sentiment/        # Market sentiment
ws://localhost:8000/ws/trading/risk-alerts/      # Risk alerts
ws://localhost:8000/ws/trading/pnl/              # Live P&L
ws://localhost:8000/ws/trading/fno/              # F&O updates
```

### AI Studio Endpoints
```
ws://localhost:8000/ws/ai-studio/training/{job_id}/     # Training progress
ws://localhost:8000/ws/ai-studio/monitoring/{model_id}/ # Model monitoring
ws://localhost:8000/ws/ai-studio/dashboard/             # Dashboard updates
ws://localhost:8000/ws/ai-studio/marketplace/           # Marketplace notifications
ws://localhost:8000/ws/ai-studio/predictions/{model_id}/ # Model predictions
ws://localhost:8000/ws/ai-studio/backtest/{model_id}/   # Backtest progress
ws://localhost:8000/ws/ai-studio/system/                # System health
```

## Message Formats

### Trading Signals
```json
{
  "type": "new_signal",
  "signal": {
    "id": "signal-123",
    "symbol": "NIFTY",
    "signal_type": "BUY",
    "confidence_score": 0.85,
    "entry_price": 18500.0,
    "target_price": 18650.0,
    "stop_loss": 18400.0,
    "created_at": "2025-08-17T12:00:00Z"
  },
  "timestamp": "2025-08-17T12:00:00Z"
}
```

### Portfolio Updates
```json
{
  "type": "portfolio_update",
  "update": {
    "total_value": 500000.0,
    "total_pnl": 15000.0,
    "daily_pnl": 2500.0,
    "position_count": 5
  },
  "timestamp": "2025-08-17T12:00:00Z"
}
```

### Training Progress
```json
{
  "type": "training_update",
  "progress": {
    "progress_percentage": 65.0,
    "current_step": "Feature engineering",
    "total_steps": 10,
    "eta_minutes": 5
  },
  "timestamp": "2025-08-17T12:00:00Z"
}
```

## Client-Side Integration

### JavaScript WebSocket Client
```javascript
// Connect to trading signals
const signalsSocket = new WebSocket('ws://localhost:8000/ws/trading/signals/');

signalsSocket.onopen = function(event) {
    console.log('Connected to trading signals');
};

signalsSocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'new_signal':
            handleNewSignal(data.signal);
            break;
        case 'signal_update':
            handleSignalUpdate(data.signal);
            break;
        case 'error':
            handleError(data.error);
            break;
    }
};

// Subscribe to specific symbol
signalsSocket.send(JSON.stringify({
    'type': 'subscribe_symbol',
    'symbol': 'NIFTY'
}));
```

### React WebSocket Hook
```javascript
import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url, token) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket(`${url}?token=${token}`);
        
        ws.onopen = () => {
            setIsConnected(true);
            setSocket(ws);
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
        };
        
        ws.onclose = () => {
            setIsConnected(false);
        };
        
        return () => {
            ws.close();
        };
    }, [url, token]);

    const sendMessage = (message) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        }
    };

    return { messages, isConnected, sendMessage };
};
```

## Authentication

WebSocket connections use Django's authentication middleware. Users must be authenticated to connect to any WebSocket endpoint.

### Connection Flow
1. Client establishes WebSocket connection
2. Server validates user authentication
3. If authenticated, connection is accepted
4. If not authenticated, connection is closed with code 4001

## Message Broadcasting

### Backend Integration
```python
from apps.trading.websocket_utils import notify_new_signal

# Send new signal notification
signal_data = {
    'id': str(signal.id),
    'symbol': signal.symbol,
    'signal_type': signal.signal_type,
    'confidence_score': float(signal.confidence_score),
    'entry_price': float(signal.entry_price)
}

notify_new_signal(str(user.id), signal_data)
```

### AI Studio Integration
```python
from apps.ai_studio.websocket_utils import notify_training_progress

# Send training progress update
progress_data = {
    'progress_percentage': 65.0,
    'current_step': 'Feature engineering',
    'total_steps': 10
}

notify_training_progress(training_job_id, progress_data)
```

## Testing

### Management Commands
```bash
# Test WebSocket system
python manage.py test_websockets

# Test with specific user
python manage.py test_websockets --user-email user@example.com
```

### Manual Testing with wscat
```bash
# Install wscat
npm install -g wscat

# Connect to trading signals
wscat -c ws://localhost:8000/ws/trading/signals/

# Send subscribe message
{"type": "subscribe_symbol", "symbol": "NIFTY"}
```

## Deployment Considerations

### Production Setup
1. Use Redis for channel layers
2. Configure proper CORS settings
3. Use WebSocket load balancing
4. Monitor WebSocket connections

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0
```

### ASGI Server
```bash
# Use Daphne for production
pip install daphne
daphne -p 8001 config.asgi:application
```

## Monitoring

### Connection Metrics
- Active WebSocket connections
- Message throughput
- Error rates
- Connection duration

### Health Checks
- Channel layer connectivity
- Redis availability
- Consumer responsiveness

## Security

### Rate Limiting
- Connection limits per user
- Message rate limiting
- Subscription limits

### Data Validation
- Input sanitization
- Message size limits
- Malicious content filtering

## Performance

### Optimization
- Connection pooling
- Message batching
- Selective subscriptions
- Data compression

### Scaling
- Horizontal scaling with Redis
- Load balancing
- Connection sharding
- Geographic distribution