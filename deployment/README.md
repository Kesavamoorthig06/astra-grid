# ASTRA GRID Deployment Module

Complete production-ready deployment package for AWS EC2.

## 📂 Directory Structure

```
deployment/
├── README.md                    (This file)
├── deploy.sh                    (Main deployment script)
├── enable-ssl.sh               (SSL certificate setup)
├── health-check.sh             (System health monitoring)
├── nginx/
│   └── astra-grid.conf        (Nginx reverse proxy config)
└── systemd/
    ├── astra-unified.service    (Main API service)
    ├── astra-auth.service       (Auth service)
    ├── astra-simulation.service (Simulation service)
    ├── astra-chatbot.service    (Chatbot service)
    └── astra-document-extractor.service (Document extractor service)
```

## 🚀 Quick Start

```bash
# 1. SSH into EC2 instance
ssh -i astra1.pem ubuntu@<your-ec2-ip>
sudo -i

# 2. Clone and prepare
cd /opt
git clone https://github.com/Kesavamoorthig06/astra-grid.git
cd astra-grid
chmod +x deployment/*.sh

# 3. Deploy (choose one)

# Option A: Deploy without SSL (for testing)
sudo bash deployment/deploy.sh

# Option B: Deploy with SSL enabled
sudo bash deployment/deploy.sh --domain your-domain.com --with-ssl

# 4. Verify
bash deployment/health-check.sh

# 5. Access
# Frontend: http://<your-ec2-ip>
# API: http://<your-ec2-ip>/api/health
```

## 📋 Scripts

### deploy.sh
Main deployment automation script. Handles:
- System package installation
- Python virtual environment setup
- Node.js dependencies
- Frontend build
- Systemd service configuration
- Nginx setup
- Optional SSL certificate
- Service startup

**Usage:**
```bash
sudo bash deploy.sh                                    # Basic deployment
sudo bash deploy.sh --domain example.com --with-ssl   # With SSL
```

**What it does:**
1. Updates system packages
2. Installs Python, Node.js, Nginx, MongoDB
3. Clones/updates repository
4. Creates Python virtual environment
5. Installs Python dependencies
6. Builds React frontend
7. Configures systemd services
8. Sets up Nginx reverse proxy
9. Optionally installs SSL certificate
10. Starts all services

### enable-ssl.sh
Enables SSL/TLS certificate with Let's Encrypt for an existing deployment.

**Usage:**
```bash
sudo bash enable-ssl.sh --domain your-domain.com
```

**What it does:**
1. Updates domain in Nginx config
2. Requests SSL certificate from Let's Encrypt
3. Configures auto-renewal
4. Restarts Nginx with SSL

### health-check.sh
Monitors system health and service status.

**Usage:**
```bash
bash health-check.sh
```

**Checks:**
- Service running status
- Port listening status
- CPU and memory usage
- Disk space usage
- Database connectivity
- API endpoint responsiveness
- Recent error logs

## 🔧 Systemd Services

### Service Files
Located in `systemd/` directory. Each runs a backend service with Gunicorn.

**astra-unified.service**
- Main unified API
- Port: 5000
- Workers: 4
- Timeout: 120s

**astra-auth.service**
- Authentication API
- Port: 5001
- Workers: 2
- Timeout: 60s

**astra-simulation.service**
- Simulation/ML API
- Port: 5002
- Workers: 3
- Timeout: 180s

**astra-chatbot.service**
- Chatbot API
- Port: 5003
- Workers: 2
- Timeout: 60s

**astra-document-extractor.service**
- Document extraction service
- Port: 5004
- Workers: 2
- Timeout: 300s

### Service Management

```bash
# Check service status
sudo systemctl status astra-unified.service

# View service logs
sudo journalctl -u astra-unified.service -f

# Restart service
sudo systemctl restart astra-unified.service

# Stop service
sudo systemctl stop astra-unified.service

# Start service
sudo systemctl start astra-unified.service

# Check all services
sudo systemctl status astra-*.service
```

## 🌐 Nginx Configuration

**File:** `nginx/astra-grid.conf`

**Features:**
- HTTP to HTTPS redirect
- SSL/TLS with security headers
- Reverse proxy to all backend services
- Static file caching
- Gzip compression
- CORS headers
- Request logging
- 100MB upload limit

**Deployment locations:**
```bash
/etc/nginx/sites-available/astra-grid.conf
/etc/nginx/sites-enabled/astra-grid.conf (symlink)
```

**Nginx management:**
```bash
# Test configuration
sudo nginx -t

# Reload config (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## 📊 Service Routing (via Nginx)

```
GET    /                   → Frontend (React)
POST   /api/*             → Port 5000 (Unified API)
POST   /auth/*            → Port 5001 (Auth)
POST   /simulation/*      → Port 5002 (Simulation)
POST   /chatbot/*         → Port 5003 (Chatbot)
POST   /extract/*         → Port 5004 (Document Extractor)
GET    /health            → Health check
```

## 🔐 Security Configuration

### Firewall Setup
```bash
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw enable
```

### SSL Certificate
```bash
# Option 1: Using deploy script
sudo bash deploy.sh --domain your-domain.com --with-ssl

# Option 2: Manual setup
sudo bash enable-ssl.sh --domain your-domain.com

# Check certificate status
sudo certbot certificates

# Manual renewal
sudo certbot renew
```

### Environment Security
```bash
# Restrict access to environment file
sudo chmod 600 backend/.env.production

# Change ownership
sudo chown www-data:www-data backend/.env.production
```

## 📝 Configuration

### Environment Variables
Located at: `backend/.env.production`

Key variables:
```env
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=astra_grid
JWT_SECRET=<generate-with-openssl-rand-hex-32>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
CORS_ORIGINS=http://localhost,https://your-domain.com
FLASK_ENV=production
```

### Generate Secure JWT Secret
```bash
openssl rand -hex 32
```

## 📊 Monitoring

### Check Service Status
```bash
# Individual service
sudo systemctl status astra-unified.service

# All services
sudo systemctl status astra-*.service

# Detailed status
systemctl show astra-unified.service
```

### View Logs
```bash
# Real-time logs
sudo journalctl -u astra-unified.service -f

# Last 50 lines
sudo journalctl -u astra-unified.service -n 50

# Filter by severity
sudo journalctl -u astra-unified.service -p err

# Time range
sudo journalctl -u astra-unified.service --since "1 hour ago"
```

### System Resources
```bash
# CPU and memory
top

# Disk usage
df -h /opt/astra-grid

# Process list
ps aux | grep python

# Open ports
sudo netstat -tulpn | grep LISTEN
```

## 🆘 Troubleshooting

### Service Won't Start
```bash
# Check status
sudo systemctl status astra-unified.service

# View full error
sudo journalctl -u astra-unified.service -n 50

# Manual test
source /opt/astra-grid/venv/bin/activate
cd /opt/astra-grid
python backend/unified_api.py
```

### Port Already in Use
```bash
# Find process
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or restart service
sudo systemctl restart astra-unified.service
```

### MongoDB Connection Issues
```bash
# Check MongoDB
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Reload config
sudo systemctl reload nginx
```

## 🔄 Updating Application

```bash
# Stop services
sudo systemctl stop astra-*.service

# Pull latest code
cd /opt/astra-grid
git pull origin main

# Install new dependencies
source venv/bin/activate
pip install -r backend/requirements.txt

# Rebuild frontend
npm install
npm run build

# Restart services
sudo systemctl restart astra-*.service

# Verify
bash deployment/health-check.sh
```

## 💾 Backup & Recovery

### Backup Database
```bash
sudo mongodump --out /backup/mongodb/$(date +%Y%m%d)
```

### Backup Application
```bash
sudo tar -czf /backup/astra-grid-$(date +%Y%m%d).tar.gz /opt/astra-grid
```

### Backup Configuration
```bash
sudo cp backend/.env.production /backup/.env.production.backup
```

## 📈 Performance Tuning

### Increase Worker Count
Edit service file (e.g., `astra-unified.service`):
```ini
ExecStart=/opt/astra-grid/venv/bin/gunicorn \
  --workers 8 \
  --worker-class sync \
  --bind 127.0.0.1:5000 \
  backend.unified_api:app
```

Reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart astra-unified.service
```

### Optimize Nginx
Edit `/etc/nginx/nginx.conf`:
```nginx
worker_processes auto;
worker_connections 2048;
```

Reload:
```bash
sudo systemctl reload nginx
```

## 📚 Documentation

- **Full Guide**: `../EC2_DEPLOYMENT_SETUP.md`
- **Quick Start**: `../QUICK_START_EC2.md`
- **Deployment Summary**: `../DEPLOYMENT_SUMMARY.md`

## 🆘 Getting Help

1. **Check logs**: `sudo journalctl -u astra-unified.service -f`
2. **Run health check**: `bash health-check.sh`
3. **Test endpoints**: `curl http://localhost/api/health`
4. **Check Nginx**: `sudo nginx -t`

## 📞 Support

- GitHub: https://github.com/Kesavamoorthig06/astra-grid
- Issues: Create an issue on GitHub repository

---

**Version**: 1.0  
**Last Updated**: December 5, 2025
