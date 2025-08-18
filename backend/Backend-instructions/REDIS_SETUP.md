# Redis Setup Guide for ShareWise AI

## 📋 Overview

ShareWise AI is now configured to use Redis for:
- **Caching** (Database 1) - Django cache framework
- **Sessions** (Database 2) - User session storage  
- **WebSocket Channels** (Database 3) - Real-time communication
- **Celery Broker** (Database 4) - Task queue messaging
- **Celery Results** (Database 5) - Task result storage

## 🚀 Installation

### Windows

#### Option 1: Using Chocolatey (Recommended)
```bash
# Install Chocolatey if not installed
# Run as Administrator
choco install redis-64

# Start Redis service
redis-server
```

#### Option 2: Download Binary
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract to `C:\Redis`
3. Run `redis-server.exe`

#### Option 3: Using WSL (Windows Subsystem for Linux)
```bash
# In WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### macOS

#### Using Homebrew
```bash
brew install redis
brew services start redis
```

#### Using MacPorts
```bash
sudo port install redis
sudo port load redis
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Linux (CentOS/RHEL/Fedora)

```bash
sudo yum install redis
# or for newer versions
sudo dnf install redis

sudo systemctl start redis
sudo systemctl enable redis
```

## ⚙️ Configuration

### Basic Redis Configuration

Create or edit Redis config file:

#### Windows: `C:\Redis\redis.conf`
#### Linux/macOS: `/etc/redis/redis.conf`

```bash
# Basic production settings
port 6379
bind 127.0.0.1
protected-mode yes
timeout 300
tcp-keepalive 300

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes

# Security
requirepass your_secure_password_here

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

### Production Security Settings

Add to your Redis configuration:

```bash
# Security
protected-mode yes
requirepass "your_very_secure_password_here"
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG "CONFIG_9a8b7c6d5e4f"

# Network security
bind 127.0.0.1 # Only local connections
port 6379
tcp-backlog 511

# Client limits
maxclients 10000
timeout 300
```

## 🔧 ShareWise AI Configuration

### Environment Variables

Update your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For password-protected Redis:
# REDIS_URL=redis://:your_password@localhost:6379

# Optional: Separate Redis instances
REDIS_CACHE_URL=redis://localhost:6379/1
REDIS_SESSION_URL=redis://localhost:6379/2
REDIS_CHANNELS_URL=redis://localhost:6379/3
REDIS_CELERY_BROKER_URL=redis://localhost:6379/4
REDIS_CELERY_RESULT_URL=redis://localhost:6379/5
```

### Test Redis Connection

```bash
# Test basic connection
redis-cli ping
# Should return: PONG

# Test with password
redis-cli -a your_password ping

# Check Redis info
redis-cli info server
```

## 🚀 Starting Services

### Development Mode

1. **Start Redis:**
   ```bash
   redis-server
   ```

2. **Start Django:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Start Celery Worker:**
   ```bash
   cd backend
   celery -A config worker --loglevel=info
   ```

4. **Start Celery Beat (for scheduled tasks):**
   ```bash
   cd backend
   celery -A config beat --loglevel=info
   ```

### Production Mode

#### Using systemd (Linux)

Create service files:

1. **Redis service:** (usually installed automatically)
   ```bash
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. **Django service:** `/etc/systemd/system/sharewise-django.service`
   ```ini
   [Unit]
   Description=ShareWise AI Django Application
   After=network.target redis.service
   Requires=redis.service

   [Service]
   Type=exec
   User=sharewise
   Group=sharewise
   WorkingDirectory=/path/to/sharewise-ai/backend
   Environment=DJANGO_SETTINGS_MODULE=config.settings.production
   ExecStart=/path/to/venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Celery worker service:** `/etc/systemd/system/sharewise-celery.service`
   ```ini
   [Unit]
   Description=ShareWise AI Celery Worker
   After=network.target redis.service
   Requires=redis.service

   [Service]
   Type=exec
   User=sharewise
   Group=sharewise
   WorkingDirectory=/path/to/sharewise-ai/backend
   Environment=DJANGO_SETTINGS_MODULE=config.settings.production
   ExecStart=/path/to/venv/bin/celery -A config worker --loglevel=info
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

## 🔍 Health Checks

ShareWise AI includes built-in health check endpoints:

```bash
# Basic health check
curl http://localhost:8000/health/

# Detailed health check with Redis status
curl http://localhost:8000/health/detailed/

# Redis-specific health check
curl http://localhost:8000/health/redis/

# Celery health check
curl http://localhost:8000/health/celery/

# System metrics
curl http://localhost:8000/metrics/
```

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Refused**
   ```bash
   # Check if Redis is running
   ps aux | grep redis
   
   # Check Redis logs
   tail -f /var/log/redis/redis-server.log
   
   # Test connection
   redis-cli ping
   ```

2. **Permission Denied**
   ```bash
   # Check Redis permissions
   sudo chmod 755 /var/lib/redis
   sudo chown redis:redis /var/lib/redis
   ```

3. **Memory Issues**
   ```bash
   # Check Redis memory usage
   redis-cli info memory
   
   # Clear all caches (careful!)
   redis-cli flushall
   ```

4. **Port Already in Use**
   ```bash
   # Check what's using port 6379
   sudo netstat -tulpn | grep 6379
   
   # Kill process if needed
   sudo kill -9 <PID>
   ```

### Fallback Mode

ShareWise AI automatically falls back to database backends when Redis is unavailable:

- **Caching:** Uses Django's database cache
- **Sessions:** Uses database session backend  
- **Channels:** Uses in-memory channel layer
- **Celery:** Uses Django database message transport

## 📊 Monitoring

### Redis Metrics

```bash
# Monitor Redis in real-time
redis-cli --stat

# Get detailed info
redis-cli info all

# Monitor slow queries
redis-cli config set slowlog-log-slower-than 10000
redis-cli slowlog get 10
```

### ShareWise AI Monitoring

The health check endpoints provide comprehensive monitoring:

- Database connectivity
- Redis connectivity and performance
- Celery worker status
- System resources (CPU, memory, disk)
- Application metrics

## 🔒 Security Best Practices

1. **Network Security**
   - Bind Redis to localhost only (`bind 127.0.0.1`)
   - Use firewall rules to restrict access
   - Use Redis AUTH with strong passwords

2. **Command Security**
   - Disable dangerous commands (`FLUSHALL`, `FLUSHDB`, `CONFIG`)
   - Rename administrative commands

3. **Data Security**
   - Enable Redis persistence for important data
   - Regular backups of Redis dumps
   - Use SSL/TLS for Redis connections in production

4. **Monitoring**
   - Monitor Redis logs for suspicious activity
   - Set up alerts for connection failures
   - Track memory usage and performance metrics

## 📚 Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [Redis Security Guide](https://redis.io/topics/security)
- [Celery with Redis](https://docs.celeryproject.org/en/stable/getting-started/brokers/redis.html)
- [Django Redis Cache](https://django-redis.readthedocs.io/)
- [Django Channels Redis](https://channels.readthedocs.io/en/stable/topics/channel_layers.html#redis-channel-layer)