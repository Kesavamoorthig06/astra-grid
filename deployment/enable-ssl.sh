#!/bin/bash

################################################################################
# ASTRA GRID - Enable SSL Certificate Script
# This script enables SSL/TLS on an already deployed ASTRA GRID instance
#
# Usage: sudo bash enable-ssl.sh --domain your-domain.com
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="$2"

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Usage: sudo bash enable-ssl.sh --domain your-domain.com${NC}"
    exit 1
fi

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

echo -e "${BLUE}Setting up SSL certificate for domain: $DOMAIN${NC}"

# Update Nginx config with domain
sed -i "s/astra-grid.example.com/$DOMAIN/g" /etc/nginx/sites-available/astra-grid.conf

# Create certbot directory
mkdir -p /var/www/certbot

# Test Nginx
nginx -t

# Reload Nginx
systemctl reload nginx

# Get certificate from Let's Encrypt
certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email admin@$DOMAIN \
    -d $DOMAIN \
    -d www.$DOMAIN

# Reload Nginx with SSL config
systemctl reload nginx

# Setup auto-renewal
systemctl start certbot.timer
systemctl enable certbot.timer

echo -e "${GREEN}✓ SSL certificate installed successfully!${NC}"
echo -e "${GREEN}✓ Auto-renewal enabled${NC}"
echo -e "\nAccess your application at: https://$DOMAIN"
