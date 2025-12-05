"""
ASTRA GRID - Unified Backend API
Combines all backend services into a single Flask application
Port: 5000 (configurable via environment variable)
"""

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import jwt
import datetime
import secrets
from functools import wraps
import pandas as pd
import joblib
import numpy as np
from pathlib import Path

# Initialize Flask app
app = Flask(__name__)

# CORS configuration
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, 
     supports_credentials=True,
     origins=cors_origins,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', secrets.token_hex(32))
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
PORT = int(os.environ.get('PORT', 5000))

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client[os.environ.get('MONGODB_DB', 'astra_grid_db')]
users_collection = db['users']
verification_codes_collection = db['verification_codes']
predictions_collection = db['predictions']

# Load ML models
MODEL_PATH = Path(__file__).parent / 'ml_model_extracted' / 'models'
try:
    model_bundle = joblib.load(MODEL_PATH / 'powergrid_simulation_bundle.joblib')
    
    # Map bundle keys to expected model variables
    cost_model = model_bundle.get('xgb_cost')
    timeline_model = model_bundle.get('xgb_delay')  # delay is timeline
    risk_model = cost_model  # Use cost model for risk (they're related)
    
    scaler_cost = model_bundle.get('scaler_cost')
    scaler_delay = model_bundle.get('scaler_delay')
    scaler = scaler_cost  # Use cost scaler as default
    
    feature_names_cost = model_bundle.get('feature_names_cost', [])
    feature_names_delay = model_bundle.get('feature_names_delay', [])
    feature_names = feature_names_cost  # Use cost features as default
    
    # Additional metadata
    cost_metrics = model_bundle.get('cost_metrics', {})
    delay_metrics = model_bundle.get('delay_metrics', {})
    risk_thresholds_cost = model_bundle.get('risk_thresholds_cost', {})
    
    models_loaded = cost_model is not None and timeline_model is not None
    if models_loaded:
        print("[OK] ML Models loaded successfully")
        print(f"     Cost model: {type(cost_model).__name__}")
        print(f"     Timeline model: {type(timeline_model).__name__}")
        print(f"     Features: {len(feature_names_cost)} cost, {len(feature_names_delay)} delay")
    else:
        print("[WARNING] Models exist but could not be initialized")
        
except Exception as e:
    print(f"[WARNING] Could not load ML models - {e}")
    import traceback
    traceback.print_exc()
    risk_model = cost_model = timeline_model = scaler = None
    scaler_cost = scaler_delay = None
    feature_names = feature_names_cost = feature_names_delay = []
    cost_metrics = delay_metrics = risk_thresholds_cost = {}
    models_loaded = False

# ==================== UTILITY FUNCTIONS ====================

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

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ASTRA GRID Unified API',
        'version': '1.0.0',
        'models_loaded': models_loaded,
        'models': {
            'cost': cost_model is not None,
            'timeline': timeline_model is not None,
            'risk': risk_model is not None
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400

        user = users_collection.find_one({'email': email})
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

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

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    response = jsonify({'success': True})
    response.set_cookie('astra_token', '', expires=0)
    return response

@app.route('/api/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token validity"""
    try:
        token = request.headers.get('Authorization')
        cookie_token = request.cookies.get('astra_token')
        
        if token and token.startswith('Bearer '):
            token = token[7:]
        elif cookie_token:
            token = cookie_token
        
        if not token:
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user = users_collection.find_one({'email': data['email']})
            
            if user:
                return jsonify({
                    'success': True,
                    'user': {
                        'email': user['email'],
                        'name': user.get('name', 'User')
                    }
                })
            else:
                return jsonify({'success': False, 'error': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        verified = data.get('verified', False)

        if not name or not email or not password:
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        
        if not verified:
            return jsonify({'success': False, 'error': 'Email not verified'}), 403

        if users_collection.find_one({'email': email}):
            return jsonify({'success': False, 'error': 'Email already registered'}), 400

        new_user = {
            'name': name,
            'email': email,
            'password': generate_password_hash(password),
            'created_at': datetime.datetime.utcnow()
        }
        
        users_collection.insert_one(new_user)
        
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        
        response = jsonify({
            'success': True,
            'token': token,
            'user': {'email': email, 'name': name}
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

# ==================== PREDICTION ROUTES ====================

@app.route('/api/predict', methods=['POST'])
@token_required
def predict_risk(current_user):
    """ML prediction endpoint"""
    try:
        if not risk_model:
            return jsonify({'error': 'ML models not loaded'}), 500

        data = request.get_json()
        
        # Encode categorical variables
        regulatory_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        material_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        
        regulatory_value = data.get('regulatory_hotspot_region', 'Low')
        material_value = data.get('material_availability_issue', 'Low')
        
        # Create feature vector with encoded categoricals
        features = pd.DataFrame([{
            'Target_Cost_INR': float(data.get('target_cost_inr', 0)),
            'Target_Duration_Days': int(data.get('target_duration_days', 0)),
            'Voltage_Level_kV': int(data.get('voltage_level_kv', 0)),
            'Line_Length_km': float(data.get('line_length_km', 0)),
            'Number_of_Bays': int(data.get('number_of_bays', 0)),
            'Terrain_Complexity_Index': int(data.get('terrain_complexity_index', 0)),
            'Environmental_Impact_Severity': int(data.get('environmental_impact_severity', 0)),
            'Forest_Land_Required_Ha': float(data.get('forest_land_required_ha', 0)),
            'Annual_Rainfall_mm': float(data.get('annual_rainfall_mm', 0)),
            'Num_Required_Permits': int(data.get('num_required_permits', 0)),
            'Average_Permit_Lag_Days': int(data.get('average_permit_lag_days', 0)),
            'Regulatory_Hotspot_Region': regulatory_mapping.get(regulatory_value, 0),
            'Labour_Cost_Estimate_INR': float(data.get('labour_cost_estimate_inr', 0)),
            'Material_Cost_Estimate_INR': float(data.get('material_cost_estimate_inr', 0)),
            'Num_Skilled_Workers_Required': int(data.get('num_skilled_workers_required', 0)),
            'Vendor_Performance_Rating': float(data.get('vendor_performance_rating', 0)),
            'Material_Availability_Issue': material_mapping.get(material_value, 0)
        }])

        # Make predictions
        risk_score = float(risk_model.predict(features)[0])
        cost_overrun = float(cost_model.predict(features)[0])
        timeline_overrun = float(timeline_model.predict(features)[0])

        prediction_data = {
            'risk_score': round(risk_score, 2),
            'cost_overrun_percent': round(cost_overrun, 2),
            'timeline_overrun_days': round(timeline_overrun, 1),
            'risk_category': 'High' if risk_score >= 7 else 'Medium' if risk_score >= 4 else 'Low'
        }

        # Save prediction to database
        predictions_collection.insert_one({
            'user_email': current_user['email'],
            'timestamp': datetime.datetime.utcnow(),
            'input_data': data,
            'prediction': prediction_data
        })

        return jsonify({
            'success': True,
            'data': prediction_data
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prediction-history', methods=['POST'])
@token_required
def save_prediction_history(current_user):
    """Save prediction to history"""
    try:
        data = request.get_json()
        predictions_collection.insert_one({
            'user_email': current_user['email'],
            'timestamp': datetime.datetime.utcnow(),
            'prediction': data
        })
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prediction-history', methods=['GET'])
@token_required
def get_prediction_history(current_user):
    """Get prediction history"""
    try:
        predictions = list(predictions_collection.find(
            {'user_email': current_user['email']},
            {'_id': 1, 'timestamp': 1, 'input_data': 1, 'prediction': 1}
        ).sort('timestamp', -1).limit(50))
        
        # Convert ObjectId to string
        for pred in predictions:
            pred['_id'] = str(pred['_id'])
            
        return jsonify({'success': True, 'predictions': predictions, 'pages': 1})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== SIMULATION ROUTES ====================

@app.route('/api/simulate', methods=['POST'])
@token_required
def simulate_project(current_user):
    """Project simulation endpoint"""
    try:
        if not risk_model:
            return jsonify({'error': 'Simulation models not loaded'}), 500

        data = request.get_json()
        
        # Run simulation (simplified version)
        base_risk = float(data.get('base_risk_score', 5))
        
        # Simulate different scenarios
        scenarios = {
            'optimistic': {'risk': base_risk * 0.8, 'cost': -10, 'timeline': -15},
            'realistic': {'risk': base_risk, 'cost': 0, 'timeline': 0},
            'pessimistic': {'risk': base_risk * 1.3, 'cost': 20, 'timeline': 30}
        }

        return jsonify({
            'success': True,
            'scenarios': scenarios,
            'recommendations': [
                'Monitor high-risk areas closely',
                'Ensure timely permit acquisition',
                'Optimize vendor performance'
            ]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== CHATBOT ROUTES ====================

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chatbot endpoint for power grid queries"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip().lower()
        
        if not user_message:
            return jsonify({'response': 'Please ask me something about power transmission!'}), 200
        
        # Simple rule-based responses for power grid domain
        responses = {
            'hello': 'Hello! I\'m ASTRA GRID assistant. I can help you with power transmission queries, risk assessment, and project simulations.',
            'hi': 'Hi there! How can I assist you with power grid operations today?',
            'help': 'I can help you with:\n- Transmission line risk predictions\n- Project cost and timeline estimates\n- Regulatory compliance information\n- Terrain and environmental impact assessment\n- Vendor performance queries',
            'risk': 'Risk assessment considers factors like terrain complexity, environmental impact, regulatory hotspots, and vendor performance. Would you like to run a prediction?',
            'cost': 'Project costs depend on voltage level, line length, terrain complexity, and material availability. Use the simulation tool for detailed estimates.',
            'voltage': 'We support voltage levels: 132 kV, 220 kV, 400 kV, and 765 kV transmission lines.',
            'terrain': 'Terrain complexity affects both cost and timeline. We classify terrain as: Simple (Index 3), Moderate (5), Complex (7), or Very Complex (10).',
            'environment': 'Environmental impact severity ranges from Low to Critical. Higher impact requires more mitigation measures and permits.',
            'vendor': 'Vendor performance rating (1-5) significantly impacts project success. Higher ratings reduce delays and cost overruns.',
            'timeline': 'Project timelines are estimated based on line length, terrain complexity, regulatory approvals, and vendor capacity.',
            'simulation': 'Use the Simulation page to model different scenarios with varying parameters for cost and timeline optimization.',
            'prediction': 'The Prediction tool uses ML models to assess transmission line project risks based on 9 key parameters.',
            'dashboard': 'The Dashboard shows real-time metrics, project insights, and India\'s transmission network map.',
        }
        
        # Find matching response
        for keyword, response in responses.items():
            if keyword in user_message:
                return jsonify({'response': response}), 200
        
        # Default response for unmatched queries
        default_response = (
            'I\'m here to help with power transmission queries. You can ask me about:\n'
            '• Risk assessment and predictions\n'
            '• Cost and timeline estimates\n'
            '• Voltage levels and terrain complexity\n'
            '• Environmental and regulatory factors\n'
            'Try asking "help" for more information!'
        )
        
        return jsonify({'response': default_response}), 200
        
    except Exception as e:
        return jsonify({'response': f'Sorry, I encountered an error: {str(e)}'}), 500

# ==================== START SERVER ====================

if __name__ == '__main__':
    # Seed admin users if database is empty
    try:
        if users_collection.count_documents({}) == 0:
            admin_users = [
                {'email': 'abroesly@powergrid.com', 'password': generate_password_hash('admin123'), 'name': 'Abro esly'},
                {'email': 'kesavamoorthi@powergrid.com', 'password': generate_password_hash('admin123'), 'name': 'Kesavamoorthi'},
            ]
            users_collection.insert_many(admin_users)
            print("[OK] Seeded admin users")
    except Exception as e:
        print(f"[WARNING] Admin seeding: {e}")

    print(f"""
===============================================
   ASTRA GRID - Unified Backend API
   Port: {PORT}
   Environment: {os.environ.get('FLASK_ENV', 'development')}
===============================================

Available Endpoints:
   - GET  /api/health
   - POST /api/login
   - POST /api/verify-token
   - POST /api/signup
   - POST /api/logout
   - POST /api/predict
   - POST /api/simulate
   - GET  /api/prediction-history
   - POST /api/prediction-history
   - POST /api/chat

Access: http://0.0.0.0:{PORT}
    """)

    # Use waitress for production-ready server
    try:
        from waitress import serve
        print("[STARTING] Server with Waitress...")
        serve(app, host='0.0.0.0', port=PORT, threads=6)
    except Exception as e:
        print(f"[ERROR] Failed to start server: {e}")
        import traceback
        traceback.print_exc()
