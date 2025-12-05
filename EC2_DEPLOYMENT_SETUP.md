# ASTRA GRID - EC2 Deployment Guide

## Overview
This guide sets up ASTRA GRID on AWS EC2 with multiple backend services running on separate ports, managed by systemd, and proxied through Nginx.

### Service Architecture

| Service | Port | Description |
|---------|------|-------------|
| Unified API | 5000 | Main API with auth & predictions |
| Auth API | 5001 | Authentication service |
| Simulation API | 5002 | ML simulation engine |
| Chatbot API | 5003 | Chatbot service |
| Document Extractor | 5004 | Document extraction with AWS Textract |
| Frontend | 3000 | React/Vite application |
| Nginx | 80, 443 | Reverse proxy & SSL |

---

## Prerequisites

### 1. EC2 Instance Setup

**Instance Requirements:**
- **AMI:** Ubuntu 22.04 LTS (ami-0c55b159cbfafe1f0 or similar)
- **Instance Type:** t3.medium or larger (2+ vCPUs, 4GB+ RAM)
- **Storage:** 50GB+ EBS volume
- **Security Group:** Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

**Launch Command:**
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name astra1 \
  --security-group-ids sg-xxxxxxxxx \
  --monitoring Enabled=true \
  --block-device-mappings DeviceName=/dev/sda1,Ebs={VolumeSize=50,VolumeType=gp3}
```

### 2. Connect to EC2 Instance

```bash
# Using the provided PEM key
ssh -i astra1.pem ubuntu@<your-ec2-public-ip>

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## Installation Steps

### Step 1: Install System Dependencies

```bash
# Install Python, Node.js, and build tools
sudo apt install -y \
  python3-pip \
  python3-venv \
  python3-dev \
  nodejs \
  npm \
  nginx \
  supervisor \
  curl \
  wget \
  git \
  build-essential \
  libssl-dev \
  libffi-dev

# Install MongoDB (optional, if using local MongoDB)
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Step 2: Clone Repository

```bash
# Clone the ASTRA GRID repository
cd /opt
sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git
sudo chown -R $USER:$USER astra-grid
cd astra-grid
```

### Step 3: Setup Python Environment & Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install Python dependencies
pip install -r backend/requirements.txt

# Install gunicorn for production WSGI
pip install gunicorn
```

### Step 4: Setup Environment Variables

```bash
# Copy .env template and configure
cd /opt/astra-grid
cp backend/.env.production.example backend/.env.production

# Edit with your configuration
nano backend/.env.production
```

**`.env.production` content:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=astra_grid

# JWT
JWT_SECRET=your-secure-secret-key-here-change-this

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1

# CORS
CORS_ORIGINS=http://your-ec2-ip,http://localhost,https://your-domain.com

# Flask
FLASK_ENV=production

# Ports (keep internal)
PORT=5000
```

### Step 5: Build Frontend

```bash
cd /opt/astra-grid
npm install
npm run build

# Output will be in dist/ folder
```

### Step 6: Setup Systemd Services

Create systemd service files for each backend service:

```bash
# Copy systemd service files
sudo cp deployment/systemd/*.service /etc/systemd/system/

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable astra-unified.service
sudo systemctl enable astra-auth.service
sudo systemctl enable astra-simulation.service
sudo systemctl enable astra-chatbot.service
sudo systemctl enable astra-document-extractor.service

# Start services
sudo systemctl start astra-unified.service
sudo systemctl start astra-auth.service
sudo systemctl start astra-simulation.service
sudo systemctl start astra-chatbot.service
sudo systemctl start astra-document-extractor.service

# Check status
sudo systemctl status astra-unified.service
```

### Step 7: Configure Nginx Reverse Proxy

```bash
# Copy Nginx configuration
sudo cp deployment/nginx/astra-grid.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/astra-grid.conf /etc/nginx/sites-enabled/

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 8: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl start certbot.timer
sudo systemctl enable certbot.timer
```

---

## Verification & Testing

### 1. Check Service Status

```bash
# Check all services
sudo systemctl status astra-*.service

# View service logs
sudo journalctl -u astra-unified.service -f
sudo journalctl -u astra-auth.service -f
```

### 2. Test Endpoints

```bash
# Test unified API
curl http://localhost/api/health

# Test auth API
curl http://localhost/auth/health

# Test simulation API
curl http://localhost/simulation/health

# Test chatbot API
curl http://localhost/chatbot/health

# Test document extractor
curl http://localhost/extract/health
```

### 3. Access Application

```
Frontend:     http://your-ec2-ip
Nginx Proxy:  http://your-ec2-ip (all APIs)
Backend APIs: See endpoints below
```

---

## API Endpoints (via Nginx Reverse Proxy)

```
GET    /api/health                    - Health check
POST   /auth/login                    - User login
POST   /auth/register                 - User registration
POST   /simulation/predict             - Run simulation
GET    /chatbot/health                - Chatbot health
POST   /chatbot/chat                  - Send message
POST   /extract/upload                - Extract document fields
```

---

## Monitoring & Logs

### View Real-time Logs

```bash
# All services
sudo journalctl -u astra-*.service -f

# Individual services
sudo journalctl -u astra-unified.service -f
sudo journalctl -u astra-auth.service -f
sudo journalctl -u astra-simulation.service -f
sudo journalctl -u astra-chatbot.service -f
sudo journalctl -u astra-document-extractor.service -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor CPU & Memory

```bash
# Real-time monitoring
top

# Check specific service resources
ps aux | grep python
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status and logs
sudo systemctl status astra-unified.service
sudo journalctl -u astra-unified.service -n 20

# Manual start for debugging
source /opt/astra-grid/venv/bin/activate
cd /opt/astra-grid
python backend/unified_api.py
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :5001

# Kill process
sudo kill -9 <PID>
```

### Nginx Not Proxying

```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
mongo --eval "db.adminCommand('ping')"
```

---

## Maintenance

### Update Application

```bash
cd /opt/astra-grid
git pull origin main
source venv/bin/activate
pip install -r backend/requirements.txt
npm install
npm run build
sudo systemctl restart astra-*.service
```

### Restart Services

```bash
# Restart all services
sudo systemctl restart astra-*.service

# Restart specific service
sudo systemctl restart astra-unified.service
```

### View Service Logs

```bash
# Last 100 lines
sudo journalctl -u astra-unified.service -n 100

# Filter by time
sudo journalctl -u astra-unified.service --since "1 hour ago"
```

---

## Performance Tuning

### Increase Service Capacity

Edit `/etc/systemd/system/astra-unified.service`:
```ini
[Service]
...
ExecStart=/opt/astra-grid/venv/bin/gunicorn \
  --workers 4 \
  --worker-class sync \
  --bind 127.0.0.1:5000 \
  --timeout 120 \
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
keepalive_timeout 65;
client_max_body_size 100M;
```

---

## Security Checklist

- [ ] Enable SSH key authentication (disable password)
- [ ] Configure firewall (ufw or AWS Security Groups)
- [ ] Enable SSL/TLS certificates
- [ ] Set strong JWT_SECRET in .env
- [ ] Restrict MongoDB to localhost only
- [ ] Enable automatic security updates
- [ ] Monitor logs for suspicious activity
- [ ] Setup regular backups

```bash
# Enable firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Enable automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Backup Strategy

```bash
# Backup database
mongodump --out /backup/mongodb/$(date +%Y%m%d)

# Backup application
tar -czf /backup/astra-grid-$(date +%Y%m%d).tar.gz /opt/astra-grid

# Setup daily backup cron
0 2 * * * /opt/astra-grid/backup.sh
```

---

## Rollback Procedure

```bash
# Stop services
sudo systemctl stop astra-*.service

# Revert code
cd /opt/astra-grid
git revert HEAD
git pull

# Restart services
sudo systemctl start astra-*.service

# Verify
curl http://localhost/api/health
```

---

## Support & Debugging

For detailed debugging:

```bash
# Enable debug mode
export FLASK_ENV=development
export FLASK_DEBUG=True

# Start service manually
source /opt/astra-grid/venv/bin/activate
python -u backend/unified_api.py

# Check Python version
python3 --version

# Check pip packages
pip list
```

---

**Last Updated:** December 5, 2025  
**Version:** 1.0
