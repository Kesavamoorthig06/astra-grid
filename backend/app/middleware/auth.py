"""
ASTRA GRID - Authentication Middleware
JWT token validation and user authentication
"""
import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from app.config.settings import current_config
from app.models.database import db_manager
import logging

logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator to verify JWT token
    Validates token from Authorization header or cookies
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        
        # Fallback to cookie
        if not token:
            token = request.cookies.get('astra_token')
        
        # No token found
        if not token:
            return jsonify({
                'success': False,
                'error': 'Authentication token missing'
            }), 401
        
        try:
            # Decode and validate token
            data = jwt.decode(
                token,
                current_config.JWT_SECRET_KEY,
                algorithms=[current_config.JWT_ALGORITHM]
            )
            
            # Get user from database
            user = db_manager.users_collection.find_one({'email': data['email']})
            if not user:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 401
            
            # Pass user to route handler
            return f(user, *args, **kwargs)
        
        except jwt.ExpiredSignatureError:
            logger.warning(f"Expired token attempted: {token[:20]}...")
            return jsonify({
                'success': False,
                'error': 'Token has expired'
            }), 401
        
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token attempted: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid authentication token'
            }), 401
        
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return jsonify({
                'success': False,
                'error': 'Authentication failed'
            }), 500
    
    return decorated


def generate_token(email):
    """Generate JWT token for user"""
    try:
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + current_config.JWT_EXPIRATION
        }, current_config.JWT_SECRET_KEY, algorithm=current_config.JWT_ALGORITHM)
        return token
    except Exception as e:
        logger.error(f"Token generation error: {e}")
        return None
