# Gunicorn configuration for ShareWise AI
bind = "127.0.0.1:8004"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
preload_app = True
timeout = 30
keepalive = 2
user = "root"
group = "root"
tmp_upload_dir = None
errorlog = "/var/log/sharewise/gunicorn_error.log"
accesslog = "/var/log/sharewise/gunicorn_access.log"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
loglevel = "info"
