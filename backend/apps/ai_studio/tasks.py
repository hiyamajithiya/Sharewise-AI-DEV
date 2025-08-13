import os
import json
import pickle
import joblib
from datetime import datetime, timedelta
from celery import shared_task
from django.utils import timezone
from django.conf import settings
import logging

try:
    import pandas as pd
    import numpy as np
    from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler
    from sklearn.feature_selection import SelectKBest, f_classif, RFE
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
        classification_report, confusion_matrix, roc_curve, precision_recall_curve
    )
    from sklearn.pipeline import Pipeline
    import shap
    ML_PACKAGES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"ML packages not available: {e}")
    ML_PACKAGES_AVAILABLE = False

try:
    import xgboost as xgb
    import lightgbm as lgb
    ADVANCED_ML_AVAILABLE = True
except ImportError:
    ADVANCED_ML_AVAILABLE = False

try:
    import yfinance as yf
    import talib
    MARKET_DATA_AVAILABLE = True
except ImportError:
    MARKET_DATA_AVAILABLE = False

from .models import MLModel, TrainingJob
from .ml_engines import MLEngineFactory, AdvancedFeatureEngineer
from .model_monitoring import ModelMonitor
from .fno_analytics import FnOBacktester, FnOPerformanceAnalyzer

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def start_model_training(self, model_id, training_job_id):
    """
    Asynchronous task to train ML model
    """
    if not ML_PACKAGES_AVAILABLE:
        raise Exception("ML packages not available. Please install scikit-learn, pandas, numpy, and shap.")
    
    try:
        # Get model and training job
        model = MLModel.objects.get(id=model_id)
        training_job = TrainingJob.objects.get(id=training_job_id)
        
        # Update training job status
        training_job.status = TrainingJob.Status.RUNNING
        training_job.started_at = timezone.now()
        training_job.current_step = "Initializing training"
        training_job.progress_percentage = 0
        training_job.save()
        
        # Step 1: Data Preparation
        self.update_state(
            state='PROGRESS',
            meta={'current': 1, 'total': 6, 'status': 'Preparing data...'}
        )
        training_job.current_step = "Preparing training data"
        training_job.progress_percentage = 10
        training_job.save()
        
        training_data = prepare_training_data(model)
        if training_data is None:
            raise Exception("Failed to prepare training data")
        
        # Step 2: Feature Engineering
        self.update_state(
            state='PROGRESS',
            meta={'current': 2, 'total': 6, 'status': 'Engineering features...'}
        )
        training_job.current_step = "Engineering features"
        training_job.progress_percentage = 25
        training_job.save()
        
        X, y = engineer_features(training_data, model.features, model.target_variable)
        
        # Step 3: Train-Test Split
        self.update_state(
            state='PROGRESS',
            meta={'current': 3, 'total': 6, 'status': 'Splitting data...'}
        )
        training_job.current_step = "Splitting training and validation data"
        training_job.progress_percentage = 40
        training_job.save()
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=model.validation_split,
            random_state=42,
            stratify=y
        )
        
        # Step 4: Model Training
        self.update_state(
            state='PROGRESS',
            meta={'current': 4, 'total': 6, 'status': 'Training model...'}
        )
        training_job.current_step = "Training ML model"
        training_job.progress_percentage = 60
        training_job.save()
        
        trained_model = train_ml_model(
            X_train, y_train, 
            model.model_type, 
            model.training_parameters,
            model  # Pass model object for advanced features
        )
        
        # Step 5: Model Evaluation
        self.update_state(
            state='PROGRESS',
            meta={'current': 5, 'total': 6, 'status': 'Evaluating performance...'}
        )
        training_job.current_step = "Evaluating model performance"
        training_job.progress_percentage = 80
        training_job.save()
        
        metrics = evaluate_model(trained_model, X_test, y_test)
        
        # Step 6: Feature Importance and Backtesting
        self.update_state(
            state='PROGRESS',
            meta={'current': 6, 'total': 6, 'status': 'Generating insights...'}
        )
        training_job.current_step = "Generating feature importance and backtesting"
        training_job.progress_percentage = 90
        training_job.save()
        
        # Generate SHAP values for explainability
        feature_importance = generate_feature_importance(trained_model, X_test, model.features)
        
        # Run backtest
        backtest_results = run_backtest(trained_model, X_test, y_test)
        
        # Save model file
        model_file_path = save_model_file(trained_model, model_id)
        
        # Update model with results
        model.accuracy = metrics['accuracy']
        model.precision = metrics['precision']
        model.recall = metrics['recall']
        model.f1_score = metrics['f1_score']
        model.auc_roc = metrics['auc_roc']
        model.training_results = metrics
        model.feature_importance = feature_importance
        model.backtest_results = backtest_results
        model.total_return = backtest_results.get('total_return', 0)
        model.sharpe_ratio = backtest_results.get('sharpe_ratio', 0)
        model.sortino_ratio = backtest_results.get('sortino_ratio', 0)
        model.max_drawdown = backtest_results.get('max_drawdown', 0)
        model.win_rate = backtest_results.get('win_rate', 0)
        model.model_file_path = model_file_path
        model.status = MLModel.Status.COMPLETED
        model.training_completed_at = timezone.now()
        model.save()
        
        # Update training job
        training_job.status = TrainingJob.Status.COMPLETED
        training_job.completed_at = timezone.now()
        training_job.current_step = "Training completed successfully"
        training_job.progress_percentage = 100
        training_job.result_data = {
            'metrics': metrics,
            'backtest_results': backtest_results,
            'feature_importance': feature_importance
        }
        training_job.save()
        
        logger.info(f"Training completed successfully for model {model_id}")
        return {
            'status': 'success',
            'model_id': model_id,
            'metrics': metrics
        }
        
    except Exception as e:
        logger.error(f"Training failed for model {model_id}: {str(e)}")
        
        # Update model status
        try:
            model = MLModel.objects.get(id=model_id)
            model.status = MLModel.Status.FAILED
            model.save()
            
            training_job = TrainingJob.objects.get(id=training_job_id)
            training_job.status = TrainingJob.Status.FAILED
            training_job.error_message = str(e)
            training_job.completed_at = timezone.now()
            training_job.save()
        except:
            pass
        
        raise e


def prepare_training_data(model):
    """Prepare enhanced training data for the model"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=model.training_period_days)
        
        # Enhanced mock data generation with realistic patterns
        np.random.seed(42)
        n_samples = model.training_period_days * 10  # 10 samples per day
        
        # Generate base price series with trends
        base_price = 1500
        price_changes = np.random.normal(0, 0.02, n_samples)  # 2% daily volatility
        prices = [base_price]
        for change in price_changes:
            new_price = prices[-1] * (1 + change)
            prices.append(new_price)
        prices = np.array(prices[1:])
        
        # Generate volume with inverse correlation to price changes
        volumes = 50000 + np.random.normal(0, 15000, n_samples) + \
                 (-price_changes * 20000)  # Higher volume on bigger moves
        volumes = np.clip(volumes, 1000, 200000)
        
        # Create comprehensive dataset
        data = {
            'timestamp': pd.date_range(start=start_date, end=end_date, periods=n_samples),
            'symbol': np.random.choice(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'RELIANCE', 'TCS'], n_samples),
            'open': prices + np.random.normal(0, prices * 0.001),
            'high': prices + np.abs(np.random.normal(0, prices * 0.005)),
            'low': prices - np.abs(np.random.normal(0, prices * 0.005)),
            'close': prices,
            'volume': volumes,
            'returns': price_changes,
        }
        
        df = pd.DataFrame(data)
        
        # Add technical indicators using advanced feature engineering
        df = AdvancedFeatureEngineer.create_technical_features(df)
        
        # Add F&O specific features if applicable
        if model.model_type in ['OPTIONS_STRATEGY', 'FUTURES_MOMENTUM', 'VOLATILITY_TRADING']:
            # Add mock F&O data
            df['strike_price'] = df['close'] + np.random.normal(0, 100, len(df))
            df['implied_volatility'] = 0.2 + np.random.normal(0, 0.05, len(df))
            df['delta'] = np.random.uniform(0.2, 0.8, len(df))
            df['gamma'] = np.random.uniform(0.001, 0.05, len(df))
            df['theta'] = -np.random.uniform(0.1, 2.0, len(df))
            df['vega'] = np.random.uniform(5, 50, len(df))
            
            df = AdvancedFeatureEngineer.create_fno_features(df)
        
        # Add lag features
        price_columns = ['close', 'volume', 'volatility']
        df = AdvancedFeatureEngineer.create_lag_features(df, price_columns, [1, 2, 3, 5])
        
        # Add rolling features
        df = AdvancedFeatureEngineer.create_rolling_features(
            df, ['returns'], [5, 10, 20]
        )
        
        # Generate intelligent signals based on technical analysis
        df['signal_type'] = generate_intelligent_signals(df)
        
        # Remove NaN values
        df = df.dropna()
        
        logger.info(f"Generated {len(df)} samples with {len(df.columns)} features")
        return df
        
    except Exception as e:
        logger.error(f"Error preparing training data: {str(e)}")
        return None


def generate_intelligent_signals(df):
    """Generate intelligent buy/sell signals based on technical analysis"""
    signals = []
    
    for i in range(len(df)):
        # Multi-factor signal generation
        buy_signals = 0
        sell_signals = 0
        
        # RSI signals
        if 'rsi' in df.columns:
            rsi = df.iloc[i]['rsi']
            if rsi < 30:
                buy_signals += 2
            elif rsi > 70:
                sell_signals += 2
        
        # MACD signals
        if 'macd' in df.columns and 'macd_signal' in df.columns:
            macd = df.iloc[i]['macd']
            macd_signal = df.iloc[i]['macd_signal']
            if macd > macd_signal:
                buy_signals += 1
            else:
                sell_signals += 1
        
        # Bollinger Band signals
        if 'bb_position' in df.columns:
            bb_pos = df.iloc[i]['bb_position']
            if bb_pos < 0.2:
                buy_signals += 1
            elif bb_pos > 0.8:
                sell_signals += 1
        
        # Price momentum
        if 'price_to_sma_20' in df.columns:
            price_ratio = df.iloc[i]['price_to_sma_20']
            if price_ratio > 1.02:
                buy_signals += 1
            elif price_ratio < 0.98:
                sell_signals += 1
        
        # Determine final signal
        if buy_signals > sell_signals + 1:
            signals.append('BUY')
        elif sell_signals > buy_signals + 1:
            signals.append('SELL')
        else:
            signals.append('HOLD')
    
    return signals


def engineer_features(data, selected_features, target_variable):
    """Engineer features for training"""
    try:
        # Select only the features specified by the user
        feature_columns = [col for col in selected_features if col in data.columns]
        
        if not feature_columns:
            raise Exception("No valid features found in data")
        
        X = data[feature_columns].fillna(0)  # Handle missing values
        
        # Encode target variable
        if target_variable == 'signal_type':
            y = data[target_variable].map({'BUY': 1, 'SELL': 0, 'HOLD': 0})
        else:
            y = data[target_variable]
        
        return X, y
        
    except Exception as e:
        logger.error(f"Error engineering features: {str(e)}")
        raise e


def train_ml_model(X_train, y_train, model_type, training_parameters, model_obj=None):
    """Train advanced ML model with multiple engines"""
    try:
        algorithm = training_parameters.get('algorithm', 'random_forest')
        use_advanced_engine = training_parameters.get('use_advanced_engine', False)
        
        # Use advanced ML engines for specific model types
        if use_advanced_engine and model_obj:
            engine_type = training_parameters.get('engine_type', 'automl')
            
            if engine_type in ['deep_learning', 'automl', 'ensemble']:
                try:
                    engine = MLEngineFactory.create_engine(engine_type, training_parameters)
                    
                    # Split for validation
                    X_train_split, X_val_split, y_train_split, y_val_split = train_test_split(
                        X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
                    )
                    
                    # Train with advanced engine
                    training_results = engine.train(
                        X_train_split, y_train_split, X_val_split, y_val_split
                    )
                    
                    logger.info(f"Advanced {engine_type} training completed: {training_results}")
                    return engine
                    
                except Exception as e:
                    logger.warning(f"Advanced engine failed, falling back to traditional ML: {str(e)}")
        
        # Traditional ML with enhanced hyperparameter tuning
        if training_parameters.get('hyperparameter_tuning', False):
            return train_with_hyperparameter_tuning(X_train, y_train, model_type, training_parameters)
        
        # Enhanced traditional model training
        model = create_enhanced_model(algorithm, training_parameters)
        
        # Create pipeline with preprocessing
        pipeline = create_ml_pipeline(model, training_parameters)
        
        # Train with cross-validation if specified
        if training_parameters.get('use_cv', False):
            cv_scores = cross_val_score(
                pipeline, X_train, y_train, 
                cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
                scoring='accuracy'
            )
            logger.info(f"CV Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        # Train final model
        pipeline.fit(X_train, y_train)
        return pipeline
        
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise e


def create_enhanced_model(algorithm, training_parameters):
    """Create enhanced model with optimized hyperparameters"""
    
    if algorithm == 'random_forest':
        return RandomForestClassifier(
            n_estimators=training_parameters.get('n_estimators', 200),
            max_depth=training_parameters.get('max_depth', 15),
            min_samples_split=training_parameters.get('min_samples_split', 5),
            min_samples_leaf=training_parameters.get('min_samples_leaf', 2),
            max_features=training_parameters.get('max_features', 'sqrt'),
            bootstrap=True,
            oob_score=True,
            random_state=42,
            n_jobs=-1
        )
    
    elif algorithm == 'xgboost' and ADVANCED_ML_AVAILABLE:
        return xgb.XGBClassifier(
            n_estimators=training_parameters.get('n_estimators', 200),
            max_depth=training_parameters.get('max_depth', 6),
            learning_rate=training_parameters.get('learning_rate', 0.1),
            subsample=training_parameters.get('subsample', 0.8),
            colsample_bytree=training_parameters.get('colsample_bytree', 0.8),
            reg_alpha=training_parameters.get('reg_alpha', 0.1),
            reg_lambda=training_parameters.get('reg_lambda', 1.0),
            random_state=42,
            n_jobs=-1
        )
    
    elif algorithm == 'lightgbm' and ADVANCED_ML_AVAILABLE:
        return lgb.LGBMClassifier(
            n_estimators=training_parameters.get('n_estimators', 200),
            max_depth=training_parameters.get('max_depth', 6),
            learning_rate=training_parameters.get('learning_rate', 0.1),
            subsample=training_parameters.get('subsample', 0.8),
            colsample_bytree=training_parameters.get('colsample_bytree', 0.8),
            reg_alpha=training_parameters.get('reg_alpha', 0.1),
            reg_lambda=training_parameters.get('reg_lambda', 1.0),
            random_state=42,
            n_jobs=-1
        )
    
    elif algorithm == 'gradient_boosting':
        return GradientBoostingClassifier(
            n_estimators=training_parameters.get('n_estimators', 200),
            learning_rate=training_parameters.get('learning_rate', 0.1),
            max_depth=training_parameters.get('max_depth', 6),
            subsample=training_parameters.get('subsample', 0.8),
            random_state=42
        )
    
    elif algorithm == 'svm':
        return SVC(
            C=training_parameters.get('C', 1.0),
            kernel=training_parameters.get('kernel', 'rbf'),
            gamma=training_parameters.get('gamma', 'scale'),
            probability=True,
            random_state=42
        )
    
    elif algorithm == 'ensemble':
        # Create voting ensemble
        estimators = [
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('lr', LogisticRegression(random_state=42)),
        ]
        
        if ADVANCED_ML_AVAILABLE:
            estimators.extend([
                ('xgb', xgb.XGBClassifier(n_estimators=100, random_state=42)),
                ('lgb', lgb.LGBMClassifier(n_estimators=100, random_state=42))
            ])
        
        return VotingClassifier(
            estimators=estimators,
            voting='soft'
        )
    
    else:
        # Default to enhanced Logistic Regression
        return LogisticRegression(
            C=training_parameters.get('C', 1.0),
            penalty=training_parameters.get('penalty', 'l2'),
            solver=training_parameters.get('solver', 'liblinear'),
            random_state=42,
            n_jobs=-1
        )


def create_ml_pipeline(model, training_parameters):
    """Create ML pipeline with preprocessing"""
    
    preprocessing_steps = []
    
    # Feature scaling
    scaler_type = training_parameters.get('scaler', 'standard')
    if scaler_type == 'standard':
        preprocessing_steps.append(('scaler', StandardScaler()))
    elif scaler_type == 'robust':
        preprocessing_steps.append(('scaler', RobustScaler()))
    elif scaler_type == 'minmax':
        preprocessing_steps.append(('scaler', MinMaxScaler()))
    
    # Feature selection
    if training_parameters.get('feature_selection', False):
        n_features = training_parameters.get('n_features_to_select', 20)
        preprocessing_steps.append(('selector', SelectKBest(f_classif, k=n_features)))
    
    # Create pipeline
    pipeline_steps = preprocessing_steps + [('model', model)]
    return Pipeline(pipeline_steps)


def train_with_hyperparameter_tuning(X_train, y_train, model_type, training_parameters):
    """Train model with hyperparameter tuning"""
    
    algorithm = training_parameters.get('algorithm', 'random_forest')
    
    # Define parameter grids for different algorithms
    param_grids = {
        'random_forest': {
            'model__n_estimators': [100, 200, 300],
            'model__max_depth': [10, 15, 20, None],
            'model__min_samples_split': [2, 5, 10],
            'model__min_samples_leaf': [1, 2, 4]
        },
        'xgboost': {
            'model__n_estimators': [100, 200, 300],
            'model__max_depth': [3, 6, 9],
            'model__learning_rate': [0.01, 0.1, 0.2],
            'model__subsample': [0.8, 0.9, 1.0]
        } if ADVANCED_ML_AVAILABLE else {},
        'gradient_boosting': {
            'model__n_estimators': [100, 200, 300],
            'model__learning_rate': [0.01, 0.1, 0.2],
            'model__max_depth': [3, 6, 9]
        }
    }
    
    base_model = create_enhanced_model(algorithm, training_parameters)
    pipeline = create_ml_pipeline(base_model, training_parameters)
    
    # Get parameter grid for the algorithm
    param_grid = param_grids.get(algorithm, {})
    
    if param_grid:
        # Perform grid search
        grid_search = GridSearchCV(
            pipeline, param_grid,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
            scoring='accuracy',
            n_jobs=-1,
            verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best CV score: {grid_search.best_score_:.3f}")
        
        return grid_search.best_estimator_
    else:
        # Fall back to default training
        pipeline.fit(X_train, y_train)
        return pipeline


def evaluate_model(model, X_test, y_test):
    """Enhanced model evaluation with comprehensive metrics"""
    try:
        # Get predictions
        if hasattr(model, 'predict'):
            y_pred = model.predict(X_test)
        else:
            # For advanced engines
            y_pred_proba = model.predict(X_test)
            y_pred = (y_pred_proba > 0.5).astype(int)
        
        # Get probabilities
        if hasattr(model, 'predict_proba'):
            y_pred_proba = model.predict_proba(X_test)[:, 1]
        elif hasattr(model, 'predict'):
            try:
                y_pred_proba = model.predict(X_test)
                if len(y_pred_proba.shape) == 1:
                    pass  # Already probabilities
                else:
                    y_pred_proba = y_pred_proba[:, 1]
            except:
                y_pred_proba = None
        else:
            y_pred_proba = None
        
        # Handle multi-class to binary conversion if needed
        if len(np.unique(y_test)) > 2:
            # Convert to binary: 'BUY' vs 'NOT_BUY'
            y_test_binary = (y_test == 1).astype(int)  # Assuming 1 is 'BUY'
            y_pred_binary = (y_pred == 1).astype(int)
        else:
            y_test_binary = y_test
            y_pred_binary = y_pred
        
        # Calculate comprehensive metrics
        metrics = {
            'accuracy': float(accuracy_score(y_test_binary, y_pred_binary)),
            'precision': float(precision_score(y_test_binary, y_pred_binary, average='binary', zero_division=0)),
            'recall': float(recall_score(y_test_binary, y_pred_binary, average='binary', zero_division=0)),
            'f1_score': float(f1_score(y_test_binary, y_pred_binary, average='binary', zero_division=0)),
        }
        
        # Add AUC-ROC if probabilities available
        if y_pred_proba is not None:
            try:
                metrics['auc_roc'] = float(roc_auc_score(y_test_binary, y_pred_proba))
            except:
                metrics['auc_roc'] = 0.5
        else:
            metrics['auc_roc'] = 0.5
        
        # Add additional metrics
        try:
            # Classification report
            class_report = classification_report(y_test_binary, y_pred_binary, output_dict=True)
            
            # Confusion matrix
            cm = confusion_matrix(y_test_binary, y_pred_binary)
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, len(y_test))
            
            # Additional trading-specific metrics
            metrics.update({
                'specificity': float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
                'false_positive_rate': float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0,
                'false_negative_rate': float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0,
                'positive_predictive_value': metrics['precision'],
                'negative_predictive_value': float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0,
                'matthews_correlation_coefficient': calculate_mcc(tp, tn, fp, fn),
                'balanced_accuracy': (metrics['recall'] + metrics['specificity']) / 2,
                'confusion_matrix': cm.tolist(),
                'classification_report': class_report
            })
            
        except Exception as e:
            logger.warning(f"Error calculating additional metrics: {str(e)}")
        
        # Log performance summary
        logger.info(f"Model Performance - Accuracy: {metrics['accuracy']:.3f}, "
                   f"Precision: {metrics['precision']:.3f}, Recall: {metrics['recall']:.3f}, "
                   f"F1: {metrics['f1_score']:.3f}, AUC: {metrics['auc_roc']:.3f}")
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error evaluating model: {str(e)}")
        raise e


def calculate_mcc(tp, tn, fp, fn):
    """Calculate Matthews Correlation Coefficient"""
    try:
        numerator = (tp * tn) - (fp * fn)
        denominator = np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
        return float(numerator / denominator) if denominator != 0 else 0.0
    except:
        return 0.0


def generate_feature_importance(model, X_test, feature_names):
    """Generate SHAP feature importance"""
    try:
        # Create SHAP explainer
        explainer = shap.TreeExplainer(model) if hasattr(model, 'feature_importances_') else shap.KernelExplainer(model.predict, X_test[:100])
        shap_values = explainer.shap_values(X_test[:100])  # Use subset for performance
        
        # If binary classification, take positive class
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        # Calculate mean absolute SHAP values for each feature
        mean_shap = np.abs(shap_values).mean(axis=0)
        
        feature_importance = {
            feature_names[i]: float(mean_shap[i]) 
            for i in range(len(feature_names))
        }
        
        return feature_importance
        
    except Exception as e:
        logger.warning(f"Error generating SHAP values: {str(e)}")
        # Fallback to model's feature importance if available
        if hasattr(model, 'feature_importances_'):
            return {
                feature_names[i]: float(model.feature_importances_[i])
                for i in range(len(feature_names))
            }
        return {}


def run_backtest(model, X_test, y_test):
    """Run backtest simulation"""
    try:
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else y_pred
        
        # Mock backtest calculations (replace with actual backtesting logic)
        total_trades = len(y_test)
        winning_trades = np.sum((y_pred == 1) & (y_test == 1))
        losing_trades = total_trades - winning_trades
        
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # Mock returns calculation
        returns = np.random.normal(0.02, 0.1, total_trades)  # Mock daily returns
        cumulative_return = np.prod(1 + returns) - 1
        
        # Calculate Sharpe ratio
        sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252) if np.std(returns) > 0 else 0
        
        # Calculate Sortino ratio
        negative_returns = returns[returns < 0]
        sortino_ratio = np.mean(returns) / np.std(negative_returns) * np.sqrt(252) if len(negative_returns) > 0 and np.std(negative_returns) > 0 else 0
        
        # Calculate max drawdown
        cumulative_returns = np.cumprod(1 + returns)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdown)
        
        backtest_results = {
            'total_return': float(cumulative_return),
            'sharpe_ratio': float(sharpe_ratio),
            'sortino_ratio': float(sortino_ratio),
            'max_drawdown': float(abs(max_drawdown)),
            'win_rate': float(win_rate),
            'total_trades': int(total_trades),
            'winning_trades': int(winning_trades),
            'losing_trades': int(losing_trades)
        }
        
        return backtest_results
        
    except Exception as e:
        logger.error(f"Error running backtest: {str(e)}")
        return {
            'total_return': 0.0,
            'sharpe_ratio': 0.0,
            'sortino_ratio': 0.0,
            'max_drawdown': 0.0,
            'win_rate': 0.0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0
        }


def save_model_file(model, model_id):
    """Save trained model to file with enhanced serialization"""
    try:
        # Create models directory if it doesn't exist
        models_dir = os.path.join(settings.BASE_DIR, 'media', 'ml_models')
        os.makedirs(models_dir, exist_ok=True)
        
        # Save model with timestamp
        timestamp = int(datetime.now().timestamp())
        model_filename = f"model_{model_id}_{timestamp}"
        
        # Choose appropriate serialization method
        if hasattr(model, 'save'):  # TensorFlow/Keras models
            model_path = os.path.join(models_dir, f"{model_filename}.h5")
            model.save(model_path)
        elif hasattr(model, 'save_model'):  # XGBoost/LightGBM models
            model_path = os.path.join(models_dir, f"{model_filename}.model")
            model.save_model(model_path)
        else:
            # Use joblib for sklearn models (better than pickle for large arrays)
            model_path = os.path.join(models_dir, f"{model_filename}.joblib")
            joblib.dump(model, model_path, compress=3)
        
        # Also save metadata
        metadata = {
            'model_id': model_id,
            'timestamp': timestamp,
            'model_type': type(model).__name__,
            'serialization_method': 'tensorflow' if hasattr(model, 'save') else 
                                  'xgboost' if hasattr(model, 'save_model') else 'joblib',
            'file_size': os.path.getsize(model_path) if os.path.exists(model_path) else 0
        }
        
        metadata_path = os.path.join(models_dir, f"{model_filename}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved: {model_path} (Size: {metadata['file_size']} bytes)")
        return model_path
        
    except Exception as e:
        logger.error(f"Error saving model file: {str(e)}")
        return None