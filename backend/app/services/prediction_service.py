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
            if not ml_models.is_loaded:
                return None, "ML models not available"
            
            # Prepare features DataFrame
            features = pd.DataFrame([{
                'Target_Cost_INR': float(input_data.get('target_cost_inr', 0)),
                'Target_Duration_Days': int(input_data.get('target_duration_days', 0)),
                'Voltage_Level_kV': int(input_data.get('voltage_level_kv', 0)),
                'Line_Length_km': float(input_data.get('line_length_km', 0)),
                'Number_of_Bays': int(input_data.get('number_of_bays', 0)),
                'Terrain_Complexity_Index': int(input_data.get('terrain_complexity_index', 0)),
                'Environmental_Impact_Severity': int(input_data.get('environmental_impact_severity', 0)),
                'Forest_Land_Required_Ha': float(input_data.get('forest_land_required_ha', 0)),
                'Annual_Rainfall_mm': float(input_data.get('annual_rainfall_mm', 0)),
                'Num_Required_Permits': int(input_data.get('num_required_permits', 0)),
                'Average_Permit_Lag_Days': int(input_data.get('average_permit_lag_days', 0)),
                'Regulatory_Hotspot_Region': PredictionService.REGULATORY_MAPPING.get(
                    input_data.get('regulatory_hotspot_region', 'Low'), 0
                ),
                'Labour_Cost_Estimate_INR': float(input_data.get('labour_cost_estimate_inr', 0)),
                'Material_Cost_Estimate_INR': float(input_data.get('material_cost_estimate_inr', 0)),
                'Num_Skilled_Workers_Required': int(input_data.get('num_skilled_workers_required', 0)),
                'Vendor_Performance_Rating': float(input_data.get('vendor_performance_rating', 0)),
                'Material_Availability_Issue': PredictionService.MATERIAL_MAPPING.get(
                    input_data.get('material_availability_issue', 'Low'), 0
                )
            }])
            
            # Make predictions
            cost_overrun_percent = float(ml_models.predict_cost_overrun(features)[0])
            timeline_delay_days = float(ml_models.predict_timeline_delay(features)[0])
            risk_score = float(ml_models.predict_risk_score(features)[0])
            
            # Determine risk category
            if risk_score >= 7:
                risk_category = 'High'
            elif risk_score >= 4:
                risk_category = 'Medium'
            else:
                risk_category = 'Low'
            
            prediction = {
                'risk_score': round(risk_score, 2),
                'risk_category': risk_category,
                'cost_overrun_percent': round(cost_overrun_percent, 2),
                'timeline_delay_days': round(timeline_delay_days, 1),
                'estimated_actual_cost': round(
                    float(input_data.get('target_cost_inr', 0)) * (1 + cost_overrun_percent / 100), 2
                ),
                'estimated_actual_duration': round(
                    int(input_data.get('target_duration_days', 0)) + timeline_delay_days
                )
            }
            
            logger.info(f"✓ Prediction generated - Risk: {prediction['risk_category']}")
            return prediction, None
        
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return None, str(e)
    
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
