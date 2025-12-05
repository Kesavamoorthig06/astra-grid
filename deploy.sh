#!/bin/bash

# ASTRA GRID - EC2 Deployment Script
# This script deploys the application on an EC2 instance

set -e

echo "🚀 ASTRA GRID Deployment Script"
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Git
echo "📦 Installing Git..."
apt-get install -y git

# Create deployment directory
DEPLOY_DIR="/var/www/astra-grid"
echo "📁 Creating deployment directory at $DEPLOY_DIR..."
mkdir -p $DEPLOY_DIR

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "📥 Updating repository..."
    cd $DEPLOY_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    # Replace with your actual repository URL
    git clone https://github.com/Kesavamoorthig06/astra-grid.git $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

# Setup environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env
    echo "⚠️  Please edit .env file with your production values"
    read -p "Press enter to continue after editing .env file..."
fi

if [ ! -f "$DEPLOY_DIR/backend/.env" ]; then
    cp $DEPLOY_DIR/backend/.env.example $DEPLOY_DIR/backend/.env
    echo "⚠️  Please edit backend/.env file with your production values"
    read -p "Press enter to continue after editing backend/.env file..."
fi

# Build and start containers
echo "🏗️  Building Docker images..."
docker-compose build

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Setup firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo "🔒 Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    ufw --force enable
fi

# Display access information
echo ""
echo "✅ Deployment complete!"
echo "================================"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Backend API: http://$(curl -s ifconfig.me):5001"
echo "Simulation API: http://$(curl -s ifconfig.me):5002"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Rebuild: docker-compose up -d --build"
echo ""
