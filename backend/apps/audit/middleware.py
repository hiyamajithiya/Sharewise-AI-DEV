"""
Audit Middleware for automatic request/response logging
"""

import time
import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
from django.http import HttpRequest, HttpResponse

from .services import audit_logger
from .models import AuditEvent

User = get_user_model()
logger = logging.getLogger(__name__)


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log HTTP requests and responses
    """
    
    # Paths to exclude from audit logging
    EXCLUDED_PATHS = [
        '/admin/jsi18n/',
        '/static/',
        '/media/',
        '/favicon.ico',
        '/health/',
        '/ping/',
    ]
    
    # Sensitive endpoints that require detailed logging
    SENSITIVE_ENDPOINTS = [
        '/api/trading/',
        '/api/ai-studio/',
        '/api/auth/',
        '/api/users/',
    ]
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.get_response = get_response
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """
        Process incoming request
        """
        # Skip excluded paths
        if self._should_exclude_path(request.path):
            return None
        
        # Store start time for duration calculation
        request._audit_start_time = time.time()
        
        # Log sensitive endpoint access
        if self._is_sensitive_endpoint(request.path):
            self._log_sensitive_access(request)
        
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """
        Process outgoing response
        """
        # Skip excluded paths
        if self._should_exclude_path(request.path):
            return response
        
        # Calculate duration
        duration_ms = None
        if hasattr(request, '_audit_start_time'):
            duration_ms = int((time.time() - request._audit_start_time) * 1000)
        
        # Determine event type based on request
        event_type = self._determine_event_type(request, response)
        
        if event_type:
            self._log_request_response(request, response, event_type, duration_ms)
        
        return response
    
    def process_exception(self, request: HttpRequest, exception: Exception) -> Optional[HttpResponse]:
        """
        Process exceptions
        """
        # Log the exception as a security/error event
        try:
            duration_ms = None
            if hasattr(request, '_audit_start_time'):
                duration_ms = int((time.time() - request._audit_start_time) * 1000)
            
            # Log the error
            audit_logger.log_event(
                event_type=AuditEvent.EventType.SECURITY_VIOLATION,
                user=getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None,
                description=f"Request exception: {str(exception)}",
                details={
                    'exception_type': type(exception).__name__,
                    'exception_message': str(exception),
                    'url_name': self._get_url_name(request),
                },
                severity=AuditEvent.Severity.HIGH,
                status=AuditEvent.Status.ERROR,
                request=request,
                duration_ms=duration_ms
            )
            
        except Exception as e:
            logger.error(f"Failed to log exception in audit middleware: {e}")
        
        return None
    
    def _should_exclude_path(self, path: str) -> bool:
        """
        Check if path should be excluded from audit logging
        """
        return any(excluded in path for excluded in self.EXCLUDED_PATHS)
    
    def _is_sensitive_endpoint(self, path: str) -> bool:
        """
        Check if endpoint is sensitive and requires detailed logging
        """
        return any(sensitive in path for sensitive in self.SENSITIVE_ENDPOINTS)
    
    def _log_sensitive_access(self, request: HttpRequest):
        """
        Log access to sensitive endpoints
        """
        try:
            user = getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None
            
            audit_logger.log_event(
                event_type=AuditEvent.EventType.DATA_ACCESSED,
                user=user,
                description=f"Sensitive endpoint access: {request.path}",
                details={
                    'endpoint': request.path,
                    'method': request.method,
                    'url_name': self._get_url_name(request),
                },
                severity=AuditEvent.Severity.MEDIUM,
                request=request
            )
            
        except Exception as e:
            logger.error(f"Failed to log sensitive access: {e}")
    
    def _determine_event_type(self, request: HttpRequest, response: HttpResponse) -> Optional[str]:
        """
        Determine audit event type based on request/response
        """
        url_name = self._get_url_name(request)
        method = request.method
        status_code = response.status_code
        
        # Authentication events
        if 'login' in url_name:
            return AuditEvent.EventType.USER_LOGIN if status_code < 400 else None
        elif 'logout' in url_name:
            return AuditEvent.EventType.USER_LOGOUT
        elif 'register' in url_name:
            return AuditEvent.EventType.USER_REGISTRATION
        
        # Trading events
        elif 'trading' in request.path:
            if 'signals' in url_name and method == 'POST':
                return AuditEvent.EventType.SIGNAL_GENERATED
            elif 'orders' in url_name and method == 'POST':
                return AuditEvent.EventType.TRADE_PLACED
            elif 'executions' in url_name and method == 'POST':
                return AuditEvent.EventType.TRADE_EXECUTED
        
        # AI Studio events
        elif 'ai-studio' in request.path:
            if 'models' in url_name and method == 'POST':
                return AuditEvent.EventType.MODEL_CREATED
            elif 'train' in url_name and method == 'POST':
                return AuditEvent.EventType.MODEL_TRAINED
            elif 'publish' in url_name and method == 'POST':
                return AuditEvent.EventType.MODEL_PUBLISHED
            elif 'lease' in url_name and method == 'POST':
                return AuditEvent.EventType.MODEL_LEASED
        
        # Data access events
        elif method == 'GET' and self._is_sensitive_endpoint(request.path):
            return AuditEvent.EventType.DATA_ACCESSED
        
        # Error events
        elif status_code >= 400:
            if status_code == 401 or status_code == 403:
                return AuditEvent.EventType.PERMISSION_DENIED
            elif status_code == 429:
                return AuditEvent.EventType.RATE_LIMIT_EXCEEDED
        
        return None
    
    def _log_request_response(
        self, 
        request: HttpRequest, 
        response: HttpResponse, 
        event_type: str, 
        duration_ms: Optional[int]
    ):
        """
        Log the request/response audit event
        """
        try:
            user = getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None
            
            # Determine status and severity based on response
            if response.status_code < 400:
                status = AuditEvent.Status.SUCCESS
                severity = AuditEvent.Severity.LOW
            elif response.status_code < 500:
                status = AuditEvent.Status.WARNING
                severity = AuditEvent.Severity.MEDIUM
            else:
                status = AuditEvent.Status.ERROR
                severity = AuditEvent.Severity.HIGH
            
            # Prepare details
            details = {
                'url_name': self._get_url_name(request),
                'status_code': response.status_code,
                'content_type': response.get('Content-Type', ''),
                'content_length': response.get('Content-Length', 0),
            }
            
            # Log the event
            audit_logger.log_event(
                event_type=event_type,
                user=user,
                description=f"{request.method} {request.path} - {response.status_code}",
                details=details,
                severity=severity,
                status=status,
                request=request,
                duration_ms=duration_ms
            )
            
        except Exception as e:
            logger.error(f"Failed to log request/response: {e}")
    
    def _get_url_name(self, request: HttpRequest) -> str:
        """
        Get URL name from request
        """
        try:
            resolved = resolve(request.path)
            return resolved.url_name or resolved.view_name or 'unknown'
        except Exception:
            return 'unknown'


class SecurityMiddleware(MiddlewareMixin):
    """
    Security-focused middleware for detecting suspicious activities
    """
    
    # Rate limiting thresholds
    RATE_LIMITS = {
        'requests_per_minute': 60,
        'failed_logins_per_hour': 5,
        'api_calls_per_minute': 100,
    }
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.get_response = get_response
        self._request_counts = {}  # Simple in-memory counter (use Redis in production)
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """
        Process request for security violations
        """
        # Check for suspicious patterns
        self._check_suspicious_patterns(request)
        
        # Rate limiting
        self._check_rate_limits(request)
        
        return None
    
    def _check_suspicious_patterns(self, request: HttpRequest):
        """
        Check for suspicious request patterns
        """
        try:
            # SQL injection patterns
            sql_patterns = ['union select', 'drop table', '1=1', 'or 1=1', '--', ';--']
            
            # XSS patterns
            xss_patterns = ['<script', 'javascript:', 'onerror=', 'onload=']
            
            # Path traversal patterns
            path_patterns = ['../../../', '..\\..\\..\\', '/etc/passwd', '\\windows\\system32']
            
            # Check request data
            request_data = self._get_request_data(request)
            request_string = str(request_data).lower()
            
            detected_patterns = []
            
            # Check for SQL injection
            for pattern in sql_patterns:
                if pattern in request_string:
                    detected_patterns.append(f"SQL injection: {pattern}")
            
            # Check for XSS
            for pattern in xss_patterns:
                if pattern in request_string:
                    detected_patterns.append(f"XSS: {pattern}")
            
            # Check for path traversal
            for pattern in path_patterns:
                if pattern in request_string or pattern in request.path:
                    detected_patterns.append(f"Path traversal: {pattern}")
            
            # Log security event if patterns detected
            if detected_patterns:
                audit_logger.log_security_event(
                    category='INTRUSION',
                    threat_level='HIGH',
                    title='Suspicious request patterns detected',
                    description=f"Detected patterns: {', '.join(detected_patterns)}",
                    user=getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None,
                    request=request,
                    indicators=detected_patterns,
                    attack_vector='HTTP_REQUEST',
                    payload=request_string[:1000],  # Limit payload size
                    blocked=False,  # We're not blocking, just detecting
                    action_taken='LOGGED'
                )
            
        except Exception as e:
            logger.error(f"Error checking suspicious patterns: {e}")
    
    def _check_rate_limits(self, request: HttpRequest):
        """
        Check for rate limiting violations
        """
        try:
            client_ip = self._get_client_ip(request)
            current_minute = int(time.time() // 60)
            
            # Initialize counter for this IP/minute
            key = f"{client_ip}:{current_minute}"
            if key not in self._request_counts:
                self._request_counts[key] = 0
            
            self._request_counts[key] += 1
            
            # Check if rate limit exceeded
            if self._request_counts[key] > self.RATE_LIMITS['requests_per_minute']:
                audit_logger.log_security_event(
                    category='RATE_LIMITING',
                    threat_level='MEDIUM',
                    title='Rate limit exceeded',
                    description=f"IP {client_ip} exceeded rate limit: {self._request_counts[key]} requests/minute",
                    request=request,
                    indicators=[f"requests_per_minute: {self._request_counts[key]}"],
                    attack_vector='RATE_LIMITING',
                    blocked=False,
                    action_taken='LOGGED'
                )
            
            # Clean up old entries (keep only last 2 minutes)
            current_time = int(time.time() // 60)
            keys_to_remove = [k for k in self._request_counts.keys() 
                            if int(k.split(':')[1]) < current_time - 2]
            for key in keys_to_remove:
                del self._request_counts[key]
            
        except Exception as e:
            logger.error(f"Error checking rate limits: {e}")
    
    def _get_request_data(self, request: HttpRequest) -> dict:
        """
        Get request data for analysis
        """
        data = {}
        
        # GET parameters
        if request.GET:
            data.update(dict(request.GET))
        
        # POST data
        if hasattr(request, 'data') and request.data:
            data.update(dict(request.data))
        elif request.method == 'POST' and request.POST:
            data.update(dict(request.POST))
        
        # Headers
        data['headers'] = {
            key: value for key, value in request.META.items() 
            if key.startswith('HTTP_')
        }
        
        return data
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """
        Get client IP address
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip