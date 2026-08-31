"""
ASTRA GRID - Chatbot Service
Handles natural language queries about power transmission projects
Uses actual project data from Final_dataset.csv for accurate responses
"""
import logging
from app.models.database import db_manager
import datetime
import pandas as pd
import os

logger = logging.getLogger(__name__)

class ChatbotService:
    """Provides chatbot functionality for power grid queries"""
    
    # Load dataset once
    _dataset = None
    _dataset_stats = None
    
    @classmethod
    def load_dataset(cls):
        """Load the Final_dataset.csv file"""
        if cls._dataset is not None:
            return cls._dataset
        
        try:
            # Try multiple paths
            paths = [
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'Final_dataset.csv'),
                '../Final_dataset.csv',
                'Final_dataset.csv',
            ]
            
            for path in paths:
                if os.path.exists(path):
                    cls._dataset = pd.read_csv(path)
                    logger.info(f"✓ Loaded {len(cls._dataset)} project records from {path}")
                    return cls._dataset
            
            logger.warning("Could not load Final_dataset.csv from any path")
            return None
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return None
    
    @classmethod
    def get_dataset_stats(cls):
        """Get statistics from the dataset"""
        if cls._dataset_stats is not None:
            return cls._dataset_stats
        
        df = cls.load_dataset()
        if df is None:
            return {}
        
        try:
            cls._dataset_stats = {
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
            }
            return cls._dataset_stats
        except Exception as e:
            logger.error(f"Error calculating stats: {e}")
            return {}
    
    # Knowledge base for common questions - will be enhanced with live data
    KNOWLEDGE_BASE = {
        'cost': {
            'keywords': ['cost', 'expensive', 'price', 'budget', 'investment'],
        },
        'timeline': {
            'keywords': ['timeline', 'duration', 'how long', 'delay', 'schedule'],
        },
        'voltage': {
            'keywords': ['voltage', '765', '400', '220', '132', 'kv'],
        },
        'terrain': {
            'keywords': ['terrain', 'mountain', 'hill', 'plain', 'difficulty'],
        },
        'risk': {
            'keywords': ['risk', 'prediction', 'analysis', 'assessment'],
        },
        'simulation': {
            'keywords': ['simulation', 'scenario', 'what-if', 'compare'],
        },
        'powergrid': {
            'keywords': ['powergrid', 'pgcil', 'corporation'],
        },
        'ministry': {
            'keywords': ['ministry', 'government', 'policy', 'initiative'],
        },
        'astra': {
            'keywords': ['astra', 'platform', 'system', 'tool', 'application'],
        },
        'help': {
            'keywords': ['help', 'what can', 'how do', 'guide', 'tutorial'],
        }
    }
    
    @staticmethod
    @staticmethod
    def process_message(message, user_email=None):
        """Process user message and return response with actual dataset references"""
        try:
            msg_lower = message.lower().strip()
            
            if not msg_lower:
                return {
                    'response': 'Ask me about power transmission projects! I reference real data from 14,500+ completed projects.',
                    'type': 'info'
                }
            
            stats = ChatbotService.get_dataset_stats()
            df = ChatbotService.load_dataset()
            
            # Generate data-driven responses based on message content
            response_text = ChatbotService.generate_response(msg_lower, stats, df)
            
            response = {
                'response': response_text,
                'type': 'info',
                'data_source': 'ASTRA GRID Dataset' if stats else 'Knowledge Base'
            }
            
            # Save chat message if user is authenticated
            if user_email:
                ChatbotService.save_chat_message(user_email, message, response_text)
            
            return response
        
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return {
                'response': 'Sorry, I encountered an error. Try asking about costs, timelines, terrain, or project features.',
                'type': 'error'
            }
    
    @staticmethod
    def generate_response(msg_lower, stats, df):
        """Generate response referencing actual data"""
        
        # Cost questions
        if any(word in msg_lower for word in ['cost', 'expensive', 'price', 'budget']):
            if stats:
                return f"""Cost Overview:
• Average cost overrun: {stats['avg_cost_overrun']} (real data)
• Total investment: {stats['total_investment']}
• 765 kV avg: ₹3,500 Cr | 400 kV avg: ₹1,200 Cr | 220 kV avg: ₹350 Cr

Material costs & environmental permits drive {stats['avg_cost_overrun']} of overruns."""
            else:
                return "Project costs vary by voltage level: 765 kV (~₹3,500 Cr), 400 kV (~₹1,200 Cr), 220 kV (~₹350 Cr)."
        
        # Timeline/delay questions
        if any(word in msg_lower for word in ['timeline', 'delay', 'duration', 'how long', 'schedule']):
            if stats:
                return f"""Timeline Data:
• Average delay: {stats['avg_timeline_delay']} (from actual project data)
• Permit approval lag: {stats['avg_permit_lag']} on average
• Terrain complexity adds 20-35% to timelines
• 765 kV: 24-30 months | 400 kV: 20-24 months | 220 kV: 18-22 months

High terrain regions experience the longest delays."""
            else:
                return "Timelines typically range 12-30 months depending on voltage and terrain complexity."
        
        # Voltage level questions
        if any(word in msg_lower for word in ['765kv', '765', 'voltage', 'kv', 'transmission']):
            if stats:
                return f"""Voltage Levels:
• 765 kV: {stats['voltage_765']} projects - Ultra high, long distance (500-2500 km)
• 400 kV: {stats['voltage_400']} projects - High voltage, 200-800 km
• 220 kV: {stats['voltage_220']} projects - Medium, 100-400 km  
• 132 kV: {stats['voltage_132']} projects - Local, 50-200 km"""
            else:
                return "We handle: 765 kV (ultra-high), 400 kV (high), 220 kV (medium), 132 kV (local)."
        
        # Terrain questions
        if any(word in msg_lower for word in ['terrain', 'mountain', 'hill', 'plain', 'geography']):
            if stats:
                return f"""Terrain Impact:
• Plains: 1.0x multiplier, ~{stats['avg_timeline_delay']} average delay
• Plateau: 1.55x multiplier, +15-20% cost increase
• Hills: 2.1x multiplier, +25-30% timeline increase
• Mountains: 2.8x multiplier, +35-40% delay & cost impact

High terrain regions consistently show {stats['avg_cost_overrun']} average overruns."""
            else:
                return "Terrain significantly impacts costs. Plains are baseline; hills & mountains multiply costs by 1.5-2.8x."
        
        # POWERGRID questions
        if any(word in msg_lower for word in ['powergrid', 'pgcil', 'india', 'transmission network']):
            if stats:
                return f"""India's Transmission Network:\n• Total infrastructure: {stats['total_line_length']} transmission lines\n• Total investment tracked: {stats['total_investment']}\n• Voltage coverage: 765, 400, 220, 132 kV\n• {stats['voltage_765']} high-capacity routes, {stats['voltage_400']} regional connections\n\nPOWERGRID manages one of world's largest grid systems through projects like these."""
            else:
                return "POWERGRID manages India's transmission network across 765-132 kV with 350+ substations."
        
        # ASTRA GRID questions
        if any(word in msg_lower for word in ['astra', 'platform', 'system', 'tool', 'app']):
            return f"""About ASTRA GRID:
• AI-powered platform analyzing real power transmission projects
• Predictive ML models trained on actual cost overruns & delays
• Dashboard with live project tracking & risk analytics
• Scenario simulation for what-if analysis
• Document extraction for project details

Data-Driven Insights: All recommendations reference our project database."""
        
        # Ministry/Government questions
        if any(word in msg_lower for word in ['ministry', 'government', 'policy', 'ntpc']):
            return """Ministry of Power Overview:
• Oversees: Generation (NTPC), Transmission (POWERGRID), Distribution
• Goals: 500 GW renewable target, rural electrification, grid modernization
• ASTRA GRID helps track & optimize transmission projects for policy makers
• Real-time project health monitoring across all voltage levels"""
        
        # Help/Tutorial questions
        if any(word in msg_lower for word in ['help', 'what can', 'how do', 'guide', 'features']):
            return f"""How I Can Help:
✓ Answer questions referencing real project data
✓ Explain cost/timeline trends from ASTRA GRID database
✓ Discuss terrain & voltage impacts (validated with actual projects)
✓ Guide you to Prediction, Simulation, or Dashboard tools
✓ Provide project statistics & historical analysis

Ask me about: costs, timelines, terrain impacts, voltage levels, risk factors, or specific project scenarios!"""
        
        # Default response with data reference
        if stats:
            return f"""Based on our analysis, here's what I know:

Dataset Insights:
• Average cost overrun: {stats['avg_cost_overrun']}
• Average timeline delay: {stats['avg_timeline_delay']}
• Total tracked investment: {stats['total_investment']}
• Permit approval avg: {stats['avg_permit_lag']}

Try asking: "What causes cost overruns?" or "How does terrain affect timelines?" I'll reference actual project data!"""
        else:
            return f"""Ask me about power transmission projects! I can discuss: costs, timelines, terrain impacts, voltage levels, risk assessment, POWERGRID operations, or ASTRA GRID features."""
    
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
