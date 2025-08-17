"""
Explainable AI service using SHAP for trading signals
"""
import numpy as np
import pandas as pd
import shap
from typing import Dict, List, Any, Optional
import logging
from django.conf import settings


logger = logging.getLogger(__name__)


class TradingSignalExplainer:
    """
    SHAP-based explainable AI service for trading signals
    """
    
    def __init__(self):
        self.explainer = None
        self.model = None
        self.feature_names = []
        
    def initialize_explainer(self, model, training_data: pd.DataFrame, model_type: str = 'tree'):
        """
        Initialize SHAP explainer based on model type
        
        Args:
            model: Trained ML model
            training_data: Training dataset for background samples
            model_type: Type of model ('tree', 'linear', 'deep', 'kernel')
        """
        try:
            self.model = model
            self.feature_names = training_data.columns.tolist()
            
            # Choose appropriate SHAP explainer based on model type
            if model_type == 'tree':
                # For tree-based models (XGBoost, RandomForest, etc.)
                self.explainer = shap.TreeExplainer(model)
            elif model_type == 'linear':
                # For linear models
                self.explainer = shap.LinearExplainer(model, training_data.sample(100))
            elif model_type == 'deep':
                # For neural networks
                self.explainer = shap.DeepExplainer(model, training_data.sample(100))
            else:
                # Generic kernel explainer (slower but works with any model)
                self.explainer = shap.KernelExplainer(model.predict, training_data.sample(100))
                
            logger.info(f"SHAP explainer initialized for {model_type} model")
            
        except Exception as e:
            logger.error(f"Failed to initialize SHAP explainer: {e}")
            raise
    
    def generate_signal_explanation(self, 
                                  features: Dict[str, Any], 
                                  signal_type: str,
                                  confidence_score: float) -> Dict[str, Any]:
        """
        Generate SHAP-based explanation for a trading signal
        
        Args:
            features: Feature values used for prediction
            signal_type: BUY/SELL/SHORT/COVER
            confidence_score: Model confidence score
            
        Returns:
            Dictionary containing explanation data
        """
        try:
            # Convert features to numpy array in correct order
            feature_array = np.array([features.get(name, 0) for name in self.feature_names]).reshape(1, -1)
            
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(feature_array)
            
            # Handle different output formats based on model type
            if isinstance(shap_values, list):
                # Multi-class classification
                if signal_type in ['BUY', 'COVER']:
                    relevant_shap_values = shap_values[1]  # Positive class
                else:
                    relevant_shap_values = shap_values[0]  # Negative class
            else:
                # Binary classification or regression
                relevant_shap_values = shap_values
            
            # Get individual SHAP values
            shap_dict = dict(zip(self.feature_names, relevant_shap_values[0]))
            
            # Calculate feature importance (absolute SHAP values)
            feature_importance = {name: abs(value) for name, value in shap_dict.items()}
            
            # Sort features by importance
            sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            
            # Generate human-readable justification
            justification = self._generate_justification(
                shap_dict, sorted_features, signal_type, confidence_score
            )
            
            # Calculate risk-reward components
            risk_factors, reward_factors = self._analyze_risk_reward(shap_dict, features)
            
            return {
                'ai_justification': justification,
                'feature_importance': dict(sorted_features),
                'shap_values': shap_dict,
                'risk_reward_analysis': {
                    'risk_factors': risk_factors,
                    'reward_factors': reward_factors
                },
                'top_contributing_factors': sorted_features[:5],
                'probability_breakdown': self._explain_probability(shap_dict, confidence_score)
            }
            
        except Exception as e:
            logger.error(f"Failed to generate SHAP explanation: {e}")
            return self._fallback_explanation(signal_type, confidence_score)
    
    def _generate_justification(self, 
                              shap_values: Dict[str, float], 
                              sorted_features: List[tuple],
                              signal_type: str,
                              confidence_score: float) -> str:
        """
        Generate human-readable justification for the signal
        """
        try:
            top_features = sorted_features[:3]
            
            # Signal direction
            action_text = {
                'BUY': 'buying opportunity',
                'SELL': 'selling opportunity', 
                'SHORT': 'shorting opportunity',
                'COVER': 'covering opportunity'
            }.get(signal_type, 'trading opportunity')
            
            justification = f"This {action_text} is identified with {confidence_score:.1%} confidence based on the following key factors:\n\n"
            
            for i, (feature, importance) in enumerate(top_features, 1):
                shap_value = shap_values[feature]
                impact = "positively" if shap_value > 0 else "negatively"
                feature_display = self._format_feature_name(feature)
                
                justification += f"{i}. {feature_display} is {impact} influencing the signal "
                justification += f"(importance: {importance:.3f})\n"
            
            # Add risk context
            justification += f"\nRisk Assessment: "
            if confidence_score > 0.8:
                justification += "High confidence signal with strong technical alignment."
            elif confidence_score > 0.6:
                justification += "Moderate confidence signal - consider risk management."
            else:
                justification += "Lower confidence signal - use smaller position sizes."
                
            return justification
            
        except Exception as e:
            logger.error(f"Failed to generate justification: {e}")
            return f"AI-generated {signal_type} signal with {confidence_score:.1%} confidence."
    
    def _analyze_risk_reward(self, shap_values: Dict[str, float], features: Dict[str, Any]) -> tuple:
        """
        Analyze risk and reward factors from SHAP values
        """
        risk_indicators = ['volatility', 'rsi', 'atr', 'beta', 'vix']
        reward_indicators = ['momentum', 'trend', 'volume', 'breakout', 'support_resistance']
        
        risk_factors = {}
        reward_factors = {}
        
        for feature, shap_value in shap_values.items():
            feature_lower = feature.lower()
            
            # Categorize features
            if any(risk_word in feature_lower for risk_word in risk_indicators):
                risk_factors[feature] = {
                    'shap_value': shap_value,
                    'feature_value': features.get(feature, 0),
                    'risk_level': 'high' if abs(shap_value) > 0.1 else 'moderate'
                }
            elif any(reward_word in feature_lower for reward_word in reward_indicators):
                reward_factors[feature] = {
                    'shap_value': shap_value,
                    'feature_value': features.get(feature, 0),
                    'reward_potential': 'high' if shap_value > 0.1 else 'moderate'
                }
        
        return risk_factors, reward_factors
    
    def _explain_probability(self, shap_values: Dict[str, float], confidence_score: float) -> Dict[str, Any]:
        """
        Break down the probability/confidence score
        """
        total_positive_impact = sum(val for val in shap_values.values() if val > 0)
        total_negative_impact = sum(val for val in shap_values.values() if val < 0)
        
        return {
            'confidence_score': confidence_score,
            'positive_factors_contribution': total_positive_impact,
            'negative_factors_contribution': abs(total_negative_impact),
            'net_signal_strength': total_positive_impact + total_negative_impact,
            'confidence_level': 'high' if confidence_score > 0.75 else 'moderate' if confidence_score > 0.6 else 'low'
        }
    
    def _format_feature_name(self, feature_name: str) -> str:
        """
        Convert technical feature names to human-readable format
        """
        formatting_map = {
            'rsi': 'RSI (Relative Strength Index)',
            'macd': 'MACD Indicator',
            'bollinger_upper': 'Bollinger Bands Upper',
            'bollinger_lower': 'Bollinger Bands Lower',
            'volume_sma': 'Volume Moving Average',
            'price_sma': 'Price Moving Average',
            'atr': 'Average True Range (Volatility)',
            'vwap': 'Volume Weighted Average Price',
            'momentum': 'Price Momentum',
            'williams_r': 'Williams %R Oscillator'
        }
        
        return formatting_map.get(feature_name.lower(), feature_name.replace('_', ' ').title())
    
    def _fallback_explanation(self, signal_type: str, confidence_score: float) -> Dict[str, Any]:
        """
        Provide fallback explanation when SHAP fails
        """
        return {
            'ai_justification': f"AI-generated {signal_type} signal with {confidence_score:.1%} confidence based on technical analysis.",
            'feature_importance': {},
            'shap_values': {},
            'risk_reward_analysis': {'risk_factors': {}, 'reward_factors': {}},
            'top_contributing_factors': [],
            'probability_breakdown': {
                'confidence_score': confidence_score,
                'confidence_level': 'moderate'
            }
        }


# Global instance
signal_explainer = TradingSignalExplainer()


def explain_trading_signal(model, 
                         training_data: pd.DataFrame,
                         features: Dict[str, Any],
                         signal_type: str, 
                         confidence_score: float,
                         model_type: str = 'tree') -> Dict[str, Any]:
    """
    Convenience function to generate signal explanations
    """
    try:
        # Initialize if not already done
        if signal_explainer.explainer is None:
            signal_explainer.initialize_explainer(model, training_data, model_type)
        
        return signal_explainer.generate_signal_explanation(features, signal_type, confidence_score)
        
    except Exception as e:
        logger.error(f"Error in explain_trading_signal: {e}")
        return signal_explainer._fallback_explanation(signal_type, confidence_score)