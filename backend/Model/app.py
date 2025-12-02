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


def _generate_recommendations(form: Dict[str, Any], feature_row: Dict[str, float], 
                               cost_overrun: float, delay_days: float, 
                               hotspot_factors: list) -> list:
    """Generate actionable recommendations based on risk analysis."""
    recommendations = []
    
    terrain_index = _to_float(form.get('terrain_complexity_index'))
    environment_index = _to_float(form.get('environmental_impact_severity'))
    vendor_rating = _to_float(form.get('vendor_performance_rating'))
    forest_land = _to_float(form.get('forest_land_required_ha'))
    material_issue = str(form.get('material_availability_issue') or '').lower()
    region_key = str(form.get('regulatory_hotspot_region') or '').lower()
    permit_lag = _to_float(form.get('average_permit_lag_days'))
    num_permits = _to_float(form.get('num_required_permits'))
    rainfall = _to_float(form.get('annual_rainfall_mm'))
    skilled_workers = _to_float(form.get('num_skilled_workers_required'))
    
    # High terrain complexity
    if terrain_index >= 7:
        recommendations.append({
            'id': 'terrain',
            'title': 'Terrain Risk Mitigation',
            'priority': 'High',
            'category': 'Engineering',
            'summary': 'High terrain complexity detected. Special construction measures required.',
            'details': [
                'Conduct detailed geotechnical survey before construction begins',
                'Deploy specialized equipment for hilly/mountainous terrain',
                'Consider helicopter-based tower erection for inaccessible areas',
                'Plan for additional access road construction costs',
                'Engage contractors with proven experience in difficult terrain',
            ],
            'impact': 'Can reduce terrain-related delays by 25-40%',
        })
    
    # Environmental concerns
    if environment_index >= 3:
        recommendations.append({
            'id': 'environment',
            'title': 'Environmental Compliance Strategy',
            'priority': 'High',
            'category': 'Regulatory',
            'summary': 'Significant environmental impact expected. Proactive clearance needed.',
            'details': [
                'Initiate Environmental Impact Assessment (EIA) immediately',
                'Engage with State Pollution Control Board early in the process',
                'Plan wildlife corridor crossings if passing through protected areas',
                'Budget for compensatory afforestation requirements',
                'Consider underground cabling in ecologically sensitive zones',
            ],
            'impact': 'Prevents 60-90 days of potential regulatory delays',
        })
    
    # Forest land clearance
    if forest_land > 10:
        recommendations.append({
            'id': 'forest',
            'title': 'Forest Clearance Acceleration',
            'priority': 'High',
            'category': 'Regulatory',
            'summary': f'{forest_land} hectares of forest land requires Stage-I and Stage-II clearances.',
            'details': [
                'Submit Stage-I forest clearance application to Regional Office',
                'Prepare Net Present Value (NPV) payment documentation',
                'Identify Compensatory Afforestation (CA) land in advance',
                'Coordinate with State Forest Department for site inspection',
                'Track application status through PARIVESH portal regularly',
                'Consider phased construction to begin on non-forest portions',
            ],
            'impact': 'Forest clearance typically takes 6-18 months; early initiation is critical',
        })
    
    # Vendor reliability issues
    if vendor_rating < 3 or 'Vendor Reliability' in hotspot_factors:
        recommendations.append({
            'id': 'vendor',
            'title': 'Vendor Risk Management',
            'priority': 'High',
            'category': 'Supply Chain',
            'summary': 'Vendor performance rating indicates reliability concerns.',
            'details': [
                'Identify and pre-qualify 2-3 backup vendors immediately',
                'Include strict penalty clauses in contracts for delays',
                'Require performance bank guarantees (10-15% of contract value)',
                'Implement milestone-based payment schedules',
                'Set up weekly vendor performance review meetings',
                'Consider splitting large orders across multiple vendors',
            ],
            'impact': 'Reduces vendor-related delays by 30-50%',
        })
    
    # Material availability
    if material_issue in ['medium', 'high']:
        recommendations.append({
            'id': 'material',
            'title': 'Material Procurement Strategy',
            'priority': 'High' if material_issue == 'high' else 'Medium',
            'category': 'Supply Chain',
            'summary': 'Material availability constraints identified in the region.',
            'details': [
                'Pre-order critical materials (conductors, insulators, towers) immediately',
                'Establish strategic inventory buffer at site (15-20% extra)',
                'Identify alternate suppliers and materials meeting specifications',
                'Lock in prices through advance purchase agreements',
                'Set up dedicated material tracking and expediting team',
                'Consider importing materials if domestic supply is constrained',
            ],
            'impact': 'Prevents 20-45 days of material-related work stoppages',
        })
    
    # Regulatory hotspot region
    if region_key == 'high':
        recommendations.append({
            'id': 'regulatory',
            'title': 'Regulatory Navigation Plan',
            'priority': 'High',
            'category': 'Regulatory',
            'summary': 'Eastern Region identified as regulatory hotspot with historical delays.',
            'details': [
                'Engage experienced local liaison officers familiar with state procedures',
                'Schedule pre-application meetings with all relevant departments',
                'Prepare comprehensive documentation to minimize queries',
                'Build relationships with District Collector and SDM offices',
                'Monitor Right of Way (RoW) acquisition progress weekly',
                'Keep contingency budget for unexpected statutory requirements',
            ],
            'impact': 'Can reduce regulatory processing time by 30-40%',
        })
    elif region_key == 'medium':
        recommendations.append({
            'id': 'regulatory',
            'title': 'Permit Management Optimization',
            'priority': 'Medium',
            'category': 'Regulatory',
            'summary': 'Northern Region has moderate regulatory complexity.',
            'details': [
                'Create master permit tracker with all required clearances',
                'Assign dedicated resource for permit follow-ups',
                'Digitize all documentation for faster submissions',
                'Establish single-window coordination with state agencies',
            ],
            'impact': 'Streamlines approval process by 15-25%',
        })
    
    # High permit lag
    if permit_lag > 60:
        recommendations.append({
            'id': 'permits',
            'title': 'Permit Delay Mitigation',
            'priority': 'Medium',
            'category': 'Regulatory',
            'summary': f'Average permit lag of {int(permit_lag)} days exceeds optimal threshold.',
            'details': [
                'Apply for all permits simultaneously rather than sequentially',
                'Use online portals (PARIVESH, state single-window) for faster processing',
                'Prepare responses to common queries in advance',
                'Escalate pending applications through appropriate channels',
                'Consider engaging professional permit consultants',
            ],
            'impact': 'Can reduce overall permit timeline by 20-30%',
        })
    
    # Weather risk
    if rainfall > 1500:
        recommendations.append({
            'id': 'weather',
            'title': 'Monsoon Planning',
            'priority': 'Medium',
            'category': 'Operations',
            'summary': 'High rainfall area requires weather-adjusted scheduling.',
            'details': [
                'Plan foundation and civil works before monsoon season (Oct-May)',
                'Schedule stringing activities for dry season only',
                'Procure weather-resistant storage for materials on site',
                'Include monsoon buffer of 60-90 days in project schedule',
                'Install proper drainage at tower locations and substations',
            ],
            'impact': 'Prevents 30-60 days of weather-related work stoppages',
        })
    
    # Manpower constraints
    if skilled_workers > 250 or 'Manpower Shortage' in hotspot_factors:
        recommendations.append({
            'id': 'manpower',
            'title': 'Skilled Workforce Strategy',
            'priority': 'Medium',
            'category': 'Resources',
            'summary': 'Large skilled workforce requirement may face availability challenges.',
            'details': [
                'Partner with ITIs and technical institutes for workforce pipeline',
                'Arrange on-site accommodation for workers from other regions',
                'Implement multi-skilling programs to improve workforce flexibility',
                'Offer competitive wages and retention bonuses',
                'Plan workforce mobilization 2-3 months before construction start',
            ],
            'impact': 'Ensures workforce availability and reduces turnover by 25%',
        })
    
    # Cost overrun specific
    if cost_overrun > 15:
        recommendations.append({
            'id': 'cost',
            'title': 'Cost Control Measures',
            'priority': 'High',
            'category': 'Financial',
            'summary': f'Predicted cost overrun of {cost_overrun:.1f}% requires aggressive management.',
            'details': [
                'Implement Earned Value Management (EVM) for real-time cost tracking',
                'Set up monthly cost review meetings with all stakeholders',
                'Identify value engineering opportunities without compromising quality',
                'Negotiate fixed-price contracts where possible',
                'Build contingency reserve of 10-15% in project budget',
                'Review and optimize Bill of Quantities (BoQ) before tendering',
            ],
            'impact': 'Structured cost management can reduce overruns by 30-40%',
        })
    
    # Schedule delay specific
    if delay_days > 90:
        recommendations.append({
            'id': 'schedule',
            'title': 'Schedule Recovery Plan',
            'priority': 'High',
            'category': 'Operations',
            'summary': f'Predicted delay of {delay_days:.0f} days requires schedule compression.',
            'details': [
                'Identify critical path activities and fast-track them',
                'Deploy additional crews for parallel workfronts',
                'Consider overtime and extended shifts during favorable weather',
                'Pre-fabricate tower components off-site to reduce erection time',
                'Use advanced stringing techniques (helicopter, drone-assisted)',
                'Implement daily progress tracking with deviation alerts',
            ],
            'impact': 'Can compress schedule by 15-25% with proper execution',
        })
    
    # Always add general best practices if less than 3 recommendations
    if len(recommendations) < 3:
        recommendations.append({
            'id': 'general',
            'title': 'Project Excellence Practices',
            'priority': 'Low',
            'category': 'Best Practices',
            'summary': 'Standard recommendations for project success.',
            'details': [
                'Establish clear communication channels with all stakeholders',
                'Conduct weekly progress review meetings',
                'Maintain comprehensive project documentation',
                'Implement safety management system from day one',
                'Use project management software for tracking and reporting',
            ],
            'impact': 'Foundation for successful project delivery',
        })
    
    # Sort by priority
    priority_order = {'High': 0, 'Medium': 1, 'Low': 2}
    recommendations.sort(key=lambda x: priority_order.get(x['priority'], 2))
    
    return recommendations


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


def _run_predictions(form: Dict[str, Any]) -> Dict[str, Any]:
    feature_row = _build_feature_row(form)
    base_frame = pd.DataFrame([feature_row])

    cost_frame = base_frame.copy()
    cost_frame[scaler_cols_cost] = bundle['scaler_cost'].transform(cost_frame[scaler_cols_cost])
    cost_prediction = float(bundle['xgb_cost'].predict(cost_frame[feature_names_cost])[0])

    delay_frame = base_frame.copy()
    delay_frame[scaler_cols_delay] = bundle['scaler_delay'].transform(delay_frame[scaler_cols_delay])
    delay_prediction = float(bundle['xgb_delay'].predict(delay_frame[feature_names_delay])[0] + shift_delay)

    # Extract risk analysis metrics
    qualitative_risk = feature_row.get('Qualitative_Risk_Score', 0.0)
    vendor_risk = feature_row.get('Vendor_Risk_Score', 0.0)
    historical_delay_index = feature_row.get('Historical_Local_Delay_Index', 0.0)

    # Determine risk level labels
    def risk_level(score, thresholds=(3, 6)):
        if score <= thresholds[0]:
            return 'Low'
        elif score <= thresholds[1]:
            return 'Medium'
        return 'High'

    # Identify hotspot factors
    hotspot_factors = []
    if feature_row.get('Escalation_Reason_Material', 0) == 1.0:
        hotspot_factors.append('Material Cost')
    if feature_row.get('Escalation_Reason_Regulatory', 0) == 1.0:
        hotspot_factors.append('Regulatory Delays')
    if feature_row.get('Escalation_Reason_Manpower', 0) == 1.0:
        hotspot_factors.append('Manpower Shortage')
    if vendor_risk > 3.5:
        hotspot_factors.append('Vendor Reliability')
    if feature_row.get('Num_Extreme_Weather_Days', 0) > 15:
        hotspot_factors.append('Weather Risk')

    # Determine regulatory hotspot region
    region_key = str(form.get('regulatory_hotspot_region') or '').lower()
    region_labels = {'low': 'Southern Region', 'medium': 'Northern Region', 'high': 'Eastern Region'}
    hotspot_region = region_labels.get(region_key, 'Unknown')

    # Generate recommendations based on risk factors
    recommendations = _generate_recommendations(form, feature_row, cost_prediction, delay_prediction, hotspot_factors)

    return {
        'cost_overrun_percent': cost_prediction,
        'schedule_delay_days': delay_prediction,
        'risk_analysis': {
            'qualitative_risk_score': round(qualitative_risk, 2),
            'qualitative_risk_level': risk_level(qualitative_risk),
            'vendor_risk_score': round(vendor_risk, 2),
            'vendor_risk_level': risk_level(vendor_risk, (2, 4)),
            'historical_delay_index': round(historical_delay_index, 2),
        },
        'hotspot_analysis': {
            'region': hotspot_region,
            'risk_factors': hotspot_factors if hotspot_factors else ['None Identified'],
            'escalation_likelihood': 'High' if len(hotspot_factors) >= 3 else ('Medium' if len(hotspot_factors) >= 1 else 'Low'),
        },
        'recommendations': recommendations,
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
