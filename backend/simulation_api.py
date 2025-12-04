"""
Simulation API using the trained XGBoost models for PowerGrid risk prediction.
Handles cost overrun, timeline delays, risk analysis, and hotspot identification.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
import logging
import requests
from datetime import datetime


class NumpyJSONProvider(DefaultJSONProvider):
    """Custom JSON provider to handle NumPy types."""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.json = NumpyJSONProvider(app)
CORS(app)

# Load the simulation model bundle
BUNDLE_PATH = Path(__file__).parent / 'ml_model_extracted' / 'models' / 'powergrid_simulation_bundle.joblib'

try:
    bundle = joblib.load(BUNDLE_PATH)
    logger.info(f"✓ Loaded simulation model bundle from {BUNDLE_PATH}")
except Exception as e:
    logger.error(f"✗ Failed to load model bundle: {e}")
    bundle = None

# Extract model components
if bundle:
    xgb_cost = bundle['xgb_cost']
    xgb_delay = bundle['xgb_delay']
    scaler_cost = bundle['scaler_cost']
    scaler_delay = bundle['scaler_delay']
    feature_names_cost = bundle['feature_names_cost']
    feature_names_delay = bundle['feature_names_delay']
    scaler_cols_cost = bundle['scaler_cols_cost']
    scaler_cols_delay = bundle['scaler_cols_delay']
    cost_metrics = bundle['cost_metrics']
    delay_metrics = bundle['delay_metrics']
    risk_thresholds_cost = bundle['risk_thresholds_cost']
    risk_thresholds_delay = bundle['risk_thresholds_delay']
    hotspot_cost = bundle['hotspot_cost']
    hotspot_delay = bundle['hotspot_delay']


def fetch_weather_data(location: str) -> Dict[str, Any]:
    """
    Fetch real-time weather data from wttr.in API.
    Returns weather conditions and location information.
    """
    if not location or not location.strip():
        return {
            'success': False,
            'error': 'No location provided',
            'data': None
        }
    
    try:
        url = f'https://wttr.in/{location}?format=j1'
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            logger.warning(f"Weather API returned status {response.status_code}")
            return {'success': False, 'error': 'Weather API request failed', 'data': None}
        
        data = response.json()
        
        # Extract current conditions
        current = data.get('current_condition', [{}])[0]
        nearest_area = data.get('nearest_area', [{}])[0]
        
        # Parse location info
        location_info = {
            'city': nearest_area.get('areaName', [{}])[0].get('value', 'Unknown'),
            'state': nearest_area.get('region', [{}])[0].get('value', 'Unknown'),
            'country': nearest_area.get('country', [{}])[0].get('value', 'Unknown'),
            'query': location
        }
        
        # Parse weather conditions
        temp_c = float(current.get('temp_C', 20))
        humidity = int(current.get('humidity', 50))
        precip_mm = float(current.get('precipMM', 0))
        wind_kmph = int(current.get('windspeedKmph', 0))
        description = current.get('weatherDesc', [{}])[0].get('value', 'Unknown')
        
        weather_conditions = {
            'temperature_c': temp_c,
            'humidity_percent': humidity,
            'precipitation_mm': precip_mm,
            'wind_speed_kmph': wind_kmph,
            'description': description,
            'is_favorable': is_weather_favorable(temp_c, precip_mm, wind_kmph, description)
        }
        
        return {
            'success': True,
            'location': location_info,
            'conditions': weather_conditions
        }
        
    except requests.exceptions.Timeout:
        logger.warning(f"Weather API timeout for location: {location}")
        return {'success': False, 'error': 'Weather API timeout', 'data': None}
    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        return {'success': False, 'error': str(e), 'data': None}


def is_weather_favorable(temp_c: float, precip_mm: float, wind_kmph: int, description: str) -> bool:
    """
    Determine if weather conditions are favorable for construction.
    """
    # Temperature check: 5°C to 45°C is acceptable
    if temp_c < 5 or temp_c > 45:
        return False
    
    # Precipitation check: less than 10mm
    if precip_mm >= 10:
        return False
    
    # Wind speed check: less than 40 km/h
    if wind_kmph >= 40:
        return False
    
    # Check for severe weather keywords
    severe_conditions = ['storm', 'heavy rain', 'blizzard', 'dense fog', 'thunderstorm']
    description_lower = description.lower()
    if any(condition in description_lower for condition in severe_conditions):
        return False
    
    return True


def calculate_weather_impact(weather_data: Dict[str, Any], project_duration_days: int = 365) -> Dict[str, Any]:
    """
    Calculate weather impact on project cost and timeline.
    Uses historical correlation between weather conditions and delays.
    """
    if not weather_data.get('success'):
        return {
            'weather_risk_score': 0.0,
            'estimated_additional_delays': 0,
            'cost_impact_percent': 0.0,
            'annual_rainfall_estimate': 800.0,
            'extreme_weather_days_estimate': 5,
            'warnings': [],
            'recommendation': 'Weather data unavailable. Using default values.'
        }
    
    conditions = weather_data['conditions']
    temp_c = conditions['temperature_c']
    precip_mm = conditions['precipitation_mm']
    wind_kmph = conditions['wind_speed_kmph']
    is_favorable = conditions['is_favorable']
    
    # Initialize impact metrics
    risk_score = 0.0
    additional_delays = 0
    cost_impact = 0.0
    warnings = []
    
    # Precipitation impact
    if precip_mm > 10:
        risk_score += 0.3
        additional_delays += 3
        cost_impact += 2.0
        warnings.append(f'Heavy precipitation ({precip_mm}mm) may cause significant delays')
    elif precip_mm > 5:
        risk_score += 0.15
        additional_delays += 1
        cost_impact += 0.8
        warnings.append(f'Moderate precipitation ({precip_mm}mm) may cause minor delays')
    
    # Temperature impact
    if temp_c < 5:
        risk_score += 0.2
        additional_delays += 2
        cost_impact += 1.5
        warnings.append(f'Extreme cold ({temp_c}°C) requires special precautions')
    elif temp_c > 40:
        risk_score += 0.15
        additional_delays += 1
        cost_impact += 1.0
        warnings.append(f'Extreme heat ({temp_c}°C) may reduce work hours')
    
    # Wind impact
    if wind_kmph > 40:
        risk_score += 0.2
        additional_delays += 1
        cost_impact += 1.0
        warnings.append(f'High winds ({wind_kmph} km/h) may halt overhead work')
    elif wind_kmph > 25:
        risk_score += 0.1
        warnings.append(f'Moderate winds ({wind_kmph} km/h) may slow work')
    
    # Cap risk score at 0.7 (70%)
    risk_score = min(risk_score, 0.7)
    
    # Estimate annual rainfall based on current precipitation
    # Rough approximation: current precip * 30 days/month * 12 months
    annual_rainfall_estimate = max(precip_mm * 365, 800.0)  # Minimum 800mm
    
    # Estimate extreme weather days based on current conditions
    extreme_weather_days_estimate = 5  # Default
    if not is_favorable:
        extreme_weather_days_estimate = int(20 + (risk_score * 50))
    elif precip_mm > 5 or wind_kmph > 25 or temp_c < 10 or temp_c > 35:
        extreme_weather_days_estimate = 10
    
    # Generate recommendation
    if is_favorable:
        recommendation = 'Current weather conditions are favorable for construction. Proceed as planned.'
    elif risk_score > 0.5:
        recommendation = 'High-risk weather conditions detected. Consider postponing critical outdoor work and implementing comprehensive weather protection measures.'
    elif risk_score > 0.3:
        recommendation = 'Moderate weather risks present. Implement standard weather mitigation protocols and monitor conditions closely.'
    else:
        recommendation = 'Minor weather concerns. Standard safety protocols should be sufficient.'
    
    if not warnings:
        warnings.append('No significant weather warnings at this time')
    
    return {
        'weather_risk_score': round(risk_score, 3),
        'estimated_additional_delays': additional_delays,
        'cost_impact_percent': round(cost_impact, 2),
        'annual_rainfall_estimate': round(annual_rainfall_estimate, 1),
        'extreme_weather_days_estimate': extreme_weather_days_estimate,
        'warnings': warnings,
        'recommendation': recommendation
    }


def preprocess_input(raw_input: Dict[str, Any]) -> pd.DataFrame:
    """
    Convert raw API input to the feature format expected by the models.
    Applies same preprocessing as training: feature engineering + one-hot encoding.
    """
    # Create DataFrame from input
    df = pd.DataFrame([raw_input])
    
    # Feature engineering (must match training pipeline)
    df['Cost_Ratio_Material_to_Labour'] = df['Material_Cost_Estimate_INR'] / (
        df['Labour_Cost_Estimate_INR'] + 1e-6
    )
    df['Permit_Efficiency'] = df['Average_Permit_Lag_Days'] / (
        df['Num_Required_Permits'] + 1e-6
    )
    df['Vendor_Risk_Score'] = df['Num_Vendor_Change_Events'] * (
        10 - df['Vendor_Performance_Rating']
    )
    
    # One-hot encoding
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    
    return df_encoded


def predict_cost_overrun(df_encoded: pd.DataFrame) -> float:
    """Predict cost overrun percentage."""
    # Align features
    df_aligned = df_encoded.reindex(columns=feature_names_cost, fill_value=0)
    
    # Scale numerical features
    df_numerical = df_aligned[scaler_cols_cost].copy()
    df_numerical_scaled = scaler_cost.transform(df_numerical)
    df_aligned[scaler_cols_cost] = df_numerical_scaled
    
    # Predict
    prediction = float(xgb_cost.predict(df_aligned)[0])
    return prediction


def predict_timeline_overrun(df_encoded: pd.DataFrame) -> float:
    """Predict timeline overrun in days."""
    # Align features
    df_aligned = df_encoded.reindex(columns=feature_names_delay, fill_value=0)
    
    # Scale numerical features
    df_numerical = df_aligned[scaler_cols_delay].copy()
    df_numerical_scaled = scaler_delay.transform(df_numerical)
    df_aligned[scaler_cols_delay] = df_numerical_scaled
    
    # Predict
    prediction = float(xgb_delay.predict(df_aligned)[0])
    return prediction


def classify_risk(cost_pct: float, delay_days: float) -> str:
    """Classify overall project risk based on cost and timeline predictions."""
    if cost_pct < risk_thresholds_cost['low'] and delay_days < risk_thresholds_delay['low']:
        return 'LOW'
    if cost_pct < risk_thresholds_cost['medium'] and delay_days < risk_thresholds_delay['medium']:
        return 'MEDIUM'
    if cost_pct < risk_thresholds_cost['high'] and delay_days < risk_thresholds_delay['high']:
        return 'HIGH'
    return 'CRITICAL'


def analyze_hotspots(raw_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Identify key risk hotspots based on input features and model importance.
    """
    hotspots = []
    
    # Material cost hotspot (top driver for cost overrun)
    material_cost = raw_input.get('Material_Cost_Estimate_INR', 0)
    if material_cost > 400000000:  # > 40 Cr
        hotspots.append({
            'factor': 'Material Cost',
            'severity': 'High',
            'description': f'Material cost of ₹{material_cost/10000000:.1f} Cr is a major cost driver',
        })
    
    # Manpower escalation (top driver for timeline delays)
    manpower_issue = raw_input.get('Escalation_Reason_Manpower', 0)
    skilled_workers = raw_input.get('Num_Skilled_Workers_Required', 0)
    if manpower_issue == 1 or skilled_workers > 250:
        hotspots.append({
            'factor': 'Manpower Shortage',
            'severity': 'High',
            'description': f'Requires {skilled_workers} skilled workers with escalation risk',
        })
    
    # Vendor performance
    vendor_rating = raw_input.get('Vendor_Performance_Rating', 10)
    if vendor_rating < 6:
        hotspots.append({
            'factor': 'Vendor Reliability',
            'severity': 'Medium' if vendor_rating < 4 else 'Low',
            'description': f'Vendor rating of {vendor_rating}/10 may cause delays',
        })
    
    # Regulatory complexity
    permits = raw_input.get('Num_Required_Permits', 0)
    permit_lag = raw_input.get('Average_Permit_Lag_Days', 0)
    if permits > 10 or permit_lag > 90:
        hotspots.append({
            'factor': 'Regulatory Delays',
            'severity': 'High',
            'description': f'{permits} permits with {permit_lag}-day average lag',
        })
    
    # Environmental impact
    env_impact = raw_input.get('Environmental_Impact_Severity', 'Low')
    forest_land = raw_input.get('Forest_Land_Required_Ha', 0)
    if env_impact in ['High', 'Very High'] or forest_land > 50:
        hotspots.append({
            'factor': 'Environmental Clearance',
            'severity': 'High',
            'description': f'{env_impact} environmental impact with {forest_land} ha forest land',
        })
    
    # Weather risk
    rainfall = raw_input.get('Annual_Rainfall_mm', 0)
    extreme_weather = raw_input.get('Num_Extreme_Weather_Days', 0)
    if rainfall > 1500 or extreme_weather > 20:
        hotspots.append({
            'factor': 'Weather Risk',
            'severity': 'Medium',
            'description': f'{rainfall}mm rainfall with {extreme_weather} extreme weather days',
        })
    
    return {
        'identified_hotspots': hotspots,
        'hotspot_count': len(hotspots),
        'top_cost_drivers': [{'feature': feat, 'importance': round(imp * 100, 2)} for feat, imp in hotspot_cost[:5]],
        'top_delay_drivers': [{'feature': feat, 'importance': round(imp * 100, 2)} for feat, imp in hotspot_delay[:5]],
    }


def generate_risk_analysis(raw_input: Dict[str, Any], cost_pct: float, delay_days: float) -> Dict[str, Any]:
    """Generate comprehensive risk analysis metrics."""
    
    # Qualitative risk scoring
    terrain = raw_input.get('Terrain_Complexity_Index', 'Low')
    env_impact = raw_input.get('Environmental_Impact_Severity', 'Low')
    material_issue = raw_input.get('Material_Availability_Issue', 0)
    
    terrain_score_map = {
        'Low (Plain)': 2, 'Low (Urban)': 3, 'Medium (Plateau)': 5,
        'Moderate (Hilly)': 7, 'Very High (Hilly)': 9
    }
    env_score_map = {'Low': 2, 'Medium': 5, 'Moderate': 7, 'Very High': 9}
    
    terrain_score = terrain_score_map.get(terrain, 5)
    env_score = env_score_map.get(env_impact, 5)
    material_score = material_issue * 5
    
    qualitative_risk = (terrain_score + env_score + material_score) / 3.0
    
    # Vendor risk
    vendor_rating = raw_input.get('Vendor_Performance_Rating', 7)
    vendor_changes = raw_input.get('Num_Vendor_Change_Events', 0)
    vendor_risk = (10 - vendor_rating) + (vendor_changes * 2)
    
    # Schedule pressure
    duration_days = raw_input.get('Target_Duration_Days', 365)
    line_length = raw_input.get('Line_Length_km', 100)
    duration_efficiency = line_length / duration_days if duration_days > 0 else 0
    schedule_pressure = 'High' if duration_efficiency > 0.5 else ('Medium' if duration_efficiency > 0.3 else 'Low')
    
    return {
        'qualitative_risk_score': round(qualitative_risk, 2),
        'qualitative_risk_level': 'High' if qualitative_risk > 6 else ('Medium' if qualitative_risk > 3 else 'Low'),
        'vendor_risk_score': round(vendor_risk, 2),
        'vendor_risk_level': 'High' if vendor_risk > 6 else ('Medium' if vendor_risk > 3 else 'Low'),
        'schedule_pressure': schedule_pressure,
        'cost_confidence': round(cost_metrics['r2'] * 100, 1),
        'delay_confidence': round(delay_metrics['r2'] * 100, 1),
    }


@app.route('/api/simulate', methods=['POST'])
def simulate():
    """
    Main simulation endpoint for PowerGrid project risk prediction with real-time weather integration.
    
    Expected input format:
    {
        "Voltage_Level_kV": 400,
        "Line_Length_km": 200,
        "Number_of_Bays": 5,
        "Terrain_Complexity_Index": "Medium (Plateau)",
        "Environmental_Impact_Severity": "Medium",
        "Forest_Land_Required_Ha": 50,
        "Num_Required_Permits": 8,
        "Average_Permit_Lag_Days": 90,
        "Right_of_Way_Delay_Severity": "Medium",
        "Regulatory_Hotspot_Region": "Northern Region",
        "Labour_Cost_Estimate_INR": 150000000,
        "Material_Cost_Estimate_INR": 450000000,
        "Num_Skilled_Workers_Required": 200,
        "Vendor_Performance_Rating": 7.5,
        "Num_Vendor_Change_Events": 1,
        "Material_Availability_Issue": 0,
        "Commodity_Price_Index_Start": 105,
        "Commodity_Price_Change_During_Project": 0.08,
        "Historical_Local_Delay_Index": 0.65,
        "Escalation_Reason_Material": 1,
        "Escalation_Reason_Regulatory": 1,
        "Escalation_Reason_Manpower": 0,
        "Qualitative_Risk_Score": 6,
        "Year": 2023,
        "Project_Type": "Transmission Line",
        "Target_Duration_Days": 365,
        "project_location": "Mumbai, Maharashtra"  // Optional: for real-time weather
    }
    
    Note: If Annual_Rainfall_mm and Num_Extreme_Weather_Days are not provided,
    they will be automatically estimated from real-time weather if project_location is given.
    """
    try:
        if not bundle:
            return jsonify({
                'success': False,
                'error': 'Model bundle not loaded'
            }), 500
        
        # Get input data
        raw_input = request.get_json(force=True)
        logger.info(f"Received simulation request with {len(raw_input)} parameters")
        
        # Check for weather integration
        location = raw_input.get('project_location', '').strip()
        weather_data = None
        weather_impact = None
        
        if location:
            logger.info(f"Fetching weather data for location: {location}")
            weather_data = fetch_weather_data(location)
            
            if weather_data.get('success'):
                logger.info(f"Weather data fetched successfully for {location}")
                project_duration = raw_input.get('Target_Duration_Days', 365)
                weather_impact = calculate_weather_impact(weather_data, project_duration)
                
                # Auto-populate weather fields if not provided
                if 'Annual_Rainfall_mm' not in raw_input or raw_input.get('Annual_Rainfall_mm') == 0:
                    raw_input['Annual_Rainfall_mm'] = weather_impact['annual_rainfall_estimate']
                    logger.info(f"Auto-populated Annual_Rainfall_mm: {weather_impact['annual_rainfall_estimate']}")
                
                if 'Num_Extreme_Weather_Days' not in raw_input or raw_input.get('Num_Extreme_Weather_Days') == 0:
                    raw_input['Num_Extreme_Weather_Days'] = weather_impact['extreme_weather_days_estimate']
                    logger.info(f"Auto-populated Num_Extreme_Weather_Days: {weather_impact['extreme_weather_days_estimate']}")
            else:
                logger.warning(f"Failed to fetch weather data: {weather_data.get('error')}")
                # Use defaults if weather fetch fails
                if 'Annual_Rainfall_mm' not in raw_input:
                    raw_input['Annual_Rainfall_mm'] = 1000.0
                if 'Num_Extreme_Weather_Days' not in raw_input:
                    raw_input['Num_Extreme_Weather_Days'] = 10
        else:
            # No location provided, use provided values or defaults
            if 'Annual_Rainfall_mm' not in raw_input:
                raw_input['Annual_Rainfall_mm'] = 1000.0
            if 'Num_Extreme_Weather_Days' not in raw_input:
                raw_input['Num_Extreme_Weather_Days'] = 10
        
        # Preprocess
        df_encoded = preprocess_input(raw_input)
        
        # Run predictions
        cost_overrun_pct = predict_cost_overrun(df_encoded)
        timeline_overrun_days = predict_timeline_overrun(df_encoded)
        
        # Classify risk
        risk_level = classify_risk(cost_overrun_pct, timeline_overrun_days)
        
        # Analyze hotspots
        hotspot_analysis = analyze_hotspots(raw_input)
        
        # Generate risk analysis
        risk_analysis = generate_risk_analysis(raw_input, cost_overrun_pct, timeline_overrun_days)
        
        # Calculate financial impact
        total_cost = raw_input.get('Labour_Cost_Estimate_INR', 0) + raw_input.get('Material_Cost_Estimate_INR', 0)
        cost_overrun_amount = total_cost * (cost_overrun_pct / 100)
        
        # Add weather-related cost impact if available
        weather_cost_addition = 0
        if weather_impact:
            weather_cost_addition = total_cost * (weather_impact['cost_impact_percent'] / 100)
            cost_overrun_amount += weather_cost_addition
            timeline_overrun_days += weather_impact['estimated_additional_delays']
        
        final_cost = total_cost + cost_overrun_amount
        
        # Build response
        response = {
            'success': True,
            'predictions': {
                'cost_overrun_percent': round(cost_overrun_pct, 2),
                'cost_overrun_amount_inr': round(cost_overrun_amount, 2),
                'estimated_base_cost_inr': round(total_cost, 2),
                'predicted_final_cost_inr': round(final_cost, 2),
                'timeline_overrun_days': round(timeline_overrun_days, 1),
                'risk_level': risk_level,
                'weather_adjusted': weather_impact is not None,
            },
            'risk_analysis': risk_analysis,
            'hotspot_analysis': hotspot_analysis,
            'model_info': {
                'cost_model_r2': round(cost_metrics['r2'], 3),
                'cost_model_mae': round(cost_metrics['mae'], 2),
                'delay_model_r2': round(delay_metrics['r2'], 3),
                'delay_model_mae': round(delay_metrics['mae'], 2),
            }
        }
        
        # Add weather analysis if available
        if weather_data and weather_data.get('success') and weather_impact:
            response['weather_analysis'] = {
                'location': weather_data['location'],
                'current_conditions': weather_data['conditions'],
                'impact': weather_impact,
                'timestamp': datetime.now().isoformat()
            }
        
        log_msg = f"Prediction: Cost={cost_overrun_pct:.1f}%, Delay={timeline_overrun_days:.0f}d, Risk={risk_level}"
        if weather_impact:
            log_msg += f", Weather Impact: +{weather_impact['estimated_additional_delays']}d, +{weather_impact['cost_impact_percent']}%"
        logger.info(log_msg)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': bundle is not None,
        'cost_model_features': len(feature_names_cost) if bundle else 0,
        'delay_model_features': len(feature_names_delay) if bundle else 0,
    })


@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model metadata and performance metrics."""
    if not bundle:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'cost_model': {
            'r2_score': cost_metrics['r2'],
            'mae': cost_metrics['mae'],
            'num_features': len(feature_names_cost),
            'risk_thresholds': risk_thresholds_cost,
        },
        'delay_model': {
            'r2_score': delay_metrics['r2'],
            'mae': delay_metrics['mae'],
            'num_features': len(feature_names_delay),
            'risk_thresholds': risk_thresholds_delay,
        },
        'top_cost_drivers': [
            {'feature': feat, 'importance': float(imp)}
            for feat, imp in hotspot_cost[:10]
        ],
        'top_delay_drivers': [
            {'feature': feat, 'importance': float(imp)}
            for feat, imp in hotspot_delay[:10]
        ],
    })


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5002)
