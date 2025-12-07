"""
ASTRA GRID - Chatbot Service
Handles natural language queries about power transmission projects
"""
import logging
from app.models.database import db_manager
import datetime

logger = logging.getLogger(__name__)

class ChatbotService:
    """Provides chatbot functionality for power grid queries"""
    
    # Knowledge base for common questions
    KNOWLEDGE_BASE = {
        'cost': {
            'keywords': ['cost', 'expensive', 'price', 'budget', 'investment'],
            'response': 'Project costs vary significantly by voltage level and terrain. 765 kV lines average ₹3,500 Cr, while 132 kV lines average ₹80 Cr. Would you like predictions for a specific project?'
        },
        'timeline': {
            'keywords': ['timeline', 'duration', 'how long', 'delay', 'schedule'],
            'response': 'Project timelines depend on terrain complexity and permits. Typically 12-30 months. High terrain adds 20-35% more time. Use our Prediction tool for accurate estimates.'
        },
        'voltage': {
            'keywords': ['voltage', '765', '400', '220', '132', 'kv'],
            'response': 'We work with: 765 kV (ultra-high, 500-2500 km), 400 kV (high, 200-800 km), 220 kV (medium, 100-400 km), 132 kV (medium, 50-200 km).'
        },
        'terrain': {
            'keywords': ['terrain', 'mountain', 'hill', 'plain', 'difficulty'],
            'response': 'Terrain multipliers: Plains (1.0x), Plateau (1.55x), Hills (2.1x), Mountains (2.8x). Higher multipliers increase both cost and timeline.'
        },
        'risk': {
            'keywords': ['risk', 'prediction', 'analysis', 'assessment'],
            'response': 'Risk is assessed by ML models trained on 12,000+ projects. Factors: terrain, permits, vendor performance, weather, environmental impact. Use Prediction page for analysis.'
        },
        'simulation': {
            'keywords': ['simulation', 'scenario', 'what-if', 'compare'],
            'response': 'Simulate optimistic, realistic, and pessimistic scenarios. Adjust parameters and see cost/timeline impacts instantly. Use the Simulation page.'
        },
        'powergrid': {
            'keywords': ['powergrid', 'pgcil', 'corporation'],
            'response': 'POWERGRID manages 180,000+ km transmission lines across India with 350+ substations. 14,500+ active projects covering 765 kV to 132 kV levels.'
        },
        'ministry': {
            'keywords': ['ministry', 'government', 'policy', 'initiative'],
            'response': 'Ministry of Power oversees: generation (NTPC), transmission (POWERGRID), distribution. Focus: renewable integration (500 GW target), rural electrification, smart grids.'
        },
        'astra': {
            'keywords': ['astra', 'platform', 'system', 'tool', 'application'],
            'response': 'ASTRA GRID is an AI platform for power transmission risk prediction. Features: ML predictions, scenario simulation, document extraction, interactive dashboards.'
        },
        'help': {
            'keywords': ['help', 'what can', 'how do', 'guide', 'tutorial'],
            'response': 'I can help with: Cost & timeline predictions, Risk assessment, Scenario simulation, Project information, Terrain analysis. Try asking about specific projects!'
        }
    }
    
    @staticmethod
    def process_message(message, user_email=None):
        """Process user message and return response"""
        try:
            msg_lower = message.lower().strip()
            
            if not msg_lower:
                return {
                    'response': 'Please ask me something about power transmission projects!',
                    'type': 'info'
                }
            
            # Find matching knowledge base entry
            for category, kb_entry in ChatbotService.KNOWLEDGE_BASE.items():
                for keyword in kb_entry['keywords']:
                    if keyword in msg_lower:
                        response = {
                            'response': kb_entry['response'],
                            'type': 'info',
                            'category': category
                        }
                        
                        # Save chat message if user is authenticated
                        if user_email:
                            ChatbotService.save_chat_message(user_email, message, response['response'])
                        
                        return response
            
            # Default response for unmatched queries
            default_response = {
                'response': f'That\'s an interesting question about "{message}". Try asking about: costs, timelines, terrain impacts, risk analysis, simulations, ASTRA GRID features, or POWERGRID operations.',
                'type': 'info'
            }
            
            if user_email:
                ChatbotService.save_chat_message(user_email, message, default_response['response'])
            
            return default_response
        
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return {
                'response': 'Sorry, I encountered an error processing your message.',
                'type': 'error'
            }
    
    @staticmethod
    def save_chat_message(user_email, user_message, bot_response):
        """Save chat conversation to database"""
        try:
            # Create chat collection if it doesn't exist
            chat_collection = db_manager.db['chat_history']
            
            record = {
                'user_email': user_email,
                'timestamp': datetime.datetime.utcnow(),
                'user_message': user_message,
                'bot_response': bot_response
            }
            
            chat_collection.insert_one(record)
            logger.debug(f"Chat saved for user: {user_email}")
        
        except Exception as e:
            logger.error(f"Failed to save chat: {e}")
    
    @staticmethod
    def get_chat_history(user_email, limit=50):
        """Get user's chat history"""
        try:
            chat_collection = db_manager.db['chat_history']
            
            messages = list(
                chat_collection.find(
                    {'user_email': user_email},
                    {'_id': 1, 'timestamp': 1, 'user_message': 1, 'bot_response': 1}
                ).sort('timestamp', -1).limit(limit)
            )
            
            # Convert ObjectId to string
            for msg in messages:
                msg['_id'] = str(msg['_id'])
                msg['timestamp'] = msg['timestamp'].isoformat()
            
            return messages, None
        
        except Exception as e:
            logger.error(f"Failed to get chat history: {e}")
            return None, str(e)
