"""
Power Grid AI Assistant - Flask Backend
Standalone backend for AI-powered power grid project queries
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
from werkzeug.utils import secure_filename
from config import get_config
from nlp_processor import NLPProcessor
from database_handler import DatabaseHandler
from file_processor import FileProcessor
from ml_predictor import MLPredictor
from web_search_handler import WebSearchHandler

# Enable error logging
import logging
logging.basicConfig(
    filename='flask_errors.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Load configuration
CONFIG = get_config()

app = Flask(__name__)
app.config.from_object(CONFIG)
CORS(app)

# Create upload folder if it doesn't exist
if not os.path.exists(CONFIG.UPLOAD_FOLDER):
    os.makedirs(CONFIG.UPLOAD_FOLDER)

# Initialize components
db_handler = DatabaseHandler('power_grid.db')
nlp_processor = NLPProcessor()
file_processor = FileProcessor()
ml_predictor = MLPredictor()
web_search_handler = WebSearchHandler()

# Conversation context storage
conversation_context = {
    'last_query': None,
    'last_intent': None,
    'last_entities': {},
    'last_result': None,
    'last_project': None
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in CONFIG.ALLOWED_EXTENSIONS


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages with NLP processing"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Use regex-based NLP with context
        intent, entities = nlp_processor.process_message(user_message, conversation_context)
        
        # Check web search only if NLP found nothing relevant
        if intent in ['general_query', 'unknown', 'domain_validation_failed']:
            if web_search_handler.is_power_grid_query(user_message):
                intent = 'web_search'
        
        # Generate response based on intent
        response = generate_response(intent, entities, user_message, conversation_context)
        
        # Update conversation context
        conversation_context['last_query'] = user_message
        conversation_context['last_intent'] = intent
        conversation_context['last_entities'] = entities
        conversation_context['last_result'] = response.get('data')
        
        if response.get('data') and isinstance(response.get('data'), dict):
            if 'Project_ID' in response.get('data', {}):
                conversation_context['last_project'] = response['data']
        
        if not response:
            response = {'text': 'Sorry, I could not process your request.'}
        
        return jsonify({
            'response': response.get('text', 'No response generated'),
            'data': response.get('data'),
            'chart_type': response.get('chart_type')
        })
    
    except Exception as e:
        error_msg = f"Error in chat endpoint: {e}"
        logging.error(error_msg)
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({'error': 'Sorry, I encountered an error. Please try again.'}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        stats = db_handler.get_dashboard_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get recent projects"""
    try:
        limit = request.args.get('limit', 10, type=int)
        projects = db_handler.get_recent_projects(limit)
        return jsonify(projects)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and ML prediction"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload PDF, DOCX, or TXT files.'}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            extracted_data = file_processor.process_file(filepath)
            
            if 'error' in extracted_data:
                return jsonify({'success': False, 'error': extracted_data['error']}), 400
            
            prediction_result = ml_predictor.predict(extracted_data)
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'extracted_data': extracted_data,
                'prediction': prediction_result,
                'message': 'File processed successfully'
            })
        
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_response(intent, entities, user_message, context=None):
    """Generate response based on intent and entities"""
    
    if context is None:
        context = {}
    
    if not entities.get('is_domain_valid', True) and intent == 'general_query':
        return {
            'text': '⚠️ I\'m a specialized AI assistant for **Power Grid and Electricity Board queries only**.\n\nI can help with:\n• Transmission projects and infrastructure\n• Ministry of Power initiatives\n• Electricity board operations\n• Project costs, timelines, and delays\n• Regional power distribution\n• Voltage levels and technical specifications\n\nPlease ask questions related to power grid, electricity, or transmission projects.'
        }
    
    if intent == 'greeting':
        return {
            'text': 'Hello! I\'m your Power Grid AI Assistant. I can help you with:\n\n📊 **Your Database**: Project costs, timelines, regional data\n🌐 **Web Knowledge**: Latest policies, technologies, general info\n💬 **Natural Conversation**: Ask me anything about power grids!\n\nHow can I assist you today?'
        }
    
    elif intent == 'web_search':
        web_result = web_search_handler.get_web_answer(user_message)
        return {
            'text': web_result['text'],
            'data': web_result.get('sources')
        }
    
    elif intent == 'project_problems':
        project = entities.get('context_project') or context.get('last_project')
        if project:
            response_text = f"📋 **Issues & Challenges for {project.get('Project_Type', 'Project')}:**\n\n"
            cost_overrun = project.get('Cost_Overrun_Percent', 0)
            duration = project.get('Actual_Duration_Days', 0)
            
            if cost_overrun < 0:
                response_text += f"✅ **Cost Management**: Project came in UNDER budget by {abs(cost_overrun):.2f}%\n\n"
            elif cost_overrun > 10:
                response_text += f"⚠️ **Cost Overrun**: {cost_overrun:.2f}% over budget - major cost challenges\n\n"
            else:
                response_text += f"💰 **Cost**: {cost_overrun:.2f}% overrun - relatively managed\n\n"
            
            if duration > 1000:
                response_text += f"⏱️ **Long Duration**: {duration} days ({duration//365} years) indicates:\n"
                response_text += f"  • Complex infrastructure requirements\n"
                response_text += f"  • Possible regulatory delays\n"
                response_text += f"  • Large-scale transmission system\n\n"
            
            response_text += f"**Common challenges in {project.get('Voltage_Level_kV')}kV projects:**\n"
            response_text += f"  • Land acquisition and right-of-way clearances\n"
            response_text += f"  • Environmental and forest clearances\n"
            response_text += f"  • Regulatory approvals from multiple states\n"
            response_text += f"  • Coordination with local electricity boards\n"
            response_text += f"  • Technical challenges in {project.get('Regulatory_Hotspot_Region')} terrain\n"
            
            return {'text': response_text, 'data': project}
        else:
            return {'text': '⚠️ Please first ask about a specific project, then I can tell you about its challenges.'}
    
    elif intent == 'project_timeline':
        project = entities.get('context_project') or context.get('last_project')
        if project:
            duration = project.get('Actual_Duration_Days', 0)
            years = duration // 365
            months = (duration % 365) // 30
            
            response_text = f"📅 **Timeline Details:**\n\n"
            response_text += f"**Duration:** {duration} days ({years} years, {months} months)\n"
            response_text += f"**Year:** {project.get('Year')}\n"
            response_text += f"**Project Type:** {project.get('Project_Type')}\n\n"
            
            if duration > 1200:
                response_text += f"⏱️ **Extended Timeline** - This is longer than average due to:\n"
                response_text += f"  • Large-scale infrastructure ({project.get('Voltage_Level_kV')}kV)\n"
                response_text += f"  • Multiple state coordination\n"
                response_text += f"  • Complex regulatory approvals\n"
            
            return {'text': response_text, 'data': project}
        else:
            return {'text': '⚠️ Please first ask about a specific project, then I can share timeline details.'}
    
    elif intent == 'similar_projects':
        project = entities.get('context_project') or context.get('last_project')
        if project:
            voltage = project.get('Voltage_Level_kV')
            region = project.get('Regulatory_Hotspot_Region')
            similar = db_handler.get_similar_projects(voltage=voltage, region=region, limit=5)
            
            if similar:
                response_text = f"🔍 **Similar Projects ({voltage}kV in {region}):**\n\n"
                for i, proj in enumerate(similar, 1):
                    cost_cr = proj['Actual_Cost_INR'] / 10000000
                    response_text += f"{i}. **{proj['Project_Type']}**\n"
                    response_text += f"   ID: {proj['Project_ID']}\n"
                    response_text += f"   Cost: ₹{cost_cr:,.2f} Cr\n"
                    response_text += f"   Duration: {proj['Actual_Duration_Days']} days\n"
                    response_text += f"   Year: {proj['Year']}\n"
                    if proj.get('Cost_Overrun_Percent'):
                        response_text += f"   Overrun: {proj['Cost_Overrun_Percent']:.2f}%\n"
                    response_text += "\n"
                
                response_text += f"**Summary**: Found {len(similar)} similar projects in {region} at {voltage}kV level"
                return {'text': response_text, 'data': similar}
            else:
                return {'text': f'No other projects found with {voltage}kV voltage level in {region}.'}
        else:
            return {'text': '⚠️ Please first ask about a specific project, then I can find similar ones.'}
    
    elif intent == 'highest_cost':
        data = db_handler.get_highest_cost_project()
        if data:
            cost_cr = data['Actual_Cost_INR'] / 10000000
            response_text = f"🏆 **Highest Cost Project:**\n\n"
            response_text += f"**Project:** {data['Project_Type']}\n"
            response_text += f"**ID:** {data['Project_ID']}\n"
            response_text += f"**Cost:** ₹{cost_cr:,.2f} Crores\n"
            response_text += f"**Region:** {data['Regulatory_Hotspot_Region']}\n"
            response_text += f"**Voltage:** {data['Voltage_Level_kV']}kV\n"
            response_text += f"**Duration:** {data['Actual_Duration_Days']} days\n"
            response_text += f"**Year:** {data['Year']}\n"
            if data.get('Cost_Overrun_Percent'):
                response_text += f"**Cost Overrun:** {data['Cost_Overrun_Percent']:.2f}%\n"
            return {'text': response_text, 'data': data}
        return {'text': 'No project data found.'}
    
    elif intent == 'lowest_cost':
        data = db_handler.get_lowest_cost_project()
        if data:
            cost_cr = data['Actual_Cost_INR'] / 10000000
            response_text = f"💰 **Lowest Cost Project:**\n\n"
            response_text += f"**Project:** {data['Project_Type']}\n"
            response_text += f"**ID:** {data['Project_ID']}\n"
            response_text += f"**Cost:** ₹{cost_cr:,.2f} Crores\n"
            response_text += f"**Region:** {data['Regulatory_Hotspot_Region']}\n"
            response_text += f"**Voltage:** {data['Voltage_Level_kV']}kV\n"
            response_text += f"**Duration:** {data['Actual_Duration_Days']} days\n"
            response_text += f"**Year:** {data['Year']}\n"
            return {'text': response_text, 'data': data}
        return {'text': 'No project data found.'}
    
    elif intent == 'project_count':
        count = db_handler.count_projects(entities)
        project_type = entities.get('project_type', 'projects')
        region = entities.get('region', '')
        
        response_text = f"📊 **Project Count:**\n\n"
        response_text += f"There are **{count}** {project_type}"
        if region:
            response_text += f" in **{region}**"
        response_text += " in the database."
        
        return {'text': response_text, 'data': {'count': count, 'type': project_type, 'region': region}}
    
    elif intent == 'cost_analysis':
        data = db_handler.get_cost_analysis(entities)
        region = entities.get('region', 'all regions')
        return {
            'text': f'Here\'s the cost analysis for {region}. Average cost overrun: {data["avg_overrun"]:.2f}%, Total projects: {data["total_projects"]}',
            'data': data,
            'chart_type': 'bar'
        }
    
    elif intent == 'timeline_query':
        data = db_handler.get_timeline_analysis(entities)
        return {
            'text': f'Timeline analysis shows average delay of {data["avg_delay"]} days across {data["total_projects"]} projects.',
            'data': data,
            'chart_type': 'line'
        }
    
    elif intent == 'region_query':
        region = entities.get('region')
        data = db_handler.get_region_data(region)
        return {
            'text': f'Data for {region}: {data["project_count"]} projects with average cost of ₹{data["avg_cost"]/10000000:.2f} Cr',
            'data': data,
            'chart_type': 'pie'
        }
    
    elif intent == 'project_details':
        project_id = entities.get('project_id')
        data = db_handler.get_project_details(project_id)
        if data:
            return {
                'text': f'Project: {data["Project_Type"]}\nCost: ₹{data["Actual_Cost_INR"]/10000000:.2f} Cr\nDuration: {data["Actual_Duration_Days"]} days\nRegion: {data["Regulatory_Hotspot_Region"]}',
                'data': data
            }
        return {'text': 'Project not found.'}
    
    elif intent == 'cost_overrun':
        data = db_handler.get_cost_overrun_projects()
        return {
            'text': f'Found {len(data)} projects with cost overruns. Average overrun: {sum(p["Cost_Overrun_Percent"] for p in data)/len(data):.2f}%',
            'data': data,
            'chart_type': 'bar'
        }
    
    elif intent == 'voltage_level':
        voltage = entities.get('voltage_level')
        data = db_handler.get_projects_by_voltage(voltage)
        return {'text': f'There are {len(data)} projects at {voltage}kV voltage level.', 'data': data}
    
    else:
        # General query - try general search
        results = db_handler.search_general(user_message)
        if results:
            response_text = f"🔍 **Search Results:**\n\n"
            response_text += f"I found **{len(results)}** projects matching your query.\n\n"
            if len(results) > 0:
                response_text += "Here are the top results:"
            return {'text': response_text, 'data': results}
        
        if entities.get('is_domain_valid', False):
            return {
                'text': '❓ I couldn\'t find specific data for your query. Could you rephrase?\n\nTry asking:\n• "What is the highest cost project?"\n• "Show me projects in Gujarat"\n• "How many delayed projects?"\n• "Cost analysis for Maharashtra"\n• "Show 765kV transmission lines"'
            }
        else:
            return {
                'text': '⚠️ I can only answer questions about **power grid, electricity boards, and Ministry of Power** projects.\n\nPlease ask about transmission projects, costs, timelines, or regional data.'
            }


if __name__ == '__main__':
    db_handler.initialize_database()
    print("Server starting on http://localhost:5000")
    app.run(debug=False, port=5000, threaded=True)
