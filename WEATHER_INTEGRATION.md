# Weather API Integration - Simulation System

## Overview
The simulation system now integrates real-time weather data to enhance project analysis with environmental factors.

## Weather Data Provider
- **API**: wttr.in (free, no API key required)
- **Endpoint**: `https://wttr.in/{location}?format=j1`
- **Data Format**: JSON

## Location Detection
The system extracts comprehensive location information:
- **City**: Extracted from nearest_area data
- **State/Region**: Geographical region information
- **Country**: Country name
- **Query**: User-provided location string

## Weather Metrics Collected
1. **Temperature** (°C): Current temperature
2. **Humidity** (%): Relative humidity percentage
3. **Precipitation** (mm): Current rainfall amount
4. **Wind Speed** (km/h): Current wind velocity
5. **Description**: Weather condition description
6. **Favorability**: Boolean indicator for construction-friendly conditions

## Weather Favorability Assessment
Weather is considered **favorable** for construction when:
- Temperature: 5°C to 45°C
- Precipitation: < 10mm
- Wind Speed: < 40 km/h
- No severe conditions (storms, heavy rain, blizzards, dense fog)

## Weather Impact Calculations

### Risk Score (0-0.7)
Calculated based on multiple factors:
- Precipitation levels (heavy rain = higher risk)
- Temperature extremes (too hot or too cold)
- Wind speed (high winds = higher risk)

### Estimated Additional Delays
- **Heavy precipitation (>10mm)**: +3 days
- **Moderate precipitation (5-10mm)**: +1 day
- **Extreme temperature (<5°C or >40°C)**: +1-2 days
- **High winds (>40 km/h)**: +1 day

### Cost Impact Percentage
- **High risk conditions**: +1.5% to 2%
- **Moderate risk**: +0.5% to 1%
- **Favorable conditions**: Minimal impact

## Implementation Details

### Backend Changes (`simulation_engine.py`)

#### New Functions Added:

1. **`_fetch_weather_data(location)`**
   - Calls wttr.in API with 5-second timeout
   - Parses JSON response for weather and location data
   - Returns structured dictionary with success flag
   - Includes fallback for API failures

2. **`_is_weather_favorable(temp, precip, wind, desc)`**
   - Boolean checker for construction safety
   - Validates temperature range, precipitation, wind speed
   - Checks for severe weather keywords

3. **`_estimate_weather_impact(weather_data, project_data)`**
   - Calculates weather risk score
   - Estimates additional delays based on conditions
   - Determines cost impact percentage
   - Generates warnings and recommendations

#### Integration into `run_simulation()`
```python
# Extract location from progress or project data
location = progress_data.get('project_location', '') or project_data.get('project_location', '')

# Fetch weather data if location provided
if location:
    weather_data = _fetch_weather_data(location)
    weather_impact = _estimate_weather_impact(weather_data, project_data)
    weather_delays += weather_impact.get('estimated_additional_delays', 0)
```

#### Results Structure
Added `weather_analysis` field to simulation results:
```python
'weather_analysis': {
    'location': {
        'city': str,
        'state': str,
        'country': str,
        'query': str
    },
    'current_conditions': {
        'temperature_c': float,
        'humidity_percent': int,
        'precipitation_mm': float,
        'wind_speed_kmph': int,
        'description': str,
        'is_favorable': bool
    },
    'impact': {
        'weather_risk_score': float,
        'estimated_additional_delays': int,
        'cost_impact_percent': float,
        'warnings': list[str],
        'recommendation': str
    }
}
```

### Frontend Changes

#### 1. SimulationProgressSection.jsx
- Added **Project Location** input field
- Icon: Cloud (lucide-react)
- Placeholder: "City, State (e.g., Mumbai, Maharashtra)"
- Help text: "Location for real-time weather analysis"

#### 2. SimulationPage.jsx
- Added `project_location` to progressData state initialization
- Location string sent to backend with simulation request

#### 3. SimulationResults.jsx
- Added **Weather** tab (5th tab after recommendations)
- Displays comprehensive weather information:

**Location Information Card:**
- City, State, Country in grid layout

**Current Weather Conditions Card:**
- Temperature (blue badge)
- Humidity (cyan badge)
- Precipitation (indigo badge)
- Wind Speed (purple badge)
- Favorability badge (green = favorable, amber = caution)
- Weather description

**Weather Impact Analysis Card:**
- Risk score (percentage display)
- Additional delays (days)
- Cost impact (percentage)
- Warnings list (with alert icons)
- Recommendation box (blue highlight)

## Usage Guide

### For Users
1. Navigate to Simulation page
2. Fill in project parameters
3. In "Current Progress Tracking" section, enter project location
   - Format: "City, State" or "City, Country"
   - Example: "Mumbai, Maharashtra" or "Delhi, India"
4. Complete other progress fields
5. Submit simulation
6. View weather analysis in **Weather** tab of results

### Location Format Best Practices
- Use common city/state names for best API results
- Examples:
  - "Mumbai, Maharashtra"
  - "Bangalore, Karnataka"
  - "Delhi, India"
  - "Pune"
- Avoid special characters or overly specific addresses

## Error Handling

### Graceful Degradation
- If location not provided: Weather analysis skipped, simulation continues
- If API fails: Default values used, warning logged, no delays added
- If location not found: API returns default data, minimal impact

### API Timeout
- 5-second timeout for weather API calls
- Prevents simulation from hanging on slow connections

## Benefits of Weather Integration

1. **Real-time Environmental Context**: Current weather conditions inform delay estimates
2. **Location-specific Analysis**: City/state/country data provides geographical context
3. **Risk Assessment**: Quantified weather risk score helps prioritize mitigation
4. **Cost Impact Visibility**: Weather-related cost increases clearly identified
5. **Actionable Recommendations**: Specific guidance based on current conditions
6. **Enhanced Accuracy**: Model predictions enhanced with real-time environmental factors

## Technical Dependencies

### Backend
- `requests` library (already installed: v2.32.5)
- `datetime` module (Python standard library)

### Frontend
- lucide-react icons (Cloud icon added)
- Existing UI components (Badge, Dialog, etc.)

## Future Enhancements (Optional)

1. **Weather Forecast Integration**: Use 7-day forecast for future delay predictions
2. **Historical Weather Correlation**: Compare historical weather with actual delays
3. **Location Auto-detection**: Use IP geolocation or browser API
4. **Weather Caching**: Cache weather data for 1-hour to reduce API calls
5. **Multiple Location Support**: Track weather at different project sites
6. **Severe Weather Alerts**: Push notifications for critical weather events
7. **Seasonal Analysis**: Historical seasonal patterns for long-term planning

## Notes

- Weather API (wttr.in) is free and doesn't require API key
- API has rate limits (check wttr.in documentation for details)
- Weather data refreshed on each simulation run
- Location string is case-insensitive
- System handles partial location strings (e.g., just city name)
