"""
ASTRA GRID - Chatbot Routes
AI chatbot endpoints for power grid queries
"""
from flask import Blueprint, request, jsonify
from app.services.chatbot_service import ChatbotService
from app.middleware.auth import token_required

# Create blueprint
chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    """
    Send message to chatbot
    POST /api/chatbot/message
    
    Request body:
    {
        "message": "What's the average cost of a 765 kV project?"
    }
    
    Optional: Include authorization header for authenticated queries
    """
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            }), 400
        
        # Get current user if authenticated
        user_email = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                from app.config.settings import current_config
                import jwt
                try:
                    token = auth_header[7:]
                    data_decoded = jwt.decode(
                        token,
                        current_config.JWT_SECRET_KEY,
                        algorithms=[current_config.JWT_ALGORITHM]
                    )
                    user_email = data_decoded.get('email')
                except:
                    pass
        
        # Process message
        response = ChatbotService.process_message(message, user_email)
        
        return jsonify({
            'success': True,
            'response': response['response'],
            'type': response.get('type', 'info'),
            'category': response.get('category')
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/message', methods=['POST'])
@token_required
def send_authenticated_message(current_user):
    """
    Send authenticated message (saves to history)
    POST /api/chatbot/message
    Requires: Authorization header with valid JWT token
    """
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            }), 400
        
        # Process message with user context
        response = ChatbotService.process_message(message, current_user['email'])
        
        return jsonify({
            'success': True,
            'response': response['response'],
            'type': response.get('type', 'info'),
            'category': response.get('category'),
            'user': current_user['email']
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    """
    Get user's chat history
    GET /api/chatbot/history?limit=50
    Requires: Authorization header with valid JWT token
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 200)  # Cap at 200
        
        history, error = ChatbotService.get_chat_history(current_user['email'], limit)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 500
        
        return jsonify({
            'success': True,
            'count': len(history) if history else 0,
            'history': history or []
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@chatbot_bp.route('/capabilities', methods=['GET'])
def get_capabilities():
    """
    Get chatbot capabilities and knowledge topics
    GET /api/chatbot/capabilities
    """
    try:
        capabilities = {
            'topics': list(ChatbotService.KNOWLEDGE_BASE.keys()),
            'description': 'AI assistant for power transmission project queries',
            'features': [
                'Cost analysis and predictions',
                'Timeline and delay estimation',
                'Voltage level information',
                'Terrain impact analysis',
                'Risk assessment guidance',
                'Simulation and scenario planning',
                'POWERGRID operations info',
                'Ministry of Power initiatives',
                'ASTRA GRID platform features'
            ]
        }
        
        return jsonify({
            'success': True,
            'capabilities': capabilities
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
