from datetime import date
from typing import Any, Dict

import os
import pandas as pd
import pickle

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

bundle_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
with open(bundle_path, 'rb') as bundle_file:
    bundle = pickle.load(bundle_file)

feature_names_cost = list(bundle['feature_names_cost'])
feature_names_delay = list(bundle['feature_names_delay'])
scaler_cols_cost = bundle['scaler_cols_cost']
scaler_cols_delay = bundle['scaler_cols_delay']
shift_delay = float(bundle.get('shift_delay', 0.0))
year_columns = [col for col in feature_names_cost if col.startswith('Year_')]

project_type_map = {
    'Transmission Line': 'Project_Type_Transmission Line',
    'Substation': 'Project_Type_Substation',
    'Distribution': 'Project_Type_Transmission System',
}

material_value_map = {'low': 0.0, 'medium': 1.0, 'high': 2.0}
material_risk_map = {'low': 0.2, 'medium': 0.6, 'high': 1.0}

terrain_buckets = [
    (2, 'Terrain_Complexity_Index_Low (Plain)', 0.2),
    (4, 'Terrain_Complexity_Index_Low (Urban)', 0.35),
    (6, 'Terrain_Complexity_Index_Medium (Plateau)', 0.55),
    (8, 'Terrain_Complexity_Index_Moderate (Hilly)', 0.75),
    (10, 'Terrain_Complexity_Index_Very High (Hilly)', 0.95),
]

environment_buckets = [
    (1, 'Environmental_Impact_Severity_Low', 0.2),
    (2, 'Environmental_Impact_Severity_Medium', 0.45),
    (3, 'Environmental_Impact_Severity_Moderate', 0.65),
    (5, 'Environmental_Impact_Severity_Very High', 0.9),
]

region_map = {
    'low': ('Regulatory_Hotspot_Region_Southern Region', 0.25),
    'medium': ('Regulatory_Hotspot_Region_Northern Region', 0.55),
    'high': ('Regulatory_Hotspot_Region_Eastern Region', 0.85),
}


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _choose_bucket(buckets, value):
    for threshold, column, score in buckets:
        if value <= threshold:
            return column, score
    return buckets[-1][1], buckets[-1][2]


def _choose_environment_bucket(value):
    for threshold, column, score in environment_buckets:
        if value <= threshold:
            return column, score
    return environment_buckets[-1][1], environment_buckets[-1][2]


def _financial_year_column():
    if not year_columns:
        return None
    today = date.today()
    year_start = today.year if today.month >= 4 else today.year - 1
    label = f"Year_{year_start}-{str(year_start + 1)[-2:]}"
    if label in year_columns:
        return label
    return year_columns[-1]


def _build_feature_row(form: Dict[str, Any]) -> Dict[str, float]:
    row = {name: 0.0 for name in feature_names_cost}

    row['Voltage_Level_kV'] = _to_float(form.get('voltage_level_kv'))
    row['Line_Length_km'] = _to_float(form.get('line_length_km'))
    row['Number_of_Bays'] = _to_float(form.get('number_of_bays'))
    row['Forest_Land_Required_Ha'] = _to_float(form.get('forest_land_required_ha'))
    row['Num_Required_Permits'] = _to_float(form.get('num_required_permits'))
    row['Average_Permit_Lag_Days'] = _to_float(form.get('average_permit_lag_days'))
    row['Labour_Cost_Estimate_INR'] = _to_float(form.get('labour_cost_estimate_inr'))
    row['Material_Cost_Estimate_INR'] = _to_float(form.get('material_cost_estimate_inr'))
    row['Num_Skilled_Workers_Required'] = _to_float(form.get('num_skilled_workers_required'))
    row['Vendor_Performance_Rating'] = _to_float(form.get('vendor_performance_rating'))

    rainfall = _to_float(form.get('annual_rainfall_mm'))
    row['Annual_Rainfall_mm'] = rainfall
    row['Num_Extreme_Weather_Days'] = max(0.0, rainfall / 50.0)

    material_key = str(form.get('material_availability_issue') or '').lower()
    material_index = material_value_map.get(material_key, 0.0)
    row['Material_Availability_Issue'] = material_index
    material_risk = material_risk_map.get(material_key, 0.0)

    terrain_index = _to_float(form.get('terrain_complexity_index'))
    terrain_column, terrain_score = _choose_bucket(terrain_buckets, terrain_index)
    if terrain_column in row:
        row[terrain_column] = 1.0

    environment_index = _to_float(form.get('environmental_impact_severity'))
    environment_column, environment_score = _choose_environment_bucket(environment_index)
    if environment_column in row:
        row[environment_column] = 1.0

    region_key = str(form.get('regulatory_hotspot_region') or '').lower()
    region_column, region_score = region_map.get(region_key, (None, 0.0))
    if region_column and region_column in row:
        row[region_column] = 1.0

    project_type = form.get('project_type')
    project_column = project_type_map.get(project_type)
    if project_column and project_column in row:
        row[project_column] = 1.0

    qualitative_risk = (terrain_score + environment_score + material_risk) / 3.0
    row['Qualitative_Risk_Score'] = qualitative_risk * 10.0

    target_cost_inr = _to_float(form.get('target_cost_inr'))
    line_length = row['Line_Length_km'] or 1.0
    row['Cost_Per_km_Cr'] = (target_cost_inr / 1e7) / line_length

    duration_days = _to_float(form.get('target_duration_days')) or 1.0
    row['Duration_Efficiency'] = line_length / duration_days

    labour_cost = row['Labour_Cost_Estimate_INR'] or 1.0
    material_cost = row['Material_Cost_Estimate_INR']
    row['Cost_Ratio_Material_to_Labour'] = material_cost / labour_cost

    permits = row['Num_Required_Permits'] or 0.0
    permit_lag = row['Average_Permit_Lag_Days'] or 1.0
    row['Permit_Efficiency'] = permits / permit_lag

    vendor_rating = row['Vendor_Performance_Rating']
    row['Vendor_Risk_Score'] = max(0.0, (5.0 - vendor_rating)) + material_risk

    row['Num_Vendor_Change_Events'] = 1.0 if row['Vendor_Risk_Score'] > 3.5 else 0.0
    row['Historical_Local_Delay_Index'] = region_score * 10.0
    row['Commodity_Price_Index_Start'] = 100.0
    row['Commodity_Price_Change_During_Project'] = 0.0

    row['Escalation_Reason_Material'] = 1.0 if material_cost > labour_cost else 0.0
    row['Escalation_Reason_Regulatory'] = 1.0 if region_score >= 0.55 else 0.0
    row['Escalation_Reason_Manpower'] = 1.0 if row['Num_Skilled_Workers_Required'] > 250 else 0.0

    row['Right_of_Way_Delay_Severity_Medium'] = 1.0

    year_column = _financial_year_column()
    if year_column and year_column in row:
        row[year_column] = 1.0

    return row


def _run_predictions(form: Dict[str, Any]) -> Dict[str, float]:
    feature_row = _build_feature_row(form)
    base_frame = pd.DataFrame([feature_row])

    cost_frame = base_frame.copy()
    cost_frame[scaler_cols_cost] = bundle['scaler_cost'].transform(cost_frame[scaler_cols_cost])
    cost_prediction = float(bundle['xgb_cost'].predict(cost_frame[feature_names_cost])[0])

    delay_frame = base_frame.copy()
    delay_frame[scaler_cols_delay] = bundle['scaler_delay'].transform(delay_frame[scaler_cols_delay])
    delay_prediction = float(bundle['xgb_delay'].predict(delay_frame[feature_names_delay])[0] + shift_delay)

    return {
        'cost_overrun_percent': cost_prediction,
        'schedule_delay_days': delay_prediction,
    }


@app.route('/predict', methods=['POST'])
def predict():
    try:
        payload = request.get_json(force=True) or {}
        form_payload = payload.get('form') or payload.get('features') or payload
        results = _run_predictions(form_payload)
        return jsonify({'success': True, 'data': results})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': bool(bundle),
        'feature_count': len(feature_names_cost),
    })


if __name__ == '__main__':
    app.run(debug=False, port=5000)
