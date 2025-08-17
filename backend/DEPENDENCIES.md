# Dependencies Guide for ShareWise AI

## 📦 Requirements Files Overview

This project uses multiple requirements files for different environments and use cases:

### Base Requirements (`requirements.txt`)
Core dependencies needed for production deployment:
- Django web framework and REST API
- Database connections (PostgreSQL)
- Authentication and security
- Basic ML libraries (scikit-learn, pandas, numpy)
- Async processing (Celery, Redis, Channels)

### Development Requirements (`requirements-dev.txt`)
Additional tools for development:
- Testing frameworks (pytest, coverage)
- Code quality tools (black, flake8, pylint)
- Debugging tools
- Development servers
- Documentation tools

### Machine Learning Requirements (`requirements-ml.txt`)
Advanced ML and deep learning dependencies:
- Deep learning frameworks (PyTorch, PyTorch Lightning)
- GPU acceleration support
- Experiment tracking (MLflow, TensorBoard)
- AutoML and hyperparameter optimization
- Model deployment and monitoring

## 🚀 Installation Instructions

### 1. Basic Installation (Production)
```bash
cd backend
pip install -r requirements.txt
```

### 2. Development Setup
```bash
cd backend
pip install -r requirements-dev.txt
```

### 3. Full ML/AI Setup
```bash
cd backend
pip install -r requirements-ml.txt
```

### 4. Custom Installation
For minimal installation, you can install specific components:
```bash
# Web framework only
pip install Django djangorestframework psycopg2-binary

# Add ML capabilities
pip install numpy pandas scikit-learn

# Add deep learning
pip install torch pytorch-lightning
```

## 🔧 GPU Support

For GPU-accelerated training:

1. **Install CUDA 11.8** (recommended)
2. **Install PyTorch with CUDA support:**
   ```bash
   pip install torch==2.4.1+cu118 torchvision==0.19.1+cu118 -f https://download.pytorch.org/whl/torch_stable.html
   ```

3. **Verify GPU availability:**
   ```python
   import torch
   print(f"CUDA available: {torch.cuda.is_available()}")
   print(f"GPU count: {torch.cuda.device_count()}")
   ```

## 📋 System Requirements

### Minimum Requirements
- Python 3.11+
- PostgreSQL 13+
- Redis 6+ (for production)
- 8GB RAM
- 20GB storage

### Recommended for ML/AI
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- 16GB+ RAM
- 100GB+ storage
- NVIDIA GPU with 8GB+ VRAM (optional)

## 🔍 Version Management

### Updating Dependencies
```bash
# Check for outdated packages
pip list --outdated

# Update specific package
pip install --upgrade package-name

# Generate new requirements with current versions
pip freeze > requirements-frozen.txt
```

### Security Updates
```bash
# Check for security vulnerabilities
pip install safety
safety check

# Update security-critical packages
pip install --upgrade cryptography django
```

## 🛠 Development Tools

### Code Quality
```bash
# Format code
black .
isort .

# Lint code
flake8 .
pylint apps/

# Type checking
mypy apps/
```

### Testing
```bash
# Run tests
pytest

# With coverage
pytest --cov=apps/

# Performance testing
pytest --benchmark-only
```

## 📊 Performance Considerations

### Production Optimizations
- Use `psycopg2-binary` for faster PostgreSQL connections
- Enable Redis for caching and session storage
- Use `whitenoise` for static file serving
- Consider `gunicorn` with `gevent` workers

### ML Performance
- Use GPU acceleration when available
- Enable mixed precision training with PyTorch Lightning
- Use `torch.compile()` for faster inference (PyTorch 2.0+)
- Consider model quantization for deployment

## 🚨 Common Issues

### 1. CUDA Installation
```bash
# Check CUDA version
nvidia-smi

# Install correct PyTorch version
pip install torch==2.4.1+cu118 --index-url https://download.pytorch.org/whl/cu118
```

### 2. PostgreSQL Connection
```bash
# Install development headers (Ubuntu/Debian)
sudo apt-get install libpq-dev python3-dev

# For Windows, use psycopg2-binary
pip install psycopg2-binary
```

### 3. TA-Lib Installation
```bash
# Ubuntu/Debian
sudo apt-get install build-essential wget
wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
tar -xzf ta-lib-0.4.0-src.tar.gz
cd ta-lib/
./configure --prefix=/usr
make
sudo make install
pip install TA-Lib

# Windows: Download pre-compiled wheel from
# https://www.lfd.uci.edu/~gohlke/pythonlibs/#ta-lib
```

## 📝 Environment Variables

Required environment variables (see `.env.example`):
```bash
SECRET_KEY=your-secret-key
DEBUG=False
DB_NAME=sharewise_ai
DB_USER=your-db-user
DB_PASSWORD=your-db-password
REDIS_URL=redis://localhost:6379
```

## 🔄 Continuous Integration

For CI/CD pipelines, use:
```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: |
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
```

## 📞 Support

For dependency-related issues:
1. Check this documentation
2. Search existing GitHub issues
3. Create a new issue with:
   - Python version (`python --version`)
   - OS and version
   - Full error message
   - Steps to reproduce