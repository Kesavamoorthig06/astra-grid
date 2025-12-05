# ASTRA GRID - EC2 Quick Start Deployment Guide

## 🚀 5-Minute Quick Start

### Prerequisites
- AWS EC2 instance (Ubuntu 22.04 LTS) running
- PEM key file for SSH access
- Domain name (optional, for SSL)

### Step 1: Connect to Your EC2 Instance

```bash
# Replace with your EC2 public IP
ssh -i astra1.pem ubuntu@<your-ec2-ip>

# Switch to root
sudo -i
```

### Step 2: Clone Repository & Run Deployment

```bash
# Clone the repo
cd /opt
git clone https://github.com/Kesavamoorthig06/astra-grid.git
cd astra-grid

# Make deployment scripts executable
chmod +x deployment/*.sh

# Run deployment (without SSL for initial setup)
sudo bash deployment/deploy.sh

# Or with domain and SSL enabled
sudo bash deployment/deploy.sh --domain astra-grid.example.com --with-ssl
```

### Step 3: Verify Installation

```bash
# Check all services
sudo systemctl status astra-*.service

# View logs
sudo journalctl -u astra-unified.service -f

# Run health check
bash deployment/health-check.sh
```

### Step 4: Access Your Application

```
Frontend:     http://<your-ec2-ip>
Backend API:  http://<your-ec2-ip>/api
```

---

## 🔧 Manual Deployment (If Script Fails)

### 1. System Setup

```bash
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-venv python3-pip \
    nodejs npm nginx mongodb curl git build-essential
```

### 2. Python Environment

```bash
cd /opt/astra-grid
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

### 3. Environment Configuration

```bash
cp backend/.env.production.example backend/.env.production

# Edit configuration
nano backend/.env.production

# Important: Set these values
# - MONGODB_URI (if using remote MongoDB)
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY (if using)
```

### 4. Build Frontend

```bash
npm install
npm run build
```

### 5. Setup Services

```bash
# Copy systemd service files
sudo cp deployment/systemd/*.service /etc/systemd/system/

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable astra-*.service

# Start services
sudo systemctl start astra-*.service
```

### 6. Configure Nginx

```bash
# Copy Nginx config
sudo cp deployment/nginx/astra-grid.conf /etc/nginx/sites-available/

# Replace placeholder domain with your actual domain
sudo sed -i 's/astra-grid.example.com/your-domain.com/g' /etc/nginx/sites-available/astra-grid.conf

# Enable site
sudo ln -sf /etc/nginx/sites-available/astra-grid.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / Clients                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
    ┌───▼────────┐          ┌──────▼──────┐
    │   HTTP:80  │          │  HTTPS:443  │
    │  (redirect)│          │   (SSL)     │
    └───┬────────┘          └──────┬──────┘
        │                          │
        └──────────────┬───────────┘
                       │
           ┌───────────▼────────────┐
           │  Nginx Reverse Proxy   │
           │   (Load Balancer)      │
           └───────────┬────────────┘
                       │
      ┌────────────────┼────────────────┐
      │                │                │
   ┌──▼──┐  ┌────────┐ │ ┌──────────┐  │
   │5000 │  │ 5001   │ │ │  5002    │  │
   │API  │  │ Auth   │ │ │Simulation│  │
   └──┬──┘  └────┬───┘ │ └─────┬────┘  │
      │          │     │       │       │
   ┌──▼──┐  ┌────▼──┐  │  ┌────▼────┐  │
   │5003 │  │ 5004  │  │  │ Backend │  │
   │Chat │  │Extract│  │  │  Code   │  │
   └─────┘  └───────┘  │  └─────────┘  │
      │                │                │
      └────────────────┼────────────────┘
                       │
           ┌───────────▼──────────┐
           │  Local Backends      │
           │  - MongoDB           │
           │  - File Storage      │
           │  - Models            │
           └──────────────────────┘
```

---

## 🔐 Security Setup

### 1. Enable SSL Certificate

```bash
# Using the provided script
sudo bash deployment/enable-ssl.sh --domain your-domain.com

# Or manually with Certbot
sudo certbot certonly --nginx -d your-domain.com
```

### 2. Configure Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### 3. Secure Environment File

```bash
sudo chmod 600 backend/.env.production
sudo chown www-data:www-data backend/.env.production
```

### 4. Setup Automatic Updates

```bash
sudo apt install -y unattended-upgrades
sudo systemctl start unattended-upgrades
sudo systemctl enable unattended-upgrades
```

---

## 📝 Common Operations

### Viewing Logs

```bash
# Unified API logs
sudo journalctl -u astra-unified.service -f

# Auth API logs
sudo journalctl -u astra-auth.service -f

# All backend services
sudo journalctl -u astra-*.service -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Last 50 lines
sudo journalctl -u astra-unified.service -n 50
```

### Restarting Services

```bash
# Restart all services
sudo systemctl restart astra-*.service

# Restart specific service
sudo systemctl restart astra-unified.service

# Reload Nginx (without disconnecting clients)
sudo systemctl reload nginx
```

### Checking Service Status

```bash
# Check all services
sudo systemctl status astra-*.service

# Check if port is listening
sudo lsof -i :5000
sudo netstat -tulpn | grep LISTEN

# Check CPU and memory usage
top
ps aux | grep python
```

### Updating Application

```bash
cd /opt/astra-grid

# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install new dependencies
pip install -r backend/requirements.txt

# Rebuild frontend
npm install
npm run build

# Restart services
sudo systemctl restart astra-*.service
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status astra-unified.service

# View error logs
sudo journalctl -u astra-unified.service -n 50

# Try starting manually
source /opt/astra-grid/venv/bin/activate
cd /opt/astra-grid
python backend/unified_api.py
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or restart the service
sudo systemctl restart astra-unified.service
```

### MongoDB Connection Error

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

### Nginx Not Proxying Correctly

```bash
# Test Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

---

## 📊 Monitoring

### Health Check

```bash
# Run included health check script
bash /opt/astra-grid/deployment/health-check.sh

# Or manually test endpoints
curl http://localhost/api/health
curl http://localhost/auth/health
curl http://localhost/simulation/health
curl http://localhost/chatbot/health
curl http://localhost/extract/health
```

### Performance Metrics

```bash
# Check CPU usage
top
ps aux | grep python | awk '{sum+=$3} END {print "CPU: " sum "%"}'

# Check memory usage
ps aux | grep python | awk '{sum+=$6} END {print "Memory: " sum " KB"}'

# Check disk usage
df -h /opt/astra-grid
du -sh /opt/astra-grid

# Check open connections
netstat -an | grep ESTABLISHED | wc -l
```

---

## 🔄 Backup & Recovery

### Backup Database

```bash
# Backup MongoDB
sudo mongodump --out /backup/mongodb/$(date +%Y%m%d_%H%M%S)

# Backup application files
sudo tar -czf /backup/astra-grid-$(date +%Y%m%d_%H%M%S).tar.gz /opt/astra-grid

# Backup configuration
sudo cp /opt/astra-grid/backend/.env.production /backup/.env.production.$(date +%Y%m%d)
```

### Restore from Backup

```bash
# Restore MongoDB
sudo mongorestore /backup/mongodb/2025-12-05_120000

# Restore application files
sudo tar -xzf /backup/astra-grid-20251205_120000.tar.gz -C /opt
```

---

## 📚 API Endpoints (via Nginx)

```
Method  Path                    Description
──────────────────────────────────────────────
POST    /api/login             User login
POST    /api/register          User registration
GET     /api/health            Health check
POST    /api/predict           Run prediction
GET     /auth/health           Auth health
POST    /simulation/predict    Simulation
GET     /chatbot/health        Chatbot health
POST    /chatbot/chat          Send message
POST    /extract/upload        Extract document
GET     /health                General health
```

---

## 🆘 Getting Help

### View Service Logs
```bash
sudo journalctl -u astra-unified.service -f -n 100
```

### Check System Resources
```bash
free -h        # Memory
df -h /opt     # Disk space
top            # Process monitor
```

### Reset Services
```bash
sudo systemctl restart astra-*.service
```

### Emergency Recovery
```bash
# Stop all services
sudo systemctl stop astra-*.service

# Check what went wrong
sudo systemctl status astra-unified.service

# Restart one service
sudo systemctl start astra-unified.service

# Check if it started
sudo systemctl status astra-unified.service
```

---

## 📞 Support

- **Documentation**: `/opt/astra-grid/EC2_DEPLOYMENT_SETUP.md`
- **GitHub**: https://github.com/Kesavamoorthig06/astra-grid
- **Issues**: Create an issue on GitHub

---

**Last Updated**: December 5, 2025
**Version**: 1.0
