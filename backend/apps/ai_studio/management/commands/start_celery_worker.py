"""
Django management command to start Celery workers for AI Studio
"""

import os
import sys
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Start Celery worker for AI Studio ML training tasks'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--queue',
            type=str,
            default='ml_training',
            help='Queue to listen to (default: ml_training)'
        )
        parser.add_argument(
            '--concurrency',
            type=int,
            default=2,
            help='Number of concurrent worker processes (default: 2)'
        )
        parser.add_argument(
            '--loglevel',
            type=str,
            default='info',
            help='Logging level (default: info)'
        )
        parser.add_argument(
            '--autoscale',
            type=str,
            help='Autoscale workers (e.g., "4,1" for max 4, min 1)'
        )
        parser.add_argument(
            '--beat',
            action='store_true',
            help='Also start Celery beat scheduler'
        )
    
    def handle(self, *args, **options):
        queue = options['queue']
        concurrency = options['concurrency']
        loglevel = options['loglevel']
        autoscale = options['autoscale']
        start_beat = options['beat']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting Celery worker for queue: {queue}'
            )
        )
        
        # Build Celery worker command
        cmd_parts = [
            'celery',
            '-A', 'config',
            'worker',
            '--queues', queue,
            '--loglevel', loglevel,
        ]
        
        if autoscale:
            cmd_parts.extend(['--autoscale', autoscale])
        else:
            cmd_parts.extend(['--concurrency', str(concurrency)])
        
        # Add platform-specific options
        if sys.platform.startswith('win'):
            # Windows-specific options
            cmd_parts.extend(['--pool', 'solo'])
            self.stdout.write(
                self.style.WARNING(
                    'Running on Windows: Using solo pool (single process)'
                )
            )
        
        # Display command
        cmd_str = ' '.join(cmd_parts)
        self.stdout.write(f'Command: {cmd_str}')
        
        # Show beat command if requested
        if start_beat:
            beat_cmd = 'celery -A config beat --loglevel=info'
            self.stdout.write(
                self.style.SUCCESS(
                    f'To start beat scheduler, run in another terminal: {beat_cmd}'
                )
            )
        
        # Show monitoring commands
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('Monitoring Commands:'))
        self.stdout.write(f'Monitor tasks: celery -A config flower')
        self.stdout.write(f'Monitor workers: celery -A config inspect active')
        self.stdout.write(f'Inspect queues: celery -A config inspect reserved')
        self.stdout.write('='*60 + '\n')
        
        # Check prerequisites
        try:
            import celery
            self.stdout.write(f'✓ Celery version: {celery.__version__}')
        except ImportError:
            self.stdout.write(
                self.style.ERROR('✗ Celery not installed')
            )
            return
        
        # Check broker connection
        try:
            from celery import current_app
            broker_url = current_app.conf.broker_url
            self.stdout.write(f'✓ Broker URL: {broker_url}')
            
            if 'redis' in broker_url:
                try:
                    import redis
                    redis_client = redis.Redis.from_url(broker_url)
                    redis_client.ping()
                    self.stdout.write('✓ Redis connection successful')
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ Redis connection issue: {e}')
                    )
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠ Broker check failed: {e}')
            )
        
        # Execute command
        try:
            os.execvp(cmd_parts[0], cmd_parts)
        except OSError as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Failed to start Celery worker: {e}\n'
                    f'Make sure Celery is installed: pip install celery[redis]'
                )
            )