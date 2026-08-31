"""
ASTRA GRID - Main Application Factory
Creates and configures the Flask application
"""
from flask import Flask, request
from flask_cors import CORS
from app.config.settings import current_config
from app.services.auth_service import AuthService
from app.models.ml_manager import ml_models
from app.models.database import db_manager
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config=None):
    """
    Application factory function
    Creates and configures Flask application with all dependencies
    """
    
    # Create Flask app
    app = Flask(__name__)
    
    # Apply configuration
    if config is None:
        config = current_config
    
    app.config.from_object(config)
    
    # Initialize CORS
    CORS(app,
         supports_credentials=True,
         origins=config.CORS_ORIGINS,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    logger.info(f"✓ Flask application created")
    logger.info(f"  Environment: {os.environ.get('FLASK_ENV', 'development')}")
    logger.info(f"  CORS Origins: {', '.join(config.CORS_ORIGINS)}")
    
    # Register blueprints (routes)
    from app.routes.health_routes import health_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.prediction_routes import prediction_bp
    from app.routes.simulation_routes import simulation_bp
    from app.routes.new_simulation_routes import new_simulation_bp
    from app.routes.document_routes import document_bp
    from app.routes.chatbot_routes import chatbot_bp
    from app.routes.dashboard_routes import dashboard_bp
    from simulation_api import simulation_bp as project_simulation_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(new_simulation_bp)
    app.register_blueprint(document_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(project_simulation_bp, name='project_simulation')
    
    logger.info("✓ All blueprints registered including project simulation API")
    
    # Initialize database
    try:
        if not db_manager.health_check():
            logger.warning("⚠ Database connection check failed")
    except Exception as e:
        logger.error(f"✗ Database initialization error: {e}")
    
    # Load ML models
    if ml_models.is_loaded:
        logger.info("✓ ML models loaded successfully")
    else:
        logger.warning("⚠ ML models not available")
    
    # Seed admin users
    try:
        AuthService.seed_admin_users()
    except Exception as e:
        logger.warning(f"⚠ Admin user seeding: {e}")
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return {'success': False, 'error': 'Internal server error'}, 500
    
    # Request logging
    @app.before_request
    def log_request():
        logger.debug(f"{request.method} {request.path}")
    
    logger.info("✓ Application fully initialized and ready")
    
    return app


# For direct execution
if __name__ == '__main__':
    app = create_app()
