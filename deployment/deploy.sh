#!/bin/bash

################################################################################
# ASTRA GRID - Automated EC2 Deployment Script
# This script automates the entire deployment process on Ubuntu EC2
# 
# Usage: sudo bash deploy.sh [--domain your-domain.com] [--with-ssl]
# 
# Example:
#   sudo bash deploy.sh --domain astra-grid.example.com --with-ssl
#   sudo bash deploy.sh  # For local testing without SSL
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${2:-localhost}"
INSTALL_SSL=false
APP_PATH="/opt/astra-grid"
VENV_PATH="$APP_PATH/venv"
LOG_PATH="/var/log/astra-grid"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --with-ssl)
            INSTALL_SSL=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Print banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        ASTRA GRID - EC2 Automated Deployment Script            ║"
echo "║                                                                ║"
echo "║  Domain: $DOMAIN"
echo "║  SSL Enabled: $INSTALL_SSL"
echo "║  Installation Path: $APP_PATH"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verify running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This script must be run as root${NC}"
   echo "Run: sudo bash deploy.sh"
   exit 1
fi

################################################################################
# Step 1: System Update
################################################################################
echo -e "\n${BLUE}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

################################################################################
# Step 2: Install Dependencies
################################################################################
echo -e "\n${BLUE}[2/10] Installing system dependencies...${NC}"

apt-get install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    nodejs \
    npm \
    nginx \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    supervisor \
    mongodb \
    certbot \
    python3-certbot-nginx

# Start MongoDB
systemctl start mongodb
systemctl enable mongodb
echo -e "${GREEN}✓ MongoDB started and enabled${NC}"

################################################################################
# Step 3: Clone/Update Repository
################################################################################
echo -e "\n${BLUE}[3/10] Setting up application repository...${NC}"

if [ ! -d "$APP_PATH" ]; then
    mkdir -p /opt
    echo "Cloning repository..."
    # Note: Replace with your actual repository
    git clone https://github.com/Kesavamoorthig06/astra-grid.git "$APP_PATH"
else
    echo "Updating repository..."
    cd "$APP_PATH"
    git pull origin main
fi

cd "$APP_PATH"
chown -R www-data:www-data "$APP_PATH"
echo -e "${GREEN}✓ Repository ready at $APP_PATH${NC}"

################################################################################
# Step 4: Setup Python Virtual Environment
################################################################################
echo -e "\n${BLUE}[4/10] Setting up Python virtual environment...${NC}"

if [ ! -d "$VENV_PATH" ]; then
    python3 -m venv "$VENV_PATH"
fi

source "$VENV_PATH/bin/activate"

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r "$APP_PATH/backend/requirements.txt"
pip install gunicorn

echo -e "${GREEN}✓ Python environment ready${NC}"

################################################################################
# Step 5: Setup Environment File
################################################################################
echo -e "\n${BLUE}[5/10] Setting up environment configuration...${NC}"

ENV_FILE="$APP_PATH/backend/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=astra_grid

# JWT (CHANGE THIS TO A SECURE VALUE!)
JWT_SECRET=$(openssl rand -hex 32)

# AWS Configuration (Optional - for document extraction)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://$DOMAIN

# Flask
FLASK_ENV=production

# Ports
PORT=5000
EOF
    
    echo -e "${YELLOW}[!] Please edit $ENV_FILE with your configuration${NC}"
    echo -e "${YELLOW}[!] Especially: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY${NC}"
else
    echo -e "${GREEN}✓ Environment file exists${NC}"
fi

################################################################################
# Step 6: Build Frontend
################################################################################
echo -e "\n${BLUE}[6/10] Building frontend application...${NC}"

cd "$APP_PATH"
npm install
npm run build

echo -e "${GREEN}✓ Frontend built successfully${NC}"

################################################################################
# Step 7: Create Log Directory
################################################################################
echo -e "\n${BLUE}[7/10] Creating log directories...${NC}"

mkdir -p "$LOG_PATH"
chown -R www-data:www-data "$LOG_PATH"
touch "$LOG_PATH"/{unified,auth,simulation,chatbot,extractor}-{access,error}.log
chmod 640 "$LOG_PATH"/*.log

echo -e "${GREEN}✓ Log directories created${NC}"

################################################################################
# Step 8: Setup Systemd Services
################################################################################
echo -e "\n${BLUE}[8/10] Installing systemd services...${NC}"

cp "$APP_PATH/deployment/systemd"/*.service /etc/systemd/system/

# Update service files with correct paths
for service in /etc/systemd/system/astra-*.service; do
    sed -i "s|/opt/astra-grid|$APP_PATH|g" "$service"
done

systemctl daemon-reload

# Enable services
systemctl enable astra-prediction-model.service
systemctl enable astra-auth.service
systemctl enable astra-simulation.service
systemctl enable astra-chatbot.service
systemctl enable astra-document-extractor.service

echo -e "${GREEN}✓ Systemd services installed${NC}"

################################################################################
# Step 9: Configure Nginx
################################################################################
echo -e "\n${BLUE}[9/10] Configuring Nginx reverse proxy...${NC}"

# Copy Nginx configuration
cp "$APP_PATH/deployment/nginx/astra-grid.conf" /etc/nginx/sites-available/

# Update domain in Nginx config
sed -i "s/astra-grid.example.com/$DOMAIN/g" /etc/nginx/sites-available/astra-grid.conf

# Enable site
ln -sf /etc/nginx/sites-available/astra-grid.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

echo -e "${GREEN}✓ Nginx configured${NC}"

################################################################################
# Step 10: SSL Certificate Setup (Optional)
################################################################################
if [ "$INSTALL_SSL" = true ]; then
    echo -e "\n${BLUE}[10/10] Setting up SSL certificate...${NC}"
    
    mkdir -p /var/www/certbot
    
    # Start Nginx to allow Let's Encrypt challenge
    systemctl start nginx
    systemctl enable nginx
    
    # Get certificate
    certbot certonly --nginx \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        -d $DOMAIN \
        -d www.$DOMAIN \
        || echo -e "${YELLOW}[!] Certificate setup failed. You may need to do this manually.${NC}"
    
    # Setup auto-renewal
    systemctl start certbot.timer
    systemctl enable certbot.timer
    
    echo -e "${GREEN}✓ SSL certificate configured${NC}"
else
    echo -e "\n${BLUE}[10/10] Skipping SSL setup (development mode)${NC}"
    # Start Nginx for HTTP
    systemctl start nginx
    systemctl enable nginx
fi

################################################################################
# Step 11: Start Services
################################################################################
echo -e "\n${BLUE}[10/10] Starting services...${NC}"

systemctl start astra-prediction-model.service
systemctl start astra-auth.service
systemctl start astra-simulation.service
systemctl start astra-chatbot.service
systemctl start astra-document-extractor.service

# Wait for services to start
sleep 3

# Check service status
echo -e "\n${YELLOW}Service Status:${NC}"
systemctl status astra-prediction-model.service --no-pager || true
systemctl status astra-auth.service --no-pager || true
systemctl status astra-simulation.service --no-pager || true
systemctl status astra-chatbot.service --no-pager || true
systemctl status astra-document-extractor.service --no-pager || true

################################################################################
# Completion Summary
################################################################################
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Complete!                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Access Information:${NC}"
echo -e "  Frontend:  http://$DOMAIN"
if [ "$INSTALL_SSL" = true ]; then
    echo -e "  Frontend:  https://$DOMAIN (SSL)"
fi
echo -e "  Backend:   http://$DOMAIN/api"

echo -e "\n${BLUE}Service Ports (Internal):${NC}"
echo -e "  Unified API:       127.0.0.1:5000"
echo -e "  Auth API:          127.0.0.1:5001"
echo -e "  Simulation API:    127.0.0.1:5002"
echo -e "  Chatbot API:       127.0.0.1:5003"
echo -e "  Document Extract:  127.0.0.1:5004"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "  View logs:          sudo journalctl -u astra-prediction-model.service -f"
echo -e "  Check status:       sudo systemctl status astra-prediction-model.service"
echo -e "  Restart services:   sudo systemctl restart astra-*.service"
echo -e "  View access logs:   sudo tail -f /var/log/nginx/access.log"
echo -e "  Edit config:        sudo nano $ENV_FILE"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Edit $ENV_FILE with AWS credentials (if using document extraction)"
echo -e "  2. Restart services: sudo systemctl restart astra-*.service"
echo -e "  3. Test endpoints: curl http://$DOMAIN/api/health"

if [ "$INSTALL_SSL" != true ]; then
    echo -e "\n${YELLOW}To Enable SSL:${NC}"
    echo -e "  sudo bash /opt/astra-grid/deployment/enable-ssl.sh --domain $DOMAIN"
fi

echo -e "\n${BLUE}Documentation:${NC}"
echo -e "  $APP_PATH/EC2_DEPLOYMENT_SETUP.md"

echo -e "\n${GREEN}✓ Deployment successful!${NC}\n"
