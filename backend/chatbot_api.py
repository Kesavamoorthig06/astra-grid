"""
Intelligent Chatbot API for ASTRA GRID Power Transmission Assistant
Provides contextual, relevant responses about power grid projects
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Power Grid Knowledge Base
POWER_GRID_KNOWLEDGE = {
    "project_stats": {
        "total_projects": 14500,
        "highest_cost_project": {
            "name": "765 kV Transmission Corridor (Delhi-Bangalore)",
            "cost": "₹8500 Crore",
            "voltage": "765 kV",
            "length": "2400 km",
            "status": "Completed",
            "completion_date": "2024-08",
            "terrain": "Mixed (Plains, Hills, Urban)"
        },
        "highest_risk_project": {
            "name": "Himalayan Substation Complex (Himachal)",
            "cost": "₹1200 Crore",
            "terrain": "Very High (Mountain)",
            "challenges": "Altitude 3500m, extreme weather, avalanche risk",
            "status": "In Progress",
            "delay": "14 months",
            "reason": "Weather, regulatory approval delays"
        },
        "fastest_completed": {
            "name": "Urban 220kV Distribution Network (Mumbai)",
            "cost": "₹450 Crore",
            "planned_duration": "18 months",
            "actual_duration": "14 months",
            "status": "Completed",
            "completion_date": "2023-11"
        }
    },
    "voltage_levels": {
        "765kV": {"description": "Extra High Voltage - Long distance transmission", "projects": 145, "avg_cost": "₹3500 Cr"},
        "400kV": {"description": "High Voltage - Regional transmission", "projects": 892, "avg_cost": "₹1200 Cr"},
        "220kV": {"description": "Medium Voltage - Sub-regional transmission", "projects": 3421, "avg_cost": "₹350 Cr"},
        "132kV": {"description": "Medium Voltage - Local transmission & distribution", "projects": 9500, "avg_cost": "₹80 Cr"}
    },
    "terrain_impact": {
        "plains": {"difficulty": "Low", "avg_delay": "5%", "cost_multiplier": 1.0},
        "urban": {"difficulty": "Medium", "avg_delay": "12%", "cost_multiplier": 1.35},
        "plateau": {"difficulty": "High", "avg_delay": "18%", "cost_multiplier": 1.55},
        "hills": {"difficulty": "Very High", "avg_delay": "28%", "cost_multiplier": 2.1},
        "mountains": {"difficulty": "Critical", "avg_delay": "35%", "cost_multiplier": 2.8}
    }
}

# Conversation context
conversation_history = []

@app.route('/api/chat', methods=['POST'])
def chat():
    """Intelligent chatbot endpoint for power grid queries"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Please ask me something about power transmission projects!'}), 200
        
        # Add to conversation history
        conversation_history.append({'role': 'user', 'content': user_message})
        
        # Generate contextual response
        response_text = generate_contextual_response(user_message)
        
        # Add assistant response to history
        conversation_history.append({'role': 'assistant', 'content': response_text})
        
        # Keep last 10 exchanges
        if len(conversation_history) > 20:
            conversation_history.pop(0)
            conversation_history.pop(0)
        
        return jsonify({'response': response_text}), 200
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({
            'response': 'I encountered an error. Please try again.',
            'error': str(e)
        }), 500

def generate_contextual_response(user_message):
    """Generate contextual response based on user query"""
    msg_lower = user_message.lower()
    
    # Check for specific project queries
    if any(word in msg_lower for word in ['highest', 'biggest', 'largest', 'maximum', 'most expensive', 'costliest']):
        if 'project' in msg_lower or 'done' in msg_lower or 'completed' in msg_lower or 'far' in msg_lower:
            return get_highest_cost_response()
        elif 'risk' in msg_lower or 'danger' in msg_lower:
            return get_highest_risk_response()
    
    # Voltage level queries
    if '765' in msg_lower or '765kv' in msg_lower:
        return get_voltage_info('765kV')
    elif '400' in msg_lower or '400kv' in msg_lower:
        return get_voltage_info('400kV')
    elif '220' in msg_lower or '220kv' in msg_lower:
        return get_voltage_info('220kV')
    elif '132' in msg_lower or '132kv' in msg_lower:
        return get_voltage_info('132kV')
    
    # Terrain queries
    if 'terrain' in msg_lower or 'mountain' in msg_lower or 'hill' in msg_lower or 'plain' in msg_lower:
        if 'impact' in msg_lower or 'affect' in msg_lower or 'how' in msg_lower:
            return get_terrain_impact_response()
    
    # Generic project info
    if any(word in msg_lower for word in ['project', 'transmission', 'grid', 'power']):
        if any(word in msg_lower for word in ['how many', 'total', 'count', 'number']):
            return f"""📊 **POWERGRID Project Overview**

We manage **14,500+ transmission projects** across India:

• **765 kV (Ultra High Voltage):** 145 projects
• **400 kV (High Voltage):** 892 projects  
• **220 kV (Medium-High):** 3,421 projects
• **132 kV (Medium):** 9,500+ projects

These projects span from simple distribution networks to complex high-altitude transmission corridors, with budgets ranging from ₹50 Crore to ₹8,500+ Crore."""
    
    # Help and general queries
    if any(word in msg_lower for word in ['help', 'what can', 'assistance', 'support']):
        return get_help_response()
    
    if any(word in msg_lower for word in ['hello', 'hi', 'hey', 'greetings']):
        return get_greeting_response()
    
    # Default intelligent response
    return get_default_response(user_message)

def get_highest_cost_response():
    """Get response about highest cost project"""
    project = POWER_GRID_KNOWLEDGE["project_stats"]["highest_cost_project"]
    return f"""💰 **Highest Cost Project Completed So Far**

**Project:** {project['name']}
**Voltage Level:** {project['voltage']}
**Total Cost:** {project['cost']}
**Line Length:** {project['length']}
**Status:** ✅ {project['status']}
**Completion Date:** {project['completion_date']}

**Terrain Challenges:** {project['terrain']}
- Spans multiple terrain types affecting cost and timeline
- Required advanced planning for different regions
- Completed on schedule despite complexity

This is one of India's most significant transmission infrastructure projects, connecting major power distribution hubs."""

def get_highest_risk_response():
    """Get response about highest risk project"""
    project = POWER_GRID_KNOWLEDGE["project_stats"]["highest_risk_project"]
    return f"""⚠️ **Highest Risk Project (In Progress)**

**Project:** {project['name']}
**Cost:** {project['cost']}
**Status:** 🔄 {project['status']}

**Major Challenges:**
- {project['terrain']}
- {project['challenges']}

**Impact Analysis:**
- Timeline Delay: {project['delay']}
- Primary Reason: {project['reason']}

**Risk Factors:**
🏔️ Altitude: 3,500m - Extreme working conditions
❄️ Weather: Monsoon and winter delays
⚡ Environmental: Avalanche and landslide risks
📋 Regulatory: Multiple state approvals needed

**Mitigation Strategies:**
- Seasonal work planning
- Advanced weather monitoring
- Specialized equipment and trained personnel
- Phased regulatory approvals

Would you like to know about risk management strategies for high-altitude projects?"""

def get_voltage_info(voltage):
    """Get information about specific voltage level"""
    info = POWER_GRID_KNOWLEDGE["voltage_levels"].get(voltage, {})
    return f"""⚡ **{voltage} Transmission Details**

**Purpose:** {info.get('description', 'N/A')}
**Number of Projects:** {info.get('projects', 'N/A')}
**Average Project Cost:** {info.get('avg_cost', 'N/A')}

**Project Characteristics:**
- Standard line length: 100-500 km
- Right-of-way requirements vary by region
- Environmental clearance timelines: 9-18 months
- Typical project duration: 24-36 months
- Cost factors: Terrain, urban/rural, weather

Would you like specific project examples or risk assessment for {voltage} projects?"""

def get_terrain_impact_response():
    """Get response about terrain impact on projects"""
    response = """🏞️ **How Terrain Impacts Power Grid Projects**

Terrain significantly affects both **cost** and **timeline**:

**PLAINS (Easy)**
- Cost Multiplier: 1.0x baseline
- Average Delay: 5%
- Challenges: Land acquisition, agriculture impact
- Typical Duration: 18-22 months

**URBAN (Medium Difficulty)**
- Cost Multiplier: 1.35x baseline
- Average Delay: 12%
- Challenges: Traffic management, underground routing, residential concerns
- Typical Duration: 22-28 months

**PLATEAU (High)**
- Cost Multiplier: 1.55x baseline
- Average Delay: 18%
- Challenges: Rock cutting, limited access, weather
- Typical Duration: 28-36 months

**HILLS (Very High)**
- Cost Multiplier: 2.1x baseline
- Average Delay: 28%
- Challenges: Steep slopes, landslides, weather, narrow valleys
- Typical Duration: 36-48 months

**MOUNTAINS/HIMALAYAN (Critical)**
- Cost Multiplier: 2.8x baseline
- Average Delay: 35%
- Challenges: Altitude, extreme weather, avalanches, regulatory delays
- Typical Duration: 48-60+ months

**Key Takeaway:** A ₹100 Cr plains project could cost ₹280 Cr in mountains with 35% more delays!"""
    return response

def get_help_response():
    """Get help response"""
    return """🆘 **How I Can Help You**

I'm ASTRA GRID's AI assistant for power transmission projects. I can answer questions about:

**📊 Project Information**
- Highest cost projects completed
- Risk assessment and challenges
- Project statistics by voltage level
- Timeline and duration factors

**⚡ Technical Details**
- Voltage levels (765kV, 400kV, 220kV, 132kV)
- Transmission line specifications
- Equipment and infrastructure requirements

**🏞️ Environmental & Terrain**
- How terrain impacts cost and timeline
- Environmental clearance timelines
- Regional considerations

**💰 Cost & Timeline**
- Cost estimation factors
- Project duration expectations
- Risk factors affecting schedules

**Try asking:**
- "What is the highest project done so far?"
- "How does mountain terrain affect projects?"
- "Tell me about 765kV transmission"
- "What are the major challenges in power transmission?"

What would you like to know?"""

def get_greeting_response():
    """Get greeting response"""
    return """👋 **Welcome to ASTRA GRID!**

I'm your AI assistant for India's Power Transmission Grid. I'm here to help you understand:
- Major transmission projects and their characteristics
- Cost and timeline factors
- Terrain and environmental impacts
- Technical specifications and voltage levels
- Project risks and mitigation strategies

**What would you like to know about power transmission projects?**
- Ask about the highest cost project
- Learn about different voltage levels
- Understand terrain impacts
- Get project statistics and trends"""

def get_default_response(user_message):
    """Generate intelligent default response"""
    return f"""I'm here to help with power transmission questions! 

Your question: "{user_message}"

I can provide detailed information about:
✅ Project costs and budgets
✅ Timeline and duration factors  
✅ Terrain and location impacts
✅ Voltage levels and specifications
✅ Risk assessment and challenges
✅ Regional considerations

**Try being more specific:**
- "What's the highest cost project?"
- "How does terrain affect projects?"
- "Tell me about 765kV lines"
- "What causes project delays?"

What aspect would you like to explore?"""

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chatbot-api',
        'port': 5003,
        'knowledge_base': 'Loaded'
    })

if __name__ == '__main__':
    print("Starting ASTRA GRID Chatbot API on port 5003...")
    app.run(debug=False, host='0.0.0.0', port=5003)
