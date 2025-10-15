import logging
import requests
from django.db import transaction
from django.conf import settings
from apps.brokers.models import BrokerAccount, BrokerOrder, BrokerWebhook
from apps.brokers.serializers import BrokerAccountSerializer, BrokerOrderSerializer
from django.utils import timezone

logger = logging.getLogger(__name__)


class BrokerService:
    """
    Handles core broker operations such as authentication,
    fetching accounts, placing and cancelling orders, etc.
    """

    @staticmethod
    def connect_broker(user, broker_name, auth_data):
        """Connects a user account to a broker"""
        try:
            broker_account, created = BrokerAccount.objects.update_or_create(
                user=user,
                broker_name=broker_name,
                defaults={
                    "access_token": auth_data.get("access_token"),
                    "refresh_token": auth_data.get("refresh_token"),
                    "account_id": auth_data.get("account_id"),
                    "connected_at": timezone.now(),
                },
            )

            logger.info(f"Broker account {'created' if created else 'updated'} for {user.username}")
            return BrokerAccountSerializer(broker_account).data

        except Exception as e:
            logger.error(f"Failed to connect broker: {str(e)}")
            raise Exception("Error while connecting broker")

    @staticmethod
    def fetch_broker_accounts(user):
        """Return all broker accounts for a user"""
        accounts = BrokerAccount.objects.filter(user=user)
        return BrokerAccountSerializer(accounts, many=True).data

    @staticmethod
    def refresh_token(broker_account):
        """Refresh access token for a broker"""
        try:
            response = requests.post(
                broker_account.token_url,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": broker_account.refresh_token,
                    "client_id": settings.BROKER_CLIENT_ID,
                    "client_secret": settings.BROKER_CLIENT_SECRET,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            broker_account.access_token = data["access_token"]
            broker_account.refresh_token = data.get("refresh_token", broker_account.refresh_token)
            broker_account.save()

            logger.info(f"Token refreshed for broker {broker_account.broker_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to refresh token: {str(e)}")
            return False

    @staticmethod
    def place_order(broker_account, order_data):
        """Places an order with the broker"""
        try:
            with transaction.atomic():
                order = BrokerOrder.objects.create(
                    broker_account=broker_account,
                    symbol=order_data["symbol"],
                    quantity=order_data["quantity"],
                    order_type=order_data["order_type"],
                    price=order_data.get("price"),
                    status="PENDING",
                )

                # Example API call to broker
                response = requests.post(
                    broker_account.order_url,
                    headers={"Authorization": f"Bearer {broker_account.access_token}"},
                    json=order_data,
                    timeout=10,
                )
                response.raise_for_status()
                data = response.json()

                order.broker_order_id = data.get("order_id")
                order.status = data.get("status", "PLACED")
                order.save()

                logger.info(f"Order placed successfully: {order.broker_order_id}")
                return BrokerOrderSerializer(order).data

        except Exception as e:
            logger.error(f"Error placing order: {str(e)}")
            raise Exception("Error while placing order")

    @staticmethod
    def cancel_order(broker_order):
        """Cancels an existing order"""
        try:
            broker_account = broker_order.broker_account
            response = requests.post(
                f"{broker_account.cancel_order_url}/{broker_order.broker_order_id}",
                headers={"Authorization": f"Bearer {broker_account.access_token}"},
                timeout=10,
            )
            response.raise_for_status()

            broker_order.status = "CANCELLED"
            broker_order.save()

            logger.info(f"Order {broker_order.broker_order_id} cancelled successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to cancel order: {str(e)}")
            return False


class BrokerWebhookService:
    """
    Handles incoming webhooks from brokers such as
    order updates, position updates, etc.
    """

    @staticmethod
    def process_webhook(payload):
        """Processes incoming broker webhooks"""
        try:
            broker_name = payload.get("broker_name")
            event_type = payload.get("event_type")
            event_data = payload.get("event_data")

            logger.info(f"Received webhook from {broker_name}: {event_type}")

            # Store webhook in DB for traceability
            webhook = BrokerWebhook.objects.create(
                broker_name=broker_name,
                event_type=event_type,
                event_data=event_data,
                received_at=timezone.now(),
            )

            if event_type == "order_update":
                BrokerWebhookService._process_order_update(webhook)

            return True

        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return False

    @staticmethod
    def _process_order_update(webhook):
        """Process order update webhook"""
        try:
            event_data = webhook.event_data
            order_id = event_data.get("order_id")

            if order_id:
                broker_order = BrokerOrder.objects.filter(
                    broker_account=webhook.broker_account,
                    broker_order_id=order_id,
                ).first()

                if broker_order:
                    broker_order.status = event_data.get("status", broker_order.status)
                    broker_order.filled_quantity = event_data.get("filled_quantity", broker_order.filled_quantity)
                    broker_order.average_price = event_data.get("average_price", broker_order.average_price)
                    broker_order.save()

        except Exception as e:
            logger.error(f"Order update processing failed: {str(e)}")
