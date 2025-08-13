from .base import BaseBrokerClient
from .zerodha import ZerodhaClient
from .upstox import UpstoxClient
from .alice_blue import AliceBlueClient

# Broker client registry
BROKER_CLIENTS = {
    'ZERODHA': ZerodhaClient,
    'UPSTOX': UpstoxClient,
    'ALICE_BLUE': AliceBlueClient,
    # Add more brokers as implemented
}


def get_broker_client(broker_type, credentials):
    """Factory function to get appropriate broker client"""
    if broker_type not in BROKER_CLIENTS:
        raise ValueError(f"Unsupported broker type: {broker_type}")
    
    client_class = BROKER_CLIENTS[broker_type]
    return client_class(credentials)


__all__ = [
    'BaseBrokerClient',
    'ZerodhaClient',
    'UpstoxClient',
    'AliceBlueClient',
    'BROKER_CLIENTS',
    'get_broker_client'
]