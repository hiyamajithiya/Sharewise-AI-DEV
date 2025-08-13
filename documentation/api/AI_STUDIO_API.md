# AI Studio API Documentation

## Overview

The AI Studio API provides endpoints for creating, training, and managing machine learning models for algorithmic trading. This API supports the complete ML workflow from data preparation to model deployment and marketplace integration.

**Base URL**: `https://api.sharewise.ai/api/ai-studio/`

**Authentication**: Bearer token required for all endpoints

**Rate Limits**: 
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour  
- Elite tier: 10000 requests/hour

---

## ML Models Management

### List User Models

**Endpoint**: `GET /models/`

**Description**: Retrieve all ML models created by the authenticated user.

**Query Parameters**:
- `status` (optional): Filter by model status (DRAFT, TRAINING, COMPLETED, FAILED, PUBLISHED, ARCHIVED)
- `model_type` (optional): Filter by model type (CLASSIFICATION, REGRESSION, TIME_SERIES)
- `page` (optional): Page number for pagination
- `page_size` (optional): Number of results per page (default: 20)

**Response**:
```json
{
  "count": 25,
  "next": "https://api.sharewise.ai/api/ai-studio/models/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "NIFTY Momentum Strategy",
      "description": "ML model for NIFTY momentum trading",
      "model_type": "CLASSIFICATION",
      "algorithm": "RANDOM_FOREST",
      "status": "COMPLETED",
      "is_published": false,
      "performance_metrics": {
        "accuracy": 0.78,
        "precision": 0.82,
        "recall": 0.75,
        "f1_score": 0.78,
        "sharpe_ratio": 1.45
      },
      "total_earnings": "2500.00",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T14:22:00Z"
    }
  ]
}
```

### Create New Model

**Endpoint**: `POST /models/`

**Description**: Create a new ML model configuration.

**Request Body**:
```json
{
  "name": "NIFTY Momentum Strategy",
  "description": "ML model for NIFTY momentum trading using technical indicators",
  "model_type": "CLASSIFICATION",
  "algorithm": "RANDOM_FOREST",
  "target_variable": "signal_type",
  "features": [
    "rsi_14",
    "macd_signal",
    "bollinger_position",
    "volume_ma_ratio",
    "price_ma_50_ratio"
  ],
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10,
    "min_samples_split": 5,
    "random_state": 42
  },
  "training_config": {
    "symbols": ["NIFTY50", "BANKNIFTY"],
    "start_date": "2023-01-01",
    "end_date": "2024-12-31",
    "train_test_split": 0.8,
    "cross_validation_folds": 5
  }
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "NIFTY Momentum Strategy",
  "status": "DRAFT",
  "created_at": "2025-01-15T15:30:00Z",
  "message": "Model created successfully. Ready for training."
}
```

### Get Model Details

**Endpoint**: `GET /models/{model_id}/`

**Description**: Retrieve detailed information about a specific model.

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "NIFTY Momentum Strategy",
  "description": "ML model for NIFTY momentum trading",
  "model_type": "CLASSIFICATION",
  "algorithm": "RANDOM_FOREST",
  "target_variable": "signal_type",
  "features": ["rsi_14", "macd_signal", "bollinger_position"],
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10
  },
  "status": "COMPLETED",
  "performance_metrics": {
    "accuracy": 0.78,
    "precision": 0.82,
    "recall": 0.75,
    "f1_score": 0.78,
    "roc_auc": 0.85,
    "sharpe_ratio": 1.45,
    "max_drawdown": 0.12,
    "total_return": 0.34
  },
  "backtest_results": {
    "total_trades": 1250,
    "winning_trades": 780,
    "losing_trades": 470,
    "win_rate": 0.624,
    "avg_win": 0.024,
    "avg_loss": -0.018,
    "profit_factor": 1.67
  },
  "feature_importance": {
    "rsi_14": 0.35,
    "macd_signal": 0.28,
    "bollinger_position": 0.22,
    "volume_ma_ratio": 0.15
  },
  "is_published": false,
  "total_downloads": 0,
  "total_earnings": "0.00",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T14:22:00Z"
}
```

### Update Model

**Endpoint**: `PATCH /models/{model_id}/`

**Description**: Update model configuration (only for DRAFT status models).

**Request Body**:
```json
{
  "name": "Updated NIFTY Momentum Strategy",
  "description": "Enhanced ML model with additional features",
  "hyperparameters": {
    "n_estimators": 150,
    "max_depth": 12
  }
}
```

### Delete Model

**Endpoint**: `DELETE /models/{model_id}/`

**Description**: Delete a model (only DRAFT status models can be deleted).

**Response**: `204 No Content`

---

## Training Jobs Management

### List Training Jobs

**Endpoint**: `GET /training-jobs/`

**Description**: Retrieve training jobs for the authenticated user.

**Query Parameters**:
- `status` (optional): Filter by job status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- `model_id` (optional): Filter by specific model

**Response**:
```json
{
  "count": 15,
  "results": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "model_id": "550e8400-e29b-41d4-a716-446655440000",
      "job_name": "NIFTY Momentum Training v1.2",
      "status": "COMPLETED",
      "progress": 100,
      "started_at": "2025-01-15T10:30:00Z",
      "completed_at": "2025-01-15T14:22:00Z",
      "compute_hours": 3.75,
      "training_metrics": {
        "final_accuracy": 0.78,
        "final_loss": 0.432,
        "epochs": 50,
        "best_epoch": 42
      },
      "validation_metrics": {
        "accuracy": 0.75,
        "precision": 0.79,
        "recall": 0.72
      }
    }
  ]
}
```

### Start Training Job

**Endpoint**: `POST /models/{model_id}/train/`

**Description**: Start training a model.

**Request Body**:
```json
{
  "job_name": "NIFTY Momentum Training v1.3",
  "priority": "NORMAL"  // LOW, NORMAL, HIGH (based on subscription tier)
}
```

**Response**:
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Training job queued successfully",
  "estimated_completion": "2025-01-15T18:30:00Z",
  "estimated_cost": "15.50"
}
```

### Get Training Job Status

**Endpoint**: `GET /training-jobs/{job_id}/`

**Description**: Get real-time status of a training job.

**Response**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "status": "RUNNING",
  "progress": 67,
  "current_epoch": 34,
  "total_epochs": 50,
  "current_metrics": {
    "accuracy": 0.76,
    "loss": 0.445
  },
  "estimated_completion": "2025-01-15T16:45:00Z",
  "logs": [
    {
      "timestamp": "2025-01-15T15:30:00Z",
      "level": "INFO",
      "message": "Starting epoch 34/50"
    }
  ]
}
```

### Cancel Training Job

**Endpoint**: `POST /training-jobs/{job_id}/cancel/`

**Description**: Cancel a running training job.

**Response**:
```json
{
  "message": "Training job cancelled successfully",
  "refund_amount": "8.25"
}
```

---

## Model Predictions

### Generate Predictions

**Endpoint**: `POST /models/{model_id}/predict/`

**Description**: Generate predictions using a trained model.

**Request Body**:
```json
{
  "symbols": ["NIFTY50", "RELIANCE"],
  "features": {
    "NIFTY50": {
      "rsi_14": 65.2,
      "macd_signal": 0.025,
      "bollinger_position": 0.8,
      "volume_ma_ratio": 1.25
    },
    "RELIANCE": {
      "rsi_14": 45.8,
      "macd_signal": -0.012,
      "bollinger_position": 0.3,
      "volume_ma_ratio": 0.95
    }
  }
}
```

**Response**:
```json
{
  "predictions": [
    {
      "symbol": "NIFTY50",
      "prediction": "BUY",
      "confidence": 0.87,
      "feature_contributions": {
        "rsi_14": 0.35,
        "macd_signal": 0.28,
        "bollinger_position": 0.24
      }
    },
    {
      "symbol": "RELIANCE", 
      "prediction": "HOLD",
      "confidence": 0.62,
      "feature_contributions": {
        "rsi_14": -0.15,
        "macd_signal": -0.22,
        "bollinger_position": 0.08
      }
    }
  ],
  "model_version": "1.2",
  "prediction_timestamp": "2025-01-15T15:45:00Z"
}
```

### Batch Predictions

**Endpoint**: `POST /models/{model_id}/batch-predict/`

**Description**: Generate predictions for multiple symbols and time periods.

**Request Body**:
```json
{
  "symbols": ["NIFTY50", "BANKNIFTY", "RELIANCE"],
  "start_date": "2025-01-10",
  "end_date": "2025-01-15",
  "include_confidence": true,
  "include_shap": true
}
```

---

## Explainable AI (XAI)

### Get SHAP Values

**Endpoint**: `GET /models/{model_id}/explain/`

**Description**: Get SHAP explanations for model predictions.

**Query Parameters**:
- `symbols`: Comma-separated list of symbols
- `start_date`: Start date for explanations
- `end_date`: End date for explanations

**Response**:
```json
{
  "explanations": [
    {
      "symbol": "NIFTY50",
      "timestamp": "2025-01-15T15:30:00Z",
      "prediction": "BUY",
      "base_value": 0.5,
      "shap_values": {
        "rsi_14": 0.15,
        "macd_signal": 0.12,
        "bollinger_position": 0.08,
        "volume_ma_ratio": 0.05
      },
      "expected_value": 0.5,
      "prediction_value": 0.9
    }
  ],
  "feature_importance_global": {
    "rsi_14": 0.35,
    "macd_signal": 0.28,
    "bollinger_position": 0.22,
    "volume_ma_ratio": 0.15
  }
}
```

### Get Feature Importance

**Endpoint**: `GET /models/{model_id}/feature-importance/`

**Description**: Get feature importance analysis for a model.

**Response**:
```json
{
  "feature_importance": {
    "rsi_14": {
      "importance": 0.35,
      "rank": 1,
      "description": "14-period Relative Strength Index"
    },
    "macd_signal": {
      "importance": 0.28, 
      "rank": 2,
      "description": "MACD Signal Line"
    }
  },
  "importance_plot_url": "/api/ai-studio/models/550e8400/plots/feature-importance.png",
  "shap_summary_plot_url": "/api/ai-studio/models/550e8400/plots/shap-summary.png"
}
```

---

## Marketplace Integration

### Publish Model

**Endpoint**: `POST /models/{model_id}/publish/`

**Description**: Publish a model to the marketplace.

**Request Body**:
```json
{
  "title": "High-Performance NIFTY Momentum Strategy",
  "description": "Proven momentum strategy with 78% accuracy and 1.45 Sharpe ratio",
  "category": "MOMENTUM",
  "asset_classes": ["EQUITY", "INDEX"],
  "pricing_model": "FIXED",
  "monthly_price": "2999.00",
  "performance_fee_rate": "0.00",
  "sample_signals": [
    {
      "symbol": "NIFTY50",
      "signal": "BUY",
      "confidence": 0.87,
      "date": "2025-01-15"
    }
  ],
  "terms_and_conditions": "Standard licensing terms apply."
}
```

**Response**:
```json
{
  "listing_id": "770e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING_REVIEW",
  "message": "Model submitted for marketplace review",
  "estimated_review_time": "2-3 business days"
}
```

### Marketplace Listings

**Endpoint**: `GET /marketplace/`

**Description**: Browse published models in the marketplace.

**Query Parameters**:
- `category`: Filter by strategy category
- `min_sharpe_ratio`: Minimum Sharpe ratio filter
- `max_price`: Maximum monthly price filter
- `asset_classes`: Filter by supported asset classes
- `search`: Text search in title/description

**Response**:
```json
{
  "count": 45,
  "results": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "title": "High-Performance NIFTY Momentum Strategy",
      "description": "Proven momentum strategy with 78% accuracy",
      "seller": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "username": "quant_trader_pro",
        "rating": 4.8,
        "total_models": 12
      },
      "category": "MOMENTUM",
      "monthly_price": "2999.00",
      "performance_metrics": {
        "sharpe_ratio": 1.45,
        "max_drawdown": 0.12,
        "total_return": 0.34,
        "win_rate": 0.624
      },
      "total_subscribers": 156,
      "average_rating": 4.6,
      "is_featured": true,
      "sample_signals_count": 5
    }
  ]
}
```

### Subscribe to Model

**Endpoint**: `POST /marketplace/{listing_id}/subscribe/`

**Description**: Subscribe to a marketplace model.

**Request Body**:
```json
{
  "subscription_type": "MONTHLY",
  "auto_renew": true
}
```

**Response**:
```json
{
  "subscription_id": "990e8400-e29b-41d4-a716-446655440000",
  "status": "ACTIVE",
  "start_date": "2025-01-15",
  "end_date": "2025-02-15",
  "next_billing_date": "2025-02-15",
  "total_amount": "2999.00",
  "message": "Successfully subscribed to model"
}
```

---

## Analytics & Performance

### Model Performance Dashboard

**Endpoint**: `GET /analytics/dashboard/`

**Description**: Get comprehensive analytics dashboard data.

**Response**:
```json
{
  "summary": {
    "total_models": 8,
    "active_models": 5,
    "published_models": 2,
    "training_jobs_this_month": 12,
    "total_earnings": "15750.50",
    "compute_hours_used": 45.25,
    "compute_hours_remaining": 54.75
  },
  "recent_activity": [
    {
      "type": "MODEL_TRAINED",
      "message": "NIFTY Momentum Strategy training completed",
      "timestamp": "2025-01-15T14:22:00Z"
    }
  ],
  "performance_chart": {
    "labels": ["Jan 1", "Jan 8", "Jan 15"],
    "datasets": [
      {
        "label": "Portfolio Value",
        "data": [100000, 105500, 108750]
      }
    ]
  }
}
```

### Model Leasing Analytics

**Endpoint**: `GET /analytics/leasing/`

**Description**: Get analytics for model leasing performance.

**Response**:
```json
{
  "total_revenue": "25750.00",
  "active_subscriptions": 45,
  "revenue_by_model": [
    {
      "model_name": "NIFTY Momentum Strategy",
      "monthly_revenue": "12500.00",
      "subscribers": 25,
      "churn_rate": 0.08
    }
  ],
  "revenue_trend": {
    "labels": ["Dec", "Jan"],
    "data": [18500, 25750]
  }
}
```

---

## Compute Resources

### Get Usage Statistics

**Endpoint**: `GET /compute/usage/`

**Description**: Get compute resource usage statistics.

**Query Parameters**:
- `start_date`: Start date for usage period
- `end_date`: End date for usage period

**Response**:
```json
{
  "current_period": {
    "period": "2025-01",
    "hours_used": 45.25,
    "hours_limit": 100.00,
    "percentage_used": 45.25,
    "cost": "225.75"
  },
  "usage_by_job": [
    {
      "job_name": "NIFTY Momentum Training v1.2",
      "hours": 3.75,
      "cost": "18.75",
      "resource_type": "GPU"
    }
  ],
  "daily_usage": [
    {
      "date": "2025-01-15",
      "hours": 4.5,
      "cost": "22.50"
    }
  ]
}
```

### Purchase Additional Credits

**Endpoint**: `POST /compute/purchase-credits/`

**Description**: Purchase additional compute credits.

**Request Body**:
```json
{
  "hours": 50,
  "payment_method": "credit_card"
}
```

**Response**:
```json
{
  "transaction_id": "txn_1234567890",
  "hours_purchased": 50,
  "amount": "250.00",
  "new_balance": 104.75,
  "expires_at": "2025-02-15T23:59:59Z"
}
```

---

## Error Responses

### Standard Error Format

All API errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid model configuration",
    "details": {
      "features": ["This field is required"],
      "hyperparameters": ["Invalid parameter 'n_estimators': must be positive integer"]
    }
  },
  "timestamp": "2025-01-15T15:45:00Z"
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR`: Invalid or expired token
- `PERMISSION_DENIED`: Insufficient permissions for operation
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INSUFFICIENT_CREDITS`: Not enough compute credits
- `MODEL_TRAINING_ERROR`: Error during model training
- `SUBSCRIPTION_REQUIRED`: Feature requires paid subscription

---

## Webhooks

### Training Job Completion

**Endpoint**: `POST {your_webhook_url}`

**Headers**:
- `X-Sharewise-Signature`: HMAC signature for verification
- `X-Sharewise-Event`: Event type

**Payload**:
```json
{
  "event": "training_job.completed",
  "data": {
    "job_id": "660e8400-e29b-41d4-a716-446655440000",
    "model_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "performance_metrics": {
      "accuracy": 0.78,
      "sharpe_ratio": 1.45
    }
  },
  "timestamp": "2025-01-15T14:22:00Z"
}
```

### Model Subscription

**Payload**:
```json
{
  "event": "model.subscribed",
  "data": {
    "listing_id": "770e8400-e29b-41d4-a716-446655440000",
    "subscriber_id": "880e8400-e29b-41d4-a716-446655440001",
    "subscription_id": "990e8400-e29b-41d4-a716-446655440000",
    "amount": "2999.00"
  },
  "timestamp": "2025-01-15T16:30:00Z"
}
```

---

**API Version**: v1.0  
**Last Updated**: January 2025  
**Support**: api-support@sharewise.ai