"""
ASTRA GRID - Authentication Routes
Login, signup, token verification, and user management
"""
from flask import Blueprint, request, jsonify, make_response
from app.services.auth_service import AuthService
from app.middleware.auth import token_required, generate_token
from datetime import datetime

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint
    POST /api/auth/login
    
    Request body:
    {
        "email": "user@powergrid.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        result, error = AuthService.login(email, password)
        if error:
            return jsonify({'success': False, 'error': error}), 401
        
        # Set secure cookie
        response = make_response(jsonify({
            'success': True,
            'token': result['token'],
            'user': result['user']
        }))
        response.set_cookie(
            'astra_token',
            result['token'],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=24 * 60 * 60  # 24 hours
        )
        return response
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint
    POST /api/auth/signup
    
    Request body:
    {
        "name": "John Doe",
        "email": "john@powergrid.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not name or not email or not password:
            return jsonify({
                'success': False,
                'error': 'Name, email, and password are required'
            }), 400
        
        result, error = AuthService.signup(name, email, password)
        if error:
            return jsonify({'success': False, 'error': error}), 400
        
        # Set secure cookie
        response = make_response(jsonify({
            'success': True,
            'token': result['token'],
            'user': result['user']
        }))
        response.set_cookie(
            'astra_token',
            result['token'],
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=24 * 60 * 60
        )
        return response
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """
    Verify JWT token validity
    POST /api/auth/verify-token
    """
    try:
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        
        # Fallback to cookie
        if not token:
            token = request.cookies.get('astra_token')
        
        if not token:
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        result, error = AuthService.verify_token(token)
        if error:
            return jsonify({'success': False, 'error': error}), 401
        
        return jsonify({'success': True, **result})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    User logout endpoint
    POST /api/auth/logout
    """
    try:
        response = make_response(jsonify({'success': True}))
        response.set_cookie('astra_token', '', expires=0)
        return response
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Get current authenticated user
    GET /api/auth/me
    """
    try:
        return jsonify({
            'success': True,
            'user': {
                'email': current_user['email'],
                'name': current_user.get('name', 'User'),
                'role': current_user.get('role', 'user')
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
