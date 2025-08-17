"""
Management command to test the audit system
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from decimal import Decimal

from apps.audit.services import audit_logger, compliance_service
from apps.audit.models import AuditEvent, SecurityEvent, DataAccessLog


User = get_user_model()


class Command(BaseCommand):
    help = 'Test the audit system with sample data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--events',
            type=int,
            default=50,
            help='Number of audit events to create'
        )
        parser.add_argument(
            '--security-events',
            type=int,
            default=10,
            help='Number of security events to create'
        )
        parser.add_argument(
            '--data-access',
            type=int,
            default=20,
            help='Number of data access logs to create'
        )
        parser.add_argument(
            '--report',
            action='store_true',
            help='Generate a compliance report'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing audit system...'))
        
        # Get or create test user
        user, created = User.objects.get_or_create(
            email='test.audit@sharewise.ai',
            defaults={
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(f'Created test user: {user.email}')
        else:
            self.stdout.write(f'Using existing user: {user.email}')
        
        # Create audit events
        self.create_audit_events(user, options['events'])
        
        # Create security events
        self.create_security_events(user, options['security_events'])
        
        # Create data access logs
        self.create_data_access_logs(user, options['data_access'])
        
        # Generate compliance report
        if options['report']:
            self.generate_compliance_report(user)
        
        # Show summary
        self.show_summary()
        
        self.stdout.write(self.style.SUCCESS('Audit system test completed!'))
    
    def create_audit_events(self, user, count):
        """Create sample audit events"""
        
        self.stdout.write(f'Creating {count} audit events...')
        
        event_types = [
            AuditEvent.EventType.USER_LOGIN,
            AuditEvent.EventType.SIGNAL_GENERATED,
            AuditEvent.EventType.TRADE_EXECUTED,
            AuditEvent.EventType.MODEL_TRAINED,
            AuditEvent.EventType.DATA_ACCESSED,
            AuditEvent.EventType.PORTFOLIO_UPDATED,
            AuditEvent.EventType.MODEL_PREDICTION,
            AuditEvent.EventType.PAYMENT_PROCESSED
        ]
        
        severities = ['LOW', 'MEDIUM', 'HIGH']
        statuses = ['SUCCESS', 'WARNING', 'FAILURE']
        
        for i in range(count):
            event_type = random.choice(event_types)
            severity = random.choice(severities)
            status = random.choice(statuses)
            
            # Create timestamp within last 30 days
            days_ago = random.randint(0, 30)
            timestamp = timezone.now() - timedelta(days=days_ago)
            
            details = {
                'test_event': True,
                'sequence': i + 1,
                'random_data': random.randint(1, 1000)
            }
            
            # Add event-specific details
            if event_type == AuditEvent.EventType.TRADE_EXECUTED:
                details.update({
                    'symbol': random.choice(['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS']),
                    'quantity': random.randint(1, 100),
                    'price': round(random.uniform(100, 5000), 2)
                })
            elif event_type == AuditEvent.EventType.MODEL_TRAINED:
                details.update({
                    'model_name': f'Test Model {i}',
                    'accuracy': round(random.uniform(0.7, 0.95), 3),
                    'training_time': random.randint(60, 3600)
                })
            
            # Create the event
            audit_logger.log_event(
                event_type=event_type,
                user=user,
                description=f'Test {event_type.replace("_", " ").title()} #{i + 1}',
                details=details,
                severity=severity,
                status=status,
                amount=Decimal(str(random.uniform(100, 10000))) if event_type in [
                    AuditEvent.EventType.TRADE_EXECUTED,
                    AuditEvent.EventType.PAYMENT_PROCESSED
                ] else None
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} audit events'))
    
    def create_security_events(self, user, count):
        """Create sample security events"""
        
        self.stdout.write(f'Creating {count} security events...')
        
        categories = ['INTRUSION', 'RATE_LIMITING', 'AUTHENTICATION', 'INPUT_VALIDATION']
        threat_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        attack_vectors = ['SQL_INJECTION', 'XSS', 'BRUTE_FORCE', 'RATE_LIMITING']
        
        for i in range(count):
            category = random.choice(categories)
            threat_level = random.choice(threat_levels)
            attack_vector = random.choice(attack_vectors)
            
            # Create a mock request object with IP address
            class MockRequest:
                def __init__(self):
                    self.META = {
                        'REMOTE_ADDR': f'192.168.{random.randint(1, 255)}.{random.randint(1, 255)}',
                        'HTTP_USER_AGENT': 'Test User Agent'
                    }
            
            mock_request = MockRequest()
            
            indicators = [
                f'Pattern detected: {attack_vector}',
                f'IP: {mock_request.META["REMOTE_ADDR"]}',
                f'Attempts: {random.randint(1, 100)}'
            ]
            
            audit_logger.log_security_event(
                category=category,
                threat_level=threat_level,
                title=f'Security Event #{i + 1}: {attack_vector}',
                description=f'Detected {attack_vector.lower().replace("_", " ")} attempt',
                user=user if random.choice([True, False]) else None,
                request=mock_request,
                indicators=indicators,
                attack_vector=attack_vector,
                payload=f'test_payload_{i}',
                blocked=random.choice([True, False]),
                action_taken='LOGGED' if random.choice([True, False]) else 'BLOCKED'
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} security events'))
    
    def create_data_access_logs(self, user, count):
        """Create sample data access logs"""
        
        self.stdout.write(f'Creating {count} data access logs...')
        
        access_types = ['READ', 'WRITE', 'EXPORT', 'DELETE']
        tables = ['trading_signals', 'user_profiles', 'trading_orders', 'ai_models', 'portfolios']
        classifications = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']
        purposes = ['Analytics', 'Reporting', 'User Request', 'System Maintenance', 'Compliance Check']
        
        for i in range(count):
            access_type = random.choice(access_types)
            table_name = random.choice(tables)
            classification = random.choice(classifications)
            purpose = random.choice(purposes)
            
            # Create a mock request object with IP address
            class MockRequest:
                def __init__(self):
                    self.META = {
                        'REMOTE_ADDR': f'10.0.{random.randint(1, 255)}.{random.randint(1, 255)}'
                    }
                    self.session = type('MockSession', (), {'session_key': f'session_{i}'})()
            
            mock_request = MockRequest()
            
            audit_logger.log_data_access(
                user=user,
                access_type=access_type,
                table_name=table_name,
                record_count=random.randint(1, 1000),
                purpose=purpose,
                request=mock_request,
                data_classification=classification,
                business_justification=f'Test data access for {purpose.lower()}',
                gdpr_lawful_basis='LEGITIMATE_INTEREST' if random.choice([True, False]) else '',
                duration_ms=random.randint(10, 5000)
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} data access logs'))
    
    def generate_compliance_report(self, user):
        """Generate a sample compliance report"""
        
        self.stdout.write('Generating compliance report...')
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        report = compliance_service.generate_compliance_report(
            report_type='GDPR_DATA_ACCESS',
            period_start=start_date,
            period_end=end_date,
            generated_by=user,
            title='Test GDPR Data Access Report',
            description='Generated by audit system test command'
        )
        
        self.stdout.write(self.style.SUCCESS(f'Generated compliance report: {report.id}'))
    
    def show_summary(self):
        """Show audit system summary"""
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.HTTP_INFO('AUDIT SYSTEM SUMMARY'))
        self.stdout.write('='*50)
        
        # Audit events summary
        total_events = AuditEvent.objects.count()
        self.stdout.write(f'Total Audit Events: {total_events}')
        
        events_by_type = AuditEvent.objects.values('event_type').distinct().count()
        self.stdout.write(f'Unique Event Types: {events_by_type}')
        
        # Security events summary
        total_security = SecurityEvent.objects.count()
        high_threat = SecurityEvent.objects.filter(threat_level__in=['HIGH', 'CRITICAL']).count()
        blocked_attacks = SecurityEvent.objects.filter(blocked=True).count()
        
        self.stdout.write(f'Security Events: {total_security}')
        self.stdout.write(f'High/Critical Threats: {high_threat}')
        self.stdout.write(f'Blocked Attacks: {blocked_attacks}')
        
        # Data access summary
        total_access = DataAccessLog.objects.count()
        exports = DataAccessLog.objects.filter(access_type='EXPORT').count()
        
        self.stdout.write(f'Data Access Logs: {total_access}')
        self.stdout.write(f'Data Exports: {exports}')
        
        # Recent events
        recent_events = AuditEvent.objects.order_by('-timestamp')[:5]
        self.stdout.write('\nRecent Events:')
        for event in recent_events:
            self.stdout.write(f'  - {event.event_type}: {event.description[:50]}...')
        
        self.stdout.write('\n' + '='*50)