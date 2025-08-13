from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MLModel, ModelLeasing, TrainingJob, ModelReview, FnOStrategy

User = get_user_model()


class MLModelSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_color = serializers.CharField(source='get_status_display_color', read_only=True)
    training_duration = serializers.SerializerMethodField()
    is_active_lease = serializers.SerializerMethodField()
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'user', 'user_email', 'name', 'description', 'model_type', 'status',
            'status_color', 'features', 'target_variable', 'training_parameters',
            'training_period_days', 'validation_split', 'training_results',
            'feature_importance', 'accuracy', 'precision', 'recall', 'f1_score',
            'auc_roc', 'backtest_results', 'total_return', 'sharpe_ratio',
            'sortino_ratio', 'max_drawdown', 'win_rate', 'is_published',
            'monthly_lease_price', 'total_leases', 'total_earnings',
            'instrument_types', 'underlying_assets', 'option_strategies', 'expiry_handling',
            'max_profit_potential', 'max_loss_potential', 'breakeven_points',
            'implied_volatility_accuracy', 'delta_neutral_success',
            'delta_prediction_accuracy', 'gamma_prediction_accuracy',
            'theta_prediction_accuracy', 'vega_prediction_accuracy',
            'training_duration', 'is_active_lease', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'user_email', 'status', 'training_results',
            'feature_importance', 'accuracy', 'precision', 'recall', 'f1_score',
            'auc_roc', 'backtest_results', 'total_return', 'sharpe_ratio',
            'sortino_ratio', 'max_drawdown', 'win_rate', 'total_leases',
            'total_earnings', 'training_duration', 'is_active_lease',
            'created_at', 'updated_at'
        ]
    
    def get_training_duration(self, obj):
        """Get training duration in minutes"""
        return obj.get_training_duration()
    
    def get_is_active_lease(self, obj):
        """Check if current user has active lease for this model"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.leases.filter(
                lessee=request.user,
                status=ModelLeasing.Status.ACTIVE
            ).exists()
        return False


class MLModelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new ML models"""
    
    class Meta:
        model = MLModel
        fields = [
            'name', 'description', 'model_type', 'features', 'target_variable',
            'training_parameters', 'training_period_days', 'validation_split',
            'instrument_types', 'underlying_assets', 'option_strategies', 'expiry_handling'
        ]
    
    def validate_features(self, value):
        """Validate features list"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one feature must be selected")
        if len(value) > 50:
            raise serializers.ValidationError("Maximum 50 features allowed")
        return value
    
    def validate_name(self, value):
        """Validate model name uniqueness for user"""
        user = self.context['request'].user
        if MLModel.objects.filter(user=user, name=value).exists():
            raise serializers.ValidationError("Model with this name already exists")
        return value


class TrainingJobSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='model.name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingJob
        fields = [
            'id', 'model', 'model_name', 'status', 'progress_percentage',
            'current_step', 'total_steps', 'result_data', 'error_message',
            'duration', 'queued_at', 'started_at', 'completed_at'
        ]
        read_only_fields = fields
    
    def get_duration(self, obj):
        """Get training duration in seconds"""
        duration = obj.get_duration()
        return duration.total_seconds() if duration else None


class ModelLeasingSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source='model.name', read_only=True)
    model_creator = serializers.CharField(source='model.user.email', read_only=True)
    lessee_email = serializers.CharField(source='lessee.email', read_only=True)
    is_active = serializers.BooleanField(source='is_active', read_only=True)
    
    class Meta:
        model = ModelLeasing
        fields = [
            'id', 'lessee', 'lessee_email', 'model', 'model_name', 'model_creator',
            'lease_price', 'platform_commission', 'creator_earnings',
            'start_date', 'end_date', 'status', 'is_active', 'payment_id',
            'payment_status', 'total_signals_generated', 'trades_executed',
            'performance_metrics', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'lessee_email', 'model_name', 'model_creator', 'is_active',
            'platform_commission', 'creator_earnings', 'total_signals_generated',
            'trades_executed', 'performance_metrics', 'created_at', 'updated_at'
        ]


class ModelReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.CharField(source='reviewer.email', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    
    class Meta:
        model = ModelReview
        fields = [
            'id', 'model', 'model_name', 'reviewer', 'reviewer_email',
            'rating', 'title', 'comment', 'actual_performance',
            'would_recommend', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reviewer', 'reviewer_email', 'model_name', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate(self, data):
        """Validate that reviewer has an active lease for the model"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            model = data['model']
            has_lease = ModelLeasing.objects.filter(
                lessee=request.user,
                model=model,
                status=ModelLeasing.Status.ACTIVE
            ).exists()
            if not has_lease:
                raise serializers.ValidationError(
                    "You can only review models you have an active lease for"
                )
        return data


class MarketplaceModelSerializer(serializers.ModelSerializer):
    """Serializer for marketplace model listings"""
    creator_email = serializers.CharField(source='user.email', read_only=True)
    creator_name = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    recent_reviews = ModelReviewSerializer(source='reviews', many=True, read_only=True)
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'creator_email', 'creator_name', 'name', 'description',
            'model_type', 'accuracy', 'precision', 'recall', 'f1_score',
            'total_return', 'sharpe_ratio', 'win_rate', 'max_drawdown',
            'monthly_lease_price', 'total_leases', 'average_rating',
            'total_reviews', 'recent_reviews', 'created_at'
        ]
        read_only_fields = fields
    
    def get_creator_name(self, obj):
        """Get creator's full name"""
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_average_rating(self, obj):
        """Calculate average rating"""
        reviews = obj.reviews.all()
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0
    
    def get_total_reviews(self, obj):
        """Get total number of reviews"""
        return obj.reviews.count()


class ModelPublishSerializer(serializers.Serializer):
    """Serializer for publishing models to marketplace"""
    monthly_lease_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=100)
    
    def validate_monthly_lease_price(self, value):
        """Validate lease price"""
        if value < 100:
            raise serializers.ValidationError("Minimum lease price is ₹100 per month")
        if value > 50000:
            raise serializers.ValidationError("Maximum lease price is ₹50,000 per month")
        return value


class FnOStrategySerializer(serializers.ModelSerializer):
    """Serializer for F&O strategy templates"""
    
    class Meta:
        model = FnOStrategy
        fields = [
            'id', 'name', 'strategy_type', 'description', 'instruments_required',
            'risk_level', 'minimum_capital', 'maximum_loss', 'maximum_profit',
            'best_market_condition', 'volatility_requirement', 'delta_target_range',
            'gamma_consideration', 'theta_strategy', 'vega_consideration',
            'entry_conditions', 'exit_conditions', 'stop_loss_rules',
            'usage_count', 'created_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at']