#!/usr/bin/env python
"""
ASTRA GRID - Main Entry Point
Production-ready backend server for EC2 deployment
"""
import os
import logging
from app.factory import create_app
from app.config.settings import current_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main entry point for the application"""
    
    # Create Flask application
    app = create_app()
    
    # Print startup information
    print(f"""
    {'='*60}
    ASTRA GRID - Unified Backend API
    {'='*60}
    
    Version: 2.0.0
    Environment: {os.environ.get('FLASK_ENV', 'development')}
    
    Server Configuration:
    - Host: {current_config.HOST}
    - Port: {current_config.PORT}
    - Workers: {current_config.WORKERS}
    
    Database:
    - MongoDB URI: {current_config.MONGODB_URI[:50]}...
    - Database Name: {current_config.MONGODB_DB_NAME}
    
    Available Endpoints:
    
    HEALTH & INFO:
    - GET  /api/health
    - GET  /api/info
    
    AUTHENTICATION:
    - POST /api/auth/login
    - POST /api/auth/signup
    - POST /api/auth/verify-token
    - POST /api/auth/logout
    - GET  /api/auth/me
    
    PREDICTION:
    - POST /api/prediction/predict
    - GET  /api/prediction/history
    - GET  /api/prediction/history/<id>
    
    SIMULATION:
    - POST /api/simulation/scenarios
    - POST /api/simulation/recommendations
    - POST /api/simulation/compare
    
    NEW SIMULATION (Project Timeline & Risk):
    - POST /api/newsimulation/run
    
    DOCUMENT PROCESSING:
    - POST /api/document/upload
    - GET  /api/document/status/<id>
    - GET  /api/document/supported-formats
    
    Starting server...
    {'='*60}
    """)
    
    # Start server
    try:
        if os.environ.get('FLASK_ENV') == 'production':
            # Use Waitress for production (WSGI server)
            logger.info("Starting with Waitress (Production)")
            from waitress import serve
            serve(
                app,
                host=current_config.HOST,
                port=current_config.PORT,
                threads=current_config.WORKERS,
                _quiet=False
            )
        else:
            # Use development server
            logger.info("Starting with Flask Development Server")
            app.run(
                host=current_config.HOST,
                port=current_config.PORT,
                debug=True
            )
    
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
