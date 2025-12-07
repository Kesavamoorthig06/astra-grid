"""
ASTRA GRID - Simulation Service
Project scenario simulation and what-if analysis
"""
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SimulationService:
    """Handles project simulation and scenario analysis"""
    
    @staticmethod
    def simulate_scenarios(base_parameters):
        """Generate optimistic, realistic, and pessimistic scenarios"""
        try:
            base_risk = float(base_parameters.get('risk_score', 5))
            base_cost = float(base_parameters.get('target_cost_inr', 100000000))
            base_timeline = int(base_parameters.get('target_duration_days', 365))
            
            scenarios = {
                'optimistic': {
                    'name': 'Optimistic Scenario',
                    'description': 'Best-case outcomes with all factors favorable',
                    'risk_score': round(base_risk * 0.7, 2),
                    'cost_change_percent': -15,
                    'timeline_change_days': -30,
                    'estimated_cost': round(base_cost * 0.85, 2),
                    'estimated_timeline': max(1, base_timeline - 30)
                },
                'realistic': {
                    'name': 'Realistic Scenario',
                    'description': 'Expected outcomes based on historical data',
                    'risk_score': round(base_risk, 2),
                    'cost_change_percent': 0,
                    'timeline_change_days': 0,
                    'estimated_cost': round(base_cost, 2),
                    'estimated_timeline': base_timeline
                },
                'pessimistic': {
                    'name': 'Pessimistic Scenario',
                    'description': 'Worst-case outcomes with multiple challenges',
                    'risk_score': round(base_risk * 1.4, 2),
                    'cost_change_percent': 25,
                    'timeline_change_days': 45,
                    'estimated_cost': round(base_cost * 1.25, 2),
                    'estimated_timeline': base_timeline + 45
                }
            }
            
            logger.info("✓ Simulation scenarios generated")
            return scenarios, None
        
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return None, str(e)
    
    @staticmethod
    def generate_recommendations(prediction_data):
        """Generate recommendations based on prediction"""
        try:
            recommendations = []
            risk_category = prediction_data.get('risk_category', 'Medium')
            cost_overrun = prediction_data.get('cost_overrun_percent', 0)
            timeline_delay = prediction_data.get('timeline_delay_days', 0)
            
            # Risk-based recommendations
            if risk_category == 'High':
                recommendations.append({
                    'priority': 'Critical',
                    'area': 'Risk Management',
                    'recommendation': 'Implement comprehensive risk mitigation strategy'
                })
                recommendations.append({
                    'priority': 'Critical',
                    'area': 'Monitoring',
                    'recommendation': 'Increase monitoring frequency to weekly'
                })
            
            # Cost-based recommendations
            if cost_overrun > 20:
                recommendations.append({
                    'priority': 'High',
                    'area': 'Cost Control',
                    'recommendation': 'Review material sourcing and vendor negotiations'
                })
            
            # Timeline-based recommendations
            if timeline_delay > 30:
                recommendations.append({
                    'priority': 'High',
                    'area': 'Schedule',
                    'recommendation': 'Increase workforce allocation and resource availability'
                })
            
            # Generic recommendations
            recommendations.extend([
                {
                    'priority': 'Medium',
                    'area': 'Permits & Regulatory',
                    'recommendation': 'Fast-track permit acquisition process'
                },
                {
                    'priority': 'Medium',
                    'area': 'Vendor Management',
                    'recommendation': 'Establish clear vendor performance metrics'
                },
                {
                    'priority': 'Medium',
                    'area': 'Environmental',
                    'recommendation': 'Conduct early environmental impact mitigation'
                }
            ])
            
            logger.info(f"✓ Generated {len(recommendations)} recommendations")
            return recommendations, None
        
        except Exception as e:
            logger.error(f"Recommendation generation error: {e}")
            return None, str(e)
