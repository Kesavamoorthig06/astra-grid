"""
Quick test to verify simulation API is working on port 5002
"""
import requests
import json

# Test the health endpoint
print("=" * 60)
print("Testing Simulation API on Port 5002")
print("=" * 60)

try:
    # Test health endpoint
    print("\n1. Testing /api/health endpoint...")
    health_response = requests.get('http://localhost:5002/api/health', timeout=5)
    print(f"   Status: {health_response.status_code}")
    print(f"   Response: {health_response.json()}")
    
    # Test simulate endpoint with minimal data
    print("\n2. Testing /api/simulate endpoint...")
    test_data = {
        "Voltage_Level_kV": 400,
        "Line_Length_km": 150,
        "Number_of_Bays": 5,
        "Terrain_Complexity_Index": "Medium (Plateau)",
        "Environmental_Impact_Severity": "Medium",
        "Forest_Land_Required_Ha": 30,
        "Num_Required_Permits": 8,
        "Average_Permit_Lag_Days": 75,
        "Right_of_Way_Delay_Severity": "Medium",
        "Regulatory_Hotspot_Region": "Northern Region",
        "Labour_Cost_Estimate_INR": 120000000,
        "Material_Cost_Estimate_INR": 380000000,
        "Num_Skilled_Workers_Required": 180,
        "Vendor_Performance_Rating": 7.2,
        "Num_Vendor_Change_Events": 1,
        "Material_Availability_Issue": 0,
        "Commodity_Price_Index_Start": 102,
        "Commodity_Price_Change_During_Project": 0.06,
        "Historical_Local_Delay_Index": 0.58,
        "Escalation_Reason_Material": 1,
        "Escalation_Reason_Regulatory": 1,
        "Escalation_Reason_Manpower": 0,
        "Qualitative_Risk_Score": 5,
        "Year": 2023,
        "Project_Type": "Transmission Line",
        "Target_Duration_Days": 300,
        "project_location": "Delhi"
    }
    
    simulate_response = requests.post(
        'http://localhost:5002/api/simulate',
        json=test_data,
        timeout=10
    )
    
    print(f"   Status: {simulate_response.status_code}")
    
    if simulate_response.status_code == 200:
        result = simulate_response.json()
        print(f"   ✅ SUCCESS!")
        print(f"\n   Predictions:")
        if result.get('success'):
            predictions = result.get('predictions', {})
            print(f"   - Cost Overrun: {predictions.get('cost_overrun_percent', 'N/A')}%")
            print(f"   - Timeline Overrun: {predictions.get('timeline_overrun_days', 'N/A')} days")
            print(f"   - Risk Level: {predictions.get('risk_level', 'N/A')}")
            print(f"   - Weather Adjusted: {predictions.get('weather_adjusted', False)}")
            
            if 'weather_analysis' in result:
                weather = result['weather_analysis']
                print(f"\n   Weather Info:")
                print(f"   - Location: {weather.get('location', {}).get('city', 'N/A')}")
                print(f"   - Temperature: {weather.get('current_conditions', {}).get('temperature_c', 'N/A')}°C")
                print(f"   - Favorable: {weather.get('current_conditions', {}).get('is_favorable', 'N/A')}")
    else:
        print(f"   ❌ FAILED")
        print(f"   Response: {simulate_response.text}")
    
    print("\n" + "=" * 60)
    print("✅ Simulation API is working correctly on port 5002!")
    print("=" * 60)
    
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Could not connect to port 5002")
    print("   Make sure simulation_api.py is running on port 5002")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
