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
        """Generate comprehensive, actionable recommendations based on prediction and risk analysis"""
        try:
            recommendations = []
            risk_category = prediction_data.get('risk_category', 'Medium')
            cost_overrun = prediction_data.get('cost_overrun_percent', 0)
            timeline_delay = prediction_data.get('timeline_delay_days', 0)
            hotspot_analysis = prediction_data.get('hotspot_analysis', {})
            risk_factors = hotspot_analysis.get('risk_factors', [])
            region = hotspot_analysis.get('region', 'Unknown')
            
            # Risk-based recommendations with detailed action items
            if risk_category == 'High':
                recommendations.append({
                    'priority': 'Critical',
                    'area': 'Risk Management',
                    'recommendation': 'Implement comprehensive risk mitigation strategy with weekly monitoring and escalation protocols',
                    'details': [
                        'Conduct daily risk assessment meetings for first 30 days',
                        'Establish risk escalation matrix with clear decision-making authority',
                        'Deploy real-time project monitoring dashboard with automated alerts',
                        'Create contingency plans for top 5 identified risks',
                        'Assign risk owners for each critical risk factor',
                        'Implement weekly executive briefings on risk status'
                    ]
                })
                recommendations.append({
                    'priority': 'Critical',
                    'area': 'Project Oversight',
                    'recommendation': 'Assign dedicated risk manager and establish early warning system for cost and schedule deviations',
                    'details': [
                        'Hire or assign full-time risk manager with P&L authority',
                        'Set up automated cost variance alerts at 3%, 5%, and 10% thresholds',
                        'Implement daily schedule tracking with critical path analysis',
                        'Create buffer management system for timeline protection',
                        'Establish monthly independent project audits',
                        'Deploy earned value management (EVM) system for progress tracking'
                    ]
                })
            elif risk_category == 'Medium':
                recommendations.append({
                    'priority': 'High',
                    'area': 'Risk Management',
                    'recommendation': 'Establish bi-weekly risk review meetings and maintain active risk register',
                    'details': [
                        'Schedule bi-weekly risk review meetings with all stakeholders',
                        'Maintain living risk register with probability and impact assessments',
                        'Implement risk response strategies for medium and high risks',
                        'Track risk indicators and update mitigation plans monthly',
                        'Conduct quarterly risk workshops to identify emerging risks'
                    ]
                })
            
            # Specific recommendations based on identified risk factors
            for risk_factor in risk_factors:
                if 'Cost' in risk_factor:
                    if cost_overrun > 15:
                        recommendations.append({
                            'priority': 'Critical',
                            'area': 'Cost Control',
                            'recommendation': 'Conduct immediate cost review, renegotiate vendor contracts, and implement strict change control',
                            'details': [
                                f'Immediately freeze all non-critical spending until cost review is complete',
                                f'Conduct line-by-line budget analysis to identify {cost_overrun:.1f}% overspend sources',
                                'Renegotiate vendor contracts with focus on material and labor costs',
                                'Implement zero-based budgeting for remaining project phases',
                                'Establish change control board with authority to approve only critical changes',
                                'Set up weekly cost burn-rate reviews with finance team',
                                'Consider value engineering exercises to reduce scope without compromising quality'
                            ]
                        })
                    elif cost_overrun > 5:
                        recommendations.append({
                            'priority': 'High',
                            'area': 'Budget Management',
                            'recommendation': 'Review material costs, optimize resource allocation, and establish cost tracking dashboard',
                            'details': [
                                f'Analyze projected {cost_overrun:.1f}% cost variance and identify root causes',
                                'Review all material procurement contracts for bulk discount opportunities',
                                'Optimize labor allocation to reduce overtime and idle time',
                                'Implement real-time cost tracking dashboard with variance analysis',
                                'Establish cost approval thresholds requiring management sign-off',
                                'Create cost forecasting model to predict future variances'
                            ]
                        })
                
                if 'Timeline' in risk_factor or 'Schedule' in risk_factor:
                    if timeline_delay > 30:
                        recommendations.append({
                            'priority': 'Critical',
                            'area': 'Schedule Recovery',
                            'recommendation': 'Fast-track critical path activities, consider parallel work streams, and add resources to key tasks',
                            'details': [
                                f'Develop schedule recovery plan to mitigate {timeline_delay:.0f} days delay',
                                'Identify critical path activities that can be fast-tracked or crashed',
                                'Evaluate opportunities for parallel execution of sequential tasks',
                                'Add experienced resources to bottleneck activities',
                                'Consider working extended hours or additional shifts for critical tasks',
                                'Negotiate early material deliveries with premium payments if needed',
                                'Implement daily stand-up meetings to remove blockers immediately',
                                'Review and approve overtime budget for schedule-critical activities'
                            ]
                        })
                    elif timeline_delay > 10:
                        recommendations.append({
                            'priority': 'High',
                            'area': 'Schedule Management',
                            'recommendation': 'Optimize work sequencing, address bottlenecks early, and improve coordination between teams',
                            'details': [
                                f'Analyze {timeline_delay:.0f} days projected delay and create mitigation plan',
                                'Review project schedule for optimization opportunities',
                                'Identify and eliminate task dependencies that cause bottlenecks',
                                'Improve inter-team coordination with daily coordination meetings',
                                'Implement look-ahead planning for next 2-3 weeks',
                                'Resolve resource conflicts proactively through resource leveling'
                            ]
                        })
                
                if 'Environmental' in risk_factor:
                    recommendations.append({
                        'priority': 'High',
                        'area': 'Environmental Compliance',
                        'recommendation': 'Engage environmental consultants early, conduct thorough impact assessments, and plan mitigation measures',
                        'details': [
                            f'Hire certified environmental consultants with experience in {region}',
                            'Conduct comprehensive Environmental Impact Assessment (EIA)',
                            'Develop Environmental Management Plan (EMP) with clear mitigation measures',
                            'Obtain all required environmental clearances before site mobilization',
                            'Train project team on environmental compliance requirements',
                            'Set up environmental monitoring system with regular audits',
                            'Establish emergency response plan for environmental incidents'
                        ]
                    })
                
                if 'Permit' in risk_factor:
                    recommendations.append({
                        'priority': 'High',
                        'area': 'Permits & Compliance',
                        'recommendation': 'Maintain proactive communication with regulatory authorities and track permit status regularly',
                        'details': [
                            'Assign dedicated permit coordinator to manage all regulatory approvals',
                            'Create comprehensive permit tracking matrix with critical dates',
                            'Schedule monthly meetings with regulatory authorities to expedite approvals',
                            'Prepare complete documentation packages 30 days before submission',
                            'Identify and engage local facilitators for smoother permit processing',
                            'Build contingency time in schedule for permit delays',
                            'Consider parallel permit applications where regulations allow'
                        ]
                    })
                
                if 'Terrain' in risk_factor:
                    recommendations.append({
                        'priority': 'Medium',
                        'area': 'Site Planning',
                        'recommendation': 'Conduct detailed geotechnical surveys, plan for specialized equipment, and budget for terrain-specific challenges',
                        'details': [
                            'Complete comprehensive geotechnical investigation at all critical locations',
                            'Procure or rent specialized equipment suitable for difficult terrain',
                            'Develop site-specific construction methodology for challenging areas',
                            'Allocate contingency budget (10-15%) for unforeseen terrain challenges',
                            'Plan access routes and temporary roads for equipment movement',
                            'Consider helicopter or cable crane solutions for extremely difficult areas'
                        ]
                    })
                
                if 'Vendor' in risk_factor:
                    recommendations.append({
                        'priority': 'High',
                        'area': 'Vendor Management',
                        'recommendation': 'Establish clear performance KPIs, conduct regular vendor reviews, and maintain backup supplier relationships',
                        'details': [
                            'Define measurable KPIs for each vendor (quality, delivery, cost)',
                            'Conduct monthly vendor performance review meetings',
                            'Implement penalty clauses for delays and quality issues',
                            'Identify and pre-qualify backup suppliers for critical materials',
                            'Establish vendor risk monitoring system with early warning indicators',
                            'Consider vendor financing or advance payments for critical supply chain items',
                            'Develop long-term partnership agreements with top-performing vendors'
                        ]
                    })
            
            # Generic best practice recommendations (always include)
            if len([r for r in recommendations if 'Permits' in r['area']]) == 0:
                recommendations.append({
                    'priority': 'Medium',
                    'area': 'Permits & Compliance',
                    'recommendation': 'Maintain proactive communication with regulatory authorities and track permit status regularly',
                    'details': [
                        'Create permit tracking dashboard with status updates',
                        'Schedule quarterly meetings with regulatory bodies',
                        'Maintain updated documentation for all required permits',
                        'Build buffer time in schedule for permit processing'
                    ]
                })
            
            if len([r for r in recommendations if 'Vendor' in r['area']]) == 0:
                recommendations.append({
                    'priority': 'Medium',
                    'area': 'Vendor Coordination',
                    'recommendation': 'Establish clear performance KPIs, conduct regular vendor reviews, and maintain backup supplier relationships',
                    'details': [
                        'Set up monthly vendor performance scorecard',
                        'Maintain list of pre-qualified alternative suppliers',
                        'Implement vendor feedback system for continuous improvement',
                        'Negotiate long-term agreements with strategic vendors'
                    ]
                })
            
            recommendations.append({
                'priority': 'Medium',
                'area': 'Stakeholder Communication',
                'recommendation': 'Maintain transparent communication with all stakeholders and provide regular project updates',
                'details': [
                    'Publish monthly project status reports with key metrics',
                    'Conduct quarterly stakeholder meetings with Q&A sessions',
                    'Create project website or portal for transparent information sharing',
                    'Establish communication protocol for escalating issues',
                    'Share success stories and milestone achievements regularly'
                ]
            })
            
            recommendations.append({
                'priority': 'Low',
                'area': 'Documentation',
                'recommendation': 'Maintain comprehensive project documentation and lessons learned log for future reference',
                'details': [
                    'Implement document management system for all project records',
                    'Maintain daily logs, meeting minutes, and decision registers',
                    'Create lessons learned database with searchable tags',
                    'Document design changes and rationale for future reference',
                    'Archive all key correspondence and technical documents'
                ]
            })
            
            logger.info(f"✓ Generated {len(recommendations)} detailed recommendations from {len(risk_factors)} risk factors")
            return recommendations, None
        
        except Exception as e:
            logger.error(f"Recommendation generation error: {e}")
            return None, str(e)
