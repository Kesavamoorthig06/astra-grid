"""
ASTRA GRID - New Simulation Routes
Advanced project simulation with dynamic time engine, cost calculation, and catch-up logic
"""
from flask import Blueprint, request, jsonify
from app.services.advanced_simulation import generate_project_plan
import logging

logger = logging.getLogger(__name__)

new_simulation_bp = Blueprint('new_simulation', __name__, url_prefix='/api/newsimulation')

@new_simulation_bp.route('/run', methods=['POST', 'OPTIONS'])
def run_simulation():
    """
    Run project simulation
    POST /api/newsimulation/run
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    
    try:
        logger.info("📋 Received simulation request")
        
        data = request.get_json()
        logger.info(f"📊 Project Data: {data}")
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required = ['projectType', 'startDate', 'plannedEndDate', 'estimatedCost']
        missing = [field for field in required if field not in data or not data[field]]
        
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        # Generate project plan
        project_plan = generate_project_plan(data)
        
        logger.info(f"✅ Simulation completed: {len(project_plan['tasks'])} tasks generated")
        
        return jsonify({
            'success': True,
            'data': project_plan
        }), 200
        
    except Exception as e:
        logger.error(f"Simulation API error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
