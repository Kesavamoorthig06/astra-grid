import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
import os

class MLPredictor:
    """Handle ML model predictions for power grid projects"""
    
    def __init__(self, model_path: str = 'powergrid_risk_model_package.pkl'):
        self.model_path = model_path
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained ML model"""
        # Try multiple possible paths
        possible_paths = [
            self.model_path,
            'powergrid_risk_model_package (1).pkl',
            os.path.join(os.path.dirname(__file__), self.model_path),
            os.path.join(os.path.dirname(__file__), 'powergrid_risk_model_package (1).pkl'),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'rb') as f:
                        self.model = pickle.load(f)
                    print(f"ML model loaded successfully from {path}")
                    return
                except Exception as e:
                    print(f"Error loading model from {path}: {str(e)}")
        
        print("Model file not found")
        self.model = None
    
    def prepare_features(self, project_data: Dict[str, Any]) -> Optional[pd.DataFrame]:
        """Prepare features for ML model prediction"""
        try:
            features = {
                'Target_Cost_INR': project_data.get('cost_inr', 0) * 10000000,
                'Target_Duration_Days': project_data.get('duration_days', 365),
                'Voltage_Level_kV': project_data.get('voltage_level', 400),
                'Line_Length_km': project_data.get('line_length_km', 100),
                'Terrain_Complexity_Index': self.map_terrain(project_data.get('terrain', 'Medium')),
                'Num_Required_Permits': 10,
                'Average_Permit_Lag_Days': 60,
                'Num_Skilled_Workers_Required': 1000,
                'Annual_Rainfall_mm': 800,
                'Commodity_Price_Index_Start': 100,
            }
            
            return pd.DataFrame([features])
        
        except Exception as e:
            print(f"Error preparing features: {str(e)}")
            return None
    
    def map_terrain(self, terrain_text: str) -> int:
        """Map terrain description to complexity index"""
        terrain_lower = terrain_text.lower()
        
        if any(word in terrain_lower for word in ['high', 'hilly', 'difficult', 'mountain']):
            return 3
        elif any(word in terrain_lower for word in ['medium', 'moderate', 'undulating']):
            return 2
        else:
            return 1
    
    def predict(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction using the ML model"""
        
        if self.model is None:
            return {
                'success': False,
                'error': 'ML model not loaded',
                'prediction': None
            }
        
        try:
            features_df = self.prepare_features(project_data)
            
            if features_df is None:
                return {
                    'success': False,
                    'error': 'Failed to prepare features',
                    'prediction': None
                }
            
            prediction = self.model.predict(features_df)
            
            probability = None
            if hasattr(self.model, 'predict_proba'):
                try:
                    proba = self.model.predict_proba(features_df)
                    probability = float(proba[0][1]) if len(proba[0]) > 1 else float(proba[0][0])
                except:
                    pass
            
            risk_level = self.interpret_prediction(prediction[0])
            
            return {
                'success': True,
                'prediction': int(prediction[0]),
                'probability': probability,
                'risk_level': risk_level,
                'extracted_features': project_data,
                'interpretation': self.generate_interpretation(prediction[0], project_data)
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'prediction': None
            }
    
    def interpret_prediction(self, prediction: Any) -> str:
        """Interpret the model prediction"""
        if isinstance(prediction, (int, float)):
            if prediction == 0:
                return "Low Risk"
            elif prediction == 1:
                return "High Risk"
            else:
                return f"Risk Score: {prediction}"
        return "Unknown"
    
    def generate_interpretation(self, prediction: Any, project_data: Dict) -> str:
        """Generate human-readable interpretation"""
        risk_level = self.interpret_prediction(prediction)
        
        cost = project_data.get('cost_inr', 0)
        duration = project_data.get('duration_days', 0)
        voltage = project_data.get('voltage_level', 0)
        
        interpretation = f"Based on the project details:\n\n"
        interpretation += f"• Risk Assessment: {risk_level}\n"
        
        if cost:
            interpretation += f"• Estimated Cost: ₹{cost} Cr\n"
        if duration:
            interpretation += f"• Estimated Duration: {duration} days\n"
        if voltage:
            interpretation += f"• Voltage Level: {voltage}kV\n"
        
        if risk_level == "High Risk":
            interpretation += "\n⚠️ Recommendations:\n"
            interpretation += "- Increase monitoring and oversight\n"
            interpretation += "- Allocate contingency budget\n"
            interpretation += "- Review project timeline\n"
            interpretation += "- Ensure experienced team assignment\n"
        else:
            interpretation += "\n✅ Project appears to be on track with standard risk factors.\n"
        
        return interpretation
