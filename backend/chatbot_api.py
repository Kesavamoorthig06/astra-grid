"""
Chatbot API for ASTRA GRID Power Transmission Assistant
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chatbot endpoint for power grid queries"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip().lower()
        
        if not user_message:
            return jsonify({'response': 'Please ask me something about power transmission!'}), 200
        
        # Simple rule-based responses for power grid domain
        responses = {
            'hello': 'Hello! I\'m ASTRA GRID assistant. I can help you with power transmission queries, risk assessment, and project simulations.',
            'hi': 'Hi there! How can I assist you with power grid operations today?',
            'help': 'I can help you with:\n- Transmission line risk predictions\n- Project cost and timeline estimates\n- Regulatory compliance information\n- Terrain and environmental impact assessment\n- Vendor performance queries',
            'risk': 'Risk assessment considers factors like terrain complexity, environmental impact, regulatory hotspots, and vendor performance. Would you like to run a prediction?',
            'cost': 'Project costs depend on voltage level, line length, terrain complexity, and material availability. Use the simulation tool for detailed estimates.',
            'voltage': 'We support voltage levels: 132 kV, 220 kV, 400 kV, and 765 kV transmission lines.',
            'terrain': 'Terrain complexity affects both cost and timeline. We classify terrain as: Simple (Index 3), Moderate (5), Complex (7), or Very Complex (10).',
            'environment': 'Environmental impact severity ranges from Low to Critical. Higher impact requires more mitigation measures and permits.',
            'vendor': 'Vendor performance rating (1-5) significantly impacts project success. Higher ratings reduce delays and cost overruns.',
            'timeline': 'Project timelines are estimated based on line length, terrain complexity, regulatory approvals, and vendor capacity.',
            'simulation': 'Use the Simulation page to model different scenarios with varying parameters for cost and timeline optimization.',
            'prediction': 'The Prediction tool uses ML models to assess transmission line project risks based on key parameters.',
            'dashboard': 'The Dashboard shows real-time metrics, project insights, and India\'s transmission network map.',
        }
        
        # Find matching response
        for keyword, response in responses.items():
            if keyword in user_message:
                return jsonify({'response': response}), 200
        
        # Default response for unmatched queries
        default_response = (
            'I\'m here to help with power transmission queries. You can ask me about:\n'
            '• Risk assessment and predictions\n'
            '• Cost and timeline estimates\n'
            '• Voltage levels and specifications\n'
            '• Terrain and environmental factors\n'
            '• Regulatory requirements\n'
            '• Vendor performance\n\n'
            'Try asking "help" for more information!'
        )
        
        return jsonify({'response': default_response}), 200
        
    except Exception as e:
        return jsonify({
            'response': 'I encountered an error. Please try again.',
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chatbot-api',
        'port': 5003
    })

if __name__ == '__main__':
    print("Starting ASTRA GRID Chatbot API on port 5003...")
    app.run(debug=False, host='0.0.0.0', port=5003)
