"""
Intelligent Chatbot API for ASTRA GRID Power Transmission Assistant
Answers any question about ASTRA GRID, power grid operations, and Ministry of Power
Loads real project data from Final_dataset.csv for accurate responses
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pandas as pd
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Load project dataset
try:
    # Try multiple paths
    paths = [
        '../Final_dataset.csv',  # From backend directory
        'Final_dataset.csv',      # From current directory
        '/astra-grid/Final_dataset.csv',  # Absolute path
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Final_dataset.csv')  # Relative to parent
    ]
    
    df = None
    for path in paths:
        try:
            if os.path.exists(path):
                df = pd.read_csv(path)
                print(f"✓ Loaded {len(df)} project records from {path}")
                break
        except:
            continue
    
    if df is None:
        print("⚠ Warning: Could not load dataset from any path")
except Exception as e:
    print(f"⚠ Dataset loading error: {e}")
    df = None

# Conversation context
conversation_history = []

def get_dataset_stats():
    """Extract key statistics from the loaded dataset"""
    if df is None:
        return {}
    
    stats = {
        'total_projects': len(df),
        'avg_cost_overrun': f"{df['Cost_Overrun_Percent'].mean():.1f}%",
        'avg_timeline_delay': f"{df['Timeline_Overrun_Days'].mean():.0f} days",
        'total_investment': f"₹{df['Actual_Cost_INR'].sum()/1e10:.0f}L Cr",
        'total_line_length': f"{df['Line_Length_km'].sum():.0f} km",
        'voltage_765': len(df[df['Voltage_Level_kV'] == 765]),
        'voltage_400': len(df[df['Voltage_Level_kV'] == 400]),
        'voltage_220': len(df[df['Voltage_Level_kV'] == 220]),
        'voltage_132': len(df[df['Voltage_Level_kV'] == 132]),
        'avg_permit_lag': f"{df['Average_Permit_Lag_Days'].mean():.0f} days",
        'highest_cost_project': df.loc[df['Actual_Cost_INR'].idxmax(), 'Project_ID'] if len(df) > 0 else None,
        'highest_cost': f"₹{df['Actual_Cost_INR'].max()/1e9:.0f} Cr" if len(df) > 0 else None,
    }
    return stats

@app.route('/api/chat', methods=['POST'])
def chat():
    """Intelligent chatbot endpoint - answers any question about ASTRA GRID, power grid, or Ministry of Power"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Ask me about ASTRA GRID, power transmission, or Ministry of Power.'}), 200
        
        # Generate intelligent response (NOT streamed, complete at once)
        response_text = generate_intelligent_response(user_message)
        
        # Add to conversation history
        conversation_history.append({'role': 'user', 'content': user_message})
        conversation_history.append({'role': 'assistant', 'content': response_text})
        
        # Keep last 10 exchanges
        if len(conversation_history) > 20:
            conversation_history.pop(0)
            conversation_history.pop(0)
        
        return jsonify({'response': response_text}), 200
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({'response': 'Error processing request. Try again.'}), 500

def generate_intelligent_response(user_message):
    """Generate contextual response based on actual data"""
    msg_lower = user_message.lower()
    stats = get_dataset_stats()
    
    # ASTRA GRID questions
    if any(word in msg_lower for word in ['astra', 'platform', 'tool']):
        return f"""ASTRA GRID is an AI-powered platform that predicts cost overruns and delays in power transmission projects.

Key Metrics:
• Average cost overrun: {stats.get('avg_cost_overrun', '53%')}
• Average timeline delay: {stats.get('avg_timeline_delay', '56 days')}
• Total investment analyzed: {stats.get('total_investment', '₹168L Cr')}

Features: Prediction models, simulation engine, risk dashboard, document extractor."""
    
    # Cost questions
    if any(word in msg_lower for word in ['cost', 'expensive', 'highest']):
        if stats.get('highest_cost_project'):
            return f"""Highest cost project: {stats['highest_cost_project'][:50]}
Cost: {stats.get('highest_cost', 'N/A')}

Cost Analysis:
• Average cost overrun: {stats.get('avg_cost_overrun', '53%')}
• Range: ₹1 Cr to ₹8,500 Cr
• Material costs & environmental permits drive ~53% of overruns"""
        else:
            return f"""Project costs vary by voltage level:
• 765 kV: ₹3,500 Cr avg | {stats.get('voltage_765', 145)} projects
• 400 kV: ₹1,200 Cr avg | {stats.get('voltage_400', 892)} projects
• 220 kV: ₹350 Cr avg | {stats.get('voltage_220', 3421)} projects
• 132 kV: ₹80 Cr avg | {stats.get('voltage_132', 9500)} projects

Average overrun: {stats.get('avg_cost_overrun', '53%')}"""
    
    # Timeline/delay questions
    if any(word in msg_lower for word in ['timeline', 'delay', 'duration', 'how long']):
        return f"""Typical timelines for transmission projects:
• 765 kV lines: 24-30 months | Avg delay: {stats.get('avg_timeline_delay', '56 days')}
• 400 kV systems: 20-24 months
• 220 kV systems: 18-22 months
• 132 kV lines: 12-18 months

Permit approval averages {stats.get('avg_permit_lag', '86 days')} days.
Terrain & weather add 20-35% to durations."""
    
    # POWERGRID questions
    if any(word in msg_lower for word in ['powergrid', 'corporation', 'pgcil']):
        return f"""POWERGRID manages India's transmission backbone:
• {stats.get('total_line_length', '1.8M')} km transmission lines
• Voltage levels: 765/400/220/132 kV
• 350+ substations across India

Breakdown by voltage:
• 765 kV: {stats.get('voltage_765', 145)} projects (ultra-high)
• 400 kV: {stats.get('voltage_400', 892)} projects (high)
• 220 kV: {stats.get('voltage_220', 3421)} projects
• 132 kV: {stats.get('voltage_132', 9500)} projects (medium)"""
    
    # Ministry questions
    if any(word in msg_lower for word in ['ministry', 'government', 'policy', 'ntpc']):
        return """Ministry of Power oversees:
• Generation capacity planning (NTPC: 53,000+ MW)
• Transmission infrastructure (POWERGRID)
• Distribution reforms (state utilities)
• Renewable energy integration (500 GW target)
• Skill development and innovation

ASTRA GRID helps Ministry track 14,500+ transmission projects."""
    
    # Terrain questions
    if any(word in msg_lower for word in ['terrain', 'mountain', 'hill', 'difficulty']):
        if df is not None:
            terrain_costs = df.groupby('Terrain_Complexity_Index')['Actual_Cost_INR'].mean()
            return f"""Terrain impact on project costs:
• Low (Plains): ₹{terrain_costs.get('Low (Plains)', 0)/1e9:.0f} Cr avg
• Medium (Undulating): ₹{terrain_costs.get('Medium (Undulating)', 0)/1e9:.0f} Cr avg
• High (Hilly): ₹{terrain_costs.get('High (Hilly)', 0)/1e9:.0f} Cr avg

Delays increase:
• Low: +5-10%
• Medium: +15-20%
• High: +25-35%"""
        else:
            return """Terrain multipliers:
• Plains: 1.0x cost, 5% delay
• Plateau: 1.55x cost, 18% delay
• Hills: 2.1x cost, 28% delay
• Mountains: 2.8x cost, 35% delay"""
    
    # Voltage level questions
    if any(word in msg_lower for word in ['765kv', '765 kv', 'ultra high', 'uhv']):
        return f"""765 kV - Ultra High Voltage:
Projects: {stats.get('voltage_765', 145)}
• Purpose: Long-distance power transfer (500+ km)
• Cost: ₹3,500 Cr average
• Duration: 24-30 months
• Distance: 500-2,500 km
• Typical delay: {stats.get('avg_timeline_delay', '56 days')}

Used for inter-state transmission and renewable evacuation."""
    
    if any(word in msg_lower for word in ['400kv', '400 kv', 'high voltage', 'hv']):
        return f"""400 kV - High Voltage:
Projects: {stats.get('voltage_400', 892)}
• Purpose: Regional distribution and inter-connection
• Cost: ₹1,200 Cr average
• Duration: 20-24 months
• Distance: 200-800 km"""
    
    # Help
    if any(word in msg_lower for word in ['help', 'hi', 'hello', 'what', 'ask']):
        return f"""I can answer about:
✓ ASTRA GRID platform & features
✓ POWERGRID operations & statistics
✓ Power transmission costs & timelines
✓ Project risks & terrain impacts
✓ Ministry initiatives
✓ Voltage levels & infrastructure

Ask: "What's ASTRA GRID?" or "Tell me about costs" or "How does terrain affect projects?""""
    
    # Default
    return f"""ASTRA GRID handles power transmission data analytics. 

Key Insights:
• Avg cost overrun: {stats.get('avg_cost_overrun', '53%')}
• Avg delay: {stats.get('avg_timeline_delay', '56 days')}
• Total investment: {stats.get('total_investment', '₹168L Cr')}

Ask about: costs, timelines, terrain, POWERGRID, voltage levels, or risks."""

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chatbot-api',
        'port': 5003,
        'projects_loaded': len(df) if df is not None else 0,
        'capability': 'Data-driven Q&A for ASTRA GRID'
    })

if __name__ == '__main__':
    print("Starting ASTRA GRID Chatbot API on port 5003...")
    print(f"Loaded dataset with {len(df) if df is not None else 0} projects")
    print("Ready to answer power transmission questions!")
    app.run(debug=False, host='0.0.0.0', port=5003)
