from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import jwt
import datetime
import secrets
from functools import wraps

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Secret key for JWT - In production, use environment variable
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['astra_grid_db']
users_collection = db['users']
verification_codes_collection = db['verification_codes']

# Seed users if collection is empty
def seed_users():
    if users_collection.count_documents({}) == 0:
        test_users = [
            {'email': 'abroesly@powergrid.com', 'password': generate_password_hash('superadmin'), 'name': 'A Broesly'},
            {'email': 'kesavamoorthi@powergrid.com', 'password': generate_password_hash('superadmin'), 'name': 'Kesavamoorthi'},
            {'email': 'user1@example.com', 'password': generate_password_hash('password1'), 'name': 'User One'},
            {'email': 'user2@example.com', 'password': generate_password_hash('password2'), 'name': 'User Two'},
            {'email': 'user3@example.com', 'password': generate_password_hash('password3'), 'name': 'User Three'},
            {'email': 'user4@example.com', 'password': generate_password_hash('password4'), 'name': 'User Four'},
            {'email': 'user5@example.com', 'password': generate_password_hash('password5'), 'name': 'User Five'},
            {'email': 'user6@example.com', 'password': generate_password_hash('password6'), 'name': 'User Six'},
            {'email': 'user7@example.com', 'password': generate_password_hash('password7'), 'name': 'User Seven'},
            {'email': 'user8@example.com', 'password': generate_password_hash('password8'), 'name': 'User Eight'},
            {'email': 'user9@example.com', 'password': generate_password_hash('password9'), 'name': 'User Nine'},
            {'email': 'user10@example.com', 'password': generate_password_hash('password10'), 'name': 'User Ten'},
        ]
        users_collection.insert_many(test_users)
        print("Seeded 12 test users including admin accounts")

def token_required(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        cookie_token = request.cookies.get('astra_token')
        
        if token and token.startswith('Bearer '):
            token = token[7:]
        elif cookie_token:
            token = cookie_token
        
        if not token:
            return jsonify({'success': False, 'error': 'Token missing'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = users_collection.find_one({'email': data['email']})
            if not current_user:
                return jsonify({'success': False, 'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

seed_users()

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400

        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        if not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        # Generate JWT token
        token = jwt.encode({
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')

        response = jsonify({
            'success': True,
            'token': token,
            'user': {
                'email': user['email'],
                'name': user.get('name', 'User')
            }
        })
        response.set_cookie(
            'astra_token',
            token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=60 * 60 * 24
        )
        return response

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/check-email', methods=['POST'])
def check_email():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        user = users_collection.find_one({'email': email})
        return jsonify({'exists': user is not None})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/send-verification', methods=['POST'])
def send_verification():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'error': 'Email required'}), 400
        
        # Generate 6-digit code
        code = str(secrets.randbelow(900000) + 100000)
        
        # Store code in database with expiration (5 minutes)
        expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        # Delete any existing codes for this email
        verification_codes_collection.delete_many({'email': email})
        
        # Insert new verification code
        verification_codes_collection.insert_one({
            'email': email,
            'code': code,
            'expires_at': expiration,
            'attempts': 0
        })
        
        # For development: log the code
        print(f"\n{'='*50}")
        print(f"VERIFICATION CODE for {email}: {code}")
        print(f"Valid for 5 minutes")
        print(f"{'='*50}\n")
        
        # In production, use SendGrid/AWS SES to send email
        
        return jsonify({'success': True, 'message': 'Verification code sent (check console)'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'success': False, 'error': 'Email and code required'}), 400
        
        # Find verification code
        verification = verification_codes_collection.find_one({'email': email})
        
        if not verification:
            return jsonify({'success': False, 'error': 'No verification code found. Please request a new one.'}), 404
        
        # Check if expired
        if datetime.datetime.utcnow() > verification['expires_at']:
            verification_codes_collection.delete_one({'email': email})
            return jsonify({'success': False, 'error': 'Verification code expired. Please request a new one.'}), 410
        
        # Check attempts (max 5)
        if verification['attempts'] >= 5:
            verification_codes_collection.delete_one({'email': email})
            return jsonify({'success': False, 'error': 'Too many failed attempts. Please request a new code.'}), 429
        
        # Verify code
        if verification['code'] != code:
            # Increment attempts
            verification_codes_collection.update_one(
                {'email': email},
                {'$inc': {'attempts': 1}}
            )
            remaining = 5 - verification['attempts'] - 1
            return jsonify({'success': False, 'error': f'Invalid code. {remaining} attempts remaining.'}), 401
        
        # Code is valid - delete it
        verification_codes_collection.delete_one({'email': email})
        
        return jsonify({'success': True, 'message': 'Code verified successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        verified = data.get('verified', False)

        if not name or not email or not password:
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        
        # Must be verified first
        if not verified:
            return jsonify({'success': False, 'error': 'Email not verified'}), 403

        # Check if user already exists
        if users_collection.find_one({'email': email}):
            return jsonify({'success': False, 'error': 'Email already registered'}), 400

        # Create new user
        new_user = {
            'name': name,
            'email': email,
            'password': generate_password_hash(password),
            'created_at': datetime.datetime.utcnow()
        }
        
        users_collection.insert_one(new_user)
        
        # Generate JWT token
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        
        response = jsonify({
            'success': True,
            'token': token,
            'user': {
                'email': email,
                'name': name
            }
        })
        response.set_cookie(
            'astra_token',
            token,
            httponly=True,
            secure=False,
            samesite='Lax',
            max_age=60 * 60 * 24
        )
        return response

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/verify-token', methods=['POST'])
@token_required
def verify_token(current_user):
    """Verify if token is valid"""
    return jsonify({
        'success': True,
        'user': {
            'email': current_user['email'],
            'name': current_user.get('name', 'User')
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({'success': True})
    response.set_cookie('astra_token', '', expires=0)
    return response

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'auth'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
