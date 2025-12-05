# ASTRA GRID - EC2 Deployment Guide

## 🚀 Quick Start Deployment

This guide will help you deploy ASTRA GRID on an AWS EC2 instance.

---

## 📋 Prerequisites

### EC2 Instance Requirements
- **Instance Type**: t3.medium or larger (minimum 2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS or Amazon Linux 2023
- **Storage**: 30GB minimum
- **Security Group**:
  - Port 80 (HTTP) - Frontend
  - Port 443 (HTTPS) - Optional for SSL
  - Port 22 (SSH) - For deployment
  - Port 5000 (Unified Backend API) - **Single port for all backend services**

---

## 🛠️ Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **SSH into your EC2 instance**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

2. **Download and run the deployment script**:
```bash
curl -o deploy.sh https://raw.githubusercontent.com/Kesavamoorthig06/astra-grid/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

3. **Configure environment variables**:
   - Edit `.env` file for frontend settings
   - Edit `backend/.env` file for backend settings

4. **Access your application**:
   - Frontend: `http://your-ec2-ip`
   - Unified Backend API: `http://your-ec2-ip:5000`
   - Health Check: `http://your-ec2-ip:5000/api/health`

---

### Option 2: Manual Deployment

#### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker
```

#### Step 3: Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 4: Clone Repository
```bash
git clone https://github.com/Kesavamoorthig06/astra-grid.git
cd astra-grid
```

#### Step 5: Configure Environment Variables

**Frontend (.env)**:
```bash
cp .env.example .env
nano .env
```
Set:
```
VITE_API_URL=http://your-ec2-ip:5000
```
> **Note**: All backend services (auth, prediction, simulation) are now unified on port 5000

**Backend (backend/.env)**:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Set:
```
MONGODB_URI=mongodb://mongodb:27017/
JWT_SECRET=your-super-secret-production-key
PORT=5000
FLASK_ENV=production
FLASK_DEBUG=False
CORS_ORIGINS=http://your-ec2-ip
```
> **Architecture**: Unified API runs all services (auth, prediction, simulation) on port 5000

#### Step 6: Build and Start Services
```bash
sudo docker-compose build
sudo docker-compose up -d
```

#### Step 7: Verify Deployment
```bash
sudo docker-compose ps
sudo docker-compose logs -f
```

---

## 🔒 Security Configuration

### 1. Configure AWS Security Group
```
Inbound Rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0 (Frontend)
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (Frontend - SSL)
- Type: Custom TCP, Port: 5000, Source: 0.0.0.0/0 (Unified Backend API)
- Type: SSH, Port: 22, Source: Your IP (Secure access)
```
> **Simplified**: Only ONE backend port needed (5000) instead of multiple ports!

### 2. Setup Firewall (UFW)
```bash
sudo ufw allow 80/tcp      # Frontend
sudo ufw allow 443/tcp     # Frontend SSL
sudo ufw allow 5000/tcp    # Unified Backend API
sudo ufw allow 22/tcp      # SSH
sudo ufw enable
```

### 3. Generate Strong JWT Secret
```bash
openssl rand -hex 32
```
Add this to `backend/.env` as `JWT_SECRET`

---

## 🌐 Domain Setup (Optional)

### Using Route 53 & Elastic IP

1. **Allocate Elastic IP**:
   - AWS Console → EC2 → Elastic IPs → Allocate
   - Associate with your EC2 instance

2. **Configure DNS**:
   - Route 53 → Create hosted zone
   - Add A record pointing to Elastic IP

3. **Update environment variables**:
```bash
VITE_API_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
```

### Restart Services
```bash
sudo docker-compose restart
```

### Update Application
```bash
git pull origin main
sudo docker-compose up -d --build
```

### Stop Services
```bash
sudo docker-compose down
```

### Backup MongoDB Data
```bash
sudo docker exec astra_mongodb mongodump --out /backup
sudo docker cp astra_mongodb:/backup ./mongodb-backup
```

---

## 🚨 Troubleshooting

### Services won't start
```bash
# Check service status
sudo docker-compose ps

# View detailed logs
sudo docker-compose logs --tail=100

# Restart specific service
sudo docker-compose restart backend
```

### Port already in use
```bash
# Find process using port 5000 (unified backend)
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### MongoDB connection issues
```bash
# Check MongoDB status
sudo docker exec astra_mongodb mongosh --eval "db.adminCommand('ping')"

# Restart MongoDB
sudo docker-compose restart mongodb
```

### Frontend can't reach backend
- Check CORS_ORIGINS in backend/.env
- Verify security group allows port 5000
- Check if unified API is running: `curl http://localhost:5000/api/health`
- Verify VITE_API_URL points to correct endpoint

---

## 📈 Performance Optimization

### 1. Enable HTTPS
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 2. Setup Nginx Reverse Proxy
Create `/etc/nginx/sites-available/astra-grid`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;  # Unified backend API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Auto-start on Reboot
```bash
# Enable Docker service
sudo systemctl enable docker

# Docker Compose will auto-restart containers
# (configured with restart: unless-stopped)
```

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/Kesavamoorthig06/astra-grid/issues
- Email: kesavamoorthi@powergrid.com

---

## 📝 Environment Variables Reference

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Unified Backend API URL | http://your-ec2-ip:5000 |
| VITE_GOOGLE_TRANSLATE_API_KEY | Google Translate API | your-api-key |

> **Note**: All backend services (auth, prediction, simulation) are accessible through the unified API

### Backend (backend/.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://mongodb:27017/ |
| JWT_SECRET | JWT signing secret | 32-char-random-string |
| PORT | Unified API port | 5000 |
| FLASK_ENV | Flask environment | production |
| CORS_ORIGINS | Allowed origins (comma-separated) | http://your-ec2-ip |

---

## ✅ Post-Deployment Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] Frontend accessible from browser
- [ ] Backend API responding (test login)
- [ ] MongoDB connected and seeded
- [ ] Environment variables configured
- [ ] Security group rules set
- [ ] Firewall configured
- [ ] Admin accounts created
- [ ] SSL certificate installed (production)
- [ ] Domain configured (optional)
- [ ] Backups configured
- [ ] Monitoring setup (optional)

---

**Version**: 1.0.0  
**Last Updated**: December 2025
