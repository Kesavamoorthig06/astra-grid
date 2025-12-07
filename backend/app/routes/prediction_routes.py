"""
ASTRA GRID - Prediction Routes
ML model predictions and risk analysis
"""
from flask import Blueprint, request, jsonify
from app.services.prediction_service import PredictionService
from app.middleware.auth import token_required

# Create blueprint
prediction_bp = Blueprint('prediction', __name__, url_prefix='/api/prediction')

@prediction_bp.route('/predict', methods=['POST'])
@token_required
def predict(current_user):
    """
    Predict project risk and cost/timeline overruns
    POST /api/prediction/predict
    
    Request body contains project parameters like:
    {
        "target_cost_inr": 50000000,
        "target_duration_days": 365,
        "voltage_level_kv": 765,
        "line_length_km": 500,
        ...
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Make prediction
        prediction, error = PredictionService.predict_project_risk(data)
        if error:
            return jsonify({'success': False, 'error': error}), 500
        
        # Save prediction to database
        pred_id, save_error = PredictionService.save_prediction(
            current_user['email'],
            data,
            prediction
        )
        
        if save_error:
            return jsonify({'success': False, 'error': save_error}), 500
        
        return jsonify({
            'success': True,
            'prediction_id': pred_id,
            'data': prediction
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@prediction_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    """
    Get user's prediction history
    GET /api/prediction/history?limit=50
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 100)  # Cap at 100
        
        predictions, error = PredictionService.get_prediction_history(
            current_user['email'],
            limit=limit
        )
        
        if error:
            return jsonify({'success': False, 'error': error}), 500
        
        return jsonify({
            'success': True,
            'count': len(predictions),
            'predictions': predictions
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@prediction_bp.route('/history/<prediction_id>', methods=['GET'])
@token_required
def get_prediction_detail(current_user, prediction_id):
    """
    Get specific prediction details
    GET /api/prediction/history/<prediction_id>
    """
    try:
        prediction, error = PredictionService.get_prediction_by_id(prediction_id)
        
        if error:
            return jsonify({'success': False, 'error': error}), 404
        
        # Verify ownership
        if prediction['user_email'] != current_user['email']:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        return jsonify({
            'success': True,
            'prediction': prediction
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
