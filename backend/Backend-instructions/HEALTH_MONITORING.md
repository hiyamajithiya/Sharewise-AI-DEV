# ShareWise AI Health Monitoring System

## Overview

The ShareWise AI platform includes a comprehensive health monitoring system that provides real-time insights into system performance, security, and infrastructure status. This documentation covers all available health check endpoints and their usage.

## Health Check Endpoints

### 1. Basic Health Check
**Endpoint:** `GET /health/`
**Purpose:** Quick health status check for load balancers and uptime monitoring

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
        "database": "healthy",
        "redis": "healthy",
        "web_server": "healthy"
    }
}
```

### 2. Detailed Health Check
**Endpoint:** `GET /health/detailed/`
**Purpose:** Comprehensive system health with metrics and application data

**Features:**
- Database connection and migration status
- Redis health and availability
- Cache functionality testing
- System resource metrics (CPU, Memory, Disk)
- Application metrics (Models, Training Jobs, Signals)
- Security violation tracking

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
        "database": {
            "status": "healthy",
            "migrations_applied": 45,
            "connection_status": "connected"
        },
        "redis": {
            "redis_available": true,
            "databases": {...},
            "memory_usage": {...}
        },
        "cache": {
            "status": "healthy",
            "test_passed": true
        }
    },
    "system": {
        "cpu_usage": 25.5,
        "memory_usage": {
            "percent": 68.2,
            "available_gb": 8.45,
            "total_gb": 16.0
        },
        "disk_usage": {
            "percent": 45.3,
            "free_gb": 120.5,
            "total_gb": 250.0
        }
    },
    "application": {
        "models": {
            "total": 15,
            "trained": 12,
            "training": 2,
            "failed": 1
        },
        "training_jobs": {
            "total": 48,
            "completed_24h": 5,
            "failed_24h": 0
        },
        "trading_signals": {
            "total": 1250,
            "recent_24h": 85
        },
        "security": {
            "total_violations": 23,
            "violations_24h": 2,
            "blocked_ips_24h": 0
        }
    }
}
```

### 3. Redis Health Check
**Endpoint:** `GET /health/redis/`
**Purpose:** Dedicated Redis monitoring and diagnostics

**Features:**
- Redis server availability
- Database-specific health checks
- Memory usage statistics
- Cache performance metrics

### 4. Celery Health Check
**Endpoint:** `GET /health/celery/`
**Purpose:** Background task system monitoring

**Features:**
- Worker status and availability
- Queue monitoring
- Active task tracking
- Test task execution

### 5. Infrastructure Health Check
**Endpoint:** `GET /health/infrastructure/`
**Purpose:** System dependencies and environment validation

**Features:**
- Python and Django version checks
- Critical directory validation (logs, media, static)
- Environment variable configuration
- Database migration status
- File system permissions

### 6. Security Monitoring
**Endpoint:** `GET /security/monitoring/`
**Purpose:** Security threat analysis and violation tracking

**Features:**
- Security violation statistics
- Rate limiting violation tracking
- Input validation attack attempts
- IP blocking status
- Threat level assessment
- Top suspicious IP addresses

**Response:**
```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "overview": {
        "total_violations": 156,
        "violations_24h": 8,
        "violations_7d": 42,
        "blocked_ips_total": 12,
        "blocked_ips_24h": 1
    },
    "violation_types": {
        "rate_limiting": {
            "total": 98,
            "recent_24h": 5
        },
        "input_validation": {
            "total": 58,
            "recent_24h": 3
        }
    },
    "top_suspicious_ips_24h": [
        {"ip_address": "192.168.1.100", "violation_count": 5},
        {"ip_address": "10.0.0.50", "violation_count": 3}
    ],
    "security_status": "low_alert"
}
```

### 7. System Metrics
**Endpoint:** `GET /metrics/`
**Purpose:** Detailed performance metrics for monitoring systems

**Features:**
- CPU usage (total and per-core)
- Memory statistics (virtual and swap)
- Disk I/O metrics
- Network statistics
- Redis performance metrics
- Process monitoring

### 8. Cache Management
**Endpoint:** `POST /admin/clear-cache/`
**Purpose:** Administrative cache clearing (requires superuser)

## Security Status Levels

The security monitoring system provides threat level assessment:

- **healthy**: < 10 violations in 24h
- **low_alert**: 10-50 violations in 24h
- **moderate_alert**: 50-100 violations in 24h
- **high_alert**: > 100 violations in 24h
- **monitoring_error**: System error in security monitoring

## Integration with Monitoring Systems

### Prometheus/Grafana
All endpoints return metrics in JSON format suitable for Prometheus scraping. Configure your monitoring system to poll these endpoints regularly:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sharewise-health'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics/'
    scrape_interval: 30s
```

### Load Balancer Health Checks
Use the basic health check endpoint for load balancer configuration:

```nginx
# nginx.conf
upstream sharewise_backend {
    server 127.0.0.1:8000;
    # Health check configuration
}

location /health/ {
    access_log off;
}
```

### Kubernetes Readiness/Liveness Probes
```yaml
# deployment.yaml
spec:
  containers:
  - name: sharewise-api
    livenessProbe:
      httpGet:
        path: /health/
        port: 8000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/detailed/
        port: 8000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## Alerting Recommendations

### Critical Alerts
- Database connection failures
- Redis unavailability
- High security violation rates (> 50/hour)
- System resource exhaustion (> 90% CPU/Memory)

### Warning Alerts
- Pending database migrations
- Cache performance degradation
- Moderate security violations (10-50/hour)
- High system resource usage (> 80%)

### Information Alerts
- New IP blocks
- Training job failures
- Cache clears

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Check Redis server status
   - Verify connection string in settings
   - Review firewall/network configuration

2. **Database Migration Warnings**
   - Run `python manage.py migrate`
   - Check for conflicting migrations
   - Verify database permissions

3. **High Security Violations**
   - Review blocked IP list
   - Analyze violation patterns
   - Consider rate limit adjustments

4. **Performance Degradation**
   - Monitor system metrics endpoint
   - Check for resource constraints
   - Review database query performance

## API Authentication

Most health check endpoints are publicly accessible for monitoring purposes. The `/admin/clear-cache/` endpoint requires superuser authentication.

For production deployments, consider:
- Rate limiting health check endpoints
- IP whitelisting for monitoring systems
- Authentication for sensitive endpoints

## Monitoring Best Practices

1. **Regular Health Checks**: Poll basic health every 30 seconds
2. **Detailed Monitoring**: Check detailed health every 5 minutes
3. **Security Monitoring**: Review security status every hour
4. **Alerting**: Set up alerts for critical system failures
5. **Dashboards**: Create visual dashboards for key metrics
6. **Log Correlation**: Correlate health check data with application logs

The health monitoring system provides comprehensive visibility into the ShareWise AI platform's operational status, enabling proactive issue detection and resolution.