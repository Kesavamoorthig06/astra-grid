#!/bin/bash

################################################################################
# ASTRA GRID - Health Check Script
# Monitors all backend services and logs their status
#
# Usage: bash health-check.sh
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ASTRA GRID - Health Check Report                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Function to check service
check_service() {
    local service_name=$1
    local port=$2
    local label=$3
    
    if systemctl is-active --quiet "$service_name"; then
        status="${GREEN}✓ RUNNING${NC}"
    else
        status="${RED}✗ STOPPED${NC}"
    fi
    
    # Check port
    if nc -z 127.0.0.1 $port 2>/dev/null; then
        port_status="${GREEN}✓ LISTENING${NC}"
    else
        port_status="${RED}✗ NOT LISTENING${NC}"
    fi
    
    printf "%-30s %b  Port:%5d %b\n" "$label" "$status" "$port" "$port_status"
}

echo -e "\n${BLUE}Backend Services:${NC}"
check_service "astra-unified.service" 5000 "Unified API"
check_service "astra-auth.service" 5001 "Auth API"
check_service "astra-simulation.service" 5002 "Simulation API"
check_service "astra-chatbot.service" 5003 "Chatbot API"
check_service "astra-document-extractor.service" 5004 "Document Extractor"

echo -e "\n${BLUE}System Services:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "Nginx:                         ${GREEN}✓ RUNNING${NC}"
else
    echo -e "Nginx:                         ${RED}✗ STOPPED${NC}"
fi

if systemctl is-active --quiet mongodb; then
    echo -e "MongoDB:                       ${GREEN}✓ RUNNING${NC}"
else
    echo -e "MongoDB:                       ${RED}✗ STOPPED${NC}"
fi

echo -e "\n${BLUE}Resource Usage:${NC}"
echo -e "CPU Usage:"
ps aux | grep python | grep -v grep | awk '{cpu+=$3} END {printf "  Total: %.1f%%\n", cpu}'

echo -e "Memory Usage:"
ps aux | grep python | grep -v grep | awk '{mem+=$6} END {printf "  Total: %d MB\n", mem/1024}'

echo -e "\n${BLUE}Disk Usage:${NC}"
df -h /opt/astra-grid | awk 'NR==2 {printf "  /opt/astra-grid: %s used / %s total (%s)\n", $3, $2, $5}'

echo -e "\n${BLUE}Database Status:${NC}"
if mongo --eval "db.adminCommand('ping')" 2>/dev/null | grep -q '"ok" : 1'; then
    echo -e "  MongoDB:                      ${GREEN}✓ RESPONDING${NC}"
else
    echo -e "  MongoDB:                      ${RED}✗ NOT RESPONDING${NC}"
fi

echo -e "\n${BLUE}API Endpoints:${NC}"
for endpoint in "/api/health" "/auth/health" "/simulation/health" "/chatbot/health" "/extract/health"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:5000$endpoint" 2>/dev/null || echo "000")
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        status="${GREEN}✓ OK${NC}"
    else
        status="${RED}✗ ERROR (HTTP $response)${NC}"
    fi
    printf "  %-40s %b\n" "$endpoint" "$status"
done

echo -e "\n${BLUE}Recent Errors:${NC}"
journalctl -u astra-unified.service --since "1 hour ago" -p err --no-pager | head -5 || echo "  No errors found"

echo -e "\n${GREEN}✓ Health check complete${NC}\n"
