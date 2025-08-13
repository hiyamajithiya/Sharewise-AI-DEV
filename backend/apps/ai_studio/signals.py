from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import MLModel, ModelLeasing
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=MLModel)
def model_status_changed(sender, instance, created, **kwargs):
    """Handle model status changes"""
    if not created:
        # Log model status changes
        logger.info(f"Model {instance.name} status changed to {instance.status}")
        
        # If model is published, log to analytics
        if instance.is_published and instance.status == MLModel.Status.PUBLISHED:
            logger.info(f"Model {instance.name} published to marketplace by {instance.user.email}")


@receiver(post_save, sender=ModelLeasing)
def model_leased(sender, instance, created, **kwargs):
    """Handle new model leases"""
    if created:
        logger.info(f"Model {instance.model.name} leased by {instance.lessee.email}")
        
        # Could send notifications or update analytics here
        # send_lease_notification(instance)
        
        # Update model lease count (handled in view, but could be done here as backup)
        model = instance.model
        model.total_leases = model.leases.count()
        model.save()


@receiver(post_delete, sender=MLModel)
def cleanup_model_files(sender, instance, **kwargs):
    """Clean up model files when model is deleted"""
    if instance.model_file_path:
        try:
            import os
            if os.path.exists(instance.model_file_path):
                os.remove(instance.model_file_path)
                logger.info(f"Cleaned up model file: {instance.model_file_path}")
        except Exception as e:
            logger.error(f"Error cleaning up model file: {e}")


def send_lease_notification(lease_instance):
    """Send notification about new lease (placeholder)"""
    # This would integrate with your notification system
    # For now, just log the event
    logger.info(f"Lease notification: {lease_instance.model.name} leased by {lease_instance.lessee.email}")