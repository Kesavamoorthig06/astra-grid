"""
ASTRA GRID - Configuration Settings
Centralized configuration for development, testing, and production environments
"""
import os
from datetime import timedelta

class Config:
    """Base configuration - shared settings"""
    
    # Flask
    DEBUG = False
    TESTING = False
    JSON_SORT_KEYS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION = timedelta(hours=24)
    
    # MongoDB Configuration
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME', 'astra_grid_db')
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Server Configuration
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '0.0.0.0')
    WORKERS = int(os.environ.get('WORKERS', 6))
    
    # ML Models
    ML_MODELS_PATH = 'ml_model_extracted/models'
    
    # Database Collections
    USERS_COLLECTION = 'users'
    PREDICTIONS_COLLECTION = 'predictions'
    VERIFICATION_COLLECTION = 'verification_codes'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    MONGODB_DB_NAME = 'astra_grid_test_db'


class ProductionConfig(Config):
    """Production configuration for EC2 deployment"""
    DEBUG = False
    TESTING = False


# Select configuration based on environment
def get_config():
    """Get configuration based on FLASK_ENV"""
    env = os.environ.get('FLASK_ENV', 'development').lower()
    
    if env == 'production':
        # Validate production requirements
        jwt_key = os.environ.get('JWT_SECRET_KEY')
        mongo_uri = os.environ.get('MONGODB_URI')
        
        if not jwt_key:
            raise ValueError("JWT_SECRET_KEY environment variable must be set in production")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable must be set in production")
        
        return ProductionConfig()
    elif env == 'testing':
        return TestingConfig()
    else:
        return DevelopmentConfig()


# Get current configuration
current_config = get_config()
