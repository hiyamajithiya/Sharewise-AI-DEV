import razorpay
import hashlib
import hmac
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import Payment, Subscription, SubscriptionPlan


class RazorpayService:
    """Service for handling Razorpay payments"""
    
    def __init__(self):
        self.client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )
    
    def create_order(self, subscription, amount, currency='INR'):
        """Create a Razorpay order"""
        try:
            # Convert amount to paise (smallest currency unit)
            amount_in_paise = int(amount * 100)
            
            # Create order data
            order_data = {
                'amount': amount_in_paise,
                'currency': currency,
                'receipt': f'sub_{subscription.id}',
                'payment_capture': 1,
                'notes': {
                    'subscription_id': str(subscription.id),
                    'user_id': str(subscription.user.id),
                    'plan_id': str(subscription.plan.id),
                    'plan_name': subscription.plan.name
                }
            }
            
            # Create order with Razorpay
            order = self.client.order.create(data=order_data)
            
            # Create payment record
            payment = Payment.objects.create(
                subscription=subscription,
                amount=amount,
                currency=currency,
                status=Payment.Status.PENDING,
                payment_method=Payment.PaymentMethod.RAZORPAY,
                gateway_order_id=order['id'],
                gateway_response=order
            )
            
            return {
                'order_id': order['id'],
                'payment_id': str(payment.id),
                'amount': amount_in_paise,
                'currency': currency,
                'key_id': settings.RAZORPAY_KEY_ID
            }
            
        except Exception as e:
            raise ValidationError(f"Failed to create Razorpay order: {str(e)}")
    
    def verify_payment(self, payment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature):
        """Verify Razorpay payment signature"""
        try:
            # Get payment record
            payment = Payment.objects.get(id=payment_id)
            
            # Verify signature
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            secret = settings.RAZORPAY_KEY_SECRET.encode('utf-8')
            signature = hmac.new(
                secret,
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if signature != razorpay_signature:
                payment.mark_failed("Invalid payment signature")
                return False, "Invalid payment signature"
            
            # Fetch payment details from Razorpay
            razorpay_payment = self.client.payment.fetch(razorpay_payment_id)
            
            # Update payment record
            payment.gateway_payment_id = razorpay_payment_id
            payment.gateway_signature = razorpay_signature
            payment.gateway_response = razorpay_payment
            
            # Check payment status
            if razorpay_payment['status'] == 'captured':
                payment.mark_successful(razorpay_payment_id, razorpay_signature)
                return True, "Payment successful"
            else:
                payment.mark_failed(f"Payment status: {razorpay_payment['status']}")
                return False, f"Payment not captured: {razorpay_payment['status']}"
                
        except Payment.DoesNotExist:
            return False, "Payment record not found"
        except Exception as e:
            return False, f"Payment verification failed: {str(e)}"
    
    def create_subscription_plan(self, plan):
        """Create a subscription plan in Razorpay"""
        try:
            plan_data = {
                'period': 'monthly',
                'interval': 1,
                'item': {
                    'name': plan.name,
                    'amount': int(plan.price * 100),
                    'currency': plan.currency,
                    'description': plan.description
                },
                'notes': {
                    'plan_id': str(plan.id),
                    'plan_type': plan.plan_type
                }
            }
            
            razorpay_plan = self.client.plan.create(data=plan_data)
            return razorpay_plan
            
        except Exception as e:
            raise ValidationError(f"Failed to create Razorpay plan: {str(e)}")
    
    def cancel_subscription(self, subscription):
        """Cancel a subscription"""
        try:
            # Cancel any active recurring payments
            # This would depend on how recurring payments are set up
            subscription.cancel()
            return True, "Subscription cancelled successfully"
            
        except Exception as e:
            return False, f"Failed to cancel subscription: {str(e)}"
    
    def process_refund(self, payment, amount=None, reason=""):
        """Process a refund for a payment"""
        try:
            if payment.status != Payment.Status.SUCCESS:
                return False, "Can only refund successful payments"
            
            # Use full amount if not specified
            if amount is None:
                amount = payment.amount
            
            # Convert to paise
            amount_in_paise = int(amount * 100)
            
            # Create refund
            refund_data = {
                'amount': amount_in_paise,
                'notes': {
                    'reason': reason,
                    'payment_id': str(payment.id)
                }
            }
            
            refund = self.client.payment.refund(payment.gateway_payment_id, refund_data)
            
            # Update payment record
            payment.status = Payment.Status.REFUNDED
            payment.refund_amount = amount
            payment.refund_reason = reason
            payment.refunded_at = timezone.now()
            payment.gateway_response['refund'] = refund
            payment.save()
            
            return True, "Refund processed successfully"
            
        except Exception as e:
            return False, f"Refund failed: {str(e)}"


class SubscriptionService:
    """Service for managing subscriptions"""
    
    @staticmethod
    def create_free_subscription(user):
        """Create a free subscription for a new user"""
        try:
            # Get or create free plan
            free_plan, created = SubscriptionPlan.objects.get_or_create(
                plan_type=SubscriptionPlan.PlanType.FREE,
                defaults={
                    'name': 'Free Plan',
                    'price': Decimal('0.00'),
                    'currency': 'INR',
                    'backtests_per_day': 5,
                    'live_strategies': 1,
                    'ai_model_studio_access': False,
                    'marketplace_publishing': False,
                    'institutional_models': False,
                    'unlimited_backtests': False,
                    'unlimited_strategies': False,
                    'description': 'Get started with basic features',
                    'features': [
                        '5 backtests per day',
                        '1 live trading strategy',
                        'Basic market analysis',
                        'Email support'
                    ]
                }
            )
            
            # Create subscription
            subscription = Subscription.objects.create(
                user=user,
                plan=free_plan,
                status=Subscription.Status.ACTIVE
            )
            subscription.activate(duration_days=365)  # Free plan active for 1 year
            
            return subscription
            
        except Exception as e:
            raise ValidationError(f"Failed to create free subscription: {str(e)}")
    
    @staticmethod
    def upgrade_subscription(user, new_plan):
        """Upgrade user's subscription to a new plan"""
        try:
            subscription = user.subscription
            old_plan = subscription.plan
            
            # Update subscription
            subscription.plan = new_plan
            subscription.status = Subscription.Status.PENDING
            subscription.save()
            
            # Calculate prorated amount if needed
            # This is simplified - in production, you'd calculate based on remaining days
            amount = new_plan.price
            
            # Create payment order
            payment_service = RazorpayService()
            order = payment_service.create_order(subscription, amount)
            
            return order
            
        except Exception as e:
            raise ValidationError(f"Failed to upgrade subscription: {str(e)}")
    
    @staticmethod
    def check_feature_access(user, feature):
        """Check if user has access to a specific feature"""
        try:
            subscription = user.subscription
            if not subscription.is_active():
                return False
            
            plan = subscription.plan
            
            feature_map = {
                'ai_model_studio': plan.ai_model_studio_access,
                'marketplace_publishing': plan.marketplace_publishing,
                'institutional_models': plan.institutional_models,
                'unlimited_backtests': plan.unlimited_backtests,
                'unlimited_strategies': plan.unlimited_strategies,
                'priority_support': plan.priority_support,
                'api_access': plan.api_access,
                'custom_indicators': plan.custom_indicators
            }
            
            return feature_map.get(feature, False)
            
        except:
            return False


# Import timezone
from django.utils import timezone