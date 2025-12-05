# ASTRA GRID - Quick Reference

## 🚀 Quick Commands

### Local Development
```bash
# Windows
start-dev.bat

# Linux/Mac
npm run dev                 # Frontend
cd backend && python auth_app.py         # Backend Auth
cd backend && python simulation_api.py   # Simulation API
```

### Production (Docker)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 🌐 Access Points

### Development
- Frontend: http://localhost:3000
- Auth API: http://localhost:5001
- Simulation API: http://localhost:5002

### Production
- Frontend: http://YOUR_EC2_IP
- Auth API: http://YOUR_EC2_IP:5001
- Simulation API: http://YOUR_EC2_IP:5002

## 👤 Admin Accounts

Default admin emails (for Magic panel access):
- abroesly@powergrid.com
- kesavamoorthi@powergrid.com

## 🔧 Configuration Files

### Environment Variables
- `.env` - Frontend config
- `backend/.env` - Backend config
- `.env.example` - Template files

### Docker
- `Dockerfile` - Frontend container
- `backend/Dockerfile` - Backend container
- `docker-compose.yml` - Full stack orchestration

## 📦 Build Commands

### Frontend
```bash
npm install          # Install dependencies
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

### Backend
```bash
pip install -r requirements.txt   # Install dependencies
python auth_app.py               # Start auth server
python simulation_api.py         # Start simulation server
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux
lsof -i :5001
kill -9 <PID>
```

### Docker Issues
```bash
docker-compose down -v          # Remove volumes
docker system prune -a          # Clean all
docker-compose up -d --build    # Rebuild
```

### Frontend Can't Reach Backend
1. Check CORS_ORIGINS in backend/.env
2. Verify backend is running
3. Check firewall/security groups

## 📚 Important Files

- `DEPLOYMENT.md` - Full deployment guide
- `README.md` - Project overview
- `.gitignore` - Git ignore rules
- `package.json` - Frontend dependencies
- `backend/requirements.txt` - Backend dependencies

## 🔒 Security Checklist

Before production:
- [ ] Change JWT_SECRET to strong random value
- [ ] Update CORS_ORIGINS with production domain
- [ ] Set FLASK_DEBUG=False
- [ ] Configure firewall/security groups
- [ ] Setup SSL certificate (HTTPS)
- [ ] Use strong MongoDB password
- [ ] Review exposed ports

## 📊 Monitoring

```bash
# View all container logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Check service health
docker-compose ps
```

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or without downtime
docker-compose up -d --build --force-recreate
```

---

For detailed instructions, see `DEPLOYMENT.md`
