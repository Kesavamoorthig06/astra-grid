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
def predict():
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
        
        # Log incoming data for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Received prediction request with target_cost_inr type: {type(data.get('target_cost_inr'))}, value: {data.get('target_cost_inr')}")
        
        # Make prediction
        prediction, error = PredictionService.predict_project_risk(data)
        if error:
            logger.error(f"Prediction error: {error}")
            return jsonify({'success': False, 'error': error}), 500
        
        # Save prediction to database (optional - skip if no user logged in)
        # For testing purposes, we'll skip saving for now
        pred_id = None
        
        return jsonify({
            'success': True,
            'prediction_id': pred_id,
            'data': prediction
        })
    
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Exception in predict route: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


@prediction_bp.route('/history', methods=['GET', 'POST'])
def history():
    """
    GET: Get user's prediction history
    POST: Save a prediction to history
    """
    if request.method == 'GET':
        # For now, return empty history since we're not requiring auth
        try:
            limit = request.args.get('limit', 50, type=int)
            limit = min(limit, 100)
            
            return jsonify({
                'success': True,
                'count': 0,
                'predictions': []
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'POST':
        # Save prediction to history
        try:
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No data provided'
                }), 400
            
            # For now, just acknowledge receipt since we're not requiring auth
            # In production, you'd save to database here
            return jsonify({
                'success': True,
                'message': 'Prediction saved to history'
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
