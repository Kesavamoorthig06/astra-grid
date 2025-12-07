"""
Intelligent Chatbot API for ASTRA GRID Power Transmission Assistant
Uses Gemini AI for semantic understanding of power grid queries
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAYlm__RltTvODGDelP10-q25lZLX0WC_k")
gemini_model = None

try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('models/gemini-2.0-flash')
        print("✓ Gemini AI configured successfully")
except Exception as e:
    print(f"⚠ Gemini configuration failed: {e}")
    gemini_model = None

# Conversation context
conversation_context = []

@app.route('/api/chat', methods=['POST'])
def chat():
    """Intelligent chatbot endpoint for power grid queries"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'response': 'Please ask me something about power transmission!'}), 200
        
        # Add to conversation context
        conversation_context.append({
            'role': 'user',
            'content': user_message
        })
        
        # Use Gemini if available
        if gemini_model:
            response_text = generate_intelligent_response(user_message)
        else:
            response_text = generate_fallback_response(user_message)
        
        # Add assistant response to context
        conversation_context.append({
            'role': 'assistant',
            'content': response_text
        })
        
        # Keep only last 10 messages for context
        if len(conversation_context) > 20:
            conversation_context.pop(0)
            conversation_context.pop(0)
        
        return jsonify({'response': response_text}), 200
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({
            'response': 'I encountered an error. Please try again.',
            'error': str(e)
        }), 500

def generate_intelligent_response(user_message):
    """Generate response using Gemini AI"""
    try:
        system_prompt = """You are ASTRA GRID, an expert AI assistant for India's Power Transmission Grid.
        
You specialize in:
- Power transmission project risk analysis and forecasting
- Cost overrun and delay prediction
- Project management for transmission lines, substations, and underground cables
- Vendor performance evaluation
- Regulatory compliance and environmental impact assessment
- Terrain complexity analysis (plains, plateaus, hills, urban areas)

When answering:
1. Be specific and technical but clear
2. Reference actual India power transmission context
3. Mention project types (Transmission Line, Substation, Distribution)
4. Consider factors: voltage levels (132kV, 220kV, 400kV, 765kV), terrain, environmental impact
5. For cost queries: think in Indian rupees (₹), use Crores and Lakhs
6. For timeline: consider weather seasons, regulatory delays, vendor capacity
7. Be helpful for POWERGRID project planning

If user asks about a specific project, provide actionable insights.
If they ask about risk: analyze based on multiple factors.
If they ask about cost/timeline: give practical estimates considering terrain and vendor factors."""
        
        # Build conversation messages
        messages = []
        for msg in conversation_context[-6:]:  # Use last 6 messages for context
            messages.append({
                'role': msg['role'],
                'parts': [{'text': msg['content']}]
            })
        
        response = gemini_model.generate_content(
            [{'text': system_prompt}] + messages,
            generation_config={'temperature': 0.7, 'max_output_tokens': 500}
        )
        
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return generate_fallback_response(user_message)

def generate_fallback_response(user_message):
    """Fallback response when Gemini is unavailable"""
    msg_lower = user_message.lower()
    
    responses = {
        'hello': 'Hello! I\'m ASTRA GRID assistant. I can help you with power transmission queries, risk assessment, cost/timeline estimation, and project simulations. What would you like to know?',
        'hi': 'Hi! How can I assist you with power grid operations today?',
        'help': '''I can help you with:
• **Risk Analysis** - Transmission line project risk predictions
• **Cost Estimation** - Project cost and timeline estimates
• **Regulatory Info** - Compliance and permitting timelines
• **Terrain Impact** - Environmental and terrain complexity assessment
• **Vendor Performance** - Supplier reliability analysis
• **Simulation** - Model different project scenarios
• **Dashboard** - View India\'s transmission network metrics

What would you like to know?''',
        'risk': 'Risk assessment considers: terrain complexity, environmental impact severity, regulatory hotspots, vendor performance, weather factors, and project type. Would you like me to assess risk for a specific project or scenario?',
        'cost': 'Project costs depend on: voltage level, line length, terrain complexity, material availability, labor, and vendor performance. Using our ML model, we can estimate costs considering all these factors.',
        'voltage': 'We support transmission voltage levels: 132 kV, 220 kV, 400 kV, and 765 kV lines. Higher voltages handle more power but require more complex infrastructure.',
        'terrain': 'Terrain complexity significantly impacts cost and timeline. We classify as: Plains (Easy), Urban (Moderate), Plateau (Complex), Hilly (Very Complex). Each affects project duration and cost differently.',
        'environment': 'Environmental impact is crucial. Severity ranges: Low, Medium, High, Very High, Critical. Higher severity requires more mitigation, more permits, and longer approval timelines.',
        'vendor': 'Vendor performance rating (1-5 stars) directly impacts project success. Higher-rated vendors typically deliver on time and budget. We analyze vendor track records.',
        'timeline': 'Timelines depend on: line length, terrain, regulatory approvals, weather seasons, and vendor capacity. Our model predicts delays based on historical patterns.',
        'simulation': 'Use the Simulation tool to model different scenarios - adjust parameters and see cost/timeline impacts in real-time.',
        'prediction': 'The Prediction tool uses trained ML models to forecast project risks based on your specific parameters and historical data.',
        'dashboard': 'The Dashboard shows real-time power grid metrics, project insights, India\'s transmission network visualization, and key performance indicators.',
    }
    
    for keyword, response in responses.items():
        if keyword in msg_lower:
            return response
    
    # Default response
    return '''I'm ASTRA GRID assistant, here to help with power transmission projects. I can discuss:
• Project risk and cost estimation
• Timeline prediction and delays
• Terrain and environmental factors
• Vendor performance and capacity
• Regulatory compliance
• Simulation and scenario planning

Try asking about risk, cost, timeline, or simulation for a project scenario!'''

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chatbot-api',
        'port': 5003,
        'gemini_configured': bool(gemini_model)
    })

if __name__ == '__main__':
    print("Starting ASTRA GRID Chatbot API on port 5003...")
    app.run(debug=False, host='0.0.0.0', port=5003)
