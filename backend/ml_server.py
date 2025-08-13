"""
ML Model Inference Server for ShareWise AI
Fast API server for real-time model predictions
"""
import os
import json
import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

import uvicorn
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="ShareWise AI ML Server",
    description="High-performance ML inference server",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
model_cache = {}
model_metadata = {}

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "/app/ml_models")
MAX_CACHE_SIZE = int(os.getenv("MAX_CACHE_SIZE", "10"))
PREDICTION_TIMEOUT = int(os.getenv("PREDICTION_TIMEOUT", "30"))


class PredictionRequest(BaseModel):
    """Request model for predictions"""
    model_id: str = Field(..., description="Model ID to use for prediction")
    features: Dict[str, float] = Field(..., description="Feature values for prediction")
    return_probabilities: bool = Field(False, description="Whether to return probabilities")


class BatchPredictionRequest(BaseModel):
    """Request model for batch predictions"""
    model_id: str = Field(..., description="Model ID to use for prediction")
    features: List[Dict[str, float]] = Field(..., description="List of feature dictionaries")
    return_probabilities: bool = Field(False, description="Whether to return probabilities")


class PredictionResponse(BaseModel):
    """Response model for predictions"""
    model_id: str
    prediction: Any
    probability: Optional[float] = None
    confidence: Optional[float] = None
    timestamp: datetime
    processing_time_ms: float


class BatchPredictionResponse(BaseModel):
    """Response model for batch predictions"""
    model_id: str
    predictions: List[Any]
    probabilities: Optional[List[float]] = None
    confidences: Optional[List[float]] = None
    timestamp: datetime
    processing_time_ms: float
    count: int


class ModelInfo(BaseModel):
    """Model information"""
    model_id: str
    model_type: str
    features: List[str]
    target: str
    created_at: datetime
    last_used: datetime
    prediction_count: int
    average_processing_time: float


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    models_loaded: int
    cache_usage: float


class ModelLoader:
    """Load and manage ML models"""
    
    @staticmethod
    def load_model(model_path: str) -> Any:
        """Load model from file"""
        try:
            if model_path.endswith('.joblib'):
                return joblib.load(model_path)
            elif model_path.endswith('.pkl'):
                with open(model_path, 'rb') as f:
                    return pickle.load(f)
            elif model_path.endswith('.h5'):
                # TensorFlow/Keras model
                import tensorflow as tf
                return tf.keras.models.load_model(model_path)
            elif model_path.endswith('.model'):
                # XGBoost/LightGBM model
                try:
                    import xgboost as xgb
                    model = xgb.XGBClassifier()
                    model.load_model(model_path)
                    return model
                except ImportError:
                    try:
                        import lightgbm as lgb
                        return lgb.Booster(model_file=model_path)
                    except ImportError:
                        raise HTTPException(status_code=500, detail="XGBoost/LightGBM not available")
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported model format: {model_path}")
                
        except Exception as e:
            logger.error(f"Error loading model {model_path}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")
    
    @staticmethod
    def load_metadata(metadata_path: str) -> Dict[str, Any]:
        """Load model metadata"""
        try:
            with open(metadata_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load metadata {metadata_path}: {str(e)}")
            return {}


class ModelManager:
    """Manage model lifecycle and caching"""
    
    def __init__(self):
        self.cache = model_cache
        self.metadata = model_metadata
        self.max_cache_size = MAX_CACHE_SIZE
        self.usage_stats = {}
    
    def get_model(self, model_id: str):
        """Get model from cache or load it"""
        if model_id in self.cache:
            # Update usage stats
            self._update_usage_stats(model_id)
            return self.cache[model_id]
        
        # Load model
        model_path = self._find_model_file(model_id)
        if not model_path:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        # Load model and metadata
        model = ModelLoader.load_model(model_path)
        metadata_path = model_path.replace(Path(model_path).suffix, '_metadata.json')
        metadata = ModelLoader.load_metadata(metadata_path)
        
        # Add to cache
        self._add_to_cache(model_id, model, metadata)
        
        return model
    
    def _find_model_file(self, model_id: str) -> Optional[str]:
        """Find model file by ID"""
        model_dir = Path(MODEL_PATH)
        
        # Look for files starting with model_id
        patterns = [
            f"model_{model_id}_*.joblib",
            f"model_{model_id}_*.pkl",
            f"model_{model_id}_*.h5",
            f"model_{model_id}_*.model"
        ]
        
        for pattern in patterns:
            matches = list(model_dir.glob(pattern))
            if matches:
                # Return the most recent file
                return str(max(matches, key=os.path.getctime))
        
        return None
    
    def _add_to_cache(self, model_id: str, model: Any, metadata: Dict[str, Any]):
        """Add model to cache with LRU eviction"""
        
        # Remove old models if cache is full
        if len(self.cache) >= self.max_cache_size:
            # Remove least recently used model
            lru_model_id = min(self.usage_stats.keys(), key=lambda x: self.usage_stats[x]['last_used'])
            del self.cache[lru_model_id]
            del self.metadata[lru_model_id]
            del self.usage_stats[lru_model_id]
            logger.info(f"Evicted model {lru_model_id} from cache")
        
        # Add new model
        self.cache[model_id] = model
        self.metadata[model_id] = metadata
        self._update_usage_stats(model_id)
        
        logger.info(f"Loaded model {model_id} into cache")
    
    def _update_usage_stats(self, model_id: str):
        """Update usage statistics"""
        now = datetime.now()
        if model_id not in self.usage_stats:
            self.usage_stats[model_id] = {
                'last_used': now,
                'prediction_count': 0,
                'total_processing_time': 0.0
            }
        
        self.usage_stats[model_id]['last_used'] = now
        self.usage_stats[model_id]['prediction_count'] += 1
    
    def update_processing_time(self, model_id: str, processing_time: float):
        """Update processing time statistics"""
        if model_id in self.usage_stats:
            self.usage_stats[model_id]['total_processing_time'] += processing_time
    
    def get_model_info(self, model_id: str) -> ModelInfo:
        """Get model information"""
        if model_id not in self.cache:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not loaded")
        
        stats = self.usage_stats.get(model_id, {})
        metadata = self.metadata.get(model_id, {})
        
        avg_processing_time = 0.0
        if stats.get('prediction_count', 0) > 0:
            avg_processing_time = stats['total_processing_time'] / stats['prediction_count']
        
        return ModelInfo(
            model_id=model_id,
            model_type=metadata.get('model_type', 'unknown'),
            features=metadata.get('features', []),
            target=metadata.get('target', 'unknown'),
            created_at=datetime.fromisoformat(metadata.get('timestamp', datetime.now().isoformat())),
            last_used=stats.get('last_used', datetime.now()),
            prediction_count=stats.get('prediction_count', 0),
            average_processing_time=avg_processing_time
        )


# Global model manager
model_manager = ModelManager()


def preprocess_features(features: Dict[str, float], model_id: str) -> np.ndarray:
    """Preprocess features for prediction"""
    
    # Get model metadata to understand expected features
    metadata = model_metadata.get(model_id, {})
    expected_features = metadata.get('features', [])
    
    if expected_features:
        # Ensure all expected features are present
        processed_features = []
        for feature in expected_features:
            if feature in features:
                processed_features.append(features[feature])
            else:
                # Use default value (0.0) for missing features
                processed_features.append(0.0)
        
        return np.array([processed_features])
    else:
        # If no metadata, use features as provided
        return np.array([list(features.values())])


async def make_prediction(model: Any, features: np.ndarray, return_probabilities: bool = False) -> tuple:
    """Make prediction with timeout"""
    
    try:
        # Run prediction in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        
        # Make prediction
        if hasattr(model, 'predict'):
            prediction = await loop.run_in_executor(None, model.predict, features)
        else:
            raise HTTPException(status_code=500, detail="Model does not support prediction")
        
        # Get probabilities if requested
        probabilities = None
        if return_probabilities and hasattr(model, 'predict_proba'):
            probabilities = await loop.run_in_executor(None, model.predict_proba, features)
            probabilities = probabilities[0]  # Get first sample
        
        return prediction, probabilities
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Prediction timeout")
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        models_loaded=len(model_cache),
        cache_usage=len(model_cache) / MAX_CACHE_SIZE
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make single prediction"""
    
    start_time = datetime.now()
    
    try:
        # Get model
        model = model_manager.get_model(request.model_id)
        
        # Preprocess features
        features = preprocess_features(request.features, request.model_id)
        
        # Make prediction with timeout
        prediction, probabilities = await asyncio.wait_for(
            make_prediction(model, features, request.return_probabilities),
            timeout=PREDICTION_TIMEOUT
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        model_manager.update_processing_time(request.model_id, processing_time)
        
        # Prepare response
        response = PredictionResponse(
            model_id=request.model_id,
            prediction=prediction[0] if len(prediction) == 1 else prediction.tolist(),
            timestamp=datetime.now(),
            processing_time_ms=processing_time
        )
        
        if probabilities is not None:
            response.probability = float(probabilities[1] if len(probabilities) > 1 else probabilities[0])
            response.confidence = float(np.max(probabilities))
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction error for model {request.model_id}: {str(e)}")
        raise


@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Make batch predictions"""
    
    start_time = datetime.now()
    
    try:
        # Get model
        model = model_manager.get_model(request.model_id)
        
        # Preprocess all features
        features_list = []
        for feature_dict in request.features:
            features = preprocess_features(feature_dict, request.model_id)
            features_list.append(features[0])  # Extract the feature array
        
        features_array = np.array(features_list)
        
        # Make predictions with timeout
        predictions, probabilities = await asyncio.wait_for(
            make_prediction(model, features_array, request.return_probabilities),
            timeout=PREDICTION_TIMEOUT * 2  # Longer timeout for batch
        )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        model_manager.update_processing_time(request.model_id, processing_time)
        
        # Prepare response
        response = BatchPredictionResponse(
            model_id=request.model_id,
            predictions=predictions.tolist(),
            timestamp=datetime.now(),
            processing_time_ms=processing_time,
            count=len(predictions)
        )
        
        if probabilities is not None:
            response.probabilities = probabilities[:, 1].tolist() if probabilities.shape[1] > 1 else probabilities[:, 0].tolist()
            response.confidences = np.max(probabilities, axis=1).tolist()
        
        return response
        
    except Exception as e:
        logger.error(f"Batch prediction error for model {request.model_id}: {str(e)}")
        raise


@app.get("/models/{model_id}", response_model=ModelInfo)
async def get_model_info(model_id: str):
    """Get model information"""
    return model_manager.get_model_info(model_id)


@app.get("/models")
async def list_models():
    """List all loaded models"""
    models = []
    for model_id in model_cache.keys():
        try:
            model_info = model_manager.get_model_info(model_id)
            models.append(model_info.dict())
        except:
            pass
    
    return {"models": models, "count": len(models)}


@app.delete("/models/{model_id}")
async def unload_model(model_id: str):
    """Unload model from cache"""
    if model_id in model_cache:
        del model_cache[model_id]
        del model_metadata[model_id]
        if model_id in model_manager.usage_stats:
            del model_manager.usage_stats[model_id]
        logger.info(f"Unloaded model {model_id}")
        return {"message": f"Model {model_id} unloaded"}
    else:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")


@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info(f"Starting ML Server with model path: {MODEL_PATH}")
    logger.info(f"Max cache size: {MAX_CACHE_SIZE}")
    logger.info(f"Prediction timeout: {PREDICTION_TIMEOUT}s")
    
    # Preload models if needed
    # This could be configured via environment variables
    pass


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown tasks"""
    logger.info("Shutting down ML Server")
    model_cache.clear()
    model_metadata.clear()


if __name__ == "__main__":
    uvicorn.run(
        "ml_server:app",
        host="0.0.0.0",
        port=8001,
        workers=1,  # Use single worker for shared cache
        log_level="info",
        access_log=True
    )