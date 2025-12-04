"""
Test the simulation API with a sample request.
"""
import requests
import json

API_URL = 'http://127.0.0.1:5001/api/simulate'

# Sample test data
test_request = {
    "Voltage_Level_kV": 400,
    "Line_Length_km": 200.0,
    "Number_of_Bays": 5,
    "Terrain_Complexity_Index": "Medium (Plateau)",
    "Environmental_Impact_Severity": "Medium",
    "Forest_Land_Required_Ha": 50.0,
    "Num_Required_Permits": 8,
    "Average_Permit_Lag_Days": 90.0,
    "Right_of_Way_Delay_Severity": "Medium",
    "Regulatory_Hotspot_Region": "Northern Region",
    "Labour_Cost_Estimate_INR": 150000000.0,
    "Material_Cost_Estimate_INR": 450000000.0,
    "Num_Skilled_Workers_Required": 200,
    "Vendor_Performance_Rating": 7.5,
    "Num_Vendor_Change_Events": 1,
    "Material_Availability_Issue": 0,
    "Annual_Rainfall_mm": 1200.0,
    "Num_Extreme_Weather_Days": 20,
    "Commodity_Price_Index_Start": 105.0,
    "Commodity_Price_Change_During_Project": 0.08,
    "Historical_Local_Delay_Index": 0.65,
    "Escalation_Reason_Material": 1,
    "Escalation_Reason_Regulatory": 1,
    "Escalation_Reason_Manpower": 0,
    "Qualitative_Risk_Score": 6,
    "Year": 2023,
    "Project_Type": "Transmission Line",
    "Target_Duration_Days": 365,
    "project_location": "Mumbai, Maharashtra"
}

print("="*70)
print("TESTING SIMULATION API")
print("="*70)
print(f"\nSending request to: {API_URL}")
print(f"Project Type: {test_request['Project_Type']}")
print(f"Line Length: {test_request['Line_Length_km']} km")
print(f"Estimated Cost: ₹{(test_request['Labour_Cost_Estimate_INR'] + test_request['Material_Cost_Estimate_INR'])/10000000:.1f} Cr")

try:
    response = requests.post(API_URL, json=test_request, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        
        print("\n" + "="*70)
        print("✅ API RESPONSE SUCCESS")
        print("="*70)
        
        if result.get('success'):
            predictions = result['predictions']
            risk_analysis = result['risk_analysis']
            hotspots = result['hotspot_analysis']
            
            print("\n📊 PREDICTIONS:")
            print(f"  Cost Overrun: {predictions['cost_overrun_percent']}%")
            print(f"  Cost Overrun Amount: ₹{predictions['cost_overrun_amount_inr']/10000000:.2f} Cr")
            print(f"  Predicted Final Cost: ₹{predictions['predicted_final_cost_inr']/10000000:.2f} Cr")
            print(f"  Timeline Overrun: {predictions['timeline_overrun_days']} days")
            print(f"  Overall Risk Level: {predictions['risk_level']}")
            
            print("\n⚠️  RISK ANALYSIS:")
            print(f"  Qualitative Risk: {risk_analysis['qualitative_risk_score']} ({risk_analysis['qualitative_risk_level']})")
            print(f"  Vendor Risk: {risk_analysis['vendor_risk_score']} ({risk_analysis['vendor_risk_level']})")
            print(f"  Schedule Pressure: {risk_analysis['schedule_pressure']}")
            print(f"  Model Confidence: Cost={risk_analysis['cost_confidence']}%, Delay={risk_analysis['delay_confidence']}%")
            
            print("\n🔥 HOTSPOT ANALYSIS:")
            print(f"  Identified Hotspots: {hotspots['hotspot_count']}")
            for idx, hotspot in enumerate(hotspots['identified_hotspots'][:5], 1):
                print(f"  {idx}. [{hotspot['severity']}] {hotspot['factor']}: {hotspot['description']}")
            
            print("\n📈 TOP COST DRIVERS:")
            for idx, driver in enumerate(hotspots['top_cost_drivers'][:3], 1):
                print(f"  {idx}. {driver['feature']}: {driver['importance']}%")
            
            print("\n⏱️  TOP DELAY DRIVERS:")
            for idx, driver in enumerate(hotspots['top_delay_drivers'][:3], 1):
                print(f"  {idx}. {driver['feature']}: {driver['importance']}%")
            
            # Weather analysis if available
            if 'weather_analysis' in result:
                weather = result['weather_analysis']
                print("\n🌤️  WEATHER ANALYSIS:")
                print(f"  Location: {weather['location']['city']}, {weather['location']['state']}, {weather['location']['country']}")
                print(f"  Temperature: {weather['current_conditions']['temperature_c']}°C")
                print(f"  Precipitation: {weather['current_conditions']['precipitation_mm']}mm")
                print(f"  Wind Speed: {weather['current_conditions']['wind_speed_kmph']} km/h")
                print(f"  Conditions: {weather['current_conditions']['description']}")
                print(f"  Favorable: {'✓ Yes' if weather['current_conditions']['is_favorable'] else '✗ No'}")
                print(f"\n  Weather Risk Score: {weather['impact']['weather_risk_score']*100:.1f}%")
                print(f"  Additional Delays: +{weather['impact']['estimated_additional_delays']} days")
                print(f"  Cost Impact: +{weather['impact']['cost_impact_percent']}%")
                print(f"  Recommendation: {weather['impact']['recommendation']}")
            
            print("\n" + "="*70)
            print("Full Response (JSON):")
            print("="*70)
            print(json.dumps(result, indent=2))
        else:
            print(f"\n✗ API returned error: {result.get('error')}")
    else:
        print(f"\n✗ HTTP Error {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("\n✗ Connection failed. Is the API server running on http://127.0.0.1:5001?")
except Exception as e:
    print(f"\n✗ Request failed: {e}")
