"""
Advanced ML Engines for ShareWise AI Trading Platform
Includes Deep Learning, AutoML, and Ensemble methods
"""
import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union
from abc import ABC, abstractmethod
from datetime import datetime, timedelta

try:
    # Deep Learning
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.models import Sequential, Model
    from tensorflow.keras.layers import Dense, LSTM, Dropout, BatchNormalization, Conv1D, MaxPooling1D, Flatten
    from tensorflow.keras.optimizers import Adam, RMSprop
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    from sklearn.preprocessing import MinMaxScaler, StandardScaler
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    # AutoML
    from optuna import create_study, Trial
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False

try:
    # Advanced ML
    from sklearn.ensemble import VotingClassifier, StackingClassifier, BaggingClassifier
    from sklearn.model_selection import GridSearchCV, RandomizedSearchCV, cross_val_score
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler, RobustScaler
    from sklearn.feature_selection import SelectKBest, f_classif, RFE
    from sklearn.metrics import classification_report, confusion_matrix
    import xgboost as xgb
    import lightgbm as lgb
    SKLEARN_ADVANCED_AVAILABLE = True
except ImportError:
    SKLEARN_ADVANCED_AVAILABLE = False

try:
    # Time Series
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False

logger = logging.getLogger(__name__)


class MLEngine(ABC):
    """Abstract base class for ML engines"""
    
    def __init__(self, model_config: Dict[str, Any]):
        self.model_config = model_config
        self.model = None
        self.scaler = None
        self.feature_selector = None
        
    @abstractmethod
    def build_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build the ML model"""
        pass
    
    @abstractmethod
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, Any]:
        """Train the model"""
        pass
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        pass


class DeepLearningEngine(MLEngine):
    """Deep Learning engine using TensorFlow/Keras"""
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow not available. Please install: pip install tensorflow")
        
        # Set random seeds for reproducibility
        tf.random.set_seed(42)
        np.random.seed(42)
        
        self.model_type = model_config.get('model_type', 'dense')
        self.sequence_length = model_config.get('sequence_length', 60)
        self.scaler = StandardScaler()
    
    def build_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build deep learning model based on type"""
        
        if self.model_type == 'lstm':
            return self._build_lstm_model(input_shape)
        elif self.model_type == 'cnn':
            return self._build_cnn_model(input_shape)
        elif self.model_type == 'transformer':
            return self._build_transformer_model(input_shape)
        else:
            return self._build_dense_model(input_shape)
    
    def _build_lstm_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build LSTM model for time series prediction"""
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=input_shape),
            Dropout(0.3),
            BatchNormalization(),
            
            LSTM(64, return_sequences=True),
            Dropout(0.3),
            BatchNormalization(),
            
            LSTM(32, return_sequences=False),
            Dropout(0.3),
            
            Dense(64, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(32, activation='relu'),
            Dropout(0.2),
            
            Dense(1, activation='sigmoid')  # Binary classification
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        return model
    
    def _build_cnn_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build CNN model for pattern recognition"""
        model = Sequential([
            Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape),
            MaxPooling1D(pool_size=2),
            BatchNormalization(),
            
            Conv1D(filters=128, kernel_size=3, activation='relu'),
            MaxPooling1D(pool_size=2),
            BatchNormalization(),
            
            Conv1D(filters=64, kernel_size=3, activation='relu'),
            MaxPooling1D(pool_size=2),
            BatchNormalization(),
            
            Flatten(),
            
            Dense(128, activation='relu'),
            Dropout(0.5),
            BatchNormalization(),
            
            Dense(64, activation='relu'),
            Dropout(0.3),
            
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _build_dense_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build dense neural network"""
        model = Sequential([
            Dense(512, activation='relu', input_shape=input_shape),
            BatchNormalization(),
            Dropout(0.4),
            
            Dense(256, activation='relu'),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(128, activation='relu'),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(64, activation='relu'),
            Dropout(0.2),
            
            Dense(32, activation='relu'),
            Dropout(0.2),
            
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        return model
    
    def _build_transformer_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build Transformer model for sequence processing"""
        from tensorflow.keras.layers import MultiHeadAttention, LayerNormalization
        
        inputs = keras.Input(shape=input_shape)
        
        # Multi-head attention
        attention = MultiHeadAttention(
            num_heads=8,
            key_dim=64,
            dropout=0.1
        )(inputs, inputs)
        
        attention = LayerNormalization()(attention + inputs)
        
        # Feed forward network
        ffn = Dense(256, activation='relu')(attention)
        ffn = Dropout(0.3)(ffn)
        ffn = Dense(input_shape[-1])(ffn)
        ffn = LayerNormalization()(ffn + attention)
        
        # Global average pooling and classification
        pooled = tf.keras.layers.GlobalAveragePooling1D()(ffn)
        
        outputs = Dense(128, activation='relu')(pooled)
        outputs = Dropout(0.3)(outputs)
        outputs = Dense(64, activation='relu')(outputs)
        outputs = Dropout(0.2)(outputs)
        outputs = Dense(1, activation='sigmoid')(outputs)
        
        model = Model(inputs=inputs, outputs=outputs)
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def prepare_sequences(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare sequences for LSTM/CNN models"""
        if self.model_type not in ['lstm', 'cnn', 'transformer']:
            return X, y
        
        X_seq = []
        y_seq = []
        
        for i in range(self.sequence_length, len(X)):
            X_seq.append(X[i-self.sequence_length:i])
            y_seq.append(y[i])
        
        return np.array(X_seq), np.array(y_seq)
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, Any]:
        """Train the deep learning model"""
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
        else:
            X_val_scaled = None
        
        # Prepare sequences if needed
        if self.model_type in ['lstm', 'cnn', 'transformer']:
            X_train_seq, y_train_seq = self.prepare_sequences(X_train_scaled, y_train)
            if X_val_scaled is not None:
                X_val_seq, y_val_seq = self.prepare_sequences(X_val_scaled, y_val)
            else:
                X_val_seq, y_val_seq = None, None
        else:
            X_train_seq, y_train_seq = X_train_scaled, y_train
            X_val_seq, y_val_seq = X_val_scaled, y_val
        
        # Build model
        if self.model_type in ['lstm', 'cnn', 'transformer']:
            input_shape = (X_train_seq.shape[1], X_train_seq.shape[2])
        else:
            input_shape = (X_train_seq.shape[1],)
        
        self.model = self.build_model(input_shape)
        
        # Callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.2,
                patience=5,
                min_lr=1e-7
            )
        ]
        
        # Training
        validation_data = None
        if X_val_seq is not None and y_val_seq is not None:
            validation_data = (X_val_seq, y_val_seq)
        
        history = self.model.fit(
            X_train_seq, y_train_seq,
            validation_data=validation_data,
            epochs=self.model_config.get('epochs', 100),
            batch_size=self.model_config.get('batch_size', 32),
            callbacks=callbacks,
            verbose=1
        )
        
        # Return training metrics
        return {
            'final_loss': float(history.history['loss'][-1]),
            'final_accuracy': float(history.history['accuracy'][-1]),
            'val_loss': float(history.history['val_loss'][-1]) if 'val_loss' in history.history else None,
            'val_accuracy': float(history.history['val_accuracy'][-1]) if 'val_accuracy' in history.history else None,
            'epochs_trained': len(history.history['loss'])
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        
        if self.model_type in ['lstm', 'cnn', 'transformer']:
            X_seq, _ = self.prepare_sequences(X_scaled, np.zeros(len(X_scaled)))
            return self.model.predict(X_seq)
        else:
            return self.model.predict(X_scaled)


class AutoMLEngine(MLEngine):
    """AutoML engine using Optuna for hyperparameter optimization"""
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        if not OPTUNA_AVAILABLE:
            raise ImportError("Optuna not available. Please install: pip install optuna")
        
        self.n_trials = model_config.get('n_trials', 100)
        self.cv_folds = model_config.get('cv_folds', 5)
        self.best_params = None
        self.study = None
    
    def build_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build model with optimized hyperparameters"""
        # This will be called after hyperparameter optimization
        pass
    
    def objective(self, trial: Any, X: np.ndarray, y: np.ndarray) -> float:
        """Optuna objective function"""
        
        # Suggest hyperparameters
        algorithm = trial.suggest_categorical('algorithm', ['xgboost', 'lightgbm', 'random_forest', 'svm'])
        
        if algorithm == 'xgboost':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.5, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0)
            }
            model = xgb.XGBClassifier(**params, random_state=42)
            
        elif algorithm == 'lightgbm':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.5, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0)
            }
            model = lgb.LGBMClassifier(**params, random_state=42)
            
        elif algorithm == 'random_forest':
            from sklearn.ensemble import RandomForestClassifier
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500),
                'max_depth': trial.suggest_int('max_depth', 5, 20),
                'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
                'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 5)
            }
            model = RandomForestClassifier(**params, random_state=42)
            
        else:  # SVM
            from sklearn.svm import SVC
            params = {
                'C': trial.suggest_float('C', 0.1, 10.0),
                'kernel': trial.suggest_categorical('kernel', ['rbf', 'linear']),
                'gamma': trial.suggest_categorical('gamma', ['scale', 'auto'])
            }
            model = SVC(**params, random_state=42)
        
        # Cross-validation
        scores = cross_val_score(model, X, y, cv=self.cv_folds, scoring='accuracy')
        return scores.mean()
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, Any]:
        """Train with hyperparameter optimization"""
        
        # Feature scaling
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Create study and optimize
        self.study = create_study(direction='maximize')
        self.study.optimize(
            lambda trial: self.objective(trial, X_train_scaled, y_train),
            n_trials=self.n_trials
        )
        
        self.best_params = self.study.best_params
        
        # Train final model with best parameters
        algorithm = self.best_params.pop('algorithm')
        
        if algorithm == 'xgboost':
            self.model = xgb.XGBClassifier(**self.best_params, random_state=42)
        elif algorithm == 'lightgbm':
            self.model = lgb.LGBMClassifier(**self.best_params, random_state=42)
        elif algorithm == 'random_forest':
            from sklearn.ensemble import RandomForestClassifier
            self.model = RandomForestClassifier(**self.best_params, random_state=42)
        else:
            from sklearn.svm import SVC
            self.model = SVC(**self.best_params, random_state=42)
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        val_score = None
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_score = self.model.score(X_val_scaled, y_val)
        
        return {
            'best_params': self.best_params,
            'best_cv_score': self.study.best_value,
            'train_score': train_score,
            'val_score': val_score,
            'n_trials': len(self.study.trials)
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)[:, 1]


class EnsembleEngine(MLEngine):
    """Ensemble engine combining multiple models"""
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        self.ensemble_method = model_config.get('ensemble_method', 'voting')
        self.base_models = []
        self.ensemble_model = None
        self.scaler = StandardScaler()
    
    def build_model(self, input_shape: Tuple[int, ...]) -> Any:
        """Build ensemble model"""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.linear_model import LogisticRegression
        from sklearn.svm import SVC
        
        # Define base models
        base_models = [
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('xgb', xgb.XGBClassifier(n_estimators=100, random_state=42)),
            ('lgb', lgb.LGBMClassifier(n_estimators=100, random_state=42)),
            ('lr', LogisticRegression(random_state=42)),
        ]
        
        if self.ensemble_method == 'voting':
            self.ensemble_model = VotingClassifier(
                estimators=base_models,
                voting='soft'
            )
        elif self.ensemble_method == 'stacking':
            self.ensemble_model = StackingClassifier(
                estimators=base_models,
                final_estimator=LogisticRegression(random_state=42),
                cv=5
            )
        
        return self.ensemble_model
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray = None, y_val: np.ndarray = None) -> Dict[str, Any]:
        """Train ensemble model"""
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Build and train ensemble
        self.model = self.build_model(X_train_scaled.shape)
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        val_score = None
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_score = self.model.score(X_val_scaled, y_val)
        
        # Get individual model scores for analysis
        individual_scores = {}
        for name, estimator in self.model.named_estimators_.items():
            individual_scores[name] = estimator.score(X_train_scaled, y_train)
        
        return {
            'train_score': train_score,
            'val_score': val_score,
            'individual_scores': individual_scores,
            'ensemble_method': self.ensemble_method
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)[:, 1]


class MLEngineFactory:
    """Factory for creating ML engines"""
    
    @staticmethod
    def create_engine(engine_type: str, model_config: Dict[str, Any]) -> MLEngine:
        """Create ML engine based on type"""
        
        if engine_type == 'deep_learning':
            return DeepLearningEngine(model_config)
        elif engine_type == 'automl':
            return AutoMLEngine(model_config)
        elif engine_type == 'ensemble':
            return EnsembleEngine(model_config)
        else:
            raise ValueError(f"Unknown engine type: {engine_type}")


class AdvancedFeatureEngineer:
    """Advanced feature engineering for financial time series"""
    
    @staticmethod
    def create_technical_features(df: pd.DataFrame) -> pd.DataFrame:
        """Create advanced technical indicators"""
        
        # Price-based features
        df['price_change'] = df['close'].pct_change()
        df['volatility'] = df['price_change'].rolling(20).std()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        
        # Moving averages
        for window in [5, 10, 20, 50]:
            df[f'sma_{window}'] = df['close'].rolling(window).mean()
            df[f'ema_{window}'] = df['close'].ewm(span=window).mean()
        
        # Price ratios
        df['price_to_sma_20'] = df['close'] / df['sma_20']
        df['sma_5_to_20'] = df['sma_5'] / df['sma_20']
        
        # Bollinger Bands
        bb_period = 20
        bb_std = 2
        df['bb_middle'] = df['close'].rolling(bb_period).mean()
        bb_std_val = df['close'].rolling(bb_period).std()
        df['bb_upper'] = df['bb_middle'] + (bb_std_val * bb_std)
        df['bb_lower'] = df['bb_middle'] - (bb_std_val * bb_std)
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        ema_12 = df['close'].ewm(span=12).mean()
        ema_26 = df['close'].ewm(span=26).mean()
        df['macd'] = ema_12 - ema_26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        return df
    
    @staticmethod
    def create_fno_features(df: pd.DataFrame) -> pd.DataFrame:
        """Create F&O specific features"""
        
        if 'option_type' in df.columns:
            # Options features
            df['moneyness'] = df['underlying_price'] / df['strike_price']
            df['time_to_expiry'] = pd.to_datetime(df['expiry_date']) - pd.to_datetime(df['date'])
            df['time_to_expiry_days'] = df['time_to_expiry'].dt.days
            
            # Implied volatility features
            df['iv_rank'] = df.groupby('symbol')['implied_volatility'].rank(pct=True)
            df['iv_percentile'] = df.groupby('symbol')['implied_volatility'].rolling(252).apply(
                lambda x: (x.iloc[-1] <= x).mean()
            )
        
        if 'futures_price' in df.columns:
            # Futures features
            df['basis'] = df['futures_price'] - df['underlying_price']
            df['basis_pct'] = df['basis'] / df['underlying_price'] * 100
            df['cost_of_carry'] = df['basis'] / df['underlying_price'] * 365 / df.get('days_to_expiry', 30)
        
        return df
    
    @staticmethod
    def create_lag_features(df: pd.DataFrame, columns: List[str], lags: List[int]) -> pd.DataFrame:
        """Create lagged features"""
        for col in columns:
            for lag in lags:
                df[f'{col}_lag_{lag}'] = df[col].shift(lag)
        return df
    
    @staticmethod
    def create_rolling_features(df: pd.DataFrame, columns: List[str], windows: List[int]) -> pd.DataFrame:
        """Create rolling statistical features"""
        for col in columns:
            for window in windows:
                df[f'{col}_mean_{window}'] = df[col].rolling(window).mean()
                df[f'{col}_std_{window}'] = df[col].rolling(window).std()
                df[f'{col}_min_{window}'] = df[col].rolling(window).min()
                df[f'{col}_max_{window}'] = df[col].rolling(window).max()
                df[f'{col}_skew_{window}'] = df[col].rolling(window).skew()
        return df