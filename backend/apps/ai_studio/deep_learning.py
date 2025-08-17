"""
Advanced Deep Learning Models for ShareWise AI
Implements state-of-the-art neural networks for financial prediction
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import train_test_split
import pytorch_lightning as pl
from pytorch_lightning.callbacks import EarlyStopping, ModelCheckpoint, LearningRateMonitor
from pytorch_lightning.loggers import TensorBoardLogger
import optuna
from typing import Dict, List, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

# Check for GPU availability
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {DEVICE}")


class TimeSeriesDataset(Dataset):
    """Custom dataset for time series financial data"""
    
    def __init__(self, features: np.ndarray, targets: np.ndarray, sequence_length: int = 60):
        self.features = torch.FloatTensor(features)
        self.targets = torch.FloatTensor(targets)
        self.sequence_length = sequence_length
        
    def __len__(self):
        return len(self.features) - self.sequence_length
    
    def __getitem__(self, idx):
        return (
            self.features[idx:idx + self.sequence_length],
            self.targets[idx + self.sequence_length]
        )


class TransformerBlock(nn.Module):
    """Transformer block for financial time series"""
    
    def __init__(self, embed_dim: int, num_heads: int, ff_dim: int, dropout: float = 0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.feed_forward = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )
        
    def forward(self, x):
        # Self-attention
        attn_output, _ = self.attention(x, x, x)
        x = self.norm1(x + attn_output)
        
        # Feed forward
        ff_output = self.feed_forward(x)
        x = self.norm2(x + ff_output)
        
        return x


class FinancialTransformer(pl.LightningModule):
    """Advanced Transformer model for financial prediction"""
    
    def __init__(
        self,
        input_dim: int,
        embed_dim: int = 256,
        num_heads: int = 8,
        num_layers: int = 6,
        ff_dim: int = 512,
        output_dim: int = 1,
        dropout: float = 0.1,
        learning_rate: float = 1e-4,
        weight_decay: float = 1e-5,
        sequence_length: int = 60
    ):
        super().__init__()
        self.save_hyperparameters()
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, embed_dim)
        
        # Positional encoding
        self.positional_encoding = self._create_positional_encoding(sequence_length, embed_dim)
        
        # Transformer layers
        self.transformer_layers = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])
        
        # Output layers
        self.layer_norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)
        self.output_projection = nn.Sequential(
            nn.Linear(embed_dim, ff_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim // 2, ff_dim // 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim // 4, output_dim)
        )
        
    def _create_positional_encoding(self, max_len: int, d_model: int):
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * 
                           (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        return nn.Parameter(pe.unsqueeze(0), requires_grad=False)
        
    def forward(self, x):
        batch_size, seq_len, _ = x.shape
        
        # Input projection and positional encoding
        x = self.input_projection(x)
        x = x + self.positional_encoding[:, :seq_len, :]
        
        # Apply transformer layers
        for layer in self.transformer_layers:
            x = layer(x)
        
        # Take the last timestep and apply layer norm
        x = self.layer_norm(x[:, -1, :])
        x = self.dropout(x)
        
        # Output projection
        return self.output_projection(x)
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('val_loss', loss, on_step=False, on_epoch=True, prog_bar=True)
        return loss
    
    def configure_optimizers(self):
        optimizer = optim.AdamW(
            self.parameters(), 
            lr=self.hparams.learning_rate,
            weight_decay=self.hparams.weight_decay
        )
        
        scheduler = optim.lr_scheduler.OneCycleLR(
            optimizer,
            max_lr=self.hparams.learning_rate * 10,
            total_steps=self.trainer.estimated_stepping_batches,
            pct_start=0.1,
            anneal_strategy='cos'
        )
        
        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'step'
            }
        }


class LSTMAttention(pl.LightningModule):
    """LSTM with Attention mechanism for financial prediction"""
    
    def __init__(
        self,
        input_dim: int,
        hidden_dim: int = 128,
        num_layers: int = 3,
        output_dim: int = 1,
        dropout: float = 0.2,
        learning_rate: float = 1e-3,
        bidirectional: bool = True
    ):
        super().__init__()
        self.save_hyperparameters()
        
        self.lstm = nn.LSTM(
            input_dim, hidden_dim, num_layers,
            dropout=dropout, bidirectional=bidirectional, batch_first=True
        )
        
        lstm_output_dim = hidden_dim * 2 if bidirectional else hidden_dim
        
        # Attention mechanism
        self.attention = nn.Sequential(
            nn.Linear(lstm_output_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )
        
        # Output layers
        self.output_layers = nn.Sequential(
            nn.Linear(lstm_output_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, output_dim)
        )
        
    def forward(self, x):
        # LSTM forward pass
        lstm_out, _ = self.lstm(x)
        
        # Attention weights
        attention_weights = F.softmax(self.attention(lstm_out), dim=1)
        
        # Weighted sum
        context_vector = torch.sum(attention_weights * lstm_out, dim=1)
        
        # Output
        return self.output_layers(context_vector)
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('val_loss', loss, on_step=False, on_epoch=True, prog_bar=True)
        return loss
    
    def configure_optimizers(self):
        return optim.Adam(self.parameters(), lr=self.hparams.learning_rate)


class CNNLSTMHybrid(pl.LightningModule):
    """CNN-LSTM Hybrid model for financial prediction"""
    
    def __init__(
        self,
        input_dim: int,
        cnn_filters: List[int] = [64, 128, 256],
        kernel_sizes: List[int] = [3, 5, 7],
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        output_dim: int = 1,
        dropout: float = 0.2,
        learning_rate: float = 1e-3
    ):
        super().__init__()
        self.save_hyperparameters()
        
        # CNN layers for feature extraction
        self.conv_layers = nn.ModuleList()
        for filters, kernel_size in zip(cnn_filters, kernel_sizes):
            conv_block = nn.Sequential(
                nn.Conv1d(input_dim if len(self.conv_layers) == 0 else cnn_filters[len(self.conv_layers)-1], 
                         filters, kernel_size, padding=kernel_size//2),
                nn.BatchNorm1d(filters),
                nn.ReLU(),
                nn.Dropout(dropout)
            )
            self.conv_layers.append(conv_block)
        
        # LSTM for temporal modeling
        self.lstm = nn.LSTM(
            cnn_filters[-1], lstm_hidden, lstm_layers,
            dropout=dropout, batch_first=True
        )
        
        # Output layers
        self.output_layers = nn.Sequential(
            nn.Linear(lstm_hidden, lstm_hidden // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(lstm_hidden // 2, output_dim)
        )
        
    def forward(self, x):
        # Reshape for CNN (batch, features, sequence)
        x = x.transpose(1, 2)
        
        # Apply CNN layers
        for conv_layer in self.conv_layers:
            x = conv_layer(x)
        
        # Reshape back for LSTM (batch, sequence, features)
        x = x.transpose(1, 2)
        
        # LSTM forward pass
        lstm_out, (hidden, _) = self.lstm(x)
        
        # Use the last hidden state
        output = self.output_layers(hidden[-1])
        
        return output
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self(x)
        loss = F.mse_loss(y_hat.squeeze(), y)
        self.log('val_loss', loss, on_step=False, on_epoch=True, prog_bar=True)
        return loss
    
    def configure_optimizers(self):
        return optim.Adam(self.parameters(), lr=self.hparams.learning_rate)


class DeepFinancialPredictor:
    """Advanced deep learning predictor with hyperparameter optimization"""
    
    def __init__(self, model_type: str = 'transformer'):
        self.model_type = model_type
        self.model = None
        self.scaler = RobustScaler()
        self.device = DEVICE
        
    def create_model(self, input_dim: int, **kwargs) -> pl.LightningModule:
        """Create the specified model architecture"""
        
        if self.model_type == 'transformer':
            return FinancialTransformer(
                input_dim=input_dim,
                embed_dim=kwargs.get('embed_dim', 256),
                num_heads=kwargs.get('num_heads', 8),
                num_layers=kwargs.get('num_layers', 6),
                ff_dim=kwargs.get('ff_dim', 512),
                dropout=kwargs.get('dropout', 0.1),
                learning_rate=kwargs.get('learning_rate', 1e-4),
                sequence_length=kwargs.get('sequence_length', 60)
            )
            
        elif self.model_type == 'lstm_attention':
            return LSTMAttention(
                input_dim=input_dim,
                hidden_dim=kwargs.get('hidden_dim', 128),
                num_layers=kwargs.get('num_layers', 3),
                dropout=kwargs.get('dropout', 0.2),
                learning_rate=kwargs.get('learning_rate', 1e-3),
                bidirectional=kwargs.get('bidirectional', True)
            )
            
        elif self.model_type == 'cnn_lstm':
            return CNNLSTMHybrid(
                input_dim=input_dim,
                cnn_filters=kwargs.get('cnn_filters', [64, 128, 256]),
                kernel_sizes=kwargs.get('kernel_sizes', [3, 5, 7]),
                lstm_hidden=kwargs.get('lstm_hidden', 128),
                lstm_layers=kwargs.get('lstm_layers', 2),
                dropout=kwargs.get('dropout', 0.2),
                learning_rate=kwargs.get('learning_rate', 1e-3)
            )
            
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def prepare_data(
        self, 
        df: pd.DataFrame, 
        target_column: str,
        sequence_length: int = 60,
        test_size: float = 0.2
    ) -> Tuple[DataLoader, DataLoader, DataLoader]:
        """Prepare data for training"""
        
        # Extract features and target
        feature_columns = [col for col in df.columns if col != target_column]
        features = df[feature_columns].values
        targets = df[target_column].values
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Create sequences
        X, y = [], []
        for i in range(len(features_scaled) - sequence_length):
            X.append(features_scaled[i:i + sequence_length])
            y.append(targets[i + sequence_length])
        
        X, y = np.array(X), np.array(y)
        
        # Train-validation-test split
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, shuffle=False
        )
        
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Create datasets and dataloaders
        train_dataset = TimeSeriesDataset(X_train, y_train, sequence_length=0)
        val_dataset = TimeSeriesDataset(X_val, y_val, sequence_length=0)
        test_dataset = TimeSeriesDataset(X_test, y_test, sequence_length=0)
        
        train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
        val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=4)
        test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=4)
        
        return train_loader, val_loader, test_loader
    
    def optimize_hyperparameters(
        self, 
        train_loader: DataLoader, 
        val_loader: DataLoader,
        input_dim: int,
        n_trials: int = 50
    ) -> Dict[str, Any]:
        """Optimize hyperparameters using Optuna"""
        
        def objective(trial):
            # Suggest hyperparameters based on model type
            if self.model_type == 'transformer':
                params = {
                    'embed_dim': trial.suggest_categorical('embed_dim', [128, 256, 512]),
                    'num_heads': trial.suggest_categorical('num_heads', [4, 8, 16]),
                    'num_layers': trial.suggest_int('num_layers', 3, 8),
                    'ff_dim': trial.suggest_categorical('ff_dim', [256, 512, 1024]),
                    'dropout': trial.suggest_float('dropout', 0.1, 0.5),
                    'learning_rate': trial.suggest_float('learning_rate', 1e-5, 1e-2, log=True)
                }
            elif self.model_type == 'lstm_attention':
                params = {
                    'hidden_dim': trial.suggest_categorical('hidden_dim', [64, 128, 256]),
                    'num_layers': trial.suggest_int('num_layers', 2, 5),
                    'dropout': trial.suggest_float('dropout', 0.1, 0.5),
                    'learning_rate': trial.suggest_float('learning_rate', 1e-4, 1e-2, log=True),
                    'bidirectional': trial.suggest_categorical('bidirectional', [True, False])
                }
            elif self.model_type == 'cnn_lstm':
                params = {
                    'cnn_filters': [trial.suggest_int('filters_1', 32, 128),
                                   trial.suggest_int('filters_2', 64, 256),
                                   trial.suggest_int('filters_3', 128, 512)],
                    'lstm_hidden': trial.suggest_categorical('lstm_hidden', [64, 128, 256]),
                    'lstm_layers': trial.suggest_int('lstm_layers', 1, 3),
                    'dropout': trial.suggest_float('dropout', 0.1, 0.5),
                    'learning_rate': trial.suggest_float('learning_rate', 1e-4, 1e-2, log=True)
                }
            
            # Create and train model
            model = self.create_model(input_dim, **params)
            
            # Setup trainer
            early_stopping = EarlyStopping(
                monitor='val_loss',
                patience=10,
                mode='min'
            )
            
            trainer = pl.Trainer(
                max_epochs=50,
                callbacks=[early_stopping],
                enable_progress_bar=False,
                enable_model_summary=False,
                logger=False,
                accelerator='gpu' if torch.cuda.is_available() else 'cpu',
                devices=1 if torch.cuda.is_available() else None
            )
            
            # Train model
            trainer.fit(model, train_loader, val_loader)
            
            return trainer.callback_metrics['val_loss'].item()
        
        # Run optimization
        study = optuna.create_study(direction='minimize')
        study.optimize(objective, n_trials=n_trials)
        
        return study.best_params
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        input_dim: int,
        hyperparams: Optional[Dict[str, Any]] = None,
        max_epochs: int = 100
    ) -> pl.LightningModule:
        """Train the model with best hyperparameters"""
        
        # Use provided hyperparameters or defaults
        if hyperparams is None:
            hyperparams = self._get_default_hyperparams()
        
        # Create model
        self.model = self.create_model(input_dim, **hyperparams)
        
        # Setup callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=15,
            mode='min',
            verbose=True
        )
        
        checkpoint_callback = ModelCheckpoint(
            monitor='val_loss',
            filename='best-model-{epoch:02d}-{val_loss:.2f}',
            save_top_k=1,
            mode='min'
        )
        
        lr_monitor = LearningRateMonitor(logging_interval='step')
        
        # Setup logger
        logger = TensorBoardLogger('lightning_logs', name=f'{self.model_type}_model')
        
        # Setup trainer
        trainer = pl.Trainer(
            max_epochs=max_epochs,
            callbacks=[early_stopping, checkpoint_callback, lr_monitor],
            logger=logger,
            accelerator='gpu' if torch.cuda.is_available() else 'cpu',
            devices=1 if torch.cuda.is_available() else None,
            precision=16 if torch.cuda.is_available() else 32,  # Mixed precision for speed
            gradient_clip_val=1.0,
            enable_progress_bar=True
        )
        
        # Train model
        trainer.fit(self.model, train_loader, val_loader)
        
        # Load best model
        self.model = self.model.load_from_checkpoint(checkpoint_callback.best_model_path)
        
        return self.model
    
    def _get_default_hyperparams(self) -> Dict[str, Any]:
        """Get default hyperparameters for each model type"""
        
        defaults = {
            'transformer': {
                'embed_dim': 256,
                'num_heads': 8,
                'num_layers': 6,
                'ff_dim': 512,
                'dropout': 0.1,
                'learning_rate': 1e-4
            },
            'lstm_attention': {
                'hidden_dim': 128,
                'num_layers': 3,
                'dropout': 0.2,
                'learning_rate': 1e-3,
                'bidirectional': True
            },
            'cnn_lstm': {
                'cnn_filters': [64, 128, 256],
                'kernel_sizes': [3, 5, 7],
                'lstm_hidden': 128,
                'lstm_layers': 2,
                'dropout': 0.2,
                'learning_rate': 1e-3
            }
        }
        
        return defaults.get(self.model_type, {})
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions with the trained model"""
        
        if self.model is None:
            raise ValueError("Model has not been trained yet")
        
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X).to(self.device)
            predictions = self.model(X_tensor)
            return predictions.cpu().numpy()
    
    def evaluate(self, test_loader: DataLoader) -> Dict[str, float]:
        """Evaluate the model on test data"""
        
        if self.model is None:
            raise ValueError("Model has not been trained yet")
        
        trainer = pl.Trainer(
            accelerator='gpu' if torch.cuda.is_available() else 'cpu',
            devices=1 if torch.cuda.is_available() else None,
            logger=False,
            enable_progress_bar=False
        )
        
        results = trainer.test(self.model, test_loader)
        
        return results[0] if results else {}


# Ensemble methods
class DeepEnsemble:
    """Ensemble of different deep learning models"""
    
    def __init__(self, model_types: List[str] = ['transformer', 'lstm_attention', 'cnn_lstm']):
        self.model_types = model_types
        self.models = {}
        self.weights = None
        
    def train_ensemble(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        input_dim: int,
        optimize_hyperparams: bool = True
    ):
        """Train ensemble of models"""
        
        val_losses = []
        
        for model_type in self.model_types:
            print(f"Training {model_type} model...")
            
            predictor = DeepFinancialPredictor(model_type)
            
            # Optimize hyperparameters if requested
            if optimize_hyperparams:
                best_params = predictor.optimize_hyperparameters(
                    train_loader, val_loader, input_dim, n_trials=20
                )
            else:
                best_params = None
            
            # Train model
            model = predictor.train(train_loader, val_loader, input_dim, best_params)
            
            # Evaluate on validation set
            val_loss = predictor.evaluate(val_loader)['test_loss']
            val_losses.append(val_loss)
            
            self.models[model_type] = predictor
        
        # Calculate ensemble weights based on validation performance
        val_losses = np.array(val_losses)
        inv_losses = 1.0 / (val_losses + 1e-8)
        self.weights = inv_losses / inv_losses.sum()
        
        print(f"Ensemble weights: {dict(zip(self.model_types, self.weights))}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make ensemble predictions"""
        
        predictions = []
        for model_type in self.model_types:
            pred = self.models[model_type].predict(X)
            predictions.append(pred)
        
        # Weighted average
        predictions = np.array(predictions)
        ensemble_pred = np.average(predictions, axis=0, weights=self.weights)
        
        return ensemble_pred


# Factory function for easy model creation
def create_deep_learning_model(
    model_type: str,
    data: pd.DataFrame,
    target_column: str,
    optimize_hyperparams: bool = True,
    use_ensemble: bool = False
) -> Dict[str, Any]:
    """Factory function to create and train deep learning models"""
    
    results = {
        'model_type': model_type,
        'training_metrics': {},
        'validation_metrics': {},
        'test_metrics': {},
        'model': None,
        'hyperparameters': {},
        'gpu_available': torch.cuda.is_available()
    }
    
    try:
        if use_ensemble:
            # Train ensemble
            ensemble = DeepEnsemble()
            
            # Prepare data
            predictor = DeepFinancialPredictor('transformer')  # Use any model for data prep
            train_loader, val_loader, test_loader = predictor.prepare_data(
                data, target_column
            )
            
            input_dim = data.shape[1] - 1  # Exclude target column
            
            # Train ensemble
            ensemble.train_ensemble(train_loader, val_loader, input_dim, optimize_hyperparams)
            
            results['model'] = ensemble
            results['model_type'] = 'ensemble'
            
        else:
            # Train single model
            predictor = DeepFinancialPredictor(model_type)
            
            # Prepare data
            train_loader, val_loader, test_loader = predictor.prepare_data(
                data, target_column
            )
            
            input_dim = data.shape[1] - 1  # Exclude target column
            
            # Optimize hyperparameters if requested
            if optimize_hyperparams:
                best_params = predictor.optimize_hyperparameters(
                    train_loader, val_loader, input_dim
                )
                results['hyperparameters'] = best_params
            else:
                best_params = None
            
            # Train model
            model = predictor.train(train_loader, val_loader, input_dim, best_params)
            
            # Evaluate model
            test_results = predictor.evaluate(test_loader)
            results['test_metrics'] = test_results
            results['model'] = predictor
        
        results['success'] = True
        
    except Exception as e:
        results['success'] = False
        results['error'] = str(e)
    
    return results