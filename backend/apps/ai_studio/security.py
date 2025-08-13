"""
Security utilities for ShareWise AI Studio
"""
import os
import hashlib
import secrets
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from django.conf import settings
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import json

logger = logging.getLogger(__name__)
User = get_user_model()


class SecurityManager:
    """Security manager for AI Studio operations"""
    
    def __init__(self):
        self.rate_limits = {
            'model_training': {'limit': 10, 'window': 3600},  # 10 per hour
            'api_calls': {'limit': 1000, 'window': 3600},    # 1000 per hour
            'file_upload': {'limit': 50, 'window': 3600},    # 50 per hour
        }
        
        # Initialize encryption key
        self._encryption_key = self._get_or_create_encryption_key()
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for sensitive data"""
        key_path = os.path.join(settings.BASE_DIR, '.encryption_key')
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            
            # Save key securely
            os.umask(0o077)  # Only owner can read/write
            with open(key_path, 'wb') as f:
                f.write(key)
            
            logger.info("Generated new encryption key")
            return key
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data like API keys, passwords"""
        try:
            fernet = Fernet(self._encryption_key)
            encrypted_data = fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            raise
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            fernet = Fernet(self._encryption_key)
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Error decrypting data: {str(e)}")
            raise
    
    def validate_model_parameters(self, parameters: Dict[str, Any]) -> bool:
        """Validate model parameters for security"""
        
        # Check for dangerous parameters
        dangerous_params = [
            'exec', 'eval', 'open', 'file', '__import__',
            'subprocess', 'os', 'sys', 'pickle', 'marshal'
        ]
        
        def check_dict(d):
            if isinstance(d, dict):
                for key, value in d.items():
                    if isinstance(key, str) and any(danger in key.lower() for danger in dangerous_params):
                        return False
                    if isinstance(value, str) and any(danger in value.lower() for danger in dangerous_params):
                        return False
                    if isinstance(value, dict):
                        if not check_dict(value):
                            return False
                    elif isinstance(value, list):
                        if not check_list(value):
                            return False
            return True
        
        def check_list(l):
            if isinstance(l, list):
                for item in l:
                    if isinstance(item, str) and any(danger in item.lower() for danger in dangerous_params):
                        return False
                    if isinstance(item, dict):
                        if not check_dict(item):
                            return False
                    elif isinstance(item, list):
                        if not check_list(item):
                            return False
            return True
        
        return check_dict(parameters)
    
    def check_rate_limit(self, user_id: str, operation: str) -> bool:
        """Check if user has exceeded rate limit for operation"""
        
        if operation not in self.rate_limits:
            return True  # No limit defined
        
        limit_config = self.rate_limits[operation]
        cache_key = f"rate_limit_{user_id}_{operation}"
        
        # Get current count
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit_config['limit']:
            return False
        
        # Increment count
        cache.set(cache_key, current_count + 1, limit_config['window'])
        return True
    
    def log_security_event(self, event_type: str, user_id: str, details: Dict[str, Any]):
        """Log security-related events"""
        
        log_entry = {
            'timestamp': timezone.now().isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'details': details,
            'ip_address': details.get('ip_address', 'unknown')
        }
        
        logger.warning(f"Security Event: {json.dumps(log_entry)}")
        
        # Store in cache for monitoring
        cache_key = f"security_events_{user_id}"
        events = cache.get(cache_key, [])
        events.append(log_entry)
        
        # Keep last 100 events
        if len(events) > 100:
            events = events[-100:]
        
        cache.set(cache_key, events, 86400)  # 24 hours
    
    def validate_file_upload(self, file_data: bytes, filename: str) -> bool:
        """Validate uploaded files for security"""
        
        # Check file size (max 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        if len(file_data) > max_size:
            return False
        
        # Check file extension
        allowed_extensions = {
            '.csv', '.json', '.txt', '.xlsx', '.xls',
            '.pkl', '.joblib', '.h5', '.model'
        }
        
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in allowed_extensions:
            return False
        
        # Check for malicious content
        dangerous_patterns = [
            b'<script', b'javascript:', b'vbscript:',
            b'exec(', b'eval(', b'__import__',
            b'subprocess', b'os.system'
        ]
        
        file_content_lower = file_data.lower()
        for pattern in dangerous_patterns:
            if pattern in file_content_lower:
                return False
        
        return True
    
    def sanitize_model_name(self, name: str) -> str:
        """Sanitize model names to prevent directory traversal"""
        
        # Remove dangerous characters
        dangerous_chars = ['/', '\\\\', '..', '<', '>', ':', '"', '|', '?', '*']
        
        sanitized = name
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '_')
        
        # Limit length
        sanitized = sanitized[:100]
        
        # Ensure it's not empty
        if not sanitized.strip():
            sanitized = f"model_{secrets.token_hex(8)}"
        
        return sanitized
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    def hash_sensitive_data(self, data: str, salt: str = None) -> tuple:
        """Hash sensitive data with salt"""
        
        if salt is None:
            salt = secrets.token_hex(16)
        
        # Use PBKDF2 for password hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
        )
        
        key = kdf.derive(data.encode())
        hashed = base64.urlsafe_b64encode(key).decode()
        
        return hashed, salt
    
    def verify_hashed_data(self, data: str, hashed_data: str, salt: str) -> bool:
        """Verify hashed data"""
        
        try:
            new_hash, _ = self.hash_sensitive_data(data, salt)
            return secrets.compare_digest(new_hash, hashed_data)
        except Exception:
            return False


class ModelAccessControl:
    """Access control for ML models"""
    
    def __init__(self):
        self.permission_cache_timeout = 300  # 5 minutes
    
    def check_model_permission(self, user, model, action: str) -> bool:
        """Check if user has permission to perform action on model"""
        
        # Cache key for permissions
        cache_key = f"model_permission_{user.id}_{model.id}_{action}"
        
        # Check cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Owner always has full permissions
        if model.user == user:
            result = True
        elif action == 'view':
            # Published models can be viewed by anyone
            result = model.is_published
        elif action == 'lease':
            # Published models can be leased by anyone except owner
            result = model.is_published and model.user != user
        elif action in ['train', 'publish', 'delete']:
            # Only owner can perform these actions
            result = model.user == user
        else:
            result = False
        
        # Cache result
        cache.set(cache_key, result, self.permission_cache_timeout)
        
        return result
    
    def get_user_model_permissions(self, user, model) -> Dict[str, bool]:
        """Get all permissions for user on model"""
        
        actions = ['view', 'train', 'publish', 'delete', 'lease']
        permissions = {}
        
        for action in actions:
            permissions[action] = self.check_model_permission(user, model, action)
        
        return permissions


class APISecurityMiddleware:
    """Middleware for API security"""
    
    def __init__(self):
        self.security_manager = SecurityManager()
    
    def check_api_security(self, request, user) -> Dict[str, Any]:
        """Check API request security"""
        
        security_result = {
            'allowed': True,
            'reason': None,
            'rate_limited': False
        }
        
        # Check rate limiting
        if not self.security_manager.check_rate_limit(str(user.id), 'api_calls'):
            security_result['allowed'] = False
            security_result['rate_limited'] = True
            security_result['reason'] = 'Rate limit exceeded'
            
            # Log security event
            self.security_manager.log_security_event(
                'rate_limit_exceeded',
                str(user.id),
                {
                    'operation': 'api_calls',
                    'ip_address': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown')
                }
            )
        
        # Check for suspicious patterns in request
        if self._check_suspicious_request(request):
            security_result['allowed'] = False
            security_result['reason'] = 'Suspicious request detected'
            
            self.security_manager.log_security_event(
                'suspicious_request',
                str(user.id),
                {
                    'path': request.path,
                    'method': request.method,
                    'ip_address': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown')
                }
            )
        
        return security_result
    
    def _get_client_ip(self, request) -> str:
        """Get client IP address"""
        
        # Check for forwarded IP first
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        
        # Check real IP
        x_real_ip = request.META.get('HTTP_X_REAL_IP')
        if x_real_ip:
            return x_real_ip
        
        # Fall back to remote address
        return request.META.get('REMOTE_ADDR', 'unknown')
    
    def _check_suspicious_request(self, request) -> bool:
        """Check for suspicious request patterns"""
        
        # Check for SQL injection patterns
        sql_patterns = [
            "'", '"', ';', '--', '/*', '*/', 'union', 'select',
            'insert', 'update', 'delete', 'drop', 'exec', 'sp_'
        ]
        
        # Check for XSS patterns
        xss_patterns = [
            '<script', 'javascript:', 'vbscript:', 'onload=',
            'onerror=', 'onclick=', 'onmouseover='
        ]
        
        # Check for path traversal
        traversal_patterns = ['../', '..\\\\', '/etc/', '/var/', 'c:\\\\']
        
        all_patterns = sql_patterns + xss_patterns + traversal_patterns
        
        # Check URL, query string, and POST data
        check_strings = [
            request.path.lower(),
            request.META.get('QUERY_STRING', '').lower()
        ]
        
        # Check POST data if it exists
        try:
            if hasattr(request, 'body') and request.body:
                check_strings.append(request.body.decode('utf-8', errors='ignore').lower())
        except:
            pass
        
        for check_string in check_strings:
            for pattern in all_patterns:
                if pattern.lower() in check_string:
                    return True
        
        return False


# Global instances
security_manager = SecurityManager()
access_control = ModelAccessControl()
api_security = APISecurityMiddleware()