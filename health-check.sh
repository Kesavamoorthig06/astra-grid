#!/bin/bash
# EC2 Health Check Script

echo "🏥 ASTRA GRID Health Check"
echo "=========================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
fi
echo "✅ Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not installed"
    exit 1
fi
echo "✅ Docker Compose installed"

# Check if services are running
echo ""
echo "Service Status:"
docker-compose ps

# Check ports
echo ""
echo "Port Check:"
for port in 80 5001 5002 27017; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "✅ Port $port is open"
    else
        echo "❌ Port $port is not listening"
    fi
done

# Test endpoints
echo ""
echo "Endpoint Health:"

# Frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301"; then
    echo "✅ Frontend responding"
else
    echo "❌ Frontend not responding"
fi

# Backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001 | grep -q "200\|404"; then
    echo "✅ Backend responding"
else
    echo "❌ Backend not responding"
fi

# MongoDB
if docker exec astra_mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "✅ MongoDB responding"
else
    echo "❌ MongoDB not responding"
fi

echo ""
echo "=========================="
echo "Health check complete!"
