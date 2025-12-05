# ASTRA GRID - EC2 Deployment Guide

## Architecture Overview

The application now runs with **separate backend services** for better scalability and reliability:

- **Port 5001**: Authentication API (`auth_app.py`)
- **Port 5000**: ML Prediction API (`Model/app.py`)
- **Port 5002**: Simulation API (`simulation_api.py`)
- **Port 5003**: Chatbot API (`chatbot_api.py`)
- **Port 3000**: Frontend (React + Vite)

---

## EC2 Setup

### 1. Launch EC2 Instance

- **Instance Type**: t3.medium (2 vCPU, 4GB RAM minimum)
- **OS**: Ubuntu 22.04 LTS or Amazon Linux 2023
- **Storage**: 20GB minimum
- **Security Group**: Open ports 80, 443, 3000, 5000-5003

### 2. Security Group Rules

```
Type            Protocol    Port Range    Source
HTTP            TCP         80            0.0.0.0/0
HTTPS           TCP         443           0.0.0.0/0
Custom TCP      TCP         3000          0.0.0.0/0
Custom TCP      TCP         5000          0.0.0.0/0
Custom TCP      TCP         5001          0.0.0.0/0
Custom TCP      TCP         5002          0.0.0.0/0
Custom TCP      TCP         5003          0.0.0.0/0
SSH             TCP         22            Your-IP/32
```

---

## Installation Steps

### 1. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Install PM2 for process management
sudo npm install -g pm2
```

### 3. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/Kesavamoorthig06/astra-grid.git
cd astra-grid
```

### 4. Setup Backend

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
nano .env
```

Edit `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/
SECRET_KEY=your-super-secret-key-change-this
PORT=5001
```

### 5. Setup Frontend

```bash
cd ../
npm install
npm run build
```

---

## Running with PM2 (Production)

### 1. Create PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'astra-auth',
      cwd: '/home/ubuntu/astra-grid/backend',
      script: 'venv/bin/python',
      args: 'auth_app.py',
      env: {
        PORT: 5001
      }
    },
    {
      name: 'astra-prediction',
      cwd: '/home/ubuntu/astra-grid/backend/Model',
      script: '../venv/bin/python',
      args: 'app.py',
      env: {
        PORT: 5000
      }
    },
    {
      name: 'astra-simulation',
      cwd: '/home/ubuntu/astra-grid/backend',
      script: 'venv/bin/python',
      args: 'simulation_api.py',
      env: {
        PORT: 5002
      }
    },
    {
      name: 'astra-chatbot',
      cwd: '/home/ubuntu/astra-grid/backend',
      script: 'venv/bin/python',
      args: 'chatbot_api.py',
      env: {
        PORT: 5003
      }
    },
    {
      name: 'astra-frontend',
      cwd: '/home/ubuntu/astra-grid',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000'
    }
  ]
};
```

### 2. Start All Services

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Monitor Services

```bash
pm2 status
pm2 logs
pm2 monit
```

---

## Nginx Reverse Proxy (Optional but Recommended)

### 1. Install Nginx

```bash
sudo apt install nginx -y
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/astra-grid`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth API
    location /auth/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Prediction API
    location /predict/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Simulation API
    location /simulate/ {
        proxy_pass http://localhost:5002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Chatbot API
    location /chat/ {
        proxy_pass http://localhost:5003/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/astra-grid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Environment Variables for Production

Update frontend `.env.production`:

```env
VITE_AUTH_URL=http://your-ec2-ip:5001
VITE_PREDICT_URL=http://your-ec2-ip:5000
VITE_SIMULATE_URL=http://your-ec2-ip:5002
VITE_CHATBOT_URL=http://your-ec2-ip:5003
```

Or if using Nginx:
```env
VITE_AUTH_URL=http://your-domain.com/auth
VITE_PREDICT_URL=http://your-domain.com/predict
VITE_SIMULATE_URL=http://your-domain.com/simulate
VITE_CHATBOT_URL=http://your-domain.com/chat
```

---

## Useful Commands

### Check Service Status
```bash
pm2 status
curl http://localhost:5001/api/health
curl http://localhost:5000/health
curl http://localhost:5002/api/health  
curl http://localhost:5003/api/health
```

### View Logs
```bash
pm2 logs astra-auth
pm2 logs astra-prediction
pm2 logs astra-simulation
pm2 logs astra-chatbot
pm2 logs astra-frontend
```

### Restart Services
```bash
pm2 restart all
# Or individual:
pm2 restart astra-auth
```

### Stop Services
```bash
pm2 stop all
pm2 delete all
```

---

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :5001
sudo kill -9 <PID>
```

### MongoDB Not Running
```bash
sudo systemctl status mongodb
sudo systemctl start mongodb
```

### Check Service Logs
```bash
pm2 logs --lines 100
```

### Backend Not Responding
```bash
pm2 restart astra-auth
pm2 restart astra-prediction
```

---

## Monitoring & Maintenance

### Setup PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Auto-Restart on Crash
PM2 automatically restarts crashed processes.

### System Resources
```bash
pm2 monit  # Real-time monitoring
htop       # System resources
```

---

## SSL/HTTPS with Let's Encrypt (Production)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## Success! 🎉

Your ASTRA GRID application is now deployed on EC2 with:
- ✅ Separate backend services for scalability
- ✅ PM2 process management
- ✅ Auto-restart on failures
- ✅ MongoDB database
- ✅ All features working (Auth, ML Prediction, Simulation, Chatbot)

Access your app at: `http://your-ec2-ip:3000`
