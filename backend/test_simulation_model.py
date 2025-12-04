"""
Test script to verify the simulation model bundle loads and produces predictions.
"""
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

# Load the model bundle
bundle_path = Path(__file__).parent / 'ml_model_extracted' / 'models' / 'powergrid_simulation_bundle.joblib'
print(f"Loading bundle from: {bundle_path}")

try:
    bundle = joblib.load(bundle_path)
    print("✓ Bundle loaded successfully")
    print(f"\nBundle contents:")
    for key in bundle.keys():
        print(f"  - {key}")
except Exception as e:
    print(f"✗ Failed to load bundle: {e}")
    exit(1)

# Extract components
xgb_cost = bundle['xgb_cost']
xgb_delay = bundle['xgb_delay']
scaler_cost = bundle['scaler_cost']
scaler_delay = bundle['scaler_delay']
feature_names_cost = bundle['feature_names_cost']
feature_names_delay = bundle['feature_names_delay']
scaler_cols_cost = bundle['scaler_cols_cost']
scaler_cols_delay = bundle['scaler_cols_delay']

print(f"\n✓ Models extracted")
print(f"  Cost model features: {len(feature_names_cost)}")
print(f"  Delay model features: {len(feature_names_delay)}")
print(f"  Cost scaler columns: {len(scaler_cols_cost)}")
print(f"  Delay scaler columns: {len(scaler_cols_delay)}")

# Create test input matching the expected feature structure
test_input = {
    'Voltage_Level_kV': 400,
    'Line_Length_km': 200.0,
    'Number_of_Bays': 5,
    'Terrain_Complexity_Index': 'Medium (Plateau)',
    'Environmental_Impact_Severity': 'Medium',
    'Forest_Land_Required_Ha': 50.0,
    'Num_Required_Permits': 8,
    'Average_Permit_Lag_Days': 90.0,
    'Right_of_Way_Delay_Severity': 'Medium',
    'Regulatory_Hotspot_Region': 'Northern Region',
    'Labour_Cost_Estimate_INR': 150000000.0,
    'Material_Cost_Estimate_INR': 450000000.0,
    'Num_Skilled_Workers_Required': 200,
    'Vendor_Performance_Rating': 7.5,
    'Num_Vendor_Change_Events': 1,
    'Material_Availability_Issue': 0,
    'Annual_Rainfall_mm': 1200.0,
    'Num_Extreme_Weather_Days': 20,
    'Commodity_Price_Index_Start': 105.0,
    'Commodity_Price_Change_During_Project': 0.08,
    'Historical_Local_Delay_Index': 0.65,
    'Escalation_Reason_Material': 1,
    'Escalation_Reason_Regulatory': 1,
    'Escalation_Reason_Manpower': 0,
    'Qualitative_Risk_Score': 6,
    'Year': 2023,
    'Project_Type': 'Transmission Line',
}

print("\n" + "="*70)
print("TESTING PREDICTION PIPELINE")
print("="*70)

# Convert to DataFrame
test_df = pd.DataFrame([test_input])
print(f"\n✓ Created test DataFrame with {len(test_df.columns)} columns")

# Feature engineering (same as training)
test_df['Cost_Ratio_Material_to_Labour'] = test_df['Material_Cost_Estimate_INR'] / (test_df['Labour_Cost_Estimate_INR'] + 1e-6)
test_df['Permit_Efficiency'] = test_df['Average_Permit_Lag_Days'] / (test_df['Num_Required_Permits'] + 1e-6)
test_df['Vendor_Risk_Score'] = test_df['Num_Vendor_Change_Events'] * (10 - test_df['Vendor_Performance_Rating'])

print(f"✓ Applied feature engineering")

# One-hot encoding
categorical_cols = test_df.select_dtypes(include=['object', 'category']).columns.tolist()
test_encoded = pd.get_dummies(test_df, columns=categorical_cols, drop_first=True)
print(f"✓ Applied one-hot encoding: {len(test_encoded.columns)} features")

# Align with cost model features
test_cost = test_encoded.reindex(columns=feature_names_cost, fill_value=0)
print(f"✓ Aligned to cost model features: {len(test_cost.columns)}")

# Scale numerical features for cost
test_cost_numerical = test_cost[scaler_cols_cost].copy()
test_cost_numerical_scaled = scaler_cost.transform(test_cost_numerical)
test_cost[scaler_cols_cost] = test_cost_numerical_scaled
print(f"✓ Scaled {len(scaler_cols_cost)} numerical features for cost model")

# Predict cost overrun
cost_prediction = xgb_cost.predict(test_cost)[0]
print(f"\n🎯 Cost Overrun Prediction: {cost_prediction:.2f}%")

# Align with delay model features
test_delay = test_encoded.reindex(columns=feature_names_delay, fill_value=0)

# Scale numerical features for delay
test_delay_numerical = test_delay[scaler_cols_delay].copy()
test_delay_numerical_scaled = scaler_delay.transform(test_delay_numerical)
test_delay[scaler_cols_delay] = test_delay_numerical_scaled
print(f"✓ Scaled {len(scaler_cols_delay)} numerical features for delay model")

# Predict timeline overrun
delay_prediction = xgb_delay.predict(test_delay)[0]
print(f"🎯 Timeline Overrun Prediction: {delay_prediction:.1f} days")

# Risk classification
def classify_risk(cost_pct, delay_days):
    if cost_pct < 10 and delay_days < 30:
        return 'LOW'
    if cost_pct < 25 and delay_days < 90:
        return 'MEDIUM'
    if cost_pct < 50 and delay_days < 180:
        return 'HIGH'
    return 'CRITICAL'

risk_level = classify_risk(cost_prediction, delay_prediction)
print(f"⚠️  Overall Risk Level: {risk_level}")

print("\n" + "="*70)
print("✅ SIMULATION MODEL TEST PASSED")
print("="*70)
print("\nThe model is ready for API integration!")
