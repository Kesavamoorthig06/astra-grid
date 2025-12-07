# ASTRA GRID - EC2 DEPLOYMENT GUIDE
## Version 2.0.0 - Unified Backend

## Pre-Deployment Checklist

- [ ] EC2 instance running (Ubuntu 20.04 LTS recommended)
- [ ] MongoDB installed and running
- [ ] Python 3.9+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Environment variables configured

## Step 1: SSH into EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install -y python3.9 python3.9-venv python3-pip

# Install MongoDB
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB
mongosh --eval "db.adminCommand('ping')"
```

## Step 3: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git
cd astra-grid
```

## Step 4: Setup Python Virtual Environment

```bash
cd backend
python3.9 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

## Step 5: Configure Environment

```bash
# Copy production config
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

### Required Environment Variables:

```env
# Flask
FLASK_ENV=production
DEBUG=False

# Server
HOST=0.0.0.0
PORT=5000
WORKERS=6

# Database
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=astra_grid_db

# JWT
JWT_SECRET_KEY=your-very-secure-random-key-here-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ORIGINS=http://your-ec2-ip:3000,http://your-domain.com

# Flask
FLASK_ENV=production
```

Generate secure JWT key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Step 6: Load Environment Variables

```bash
source .env.production
```

## Step 7: Test the Application

```bash
# Run in foreground (for testing)
python run.py

# Should see:
# ============================================================
# ASTRA GRID - Unified Backend API
# Version: 2.0.0
# Environment: production
# 
# Server Configuration:
# - Host: 0.0.0.0
# - Port: 5000
# ...
# ============================================================
```

Test health endpoint (in another terminal):
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "service": {
    "name": "ASTRA GRID Unified Backend",
    "version": "2.0.0",
    "environment": "production"
  },
  "components": {
    "database": {"status": "connected"},
    "ml_models": {"status": "loaded"}
  }
}
```

## Step 8: Setup Systemd Service

Create systemd service file:

```bash
sudo nano /etc/systemd/system/astra-grid.service
```

Add content:

```ini
[Unit]
Description=ASTRA GRID Unified Backend API
After=network.target mongodb.service
Requires=mongodb.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/astra-grid/backend
Environment="PATH=/opt/astra-grid/backend/venv/bin"
Environment="FLASK_ENV=production"
EnvironmentFile=/opt/astra-grid/backend/.env.production
ExecStart=/opt/astra-grid/backend/venv/bin/python run.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable astra-grid
sudo systemctl start astra-grid

# Check status
sudo systemctl status astra-grid

# View logs
sudo journalctl -u astra-grid -f
```

## Step 9: Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/astra-grid
```

Add content:

```nginx
upstream astra_grid {
    server localhost:5000;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    location / {
        proxy_pass http://astra_grid;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/astra-grid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: Verify Deployment

Test all endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Get system info
curl http://localhost:5000/api/info

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@powergrid.com", "password":"admin123"}'

# Update frontend API endpoint
# In frontend, change all API calls from localhost:5001 to:
# http://your-ec2-ip:5000
```

## Monitoring & Maintenance

### View Logs:
```bash
# System logs
sudo journalctl -u astra-grid -f

# Application logs (if using file output)
tail -f /opt/astra-grid/backend/app.log
```

### Check Database:
```bash
mongosh
> use astra_grid_db
> db.users.countDocuments()
> db.predictions.countDocuments()
```

### Restart Application:
```bash
sudo systemctl restart astra-grid
```

### Update Application:
```bash
cd /opt/astra-grid
sudo git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart astra-grid
```

## Troubleshooting

### Port Already in Use:
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### MongoDB Connection Failed:
```bash
# Check if running
sudo systemctl status mongodb

# Start if stopped
sudo systemctl start mongodb

# Check connection
mongosh --eval "db.adminCommand('ping')"
```

### ML Models Not Loading:
```bash
# Check model file exists
ls -la /opt/astra-grid/backend/ml_model_extracted/models/

# Check permissions
sudo chown -R ubuntu:ubuntu /opt/astra-grid/backend/
```

### High Memory Usage:
```bash
# Monitor processes
top
# or
free -h
```

### CORS Issues:
- Update CORS_ORIGINS in .env.production
- Restart application: `sudo systemctl restart astra-grid`

## Security Best Practices

1. **Change Default Passwords:**
   ```bash
   mongosh
   > use admin
   > db.createUser({user: "admin", pwd: "strong-password", roles: ["root"]})
   ```

2. **Setup Firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 5000/tcp  # Only if not using proxy
   ```

3. **SSL/TLS Certificate (AWS):**
   ```bash
   # Use AWS Certificate Manager or Let's Encrypt
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d your-domain.com
   ```

4. **Rotate JWT Secret:**
   ```bash
   # Generate new secret
   python3 -c "import secrets; print(secrets.token_hex(32))"
   
   # Update .env.production
   # Restart application
   ```

5. **Backup Database:**
   ```bash
   mongodump --uri="mongodb://localhost:27017/" \
     --db=astra_grid_db \
     --out=/backups/astra-grid-$(date +%Y%m%d)
   ```

## Performance Optimization

### Enable Gzip Compression (Nginx):
```nginx
gzip on;
gzip_types text/plain text/css application/json;
gzip_min_length 1000;
```

### Increase File Descriptors:
```bash
sudo nano /etc/security/limits.conf
# Add:
# * soft nofile 65535
# * hard nofile 65535
```

### Monitor Performance:
```bash
# Real-time metrics
watch -n 1 'ps aux | grep python | grep run.py'

# Network statistics
netstat -an | grep :5000

# MongoDB performance
mongosh
> db.currentOp()
```

## Accessing from Network

Frontend can now access backend at:

```javascript
// All services at single endpoint
const API_BASE = 'http://your-ec2-ip:5000/api'

// Authentication
const AUTH_URL = 'http://your-ec2-ip:5000/api/auth'

// Predictions
const PREDICTION_URL = 'http://your-ec2-ip:5000/api/prediction'

// Simulations
const SIMULATION_URL = 'http://your-ec2-ip:5000/api/simulation'
```

## Migration from Old Backend

1. **Stop old services:**
   ```bash
   killall python  # Or specific process IDs
   ```

2. **Database remains the same:**
   - All data is preserved
   - No migration scripts needed
   - Same MongoDB database

3. **Update frontend URLs:**
   - Change from multiple ports to single port 5000
   - Update API endpoints in frontend config

4. **Test all features:**
   - Login/Signup
   - Predictions
   - Simulations
   - Document uploads

## Rollback Procedure

If issues occur:

```bash
# Stop new service
sudo systemctl stop astra-grid

# Revert code
cd /opt/astra-grid
git checkout previous-stable-commit

# Restart
sudo systemctl start astra-grid
```

## Support & Monitoring

- **Health Check:** `GET /api/health`
- **System Info:** `GET /api/info`
- **Logs:** `sudo journalctl -u astra-grid -f`
- **Database:** `mongosh`

For issues, check:
1. Service status: `sudo systemctl status astra-grid`
2. System logs: `sudo journalctl -u astra-grid -f`
3. Database connection: `mongosh --eval "db.adminCommand('ping')"`
4. Port listening: `sudo lsof -i :5000`
