"""
ASTRA GRID - Prediction Service
ML model predictions for cost overrun and timeline delays
"""
import pandas as pd
import datetime
from app.models.ml_manager import ml_models
from app.models.database import db_manager
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """Handles project risk predictions using ML models"""
    
    # Feature mappings for categorical variables
    REGULATORY_MAPPING = {'Low': 0, 'Medium': 1, 'High': 2}
    MATERIAL_MAPPING = {'Low': 0, 'Medium': 1, 'High': 2}
    
    @staticmethod
    def predict_project_risk(input_data):
        """Predict cost overrun and timeline delay for a project"""
        try:
            ml_models.load_models()

            if not ml_models.is_loaded:
                logger.error(f"ML models not loaded. Bundle: {ml_models.bundle}, Cost model: {hasattr(ml_models, 'cost_model')}")
                return None, "ML models not available - models failed to load from disk"
            
            if not ml_models.feature_names_cost or len(ml_models.feature_names_cost) == 0:
                logger.error(f"No feature names found. Available: {ml_models.feature_names_cost}")
                return None, "ML models incomplete - feature configuration missing"
            
            # Helper function to safely convert values
            def safe_float(val, default=0.0):
                if val in [None, '', 'null', 'undefined']:
                    return default
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return default
            
            def safe_int(val, default=0):
                if val in [None, '', 'null', 'undefined']:
                    return default
                try:
                    return int(float(val))
                except (ValueError, TypeError):
                    return default
            
            # Prepare features DataFrame with proper column names and order
            features = pd.DataFrame([{
                'Target_Cost_INR': safe_float(input_data.get('target_cost_inr')),
                'Target_Duration_Days': safe_int(input_data.get('target_duration_days')),
                'Voltage_Level_kV': safe_int(input_data.get('voltage_level_kv')),
                'Line_Length_km': safe_float(input_data.get('line_length_km')),
                'Number_of_Bays': safe_int(input_data.get('number_of_bays')),
                'Terrain_Complexity_Index': safe_int(input_data.get('terrain_complexity_index')),
                'Environmental_Impact_Severity': safe_int(input_data.get('environmental_impact_severity')),
                'Forest_Land_Required_Ha': safe_float(input_data.get('forest_land_required_ha')),
                'Annual_Rainfall_mm': safe_float(input_data.get('annual_rainfall_mm')),
                'Num_Required_Permits': safe_int(input_data.get('num_required_permits')),
                'Average_Permit_Lag_Days': safe_int(input_data.get('average_permit_lag_days')),
                'Regulatory_Hotspot_Region': safe_int(input_data.get('regulatory_hotspot_region')) if isinstance(input_data.get('regulatory_hotspot_region'), (int, float, str)) and str(input_data.get('regulatory_hotspot_region')).isdigit() else PredictionService.REGULATORY_MAPPING.get(input_data.get('regulatory_hotspot_region', 'Low'), 0),
                'Labour_Cost_Estimate_INR': safe_float(input_data.get('labour_cost_estimate_inr')),
                'Material_Cost_Estimate_INR': safe_float(input_data.get('material_cost_estimate_inr')),
                'Num_Skilled_Workers_Required': safe_int(input_data.get('num_skilled_workers_required')),
                'Vendor_Performance_Rating': safe_float(input_data.get('vendor_performance_rating')),
                'Material_Availability_Issue': safe_int(input_data.get('material_availability_issue')) if isinstance(input_data.get('material_availability_issue'), (int, float, str)) and str(input_data.get('material_availability_issue')).isdigit() else PredictionService.MATERIAL_MAPPING.get(input_data.get('material_availability_issue', 'Low'), 0)
            }])
            
            # Reorder features to match model's expected order
            if ml_models.feature_names_cost:
                missing_features = set(ml_models.feature_names_cost) - set(features.columns)
                if missing_features:
                    # Add missing features with default values of 0
                    for feat in missing_features:
                        features[feat] = 0.0
                    logger.warning(f"Added missing features with zero values: {missing_features}")
                
                # Select and reorder to match model
                features = features[ml_models.feature_names_cost]
            
            logger.debug(f"Features shape: {features.shape}, Columns: {list(features.columns)}")
            
            # Make predictions - ensure we extract scalar values from numpy arrays
            import numpy as np
            cost_pred = ml_models.predict_cost_overrun(features)
            timeline_pred = ml_models.predict_timeline_delay(features)
            risk_pred = ml_models.predict_risk_score(features)
            
            # Extract scalar values safely
            cost_overrun_percent_raw = float(np.asarray(cost_pred).flatten()[0])
            timeline_delay_days_raw = float(np.asarray(timeline_pred).flatten()[0])
            risk_score_raw = float(np.asarray(risk_pred).flatten()[0])
            
            # Ensure non-negative values for display (ML model can predict savings/early completion)
            # Absolute values represent magnitude of deviation from plan
            cost_overrun_percent = abs(cost_overrun_percent_raw)
            timeline_delay_days = abs(timeline_delay_days_raw)
            risk_score = abs(risk_score_raw)
            
            # Determine risk category based on absolute risk score
            if risk_score >= 7:
                risk_category = 'High'
            elif risk_score >= 4:
                risk_category = 'Medium'
            else:
                risk_category = 'Low'
            
            # Calculate actual estimates using raw values (preserving sign)
            # Ensure target_cost_inr is converted to float to avoid string multiplication errors
            target_cost = safe_float(input_data.get('target_cost_inr'))
            target_duration = safe_int(input_data.get('target_duration_days'))
            
            # Map region index back to name for hotspot analysis
            region_names = ['Northern Region', 'Southern Region', 'Eastern Region', 
                          'Western Region', 'Central Region', 'North-Eastern Region']
            region_index = input_data.get('regulatory_hotspot_region', 0)
            if isinstance(region_index, int) and 0 <= region_index < len(region_names):
                region_name = region_names[region_index]
            else:
                region_name = 'Unknown Region'
            
            # Determine escalation likelihood based on risk
            if risk_category == 'High':
                escalation_likelihood = 'High'
            elif risk_category == 'Medium':
                escalation_likelihood = 'Medium'
            else:
                escalation_likelihood = 'Low'
            
            # Identify risk factors and build recommendations
            risk_factors = []
            recommendations = []
            
            # Cost-related risks
            if cost_overrun_percent > 15:
                risk_factors.append('High Cost Overrun Risk')
                recommendations.append({
                    'id': 'cost-high',
                    'title': 'Cost Overrun Mitigation',
                    'priority': 'High',
                    'category': 'Financial',
                    'summary': f'Project shows {round(cost_overrun_percent, 1)}% cost overrun risk. Implement strict budget controls.',
                    'details': [
                        'Establish detailed cost tracking mechanisms',
                        'Review vendor pricing and negotiate discounts',
                        'Allocate contingency reserves (15-20% of budget)',
                        'Monitor material costs weekly'
                    ],
                    'impact': 'Cost savings up to 10-15%'
                })
            elif cost_overrun_percent > 5:
                risk_factors.append('Moderate Cost Risk')
                recommendations.append({
                    'id': 'cost-mod',
                    'title': 'Cost Management Plan',
                    'priority': 'Medium',
                    'category': 'Financial',
                    'summary': f'Moderate cost risk identified at {round(cost_overrun_percent, 1)}% overrun. Monitor spending regularly.',
                    'details': [
                        'Establish monthly budget reviews',
                        'Create vendor performance scorecards',
                        'Set cost variance thresholds at 5%'
                    ],
                    'impact': 'Maintain budget within 5%'
                })
            
            # Timeline-related risks
            if timeline_delay_days > 30:
                risk_factors.append('Significant Timeline Delay')
                recommendations.append({
                    'id': 'timeline-high',
                    'title': 'Schedule Risk Mitigation',
                    'priority': 'High',
                    'category': 'Schedule',
                    'summary': f'Project timeline at risk of {round(timeline_delay_days, 0)} days delay. Require immediate action.',
                    'details': [
                        'Add 30% schedule buffer to critical path',
                        'Increase team capacity or add resources',
                        'Conduct weekly progress reviews',
                        'Identify and resolve blockers immediately'
                    ],
                    'impact': 'Reduce delays by 20-30%'
                })
            elif timeline_delay_days > 10:
                risk_factors.append('Moderate Schedule Risk')
                recommendations.append({
                    'id': 'timeline-mod',
                    'title': 'Schedule Management',
                    'priority': 'Medium',
                    'category': 'Schedule',
                    'summary': f'Moderate schedule risk with {round(timeline_delay_days, 0)} days potential delay.',
                    'details': [
                        'Implement weekly status tracking',
                        'Create resource allocation plan',
                        'Set milestone review cadence'
                    ],
                    'impact': 'Stay within 10% schedule variance'
                })
            
            # Environmental risks
            env_severity = safe_int(input_data.get('environmental_impact_severity'))
            if env_severity >= 3:
                risk_factors.append('High Environmental Impact')
                recommendations.append({
                    'id': 'env-high',
                    'title': 'Environmental Compliance',
                    'priority': 'High',
                    'category': 'Compliance',
                    'summary': 'High environmental impact level. Strict compliance required.',
                    'details': [
                        'Conduct environmental impact assessment',
                        'Engage environmental consultants',
                        'Develop mitigation strategies',
                        'Plan regular compliance audits'
                    ],
                    'impact': 'Full regulatory compliance'
                })
            elif env_severity >= 2:
                risk_factors.append('Environmental Considerations')
                recommendations.append({
                    'id': 'env-mod',
                    'title': 'Environmental Management',
                    'priority': 'Medium',
                    'category': 'Compliance',
                    'summary': 'Environmental considerations present. Plan mitigation measures.',
                    'details': [
                        'Review environmental requirements',
                        'Plan resource conservation measures',
                        'Set up environmental KPIs'
                    ],
                    'impact': 'Reduce environmental impact by 20%'
                })
            
            # Regulatory/Permit risks
            permit_lag = safe_int(input_data.get('average_permit_lag_days'))
            if permit_lag > 90:
                risk_factors.append('Severe Permit Delays')
                recommendations.append({
                    'id': 'permit-high',
                    'title': 'Permit Acceleration',
                    'priority': 'High',
                    'category': 'Regulatory',
                    'summary': f'Severe permit delays expected ({permit_lag} days). Start pre-application planning.',
                    'details': [
                        'Engage with regulatory agencies early',
                        'Prepare complete permit applications',
                        'Hire permit expediting consultants',
                        'Plan parallel path activities during waiting'
                    ],
                    'impact': 'Reduce permit delays by 30-40%'
                })
            elif permit_lag > 60:
                risk_factors.append('Permit Processing Delays')
                recommendations.append({
                    'id': 'permit-mod',
                    'title': 'Permit Management',
                    'priority': 'Medium',
                    'category': 'Regulatory',
                    'summary': f'Permit processing expected to take {permit_lag} days. Plan accordingly.',
                    'details': [
                        'Schedule permit submissions strategically',
                        'Maintain agency communication log',
                        'Identify alternative approval paths'
                    ],
                    'impact': 'Streamline permitting process'
                })
            
            # Terrain complexity
            terrain = safe_int(input_data.get('terrain_complexity_index'))
            if terrain >= 3:
                risk_factors.append('Complex Terrain Challenges')
                recommendations.append({
                    'id': 'terrain-complex',
                    'title': 'Terrain Management',
                    'priority': 'High',
                    'category': 'Technical',
                    'summary': 'Complex terrain requires specialized planning and equipment.',
                    'details': [
                        'Conduct detailed site surveys',
                        'Plan specialized equipment needs',
                        'Hire experienced terrain specialists',
                        'Budget for extended construction timeline'
                    ],
                    'impact': 'Ensure safe and efficient construction'
                })
            
            # Vendor-related risks
            vendor_rating = safe_float(input_data.get('vendor_performance_rating'), 10)
            if vendor_rating < 5:
                risk_factors.append('Low Vendor Performance')
                recommendations.append({
                    'id': 'vendor-low',
                    'title': 'Vendor Performance Management',
                    'priority': 'High',
                    'category': 'Vendor',
                    'summary': f'Selected vendor has low performance rating ({round(vendor_rating, 1)}/10). Increase oversight.',
                    'details': [
                        'Establish weekly performance reviews',
                        'Create performance scorecards',
                        'Identify backup vendors',
                        'Include penalty clauses for failures'
                    ],
                    'impact': 'Improve delivery quality'
                })
            
            # If high risk but no specific recommendations, add general ones
            if risk_category == 'High' and len(recommendations) == 0:
                risk_factors.append('Multiple Risk Factors Identified')
                recommendations.append({
                    'id': 'general-mitigation',
                    'title': 'Comprehensive Risk Management',
                    'priority': 'High',
                    'category': 'General',
                    'summary': 'Project classified as High Risk. Implement comprehensive risk management.',
                    'details': [
                        'Conduct formal risk assessment workshop',
                        'Create detailed risk register',
                        'Establish risk response plans',
                        'Weekly risk reviews with stakeholders'
                    ],
                    'impact': 'Reduce overall project risk by 40%'
                })
            
            # Calculate Vendor Risk Score (0-10 scale, inverse of performance rating)
            vendor_rating = safe_float(input_data.get('vendor_performance_rating'), 10)
            vendor_change_events = safe_int(input_data.get('num_vendor_change_events'))
            vendor_risk_score = max(0, min(10, (10 - vendor_rating) + (vendor_change_events * 0.5)))
            
            # Determine vendor risk level
            if vendor_risk_score >= 7:
                vendor_risk_level = 'High'
            elif vendor_risk_score >= 4:
                vendor_risk_level = 'Medium'
            else:
                vendor_risk_level = 'Low'
            
            # Calculate Historical Delay Index (0-10 scale based on local historical data)
            historical_delay = safe_float(input_data.get('historical_local_delay_index'))
            # Normalize to 0-10 scale (assuming historical_delay_index is between 0-1)
            historical_delay_index = round(historical_delay * 10, 2)
            
            prediction = {
                'risk_score': round(risk_score, 2),
                'risk_category': risk_category,
                'cost_overrun_percent': round(cost_overrun_percent, 2),
                'timeline_delay_days': round(timeline_delay_days, 1),
                'schedule_delay_days': round(timeline_delay_days, 1),  # Frontend compatibility
                'estimated_actual_cost': round(
                    target_cost * (1 + cost_overrun_percent_raw / 100), 2
                ),
                'estimated_actual_duration': round(
                    target_duration + timeline_delay_days_raw
                ),
                'predicted_cost': round(
                    target_cost * (1 + cost_overrun_percent_raw / 100), 2
                ),
                'predicted_duration': round(
                    target_duration + timeline_delay_days_raw
                ),
                'risk_classification': risk_category,
                # Risk analysis section for frontend
                'risk_analysis': {
                    'qualitative_risk_score': round(risk_score, 2),
                    'qualitative_risk_level': risk_category,
                    'vendor_risk_score': round(vendor_risk_score, 2),
                    'vendor_risk_level': vendor_risk_level,
                    'historical_delay_index': historical_delay_index,
                },
                # Include raw predictions for advanced users
                'raw_cost_variance': round(cost_overrun_percent_raw, 2),
                'raw_timeline_variance': round(timeline_delay_days_raw, 1),
                # Hotspot analysis
                'hotspot_analysis': {
                    'region': region_name,
                    'escalation_likelihood': escalation_likelihood,
                    'risk_factors': risk_factors
                },
                # Recommendations based on risk factors
                'recommendations': recommendations
            }
            
            logger.info(f"✓ Prediction generated - Risk: {prediction['risk_category']}")
            return prediction, None
        
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}", exc_info=True)
            return None, f"Prediction failed: {str(e)}"
    
    @staticmethod
    def save_prediction(user_email, input_data, prediction):
        """Save prediction to database"""
        try:
            record = {
                'user_email': user_email,
                'timestamp': datetime.datetime.utcnow(),
                'project_name': input_data.get('project_name', 'Unnamed Project'),
                'input_data': input_data,
                'prediction': prediction
            }
            
            result = db_manager.predictions_collection.insert_one(record)
            logger.info(f"✓ Prediction saved for user: {user_email}")
            return str(result.inserted_id), None
        
        except Exception as e:
            logger.error(f"Failed to save prediction: {e}")
            return None, str(e)
    
    @staticmethod
    def get_prediction_history(user_email, limit=50):
        """Get user's prediction history"""
        try:
            predictions = list(
                db_manager.predictions_collection.find(
                    {'user_email': user_email},
                    {'_id': 1, 'timestamp': 1, 'project_name': 1, 'input_data': 1, 'prediction': 1}
                ).sort('timestamp', -1).limit(limit)
            )
            
            # Convert ObjectId to string
            for pred in predictions:
                pred['_id'] = str(pred['_id'])
            
            logger.info(f"✓ Retrieved {len(predictions)} predictions for user: {user_email}")
            return predictions, None
        
        except Exception as e:
            logger.error(f"Failed to get prediction history: {e}")
            return None, str(e)
    
    @staticmethod
    def get_prediction_by_id(prediction_id):
        """Get specific prediction by ID"""
        try:
            from bson import ObjectId
            
            prediction = db_manager.predictions_collection.find_one({'_id': ObjectId(prediction_id)})
            if prediction:
                prediction['_id'] = str(prediction['_id'])
                return prediction, None
            else:
                return None, "Prediction not found"
        
        except Exception as e:
            logger.error(f"Failed to get prediction: {e}")
            return None, str(e)
