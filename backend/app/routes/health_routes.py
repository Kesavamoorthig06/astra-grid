"""
ASTRA GRID - Health & System Routes
System health checks and information endpoints
"""
from flask import Blueprint, jsonify
from app.models.database import db_manager
from app.models.ml_manager import ml_models
import os

# Create blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api')

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    GET /api/health
    """
    try:
        db_status = db_manager.health_check()
        ml_status = ml_models.is_loaded
        
        return jsonify({
            'success': True,
            'status': 'healthy' if db_status and ml_status else 'degraded',
            'timestamp': __import__('datetime').datetime.utcnow().isoformat(),
            'service': {
                'name': 'ASTRA GRID Unified Backend',
                'version': '2.0.0',
                'environment': os.environ.get('FLASK_ENV', 'development')
            },
            'components': {
                'database': {
                    'status': 'connected' if db_status else 'disconnected',
                    'type': 'MongoDB'
                },
                'ml_models': {
                    'status': 'loaded' if ml_status else 'not_loaded',
                    'cost_model': ml_models.cost_model is not None,
                    'delay_model': ml_models.delay_model is not None
                }
            },
            'endpoints': [
                'GET  /api/health',
                'POST /api/auth/login',
                'POST /api/auth/signup',
                'POST /api/auth/verify-token',
                'POST /api/auth/logout',
                'GET  /api/auth/me',
                'POST /api/prediction/predict',
                'GET  /api/prediction/history',
                'GET  /api/prediction/history/<id>',
                'POST /api/simulation/scenarios',
                'POST /api/simulation/recommendations',
                'POST /api/simulation/compare',
                'POST /api/document/upload',
                'GET  /api/document/status/<id>',
                'GET  /api/document/supported-formats'
            ]
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@health_bp.route('/info', methods=['GET'])
def get_info():
    """
    Get system information
    GET /api/info
    """
    try:
        return jsonify({
            'success': True,
            'application': {
                'name': 'ASTRA GRID',
                'full_name': 'Automated System for Transmission Risk Assessment - GRID',
                'version': '2.0.0',
                'description': 'AI-powered platform for power transmission project risk prediction and management'
            },
            'features': [
                'Cost overrun prediction',
                'Timeline delay forecasting',
                'Risk assessment and scoring',
                'Project simulation and what-if analysis',
                'Document extraction (PDF/Images)',
                'User authentication and authorization',
                'Prediction history and tracking'
            ],
            'technologies': {
                'backend': 'Flask + Python',
                'database': 'MongoDB',
                'ml_models': 'XGBoost',
                'server': 'Waitress (production)',
                'api': 'RESTful JSON'
            },
            'database': {
                'type': 'MongoDB',
                'name': os.environ.get('MONGODB_DB_NAME', 'astra_grid_db'),
                'connection_status': 'connected' if db_manager.health_check() else 'disconnected'
            },
            'ml_models': {
                'status': 'loaded' if ml_models.is_loaded else 'not_loaded',
                'features_cost': len(ml_models.feature_names_cost) if ml_models.is_loaded else 0,
                'features_delay': len(ml_models.feature_names_delay) if ml_models.is_loaded else 0
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
