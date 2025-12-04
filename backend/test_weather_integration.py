"""
Test weather integration with different locations
"""
import requests
import json

API_URL = 'http://127.0.0.1:5001/api/simulate'

# Base project data
base_data = {
    "Voltage_Level_kV": 765,
    "Line_Length_km": 450.0,
    "Number_of_Bays": 8,
    "Terrain_Complexity_Index": "Very High (Hilly)",
    "Environmental_Impact_Severity": "High",
    "Forest_Land_Required_Ha": 80.0,
    "Num_Required_Permits": 12,
    "Average_Permit_Lag_Days": 180.0,
    "Right_of_Way_Delay_Severity": "High",
    "Regulatory_Hotspot_Region": "Eastern Region",
    "Labour_Cost_Estimate_INR": 200000000.0,
    "Material_Cost_Estimate_INR": 600000000.0,
    "Num_Skilled_Workers_Required": 250,
    "Vendor_Performance_Rating": 6.0,
    "Num_Vendor_Change_Events": 2,
    "Material_Availability_Issue": 1,
    "Commodity_Price_Index_Start": 110.0,
    "Commodity_Price_Change_During_Project": 0.12,
    "Historical_Local_Delay_Index": 0.85,
    "Escalation_Reason_Material": 1,
    "Escalation_Reason_Regulatory": 1,
    "Escalation_Reason_Manpower": 1,
    "Qualitative_Risk_Score": 8,
    "Year": 2024,
    "Project_Type": "HVDC Transmission Line",
    "Target_Duration_Days": 730
}

# Test different locations
test_locations = [
    "Cherrapunji, Meghalaya",  # High rainfall area
    "Delhi, India",            # Moderate climate
    "Leh, Ladakh",            # Cold region
]

print("="*80)
print("WEATHER-INTEGRATED SIMULATION TESTING")
print("="*80)

for location in test_locations:
    print(f"\n{'='*80}")
    print(f"Testing Location: {location}")
    print(f"{'='*80}")
    
    test_data = base_data.copy()
    test_data['project_location'] = location
    
    try:
        response = requests.post(API_URL, json=test_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                predictions = result['predictions']
                weather = result.get('weather_analysis')
                
                print(f"\n📍 Location: {location}")
                
                if weather:
                    conditions = weather['current_conditions']
                    impact = weather['impact']
                    
                    print(f"\n🌡️  Current Weather:")
                    print(f"   Temperature: {conditions['temperature_c']}°C")
                    print(f"   Precipitation: {conditions['precipitation_mm']}mm")
                    print(f"   Wind: {conditions['wind_speed_kmph']} km/h")
                    print(f"   Conditions: {conditions['description']}")
                    print(f"   Favorable: {'✓ Yes' if conditions['is_favorable'] else '✗ No'}")
                    
                    print(f"\n⚡ Weather Impact:")
                    print(f"   Risk Score: {impact['weather_risk_score']*100:.1f}%")
                    print(f"   Additional Delays: +{impact['estimated_additional_delays']} days")
                    print(f"   Cost Impact: +{impact['cost_impact_percent']}%")
                    print(f"   Annual Rainfall Est: {impact['annual_rainfall_estimate']:.0f}mm")
                    print(f"   Extreme Weather Days: {impact['extreme_weather_days_estimate']}")
                    
                    if impact['warnings']:
                        print(f"\n⚠️  Warnings:")
                        for warning in impact['warnings']:
                            print(f"   • {warning}")
                    
                    print(f"\n💡 Recommendation:")
                    print(f"   {impact['recommendation']}")
                
                print(f"\n📊 Final Predictions (Weather-Adjusted):")
                print(f"   Cost Overrun: {predictions['cost_overrun_percent']}%")
                print(f"   Timeline Overrun: {predictions['timeline_overrun_days']} days")
                print(f"   Risk Level: {predictions['risk_level']}")
                print(f"   Weather Adjusted: {'✓ Yes' if predictions['weather_adjusted'] else '✗ No'}")
                
        else:
            print(f"✗ HTTP Error {response.status_code}")
    
    except Exception as e:
        print(f"✗ Request failed: {e}")

print(f"\n{'='*80}")
print("WEATHER TESTING COMPLETE")
print(f"{'='*80}")
