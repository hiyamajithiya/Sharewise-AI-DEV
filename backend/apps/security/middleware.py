"""
Security middleware for ShareWise AI
Implements security headers, rate limiting, and protection mechanisms
"""

import re
import time
import logging
import hashlib
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from datetime import datetime, timedelta

from django.http import HttpResponse, JsonResponse, HttpRequest
from django.core.cache import cache
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.utils import timezone

from apps.audit.models import AuditEvent

logger = logging.getLogger(__name__)
User = get_user_model()


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Adds comprehensive security headers to all responses
    """
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add security headers to response"""
        
        # Content Security Policy
        csp_policy = self._get_csp_policy(request)
        response['Content-Security-Policy'] = csp_policy
        
        # HTTP Strict Transport Security (HTTPS only)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # XSS Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy (Feature Policy)
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), '
            'payment=(), usb=(), magnetometer=(), gyroscope=()'
        )
        
        # Prevent caching of sensitive pages
        if self._is_sensitive_path(request.path):
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        
        # CORS security headers
        if 'Origin' in request.headers:
            origin = request.headers['Origin']
            if self._is_allowed_origin(origin):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
            else:
                logger.warning(f"Blocked cross-origin request from: {origin}")
        
        # API security headers
        if request.path.startswith('/api/'):
            response['X-API-Version'] = '1.0'
            response['X-Robots-Tag'] = 'noindex, nofollow'
        
        return response
    
    def _get_csp_policy(self, request: HttpRequest) -> str:
        """Generate Content Security Policy based on request context"""
        
        # Base CSP policy
        csp_directives = {
            "default-src": "'self'",
            "script-src": "'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
            "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src": "'self' https://fonts.gstatic.com",
            "img-src": "'self' data: https:",
            "connect-src": "'self' wss: ws:",
            "frame-ancestors": "'none'",
            "form-action": "'self'",
            "base-uri": "'self'",
            "object-src": "'none'",
            "media-src": "'self'",
        }
        
        # Add development-specific policies
        if settings.DEBUG:
            csp_directives["script-src"] += " 'unsafe-eval'"
            csp_directives["connect-src"] += " http://localhost:* ws://localhost:*"
        
        # Convert to CSP string
        return "; ".join([f"{directive} {sources}" for directive, sources in csp_directives.items()])
    
    def _is_sensitive_path(self, path: str) -> bool:
        """Check if path contains sensitive information"""
        sensitive_patterns = [
            r'/admin/',
            r'/api/users/',
            r'/api/trading/',
            r'/api/ai-studio/',
            r'/health/',
        ]
        
        return any(re.match(pattern, path) for pattern in sensitive_patterns)
    
    def _is_allowed_origin(self, origin: str) -> bool:
        """Check if origin is allowed for CORS"""
        allowed_origins = getattr(settings, 'ALLOWED_CORS_ORIGINS', [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://sharewise-ai.com',
        ])
        
        return origin in allowed_origins


class RateLimitMiddleware(MiddlewareMixin):
    """
    Advanced rate limiting middleware with multiple strategies
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.rate_limits = {
            # API endpoints
            'api_anonymous': {'requests': 100, 'window': 3600},  # 100/hour for anonymous
            'api_authenticated': {'requests': 1000, 'window': 3600},  # 1000/hour for users
            'api_premium': {'requests': 5000, 'window': 3600},  # 5000/hour for premium
            
            # Auth endpoints
            'auth_login': {'requests': 10, 'window': 900},  # 10/15min for login attempts
            'auth_register': {'requests': 5, 'window': 3600},  # 5/hour for registration
            'auth_password_reset': {'requests': 3, 'window': 3600},  # 3/hour for password reset
            
            # Trading endpoints
            'trading_orders': {'requests': 100, 'window': 60},  # 100/minute for orders
            'trading_signals': {'requests': 50, 'window': 60},  # 50/minute for signals
            
            # AI/ML endpoints
            'ml_training': {'requests': 5, 'window': 3600},  # 5/hour for training
            'ml_prediction': {'requests': 200, 'window': 3600},  # 200/hour for predictions
        }
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Check rate limits before processing request"""
        
        # Skip rate limiting for certain paths
        if self._should_skip_rate_limit(request):
            return None
        
        # Determine rate limit key and limits
        rate_limit_key = self._get_rate_limit_key(request)
        limits = self._get_rate_limits(request)
        
        if not limits:
            return None
        
        # Check rate limit
        if self._is_rate_limited(rate_limit_key, limits):
            return self._rate_limit_response(request, limits)
        
        # Record the request
        self._record_request(rate_limit_key, limits)
        
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Add rate limit headers to response"""
        
        if hasattr(request, '_rate_limit_info'):
            info = request._rate_limit_info
            response['X-RateLimit-Limit'] = str(info['limit'])
            response['X-RateLimit-Remaining'] = str(info['remaining'])
            response['X-RateLimit-Reset'] = str(info['reset_time'])
        
        return response
    
    def _should_skip_rate_limit(self, request: HttpRequest) -> bool:
        """Check if request should skip rate limiting"""
        
        # Skip for health checks
        if request.path.startswith('/health/'):
            return True
        
        # Skip for admin (but add audit trail)
        if request.path.startswith('/admin/') and hasattr(request, 'user') and hasattr(request.user, 'is_staff') and request.user.is_staff:
            return True
        
        # Skip for static files
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return True
        
        return False
    
    def _get_rate_limit_key(self, request: HttpRequest) -> str:
        """Generate unique key for rate limiting"""
        
        # For authenticated users, use user ID
        if hasattr(request, 'user') and request.user.is_authenticated:
            base_key = f"user:{request.user.id}"
        else:
            # For anonymous users, use IP address
            ip_address = self._get_client_ip(request)
            base_key = f"ip:{ip_address}"
        
        # Add endpoint-specific suffix
        endpoint_key = self._get_endpoint_key(request)
        
        return f"rate_limit:{base_key}:{endpoint_key}"
    
    def _get_endpoint_key(self, request: HttpRequest) -> str:
        """Get endpoint-specific key for rate limiting"""
        
        path = request.path
        method = request.method
        
        # Authentication endpoints
        if '/api/users/login/' in path:
            return 'auth_login'
        elif '/api/users/register/' in path:
            return 'auth_register'
        elif '/api/users/password-reset/' in path:
            return 'auth_password_reset'
        
        # Trading endpoints
        elif '/api/trading/orders/' in path:
            return 'trading_orders'
        elif '/api/trading/signals/' in path:
            return 'trading_signals'
        
        # AI/ML endpoints
        elif '/api/ai-studio/train/' in path:
            return 'ml_training'
        elif '/api/ai-studio/predict/' in path:
            return 'ml_prediction'
        
        # General API endpoints
        elif path.startswith('/api/'):
            if hasattr(request, 'user') and request.user.is_authenticated:
                # Check if user has premium subscription
                if hasattr(request.user, 'subscription') and request.user.subscription.tier == 'premium':
                    return 'api_premium'
                return 'api_authenticated'
            return 'api_anonymous'
        
        return 'general'
    
    def _get_rate_limits(self, request: HttpRequest) -> Optional[Dict[str, int]]:
        """Get rate limits for the request"""
        endpoint_key = self._get_endpoint_key(request)
        return self.rate_limits.get(endpoint_key)
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def _is_rate_limited(self, key: str, limits: Dict[str, int]) -> bool:
        """Check if request should be rate limited"""
        
        current_time = int(time.time())
        window_start = current_time - limits['window']
        
        # Get current request count from cache
        request_times = cache.get(key, [])
        
        # Remove old requests outside the window
        request_times = [req_time for req_time in request_times if req_time > window_start]
        
        # Check if limit exceeded
        return len(request_times) >= limits['requests']
    
    def _record_request(self, key: str, limits: Dict[str, int]) -> None:
        """Record the current request"""
        
        current_time = int(time.time())
        window_start = current_time - limits['window']
        
        # Get current request times
        request_times = cache.get(key, [])
        
        # Remove old requests and add current request
        request_times = [req_time for req_time in request_times if req_time > window_start]
        request_times.append(current_time)
        
        # Store back in cache
        cache.set(key, request_times, limits['window'] + 60)  # Extra 60 seconds buffer
    
    def _rate_limit_response(self, request: HttpRequest, limits: Dict[str, int]) -> HttpResponse:
        """Return rate limit exceeded response"""
        
        # Log rate limit violation
        logger.warning(f"Rate limit exceeded for {request.path} from {self._get_client_ip(request)}")
        
        # Record in audit trail
        try:
            AuditEvent.objects.create(
                event_type='SECURITY_VIOLATION',
                user=request.user if request.user.is_authenticated else None,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Rate limit exceeded for {request.path}',
                request_path=request.path,
                request_method=request.method,
                details={
                    'violation_type': 'rate_limit_exceeded',
                    'path': request.path,
                    'method': request.method,
                    'limits': limits
                }
            )
        except Exception as e:
            logger.error(f"Failed to record audit trail: {e}")
        
        # Return rate limit response
        response_data = {
            'error': 'Rate limit exceeded',
            'message': f"Too many requests. Limit: {limits['requests']} per {limits['window']} seconds",
            'retry_after': limits['window']
        }
        
        response = JsonResponse(response_data, status=429)
        response['Retry-After'] = str(limits['window'])
        response['X-RateLimit-Limit'] = str(limits['requests'])
        response['X-RateLimit-Remaining'] = '0'
        response['X-RateLimit-Reset'] = str(int(time.time()) + limits['window'])
        
        return response


class InputValidationMiddleware(MiddlewareMixin):
    """
    Validates and sanitizes input to prevent injection attacks
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        
        # Suspicious patterns to detect
        self.suspicious_patterns = [
            # SQL injection patterns
            r"(union|select|insert|update|delete|drop|create|alter|exec|execute)",
            r"(--|#|/\*|\*/)",
            r"(\bor\b|\band\b)\s+\d+\s*=\s*\d+",
            
            # XSS patterns
            r"<script[^>]*>",
            r"javascript:",
            r"vbscript:",
            r"onload|onerror|onclick|onmouseover",
            
            # Path traversal
            r"\.\./",
            r"\\\.\\\.\\",
            
            # Command injection
            r"[;&|`$()]",
            r"\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b",
        ]
        
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.suspicious_patterns]
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Validate and sanitize request data"""
        
        # Skip validation for certain endpoints
        if self._should_skip_validation(request):
            return None
        
        # Validate query parameters
        for key, value in request.GET.items():
            if self._is_suspicious_input(value):
                return self._security_violation_response(request, 'suspicious_query_param', key, value)
        
        # Validate POST data
        if request.method == 'POST' and hasattr(request, 'POST'):
            for key, value in request.POST.items():
                if self._is_suspicious_input(value):
                    return self._security_violation_response(request, 'suspicious_post_data', key, value)
        
        # Validate JSON data
        if request.content_type == 'application/json' and hasattr(request, 'body'):
            try:
                import json
                data = json.loads(request.body)
                if self._validate_json_data(data):
                    return self._security_violation_response(request, 'suspicious_json_data', '', str(data))
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass  # Invalid JSON will be handled by the view
        
        # Validate file uploads
        if hasattr(request, 'FILES'):
            for field_name, uploaded_file in request.FILES.items():
                if not self._is_safe_file(uploaded_file):
                    return self._security_violation_response(request, 'malicious_file_upload', field_name, uploaded_file.name)
        
        return None
    
    def _should_skip_validation(self, request: HttpRequest) -> bool:
        """Check if request should skip input validation"""
        
        # Skip for static files
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return True
        
        # Skip for health checks
        if request.path.startswith('/health/'):
            return True
        
        return False
    
    def _is_suspicious_input(self, value: str) -> bool:
        """Check if input contains suspicious patterns"""
        
        if not isinstance(value, str):
            return False
        
        # Check against suspicious patterns
        for pattern in self.compiled_patterns:
            if pattern.search(value):
                return True
        
        # Check for excessive length
        if len(value) > 10000:  # Arbitrary large limit
            return True
        
        # Check for null bytes
        if '\x00' in value:
            return True
        
        return False
    
    def _validate_json_data(self, data: Any) -> bool:
        """Recursively validate JSON data"""
        
        if isinstance(data, dict):
            for key, value in data.items():
                if self._is_suspicious_input(str(key)) or self._validate_json_data(value):
                    return True
        
        elif isinstance(data, list):
            for item in data:
                if self._validate_json_data(item):
                    return True
        
        elif isinstance(data, str):
            return self._is_suspicious_input(data)
        
        return False
    
    def _is_safe_file(self, uploaded_file) -> bool:
        """Check if uploaded file is safe"""
        
        # Check file extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.csv', '.xlsx']
        file_ext = uploaded_file.name.lower().split('.')[-1] if '.' in uploaded_file.name else ''
        
        if f'.{file_ext}' not in allowed_extensions:
            return False
        
        # Check file size (10MB limit)
        if uploaded_file.size > 10 * 1024 * 1024:
            return False
        
        # Check MIME type
        content_type = uploaded_file.content_type
        allowed_mime_types = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf', 'text/plain', 'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        if content_type not in allowed_mime_types:
            return False
        
        return True
    
    def _security_violation_response(self, request: HttpRequest, violation_type: str, field: str, value: str) -> HttpResponse:
        """Return security violation response"""
        
        # Log security violation
        logger.warning(f"Security violation detected: {violation_type} in field '{field}' from {self._get_client_ip(request)}")
        
        # Record in audit trail
        try:
            AuditEvent.objects.create(
                event_type='SECURITY_VIOLATION',
                user=request.user if request.user.is_authenticated else None,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Security violation detected: {violation_type} in field {field}',
                request_path=request.path,
                request_method=request.method,
                details={
                    'violation_type': violation_type,
                    'field': field,
                    'path': request.path,
                    'method': request.method,
                    'suspicious_value': value[:100] + '...' if len(value) > 100 else value
                }
            )
        except Exception as e:
            logger.error(f"Failed to record audit trail: {e}")
        
        return JsonResponse({
            'error': 'Security violation detected',
            'message': 'Your request contains potentially malicious content and has been blocked.',
            'violation_type': violation_type
        }, status=400)
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip


class IPBlockingMiddleware(MiddlewareMixin):
    """
    Block requests from suspicious IP addresses
    """
    
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        """Check if IP should be blocked"""
        
        client_ip = self._get_client_ip(request)
        
        # Check if IP is in blocklist
        if self._is_blocked_ip(client_ip):
            logger.warning(f"Blocked request from blacklisted IP: {client_ip}")
            return JsonResponse({
                'error': 'Access denied',
                'message': 'Your IP address has been blocked due to suspicious activity.'
            }, status=403)
        
        # Check for suspicious activity patterns
        if self._has_suspicious_activity(client_ip):
            self._add_to_blocklist(client_ip, 'suspicious_activity')
            return JsonResponse({
                'error': 'Access denied',
                'message': 'Suspicious activity detected. Access temporarily restricted.'
            }, status=403)
        
        return None
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def _is_blocked_ip(self, ip: str) -> bool:
        """Check if IP is in blocklist"""
        cache_key = f"blocked_ip:{ip}"
        return cache.get(cache_key, False)
    
    def _has_suspicious_activity(self, ip: str) -> bool:
        """Check for suspicious activity patterns"""
        
        # Get recent violations for this IP
        cache_key = f"violations:{ip}"
        violations = cache.get(cache_key, [])
        
        current_time = time.time()
        
        # Remove old violations (older than 1 hour)
        violations = [v for v in violations if current_time - v < 3600]
        
        # Block if more than 10 violations in the last hour
        return len(violations) > 10
    
    def _add_to_blocklist(self, ip: str, reason: str) -> None:
        """Add IP to blocklist"""
        cache_key = f"blocked_ip:{ip}"
        cache.set(cache_key, True, 3600)  # Block for 1 hour
        
        logger.warning(f"Added IP {ip} to blocklist. Reason: {reason}")
        
        # Record in audit trail
        try:
            AuditEvent.objects.create(
                event_type='SECURITY_VIOLATION',
                ip_address=ip,
                description=f'IP {ip} blocked due to {reason}',
                details={
                    'violation_type': 'ip_blocked',
                    'reason': reason,
                    'blocked_until': timezone.now() + timedelta(hours=1)
                }
            )
        except Exception as e:
            logger.error(f"Failed to record IP blocking: {e}")