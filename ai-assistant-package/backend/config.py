"""
Configuration for Power Grid AI Assistant
"""

import os

class Config:
    """Base configuration"""
    
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DATABASE_PATH = os.environ.get('DATABASE_PATH') or 'power_grid.db'
    ENABLE_WEB_SEARCH = os.environ.get('ENABLE_WEB_SEARCH', 'true').lower() == 'true'
    MAX_WEB_SEARCH_RESULTS = int(os.environ.get('MAX_WEB_SEARCH_RESULTS', '3'))
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc'}
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    TESTING = False
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
