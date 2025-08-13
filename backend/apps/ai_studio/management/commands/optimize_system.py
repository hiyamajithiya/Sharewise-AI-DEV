"""
Django management command to optimize the AI Studio system
"""
import os
import sys
import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from apps.ai_studio.models import MLModel, TrainingJob
from apps.ai_studio.model_monitoring import ModelLifecycleManager
from apps.ai_studio.security import security_manager

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Optimize AI Studio system performance and cleanup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean-models',
            action='store_true',
            help='Clean up old model files and unused models',
        )
        parser.add_argument(
            '--optimize-db',
            action='store_true',
            help='Optimize database queries and indexes',
        )
        parser.add_argument(
            '--check-health',
            action='store_true',
            help='Check system health and model performance',
        )
        parser.add_argument(
            '--security-audit',
            action='store_true',
            help='Run security audit on models and data',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Run all optimization tasks',
        )

    def handle(self, *args, **options):
        """Main command handler"""
        
        self.stdout.write(
            self.style.SUCCESS('Starting ShareWise AI system optimization...')
        )

        if options['all']:
            options.update({
                'clean_models': True,
                'optimize_db': True,
                'check_health': True,
                'security_audit': True
            })

        if options['clean_models']:
            self.clean_models()

        if options['optimize_db']:
            self.optimize_database()

        if options['check_health']:
            self.check_system_health()

        if options['security_audit']:
            self.security_audit()

        self.stdout.write(
            self.style.SUCCESS('System optimization completed!')
        )

    def clean_models(self):
        """Clean up old models and files"""
        self.stdout.write('Cleaning up models...')

        try:
            # Remove old failed training jobs
            cutoff_date = timezone.now() - timedelta(days=7)
            old_failed_jobs = TrainingJob.objects.filter(
                status=TrainingJob.Status.FAILED,
                completed_at__lt=cutoff_date
            )
            
            count = old_failed_jobs.count()
            old_failed_jobs.delete()
            self.stdout.write(f'Removed {count} old failed training jobs')

            # Remove model files for deleted models
            model_dir = os.path.join(settings.BASE_DIR, 'media', 'ml_models')
            if os.path.exists(model_dir):
                existing_models = set(
                    MLModel.objects.values_list('id', flat=True).iterator()
                )
                
                removed_files = 0
                for filename in os.listdir(model_dir):
                    if filename.startswith('model_'):
                        try:
                            # Extract model ID from filename
                            parts = filename.split('_')
                            if len(parts) >= 3:
                                model_id = parts[1]
                                if model_id not in [str(mid) for mid in existing_models]:
                                    file_path = os.path.join(model_dir, filename)
                                    os.remove(file_path)
                                    removed_files += 1
                        except Exception as e:
                            logger.warning(f'Error processing file {filename}: {e}')
                
                self.stdout.write(f'Removed {removed_files} orphaned model files')

            # Suggest retirement for old models
            lifecycle_manager = ModelLifecycleManager()
            old_models = MLModel.objects.filter(
                training_completed_at__lt=timezone.now() - timedelta(days=180)
            )
            
            retirement_suggestions = []
            for model in old_models:
                suggestion = lifecycle_manager.suggest_retirement(str(model.id))
                if suggestion.get('should_retire', False):
                    retirement_suggestions.append(model)
            
            if retirement_suggestions:
                self.stdout.write(
                    f'Found {len(retirement_suggestions)} models that should be retired'
                )
                for model in retirement_suggestions[:5]:  # Show first 5
                    self.stdout.write(f'  - {model.name} (ID: {model.id})')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during model cleanup: {str(e)}')
            )

    def optimize_database(self):
        """Optimize database performance"""
        self.stdout.write('Optimizing database...')

        try:
            # Analyze model query patterns
            from django.db import connection
            
            # Check for missing indexes
            with connection.cursor() as cursor:
                # SQLite doesn't support ANALYZE like PostgreSQL
                if 'postgresql' in settings.DATABASES['default']['ENGINE']:
                    cursor.execute("ANALYZE;")
                    self.stdout.write('Database analysis completed')
                
                # Check for slow queries
                slow_queries = []
                if hasattr(connection, 'queries_log'):
                    for query in connection.queries_log[-100:]:  # Last 100 queries
                        if float(query.get('time', 0)) > 0.1:  # > 100ms
                            slow_queries.append(query)
                
                if slow_queries:
                    self.stdout.write(f'Found {len(slow_queries)} slow queries')

            # Cleanup old log entries if you have a logging model
            # This would be implemented if you create a separate model for logs

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during database optimization: {str(e)}')
            )

    def check_system_health(self):
        """Check overall system health"""
        self.stdout.write('Checking system health...')

        try:
            # Check model health
            models = MLModel.objects.filter(
                status__in=[MLModel.Status.COMPLETED, MLModel.Status.PUBLISHED]
            )
            
            lifecycle_manager = ModelLifecycleManager()
            healthy_models = 0
            unhealthy_models = 0
            
            for model in models[:20]:  # Check first 20 models
                try:
                    health = lifecycle_manager.evaluate_model_health(str(model.id))
                    health_score = health.get('health_score', 0)
                    
                    if health_score >= 70:
                        healthy_models += 1
                    else:
                        unhealthy_models += 1
                        
                except Exception as e:
                    logger.warning(f'Error checking health for model {model.id}: {e}')
                    unhealthy_models += 1

            self.stdout.write(f'Model health: {healthy_models} healthy, {unhealthy_models} unhealthy')

            # Check disk space
            model_dir = os.path.join(settings.BASE_DIR, 'media', 'ml_models')
            if os.path.exists(model_dir):
                total_size = 0
                file_count = 0
                for root, dirs, files in os.walk(model_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        total_size += os.path.getsize(file_path)
                        file_count += 1
                
                size_mb = total_size / (1024 * 1024)
                self.stdout.write(f'Model storage: {file_count} files, {size_mb:.2f} MB')

            # Check memory usage
            try:
                import psutil
                memory = psutil.virtual_memory()
                self.stdout.write(f'Memory usage: {memory.percent}% ({memory.used / (1024**3):.1f} GB used)')
                
                cpu = psutil.cpu_percent(interval=1)
                self.stdout.write(f'CPU usage: {cpu}%')
            except ImportError:
                self.stdout.write('psutil not available for system metrics')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during health check: {str(e)}')
            )

    def security_audit(self):
        """Run security audit"""
        self.stdout.write('Running security audit...')

        try:
            # Check for models with suspicious parameters
            suspicious_models = []
            for model in MLModel.objects.all():
                if model.training_parameters:
                    if not security_manager.validate_model_parameters(model.training_parameters):
                        suspicious_models.append(model)

            if suspicious_models:
                self.stdout.write(
                    self.style.WARNING(f'Found {len(suspicious_models)} models with suspicious parameters')
                )

            # Check file permissions
            model_dir = os.path.join(settings.BASE_DIR, 'media', 'ml_models')
            if os.path.exists(model_dir):
                stat_info = os.stat(model_dir)
                permissions = oct(stat_info.st_mode)[-3:]
                if permissions != '755':
                    self.stdout.write(
                        self.style.WARNING(f'Model directory permissions: {permissions} (should be 755)')
                    )

            # Check for encryption key
            encryption_key_path = os.path.join(settings.BASE_DIR, '.encryption_key')
            if not os.path.exists(encryption_key_path):
                self.stdout.write(
                    self.style.WARNING('Encryption key not found - will be generated on first use')
                )
            else:
                stat_info = os.stat(encryption_key_path)
                permissions = oct(stat_info.st_mode)[-3:]
                if permissions != '600':
                    self.stdout.write(
                        self.style.WARNING(f'Encryption key permissions: {permissions} (should be 600)')
                    )

            # Check for default passwords in environment
            if hasattr(settings, 'SECRET_KEY'):
                if 'django-insecure' in settings.SECRET_KEY:
                    self.stdout.write(
                        self.style.ERROR('Using default Django secret key - change in production!')
                    )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during security audit: {str(e)}')
            )