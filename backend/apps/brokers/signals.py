from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import BrokerAccount, BrokerOrder, BrokerPosition


@receiver(pre_save, sender=BrokerAccount)
def ensure_single_primary_account(sender, instance, **kwargs):
    """Ensure only one primary account per user"""
    if instance.is_primary:
        # Set all other accounts for this user to non-primary
        BrokerAccount.objects.filter(
            user=instance.user,
            is_primary=True
        ).exclude(pk=instance.pk).update(is_primary=False)


@receiver(post_save, sender=BrokerOrder)
def update_position_on_order_complete(sender, instance, created, **kwargs):
    """Update position when order is completed"""
    if instance.status == 'COMPLETE' and instance.filled_quantity > 0:
        try:
            # Find or create position
            position, position_created = BrokerPosition.objects.get_or_create(
                broker_account=instance.broker_account,
                symbol=instance.symbol,
                exchange=instance.exchange,
                product='CNC',  # Default product
                defaults={
                    'quantity': 0,
                    'average_price': instance.average_price or instance.price or 0,
                    'last_price': instance.average_price or instance.price or 0,
                    'unrealized_pnl': 0,
                    'realized_pnl': 0
                }
            )
            
            if not position_created:
                # Update existing position
                old_quantity = position.quantity
                old_avg_price = position.average_price
                
                if instance.transaction_type == 'BUY':
                    new_quantity = old_quantity + instance.filled_quantity
                    if new_quantity > 0:
                        # Calculate new average price for long position
                        total_cost = (old_quantity * old_avg_price) + (instance.filled_quantity * (instance.average_price or instance.price))
                        position.average_price = total_cost / new_quantity
                    position.quantity = new_quantity
                else:  # SELL
                    new_quantity = old_quantity - instance.filled_quantity
                    position.quantity = new_quantity
                    
                    if old_quantity > 0 and new_quantity <= 0:
                        # Position closed, calculate realized P&L
                        sell_price = instance.average_price or instance.price
                        realized_pnl = (sell_price - old_avg_price) * min(instance.filled_quantity, old_quantity)
                        position.realized_pnl += realized_pnl
                
                position.save()
                
        except Exception as e:
            # Log error but don't fail the order update
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to update position for order {instance.id}: {str(e)}")


#@receiver(post_save, sender=BrokerAccount)
#def log_account_status_change(sender, instance, created, **kwargs):
#    """Log when broker account status changes"""
#    if not created and instance.tracker.has_changed('status'):
#        from .services import BrokerService
#        BrokerService.log_api_call(
#            broker_account=instance,
#            endpoint='account_status',
#            method='UPDATE',
#            message=f"Account status changed to {instance.status}",
#            level='INFO'
#        )