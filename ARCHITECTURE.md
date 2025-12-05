# ASTRA GRID - System Architecture

## 📐 Overview

ASTRA GRID is a full-stack power grid transmission monitoring and prediction system with a **unified backend architecture** running on a single port.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                      (http://domain.com)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴───────────┐
                │                        │
        ┌───────▼──────┐        ┌────────▼────────┐
        │   Frontend   │        │  Unified Backend │
        │  React + Vite│        │   Flask API      │
        │   Port 80    │        │   Port 5000      │
        └──────────────┘        └────────┬─────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
            ┌───────▼──────┐    ┌────────▼────────┐  ┌───────▼──────┐
            │ Auth Service │    │ Prediction API  │  │ Simulation   │
            │  /api/login  │    │  /api/predict   │  │ /api/simulate│
            │  /api/signup │    │  /api/history   │  │              │
            └──────┬───────┘    └────────┬─────────┘  └───────┬──────┘
                   │                     │                    │
                   └─────────────────────┼────────────────────┘
                                         │
                                ┌────────▼─────────┐
                                │    MongoDB       │
                                │   Port 27017     │
                                │   - users        │
                                │   - predictions  │
                                │   - simulations  │
                                └──────────────────┘
```

---

## 🔧 Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.6
- **UI Components**: 
  - Custom component library (accordion, badges, charts, forms)
  - Gradient backgrounds & animations
  - Dark mode support
- **State Management**: React Context (Theme, Translation)
- **Routing**: React Router DOM
- **HTTP Client**: Fetch API
- **Maps**: Leaflet.js for transmission line visualization
- **Charts**: Recharts for metrics visualization

### Backend (Unified API)
- **Framework**: Flask (Python)
- **Single Entry Point**: `unified_api.py` on port 5000
- **Authentication**: JWT tokens with httpOnly cookies
- **Database**: MongoDB
- **ML Models**: 
  - LightGBM for risk prediction
  - XGBoost for cost/timeline estimation
  - Loaded from `powergrid_simulation_bundle.joblib`
- **CORS**: Configured for production origins

### Database
- **Engine**: MongoDB 7.0
- **Collections**:
  - `users`: User accounts, verification codes, admin flags
  - `predictions`: Prediction history with timestamps
  - `verification_codes`: Email verification tokens

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy for frontend)
- **Environment**: .env files for configuration
- **Deployment**: Automated scripts for EC2

---

## 🚀 Unified Backend Architecture

### Why Unified?
Previously, the backend was split across multiple services:
- Auth API: Port 5001
- Prediction API: Port 5000
- Simulation API: Port 5002
- Chatbot API: Port 8000
- NLP API: Port 5003

**Problems:**
- Complex security group rules (5+ ports)
- Multiple process management
- Difficult CORS configuration
- High operational overhead

**Solution:**
All services consolidated into `unified_api.py` on **port 5000**

### API Endpoints

#### Health Check
```
GET /api/health
Response: { status: "healthy", timestamp: "..." }
```

#### Authentication
```
POST /api/login
Body: { email, password }
Response: { token, user: { email, role } }

POST /api/signup
Body: { email, password, fullName }
Response: { message, userId }

POST /api/logout
Response: { message }
```

#### Prediction
```
POST /api/predict
Headers: Authorization: Bearer <token>
Body: { 
  lineLength, voltage, loadFactor, conductorType,
  terrainType, weatherConditions, maintenanceHistory
}
Response: { 
  riskLevel, costEstimate, timeline,
  confidence, recommendations
}

GET /api/prediction-history
Headers: Authorization: Bearer <token>
Response: [{ timestamp, inputs, results }]

POST /api/prediction-history
Headers: Authorization: Bearer <token>
Body: { prediction data }
```

#### Simulation
```
POST /api/simulate
Headers: Authorization: Bearer <token>
Body: { 
  projectName, location, voltage, lineLength,
  conductorType, towerType, terrainDifficulty
}
Response: {
  totalCost, timeline, riskAssessment,
  materialCosts, laborCosts, equipmentCosts,
  recommendations
}
```

---

## 🔐 Security Features

### Authentication Flow
1. User submits credentials to `/api/login`
2. Backend validates against MongoDB `users` collection
3. JWT token generated with 24-hour expiry
4. Token stored in httpOnly cookie (XSS protection)
5. All protected routes use `@token_required` decorator

### Admin System
- Hardcoded admin emails:
  - `abroesly@powergrid.com`
  - `kesavamoorthi@powergrid.com`
- Admin users seeded on startup
- Feature flag control in Account Settings

### CORS Configuration
- Production: Specific origins only
- Development: localhost:3000, localhost:5173
- Credentials: True (for cookies)

---

## 📦 Deployment Architecture

### Docker Compose Services

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports: 27017:27017
    volumes: mongodb_data

  backend:
    build: ./backend
    ports: 5000:5000
    depends_on: mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000

  frontend:
    build: ./
    ports: 80:80
    depends_on: backend
    environment:
      - VITE_API_URL=${VITE_API_URL}
```

### EC2 Security Group (Simplified)
- Port 80: HTTP (Frontend)
- Port 443: HTTPS (SSL)
- Port 5000: Unified Backend API
- Port 22: SSH (Admin only)

**Benefit**: Only 4 ports instead of 8+!

---

## 🔄 Data Flow

### Login Flow
```
1. User enters credentials on Login page
2. POST /api/login with { email, password }
3. Backend queries MongoDB users collection
4. If valid: Generate JWT, store in httpOnly cookie
5. Redirect to Dashboard
6. Frontend reads token from cookie for subsequent requests
```

### Prediction Flow
```
1. User fills Prediction Form on Dashboard
2. POST /api/predict with transmission line parameters
3. Backend extracts JWT from cookie
4. Validates token and user permissions
5. Loads ML models (LightGBM/XGBoost) from joblib
6. Runs inference on input features
7. Returns risk/cost/timeline predictions
8. Saves prediction to MongoDB history
9. Frontend displays results with confidence scores
```

### Simulation Flow
```
1. User navigates to Simulation page
2. Fills project details form
3. POST /api/simulate with project parameters
4. Backend validates JWT token
5. Calculates costs based on material/labor/equipment rates
6. Estimates timeline using terrain difficulty factors
7. Generates risk assessment
8. Returns comprehensive simulation report
9. Frontend renders charts and recommendations
```

---

## 🗄️ Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password": "hashed_password",
  "fullName": "John Doe",
  "role": "user",
  "isAdmin": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "verificationCode": "ABC123",
  "isVerified": false
}
```

### Predictions Collection
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "timestamp": "2024-01-01T12:00:00Z",
  "inputs": {
    "lineLength": 150,
    "voltage": 400,
    "loadFactor": 0.75,
    "conductorType": "ACSR",
    "terrainType": "hilly",
    "weatherConditions": "moderate",
    "maintenanceHistory": "good"
  },
  "results": {
    "riskLevel": 2.5,
    "costEstimate": 45000000,
    "timeline": 18,
    "confidence": 0.92
  }
}
```

---

## 🎨 Frontend Architecture

### Component Structure
```
frontend/
├── components/
│   ├── ChatBot.jsx (NLP assistant)
│   ├── VoiceInput.jsx (Speech recognition)
│   ├── MetricDashboard.jsx (Analytics cards)
│   ├── IndiaTownMap.jsx (Transmission line map)
│   ├── ui/ (Reusable components)
│   └── auth/ (Protected routes)
├── pages/
│   ├── Dashboard.jsx (Main hub)
│   ├── Login.jsx / Signup.jsx
│   ├── SimulationPage.jsx
│   ├── AccountSettings.jsx
│   └── History.jsx
├── contexts/
│   ├── ThemeContext.jsx (Dark mode)
│   └── TranslationContext.jsx (i18n)
└── utils/
    ├── api.js (API helpers)
    └── featureFlags.js (Admin controls)
```

### State Management
- **Theme**: Global dark/light mode via Context
- **Translation**: Multi-language support (Hindi, Tamil, Telugu)
- **Authentication**: Token stored in cookies, user state in localStorage
- **Feature Flags**: Admin-controlled feature toggles

---

## 📊 ML Model Pipeline

### Model Loading
```python
# unified_api.py
import joblib
models = joblib.load('powergrid_simulation_bundle.joblib')
risk_model = models['risk']
cost_model = models['cost']
timeline_model = models['timeline']
```

### Feature Engineering
Input features are standardized:
- Line length (km): 0-500 range
- Voltage (kV): 220/400/765
- Load factor: 0-1
- Categorical encoding for conductor/terrain types

### Prediction Output
```python
{
  "riskLevel": float (0-5 scale),
  "costEstimate": int (INR),
  "timeline": int (months),
  "confidence": float (0-1),
  "recommendations": [str]
}
```

---

## 🌐 API Configuration

### Environment-Based URLs
```javascript
// frontend/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const simulationUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const chatbotUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
```

### Development vs Production
- **Development**: `http://localhost:5000`
- **Production**: `http://your-ec2-ip:5000` or `https://yourdomain.com/api`

---

## 🔧 Build Process

### Frontend Build
```bash
npm run build
# Output: dist/ folder with optimized assets
# Vite bundles React code, code-splits routes
# Nginx serves static files from dist/
```

### Backend Build
```bash
pip install -r requirements.txt
# No compilation needed (Python)
# ML models pre-trained, loaded via joblib
```

### Docker Build
```bash
docker-compose build
# Frontend: Multi-stage build (node + nginx)
# Backend: Python 3.11 slim with Flask
# MongoDB: Official mongo:7.0 image
```

---

## 📈 Performance Optimizations

### Frontend
- **Code Splitting**: React lazy loading for routes
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Tree shaking, minification
- **Caching**: Service worker for offline support

### Backend
- **Connection Pooling**: MongoDB connection reuse
- **Model Caching**: Load ML models once at startup
- **Response Compression**: gzip for JSON responses
- **JWT Stateless**: No session storage overhead

### Database
- **Indexing**: Email, userId indexes for fast queries
- **Projection**: Only fetch required fields
- **Aggregation**: Efficient pipeline for analytics

---

## 🚦 Monitoring & Health Checks

### Health Endpoint
```bash
curl http://localhost:5000/api/health
# Response: {"status": "healthy", "timestamp": "..."}
```

### Docker Healthcheck
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Log Monitoring
```bash
# View unified API logs
docker-compose logs -f backend

# View all service logs
docker-compose logs -f
```

---

## 🔄 Version Control & CI/CD

### Git Workflow
1. Feature branches: `feature/new-feature`
2. Pull requests with code review
3. Main branch protected
4. Tags for releases: `v1.0.0`

### Automated Deployment
```bash
# deploy.sh script
git pull origin main
docker-compose build
docker-compose up -d
```

---

## 📚 API Versioning

### Current Version: v1
All endpoints use `/api/` prefix

### Future Versioning Strategy
```
/api/v1/predict
/api/v2/predict (with breaking changes)
```

---

## 🛡️ Disaster Recovery

### Backup Strategy
```bash
# MongoDB backup
docker exec astra_mongodb mongodump --out /backup

# Copy to host
docker cp astra_mongodb:/backup ./mongodb-backup

# Restore
docker exec astra_mongodb mongorestore /backup
```

### High Availability (Future)
- Load balancer (AWS ALB)
- Multiple backend instances
- MongoDB replica set
- Redis for session storage

---

## 📞 Support & Maintenance

### Admin Contact
- **Email**: kesavamoorthi@powergrid.com
- **GitHub**: https://github.com/Kesavamoorthig06/astra-grid

### System Requirements
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 30GB for application + logs
- **Network**: 1 Gbps recommended

---

**Architecture Version**: 2.0 (Unified Backend)  
**Last Updated**: 2024  
**Status**: Production-Ready ✅
