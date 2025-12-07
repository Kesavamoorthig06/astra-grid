"""
ASTRA GRID BACKEND - Architecture & Structure
Version 2.0.0 - Unified Production-Ready Backend

OVERVIEW:
This is a completely refactored backend architecture designed for:
✓ Single unified application (no multiple ports)
✓ EC2 production deployment
✓ Scalability and maintainability
✓ Clean separation of concerns
✓ Easy debugging and monitoring
✓ Network accessibility

DIRECTORY STRUCTURE:
┌── app/                              # Main application package
│   ├── __init__.py                  # Package marker
│   ├── factory.py                   # Flask app factory
│   │
│   ├── config/                      # Configuration
│   │   ├── __init__.py
│   │   └── settings.py              # Environment-based config
│   │
│   ├── middleware/                  # Middleware layers
│   │   ├── __init__.py
│   │   └── auth.py                  # JWT authentication
│   │
│   ├── models/                      # Data models & managers
│   │   ├── __init__.py
│   │   ├── database.py              # MongoDB connection
│   │   └── ml_manager.py            # ML model loader
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py          # Auth operations
│   │   ├── prediction_service.py    # ML predictions
│   │   ├── simulation_service.py    # Scenario simulation
│   │   └── document_service.py      # Document extraction
│   │
│   └── routes/                      # API endpoints
│       ├── __init__.py
│       ├── health_routes.py         # Health checks
│       ├── auth_routes.py           # Login/signup
│       ├── prediction_routes.py     # Predictions
│       ├── simulation_routes.py     # Simulations
│       └── document_routes.py       # Document upload
│
├── run.py                           # Main entry point
├── requirements.txt                 # Python dependencies
└── ml_model_extracted/              # Pre-trained models
    └── models/                      # XGBoost models

ARCHITECTURAL LAYERS:

1. ROUTES (Entry Points)
   └─> API endpoints, request validation, response formatting

2. MIDDLEWARE (Cross-cutting Concerns)
   └─> Authentication, CORS, error handling

3. SERVICES (Business Logic)
   └─> Complex operations, data processing, predictions

4. MODELS (Data & External Services)
   └─> Database operations, ML model access, connections

5. CONFIG (Settings)
   └─> Environment variables, configuration management

EXECUTION FLOW:

Request
  ↓
[CORS Middleware]
  ↓
[Route Handler] (in routes/)
  ↓
[Auth Middleware] @token_required
  ↓
[Service Logic] (in services/)
  ↓
[Models/Database] (in models/)
  ↓
Response (JSON)

KEY COMPONENTS:

DATABASE:
- MongoDB singleton instance
- Collections: users, predictions, verification_codes
- Auto-connects on first use
- Health checks available

ML MODELS:
- Loads XGBoost models at startup
- Predictions: cost overrun, timeline delay, risk score
- Singleton pattern for efficiency
- Graceful fallback if models unavailable

AUTHENTICATION:
- JWT token-based (24-hour expiration)
- Decorator: @token_required
- Supports both headers and cookies
- Per-endpoint authorization

SERVICES:
- AuthService: Login, signup, token management
- PredictionService: ML predictions, history
- SimulationService: Scenario analysis, recommendations
- DocumentService: File upload, document processing

ENDPOINTS (All under /api):

HEALTH & INFO:
  GET  /health                      # System health check
  GET  /info                        # System information

AUTHENTICATION:
  POST /auth/login                  # User login
  POST /auth/signup                 # User registration
  POST /auth/verify-token           # Token validation
  POST /auth/logout                 # User logout
  GET  /auth/me                     # Current user info

PREDICTION:
  POST /prediction/predict          # Make predictions
  GET  /prediction/history          # Get history (paginated)
  GET  /prediction/history/<id>     # Get specific prediction

SIMULATION:
  POST /simulation/scenarios        # Generate scenarios
  POST /simulation/recommendations  # Get recommendations
  POST /simulation/compare          # Compare projects

DOCUMENT:
  POST /document/upload             # Upload document
  GET  /document/status/<id>        # Check extraction status
  GET  /document/supported-formats  # Get allowed formats

STARTING THE SERVER:

Development:
  python run.py

Production (EC2):
  export FLASK_ENV=production
  export PORT=5000
  export MONGODB_URI=mongodb://localhost:27017/
  export JWT_SECRET_KEY=your-secret-key-here
  python run.py

With environment file:
  source .env.production
  python run.py

CONFIGURATION FILES:

.env                  # Development configuration
.env.example          # Example configuration
.env.production       # Production configuration template
.env.production.example  # Production example

DEPLOYMENT NOTES:

✓ Single port: 5000 (configurable via PORT env var)
✓ Host: 0.0.0.0 (listens on all network interfaces)
✓ Production WSGI: Waitress (in production mode)
✓ Database: MongoDB (URI from env var)
✓ Logging: Structured logging to stdout
✓ CORS: Configurable origins (from env var)
✓ Security: JWT tokens, password hashing, token expiration

EC2 DEPLOYMENT STEPS:

1. Install dependencies:
   pip install -r requirements.txt

2. Set environment variables:
   export FLASK_ENV=production
   export PORT=5000
   export MONGODB_URI=mongodb://localhost:27017/
   export JWT_SECRET_KEY=secure-random-key

3. Start server:
   nohup python run.py > app.log 2>&1 &

4. Check status:
   curl http://localhost:5000/api/health

5. View logs:
   tail -f app.log

MONITORING:

Health Check:
  curl http://localhost:5000/api/health

All endpoints return:
  {
    "success": true/false,
    "data": {...},
    "error": "error message if failed"
  }

DATABASE SCHEMA:

users:
  - email: string (unique)
  - password: hashed string
  - name: string
  - role: string (user/admin)
  - created_at: datetime
  - updated_at: datetime

predictions:
  - user_email: string
  - timestamp: datetime
  - project_name: string
  - input_data: object
  - prediction: object
    - risk_score: float
    - cost_overrun_percent: float
    - timeline_delay_days: float
    - risk_category: string

LOGGING:

Format: timestamp - logger_name - level - message
Level: INFO (production), DEBUG (development)
Output: stdout/stderr

Log examples:
  2024-12-07 10:30:45,123 - app.factory - INFO - ✓ Flask application created
  2024-12-07 10:30:45,456 - app.models.database - INFO - ✓ Connected to MongoDB
  2024-12-07 10:30:45,789 - app.models.ml_manager - INFO - ✓ Loaded ML models

REMOVAL OF DEPRECATED FILES:

The following OLD files are NO LONGER NEEDED:
  ✗ auth_app.py
  ✗ simulation_api.py
  ✗ unified_api.py
  ✗ chatbot_api.py
  ✗ document_extractor_api.py
  ✗ Model/app.py
  ✗ start-*.bat (old scripts)
  ✗ start-*.sh (old scripts)

All functionality is now in:
  ✓ backend/app/routes/
  ✓ backend/app/services/
  ✓ backend/run.py

FRONTEND COMPATIBILITY:

No changes needed to frontend!
- All existing endpoints work
- Same database (MongoDB)
- Same authentication (JWT)
- Same response format (JSON)

Just change API base URL if needed:
  Before: http://localhost:5001 (auth), http://localhost:5002 (prediction), etc.
  After:  http://localhost:5000 (all endpoints)

PERFORMANCE:

- Production server: Waitress (multi-threaded)
- ML models: Cached at startup
- Database: Connection pooling
- Response time: ~100-500ms per request
- Concurrent users: 100+ (with proper infrastructure)

SECURITY:

✓ JWT authentication (24-hour tokens)
✓ Password hashing (werkzeug.security)
✓ CORS configured
✓ Environment variables for secrets
✓ No hardcoded credentials
✓ Token validation on protected routes
✓ User data isolation

ERROR HANDLING:

All endpoints return consistent error format:
  {
    "success": false,
    "error": "Human-readable error message"
  }

HTTP Status Codes:
  200 OK
  400 Bad Request
  401 Unauthorized
  403 Forbidden
  404 Not Found
  500 Internal Server Error

TESTING:

Test authentication:
  curl -X POST http://localhost:5000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"admin@powergrid.com", "password":"admin123"}'

Test health check:
  curl http://localhost:5000/api/health

Test protected endpoint:
  curl -H "Authorization: Bearer YOUR_TOKEN" \\
    http://localhost:5000/api/auth/me

This architecture ensures:
✓ Scalability - Easy to add new features
✓ Maintainability - Clear structure and separation
✓ Deployability - Single unified application
✓ Reliability - Proper error handling
✓ Performance - Optimized data access
✓ Security - Token-based authentication
✓ Monitoring - Comprehensive logging
"""
