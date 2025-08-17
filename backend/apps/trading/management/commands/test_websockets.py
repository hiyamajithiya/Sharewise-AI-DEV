"""
Django management command to test WebSocket functionality
"""

import json
import asyncio
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.trading.websocket_utils import notify_new_signal, notify_portfolio_update
from apps.ai_studio.websocket_utils import notify_training_progress

User = get_user_model()


class Command(BaseCommand):
    help = 'Test WebSocket functionality'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            help='Email of user to send test notifications to'
        )
    
    def handle(self, *args, **options):
        user_email = options.get('user_email')
        
        if user_email:
            try:
                user = User.objects.get(email=user_email)
                user_id = str(user.id)
                
                self.stdout.write(f'Sending test WebSocket notifications to user: {user.email}')
                
                # Test trading signal notification
                signal_data = {
                    'id': 'test-signal-123',
                    'symbol': 'NIFTY',
                    'signal_type': 'BUY',
                    'confidence_score': 0.85,
                    'entry_price': 18500.0,
                    'target_price': 18650.0,
                    'stop_loss': 18400.0,
                    'created_at': timezone.now(),
                    'message': 'Test signal generated via management command'
                }
                
                notify_new_signal(user_id, signal_data)
                self.stdout.write(self.style.SUCCESS('✓ Sent test trading signal notification'))
                
                # Test portfolio update notification
                portfolio_data = {
                    'total_value': 500000.0,
                    'total_pnl': 15000.0,
                    'daily_pnl': 2500.0,
                    'position_count': 5,
                    'message': 'Test portfolio update via management command'
                }
                
                notify_portfolio_update(user_id, portfolio_data)
                self.stdout.write(self.style.SUCCESS('✓ Sent test portfolio update notification'))
                
                # Test AI Studio training progress notification
                training_data = {
                    'progress_percentage': 65.0,
                    'current_step': 'Feature engineering',
                    'total_steps': 10,
                    'eta_minutes': 5,
                    'message': 'Test training progress via management command'
                }
                
                notify_training_progress('test-job-123', training_data)
                self.stdout.write(self.style.SUCCESS('✓ Sent test training progress notification'))
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully sent test WebSocket notifications for user: {user.email}'
                    )
                )
                
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with email {user_email} not found')
                )
        else:
            # Send general test notifications
            self.stdout.write('Testing WebSocket system without specific user...')
            
            # Test system health notification
            from apps.ai_studio.websocket_utils import ai_notifier
            
            system_data = {
                'status': 'healthy',
                'active_workers': 2,
                'queue_length': 0,
                'message': 'Test system status via management command'
            }
            
            ai_notifier.send_system_status_update(system_data)
            self.stdout.write(self.style.SUCCESS('✓ Sent test system status update'))
            
            self.stdout.write(
                self.style.SUCCESS('WebSocket test completed successfully')
            )
        
        # Display WebSocket connection info
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('WebSocket Connection Info:'))
        self.stdout.write('Trading Signals: ws://localhost:8000/ws/trading/signals/')
        self.stdout.write('Portfolio Updates: ws://localhost:8000/ws/trading/portfolio/')
        self.stdout.write('AI Studio Dashboard: ws://localhost:8000/ws/ai-studio/dashboard/')
        self.stdout.write('Model Training: ws://localhost:8000/ws/ai-studio/training/{job_id}/')
        self.stdout.write('System Health: ws://localhost:8000/ws/ai-studio/system/')
        self.stdout.write('='*60)