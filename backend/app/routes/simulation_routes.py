"""
ASTRA GRID - Simulation Routes
Project scenario simulation and what-if analysis
"""
from flask import Blueprint, request, jsonify
from app.services.simulation_service import SimulationService
from app.services.prediction_service import PredictionService
from app.middleware.auth import token_required

# Create blueprint
simulation_bp = Blueprint('simulation', __name__, url_prefix='/api/simulation')

@simulation_bp.route('/scenarios', methods=['POST'])
@token_required
def simulate_scenarios(current_user):
    """
    Generate scenario analysis for project
    POST /api/simulation/scenarios
    
    Request body:
    {
        "risk_score": 5,
        "target_cost_inr": 50000000,
        "target_duration_days": 365
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        scenarios, error = SimulationService.simulate_scenarios(data)
        if error:
            return jsonify({'success': False, 'error': error}), 500
        
        return jsonify({
            'success': True,
            'scenarios': scenarios
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@simulation_bp.route('/recommendations', methods=['POST'])
@token_required
def get_recommendations(current_user):
    """
    Get recommendations based on prediction
    POST /api/simulation/recommendations
    
    Request body should contain prediction data
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        recommendations, error = SimulationService.generate_recommendations(data)
        if error:
            return jsonify({'success': False, 'error': error}), 500
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@simulation_bp.route('/compare', methods=['POST'])
@token_required
def compare_scenarios(current_user):
    """
    Compare multiple project scenarios
    POST /api/simulation/compare
    """
    try:
        data = request.get_json()
        projects = data.get('projects', [])
        
        if not projects:
            return jsonify({
                'success': False,
                'error': 'No projects provided'
            }), 400
        
        # Predict for each project
        predictions = []
        for project in projects:
            pred, error = PredictionService.predict_project_risk(project)
            if not error:
                predictions.append({
                    'project_name': project.get('project_name', 'Unknown'),
                    'prediction': pred
                })
        
        return jsonify({
            'success': True,
            'comparison': predictions,
            'count': len(predictions)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
