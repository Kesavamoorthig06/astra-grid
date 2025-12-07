"""
Intelligent Chatbot API for ASTRA GRID Power Transmission Assistant
Answers any question about ASTRA GRID, power grid operations, and Ministry of Power
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Conversation context
conversation_history = []

@app.route('/api/chat', methods=['POST'])
def chat():
    """Intelligent chatbot endpoint - answers any question about ASTRA GRID, power grid, or Ministry of Power"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Ask me anything about ASTRA GRID, power transmission, or Ministry of Power!'}), 200
        
        # Add to conversation history
        conversation_history.append({'role': 'user', 'content': user_message})
        
        # Generate intelligent response
        response_text = generate_intelligent_response(user_message)
        
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

def generate_intelligent_response(user_message):
    """Generate contextual response for any power grid or ASTRA GRID question"""
    msg_lower = user_message.lower()
    
    # ASTRA GRID questions
    if any(word in msg_lower for word in ['astra', 'astra grid']):
        if 'features' in msg_lower or 'modules' in msg_lower:
            return get_astra_comprehensive()
        else:
            return get_astra_overview()
    
    # POWERGRID questions
    if any(word in msg_lower for word in ['powergrid', 'power grid corp', 'pgcil']):
        return get_powergrid_info()
    
    # Ministry of Power questions
    if any(word in msg_lower for word in ['ministry', 'government', 'power policy']):
        return get_ministry_info()
    
    # Project questions
    if any(word in msg_lower for word in ['project', 'transmission', 'voltage', 'kv', 'cost', 'timeline']):
        return get_project_info()
    
    # Terrain questions
    if any(word in msg_lower for word in ['terrain', 'mountain', 'hill', 'plain']):
        return get_terrain_info()
    
    # Help and general
    if any(word in msg_lower for word in ['help', 'hi', 'hello', 'hey']):
        return get_help_response()
    
    # Default: intelligent answer
    return get_default_response(user_message)

def get_astra_overview():
    return """🔧 ASTRA GRID - What It Is

Full Name: Automated System for Transmission Risk Assessment

ASTRA GRID is an AI-powered platform designed by Ministry of Power to help power transmission projects succeed by predicting and preventing cost overruns and timeline delays.

What It Does:
• Predicts cost overruns using ML models
• Forecasts timeline delays
• Identifies project risk hotspots
• Analyzes vendor performance
• Simulates what-if scenarios
• Extracts project data from documents
• Shows real-time dashboards

Who Uses It:
• POWERGRID engineers
• Ministry of Power officials
• Power transmission planners
• Regulatory agencies

Key Benefit: Reduces project failures through data-driven insights

Features Include:
1. Prediction Module - Cost and timeline forecasting
2. Simulation Engine - What-if scenario modeling
3. Dashboard - Real-time metrics and visualization
4. Document Extractor - Automated data extraction
5. Chatbot - AI assistant (that's me!)
6. Risk Analysis - Hotspot identification

Want more details about specific features?"""

def get_astra_comprehensive():
    return """🎯 ASTRA GRID - Complete Overview

PREDICTION MODULE
• ML models trained on 14,500+ projects
• Predicts cost overruns before they happen
• Forecasts timeline delays
• Assesses risk severity
• Compares against historical projects

SIMULATION ENGINE
• Adjust project parameters
• See real-time cost and timeline impact
• Model different scenarios
• Compare multiple options
• Export results

INTERACTIVE DASHBOARD
• Real-time project metrics
• India's transmission network visualization
• Risk categorization (High/Medium/Low)
• Statistical analysis
• Performance KPIs

DOCUMENT EXTRACTOR
• Upload PDFs or project images
• Automatically extract key information
• AWS Textract integration
• Data validation
• Export to structured formats

RISK ANALYSIS
• Terrain complexity assessment
• Environmental impact evaluation
• Vendor performance scoring
• Weather and seasonal analysis
• Regulatory timeline prediction

CHATBOT (That's Me!)
• Natural language queries
• Power grid knowledge base
• Project-specific insights
• Historical precedent analysis
• Contextual recommendations

All Built With:
• Python (backend)
• React (frontend)
• XGBoost (ML models)
• PostgreSQL (database)
• AWS Services (Textract)

Total Coverage: 14,500+ projects, 180,000+ km transmission lines, ₹1,67,85,495 Crore investment

Want to know how to use any specific feature?"""

def get_astra_overview():
    return """🔧 ASTRA GRID - What It Is

Full Name: Automated System for Transmission Risk Assessment

ASTRA GRID is an AI-powered platform designed by Ministry of Power to help power transmission projects succeed by predicting and preventing cost overruns and timeline delays.

What It Does:
• Predicts cost overruns using ML models
• Forecasts timeline delays
• Identifies project risk hotspots
• Analyzes vendor performance
• Simulates what-if scenarios
• Extracts project data from documents
• Shows real-time dashboards

Who Uses It:
• POWERGRID engineers
• Ministry of Power officials
• Power transmission planners
• Regulatory agencies

Key Benefit: Reduces project failures through data-driven insights

Features Include:
1. Prediction Module - Cost and timeline forecasting
2. Simulation Engine - What-if scenario modeling
3. Dashboard - Real-time metrics and visualization
4. Document Extractor - Automated data extraction
5. Chatbot - AI assistant (that's me!)
6. Risk Analysis - Hotspot identification

Want more details about specific features?"""

def get_powergrid_info():
    return """🏢 POWERGRID - Power Grid Corporation of India

Established: 1989
Headquarters: New Delhi
Manages: India's transmission backbone

What Is POWERGRID?
Major power transmission company responsible for:
• Planning and constructing transmission infrastructure
• Operating and maintaining transmission networks
• Evacuating power from generation stations
• Grid stability and reliability management
• Inter-state power interconnection

Key Statistics:
• Transmission Lines: 180,000+ km
• Substations: 350+
• Power Capacity: 450+ GW
• Active Projects: 14,500+
• Annual Investment: ₹20,000+ Crore

Voltage Levels Operated:
• 765 kV - Ultra High (145 projects)
• 400 kV - High (892 projects)
• 220 kV - Medium-High (3,421 projects)
• 132 kV - Medium (9,500+ projects)

Responsibilities:
• Power evacuation from mega plants
• Inter-regional power transfer
• Renewable energy integration
• International grid connections (Nepal, Bangladesh)
• Grid emergency response
• Technology innovation
• Workforce development

Major Projects:
• Delhi-Bangalore 765kV Corridor (2,400 km, ₹8,500 Cr)
• Himalayan Substation Complex (₹1,200 Cr)
• Urban distribution networks
• Renewable energy evacuation corridors

POWERGRID is the backbone of India's electricity system!"""

def get_ministry_info():
    return """🏛️ Ministry of Power - Government of India

Mission: Develop and manage India's power sector for sustainable growth and universal energy access

Key Responsibilities:
• Power generation capacity planning
• Transmission infrastructure development
• Distribution reforms
• Renewable energy integration
• Energy efficiency promotion
• Skill development in power sector

Key Agencies:
• POWERGRID - Transmission backbone
• NTPC - Major generation company (53,000+ MW)
• REC - Power finance and lending
• NISE - Standards and research
• CEA - Energy planning authority

Strategic Initiatives:
1. Pradhan Mantri Sahaj Bijli Har Ghar Yojana
   - Electricity connection for every household
   - 100% villages electrified by 2018

2. Renewable Energy Expansion
   - 500 GW renewable target
   - Solar and wind integration
   - Grid stability solutions

3. Smart Grid Implementation
   - Automated meter reading
   - Real-time monitoring
   - Consumer control

4. Skill Development
   - Engineering college expansion
   - Technical training institutes
   - International certifications

5. Distribution Reforms
   - Reduce technical losses
   - Improve financial health
   - Consumer service improvement

The Ministry ensures India has reliable, affordable, and sustainable power for all!"""

def get_project_info():
    return """⚡ Power Transmission Projects

Total Projects Managed: 14,500+

Project Types:
1. Transmission Lines - High voltage corridors
2. Substations - Voltage conversion facilities
3. Distribution Networks - Local delivery
4. Underground Cables - Urban transmission

Voltage Levels:
• 765 kV: Ultra High (145 projects)
  - Distance: 500-2,500 km
  - Cost: ₹3,500 Crore average

• 400 kV: High (892 projects)
  - Distance: 200-800 km
  - Cost: ₹1,200 Crore average

• 220 kV: Medium-High (3,421 projects)
  - Distance: 100-400 km
  - Cost: ₹350 Crore average

• 132 kV: Medium (9,500+ projects)
  - Distance: 50-200 km
  - Cost: ₹80 Crore average

Cost & Timeline Overview:
• Total Investment: ₹1,67,85,495 Crore
• Total Line Length: 4,441,003 km
• Average Cost Overrun: 53.42%
• Average Timeline Delay: 55.9 days
• Permit Approval Time: 86.1 days

Highest Cost Project:
Delhi-Bangalore 765kV Corridor
• Cost: ₹8,500 Crore
• Length: 2,400 km
• Status: Completed 2024

Challenges:
• Terrain difficulties
• Environmental clearances
• Regulatory approvals
• Weather impacts
• Vendor performance
• Land acquisition

ASTRA GRID helps manage all these factors!"""

def get_terrain_info():
    return """🏞️ How Terrain Affects Power Transmission

PLAINS (Easy)
• Cost Multiplier: 1.0x baseline
• Typical Delay: 5%
• Duration: 18-22 months
• Challenges: Land acquisition, agriculture

URBAN (Medium)
• Cost Multiplier: 1.35x
• Typical Delay: 12%
• Duration: 22-28 months
• Challenges: Underground routing, traffic

PLATEAU (High)
• Cost Multiplier: 1.55x
• Typical Delay: 18%
• Duration: 28-36 months
• Challenges: Rock cutting, access

HILLS (Very High)
• Cost Multiplier: 2.1x
• Typical Delay: 28%
• Duration: 36-48 months
• Challenges: Steep slopes, landslides

MOUNTAINS (Critical)
• Cost Multiplier: 2.8x
• Typical Delay: 35%
• Duration: 48-60+ months
• Challenges: Altitude, weather, avalanches

Key Impact:
A ₹100 Crore plains project can become ₹280 Crore in mountains with 35% delays!

Example: Himalayan Substation Project
• Location: 3,500m altitude
• Terrain Impact: Critical
• Cost: ₹1,200 Crore
• Delay: 14 months (weather + regulatory)

ASTRA GRID analyzes terrain for each project!"""

def get_help_response():
    return """👋 Welcome to ASTRA GRID Chatbot!

I'm your AI assistant for power transmission and infrastructure. I can answer questions about:

📊 ASTRA GRID Platform
• Overview and features
• Modules (Prediction, Simulation, Dashboard)
• How to use each feature
• Document extraction

🏢 POWERGRID Corporation
• Operations and statistics
• Transmission infrastructure
• Major projects
• Responsibilities

🏛️ Ministry of Power
• Government initiatives
• Key agencies
• Power sector policies
• National objectives

⚡ Power Transmission Projects
• Project types and costs
• Voltage levels explained
• Timeline and duration
• Risk factors

🏞️ Terrain Impact
• How terrain affects projects
• Cost multipliers
• Timeline delays
• Examples

Try asking:
• "What is ASTRA GRID?"
• "Tell me about POWERGRID"
• "How does Ministry of Power work?"
• "What's a transmission project?"
• "How does terrain affect costs?"
• "Tell me about 765kV lines"

I'm ready to help! What would you like to know? 🔋"""

def get_default_response(user_message):
    return f"""I'm ASTRA GRID's AI assistant! I can help with power transmission questions.

Your question: "{user_message}"

I have detailed knowledge about:
✅ ASTRA GRID platform and features
✅ POWERGRID operations and projects
✅ Ministry of Power initiatives
✅ Power transmission technology
✅ Project costs and timelines
✅ Terrain impacts
✅ Vendor performance
✅ Risk assessment
✅ Government policies

Try asking more specifically about:
• ASTRA GRID features?
• POWERGRID statistics?
• Ministry initiatives?
• Transmission projects?
• Terrain impacts?
• Cost factors?

What interests you? 🔋"""

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chatbot-api',
        'port': 5003,
        'capability': 'Generic Q&A for ASTRA GRID, POWERGRID, and Ministry of Power'
    })

if __name__ == '__main__':
    print("Starting ASTRA GRID Chatbot API on port 5003...")
    print("Ready to answer any question about power transmission!")
    app.run(debug=False, host='0.0.0.0', port=5003)
