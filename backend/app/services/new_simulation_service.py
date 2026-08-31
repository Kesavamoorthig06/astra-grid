"""
ASTRA GRID - New Simulation Service
Handles project simulation with timeline, cost, and risk analysis
"""
import logging
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class NewSimulationService:
    """Handles new project simulation with timeline and cost tracking"""
    
    @staticmethod
    def run_simulation(project_data):
        """
        Run simulation for power project with timeline and cost analysis
        """
        try:
            project_type = project_data.get('projectType', 'transmission')
            start_date = datetime.fromisoformat(project_data.get('startDate'))
            planned_end_date = datetime.fromisoformat(project_data.get('plannedEndDate'))
            estimated_cost = float(project_data.get('estimatedCost', 0))
            terrain = project_data.get('terrain', 'plain')
            
            # Calculate base duration
            planned_duration = (planned_end_date - start_date).days
            
            # Generate project phases based on type
            if project_type == 'substation':
                phases = NewSimulationService._generate_substation_phases(
                    start_date, planned_duration, estimated_cost, terrain
                )
            else:  # transmission
                phases = NewSimulationService._generate_transmission_phases(
                    start_date, planned_duration, estimated_cost, terrain
                )
            
            # Calculate risk factors
            risk_analysis = NewSimulationService._calculate_risk_factors(
                project_data, terrain, planned_duration
            )
            
            # Generate cost breakdown
            cost_breakdown = NewSimulationService._generate_cost_breakdown(
                estimated_cost, project_type, terrain
            )
            
            # Simulate timeline with delays
            simulated_timeline = NewSimulationService._simulate_timeline(
                phases, risk_analysis
            )
            
            result = {
                'projectType': project_type,
                'plannedDuration': planned_duration,
                'estimatedCost': estimated_cost,
                'phases': phases,
                'riskAnalysis': risk_analysis,
                'costBreakdown': cost_breakdown,
                'simulatedTimeline': simulated_timeline,
                'simulatedEndDate': (start_date + timedelta(days=simulated_timeline['totalDays'])).isoformat(),
                'delayDays': simulated_timeline['totalDays'] - planned_duration,
                'costOverrun': simulated_timeline['costOverrun']
            }
            
            logger.info(f"✓ Simulation completed for {project_type} project")
            return result, None
            
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return None, str(e)
    
    @staticmethod
    def _generate_substation_phases(start_date, duration, cost, terrain):
        """Generate phases for substation project"""
        terrain_multiplier = {'plain': 1.0, 'hilly': 1.2, 'mountainous': 1.5}
        multiplier = terrain_multiplier.get(terrain, 1.0)
        
        phases = [
            {
                'name': 'Site Preparation',
                'duration': int(30 * multiplier),
                'cost': cost * 0.10,
                'dependencies': [],
                'risk': 'medium'
            },
            {
                'name': 'Civil Works',
                'duration': int(60 * multiplier),
                'cost': cost * 0.25,
                'dependencies': ['Site Preparation'],
                'risk': 'high'
            },
            {
                'name': 'Equipment Installation',
                'duration': 45,
                'cost': cost * 0.35,
                'dependencies': ['Civil Works'],
                'risk': 'medium'
            },
            {
                'name': 'Testing & Commissioning',
                'duration': 30,
                'cost': cost * 0.15,
                'dependencies': ['Equipment Installation'],
                'risk': 'low'
            },
            {
                'name': 'Regulatory Clearance',
                'duration': int(20 * multiplier),
                'cost': cost * 0.05,
                'dependencies': [],
                'risk': 'high'
            }
        ]
        
        return phases
    
    @staticmethod
    def _generate_transmission_phases(start_date, duration, cost, terrain):
        """Generate phases for transmission line project"""
        terrain_multiplier = {'plain': 1.0, 'hilly': 1.3, 'mountainous': 1.6}
        multiplier = terrain_multiplier.get(terrain, 1.0)
        
        phases = [
            {
                'name': 'Survey & Design',
                'duration': int(45 * multiplier),
                'cost': cost * 0.08,
                'dependencies': [],
                'risk': 'low'
            },
            {
                'name': 'Land Acquisition',
                'duration': int(90 * multiplier),
                'cost': cost * 0.15,
                'dependencies': ['Survey & Design'],
                'risk': 'high'
            },
            {
                'name': 'Foundation Work',
                'duration': int(75 * multiplier),
                'cost': cost * 0.20,
                'dependencies': ['Land Acquisition'],
                'risk': 'high'
            },
            {
                'name': 'Tower Erection',
                'duration': int(60 * multiplier),
                'cost': cost * 0.25,
                'dependencies': ['Foundation Work'],
                'risk': 'medium'
            },
            {
                'name': 'Conductor Stringing',
                'duration': int(45 * multiplier),
                'cost': cost * 0.20,
                'dependencies': ['Tower Erection'],
                'risk': 'medium'
            },
            {
                'name': 'Testing & Energization',
                'duration': 30,
                'cost': cost * 0.12,
                'dependencies': ['Conductor Stringing'],
                'risk': 'low'
            }
        ]
        
        return phases
    
    @staticmethod
    def _calculate_risk_factors(project_data, terrain, duration):
        """Calculate risk factors for the project"""
        terrain_risk = {'plain': 0.1, 'hilly': 0.3, 'mountainous': 0.5}
        
        risks = {
            'terrainRisk': terrain_risk.get(terrain, 0.1),
            'weatherRisk': 0.2 if duration > 300 else 0.1,
            'regulatoryRisk': 0.3,
            'supplyChainRisk': 0.15,
            'overallRisk': 0
        }
        
        risks['overallRisk'] = (
            risks['terrainRisk'] * 0.3 +
            risks['weatherRisk'] * 0.2 +
            risks['regulatoryRisk'] * 0.3 +
            risks['supplyChainRisk'] * 0.2
        )
        
        return risks
    
    @staticmethod
    def _generate_cost_breakdown(total_cost, project_type, terrain):
        """Generate detailed cost breakdown"""
        if project_type == 'substation':
            breakdown = {
                'equipment': total_cost * 0.40,
                'civil': total_cost * 0.25,
                'labour': total_cost * 0.15,
                'materials': total_cost * 0.10,
                'contingency': total_cost * 0.10
            }
        else:  # transmission
            breakdown = {
                'towers': total_cost * 0.25,
                'conductors': total_cost * 0.20,
                'civil': total_cost * 0.20,
                'labour': total_cost * 0.15,
                'land': total_cost * 0.10,
                'contingency': total_cost * 0.10
            }
        
        return breakdown
    
    @staticmethod
    def _simulate_timeline(phases, risk_analysis):
        """Simulate project timeline with potential delays"""
        total_planned = sum(phase['duration'] for phase in phases)
        
        # Apply risk-based delays
        delay_factor = 1 + (risk_analysis['overallRisk'] * 0.5)
        total_simulated = int(total_planned * delay_factor)
        
        # Random variation
        total_simulated += random.randint(-10, 20)
        
        # Cost overrun based on delay
        delay_days = total_simulated - total_planned
        cost_overrun_percent = (delay_days / total_planned) * 15 if delay_days > 0 else 0
        
        return {
            'totalDays': total_simulated,
            'delayDays': delay_days,
            'costOverrun': cost_overrun_percent
        }
