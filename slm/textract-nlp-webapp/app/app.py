import os
import boto3
import json
import re
import io
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from PIL import Image
from pdf2image import convert_from_path
import PyPDF2

load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'app/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'pdf', 'tiff'}

# Initialize AWS clients
textract_client = boto3.client(
    'textract',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

comprehend_client = boto3.client(
    'comprehend',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def extract_text_from_image(file_path):
    """Extract text from image/PDF using AWS Textract"""
    file_ext = file_path.lower().split('.')[-1]
    all_text = ""
    
    try:
        if file_ext == 'pdf':
            # Convert PDF to images first
            try:
                images = convert_from_path(file_path, dpi=200)
            except Exception as pdf_error:
                print(f"PDF conversion error: {str(pdf_error)}")
                # Fallback: Try reading PDF text directly
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        all_text += page.extract_text() + "\n"
                return all_text if all_text.strip() else "No text could be extracted from PDF"
            
            # Process each page as an image
            for i, image in enumerate(images):
                # Convert PIL image to bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                
                # Check size limit (5MB for Textract)
                if len(img_byte_arr) > 5 * 1024 * 1024:
                    # Resize image if too large
                    image.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
                    img_byte_arr = io.BytesIO()
                    image.save(img_byte_arr, format='PNG')
                    img_byte_arr = img_byte_arr.getvalue()
                
                # Extract text from this page
                response = textract_client.detect_document_text(
                    Document={'Bytes': img_byte_arr}
                )
                
                for block in response['Blocks']:
                    if block['BlockType'] == 'LINE':
                        all_text += block['Text'] + "\n"
        else:
            # For images, use detect_document_text
            with open(file_path, 'rb') as document:
                image_bytes = document.read()
            
            # Check size and resize if needed
            if len(image_bytes) > 5 * 1024 * 1024:
                image = Image.open(file_path)
                image.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                image_bytes = img_byte_arr.getvalue()
            
            response = textract_client.detect_document_text(
                Document={'Bytes': image_bytes}
            )
            
            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    all_text += block['Text'] + "\n"
        
        return all_text
    except Exception as e:
        print(f"Textract error: {str(e)}")
        raise


def extract_entities_with_comprehend(text):
    """Use AWS Comprehend to extract entities and key phrases"""
    entities = []
    key_phrases = []
    
    if len(text.strip()) > 0:
        # Limit text to 5000 bytes for Comprehend
        text_limited = text[:5000] if len(text) > 5000 else text
        
        try:
            # Extract entities
            entity_response = comprehend_client.detect_entities(
                Text=text_limited,
                LanguageCode='en'
            )
            entities = entity_response.get('Entities', [])
            
            # Extract key phrases
            key_phrase_response = comprehend_client.detect_key_phrases(
                Text=text_limited,
                LanguageCode='en'
            )
            key_phrases = key_phrase_response.get('KeyPhrases', [])
        except Exception as e:
            print(f"Comprehend error: {str(e)}")
    
    return entities, key_phrases


def extract_fields_from_text(text, entities, key_phrases):
    """Extract specific fields using AWS Comprehend NLP entities and key phrases"""
    import re
    
    fields = {
        'project_type': None,
        'target_cost_inr': None,
        'target_duration_days': None,
        'voltage_level_kv': None,
        'line_length_km': None,
        'number_of_bays': None,
        'terrain_complexity_index': None,
        'environmental_impact_severity': None,
        'forest_land_required_ha': None,
        'annual_rainfall_mm': None,
        'num_required_permits': None,
        'average_permit_lag_days': None,
        'regulatory_hotspot_region': None,
        'labour_cost_estimate_inr': None,
        'material_cost_estimate_inr': None,
        'num_skilled_workers_required': None,
        'vendor_performance_rating': None,
        'material_availability_issue': None
    }
    
    text_lower = text.lower()
    
    # First, try to extract from table format if present
    # Pattern: "Field Name" followed by value on same/next line
    table_patterns = {
        'target_duration_days': r'target\s+duration\s+(\d+)\s+days?',
        'line_length_km': r'transmission\s+line\s+length\s+(\d+)\s+km',
        'terrain_complexity_index': r'terrain\s+complexity\s+index\s+(\d+)\s*/\s*(\d+)',
        'environmental_impact_severity': r'environmental\s+impact\s+severity\s+(\d+)\s*/\s*(\d+)',
        'num_required_permits': r'number\s+of\s+statutory\s+permits\s+(\d+)',
        'vendor_performance_rating': r'vendor\s+performance\s+rating\s+(\d+)\s*/\s*(\d+)',
        'regulatory_hotspot_region': r'regulatory\s+hotspot\s+classification\s+(high|medium|low)',
        'material_availability_issue': r'material\s+availability\s+risk\s+(high|medium|low)',
    }
    
    for field_name, pattern in table_patterns.items():
        if fields[field_name] is None:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    if field_name in ['terrain_complexity_index', 'environmental_impact_severity', 'vendor_performance_rating']:
                        # Fraction format
                        if len(match.groups()) > 1:
                            fields[field_name] = f"{match.group(1)}/{match.group(2)}"
                        else:
                            fields[field_name] = match.group(1)
                    elif field_name in ['regulatory_hotspot_region', 'material_availability_issue']:
                        fields[field_name] = match.group(1)
                    else:
                        fields[field_name] = int(match.group(1))
                except:
                    pass
    
    # Use AWS Comprehend entities for intelligent extraction
    for entity in entities:
        entity_text = entity['Text']
        entity_text_lower = entity_text.lower()
        entity_type = entity['Type']
        
        # Find context around this entity in the original text
        try:
            entity_pos = text_lower.find(entity_text_lower)
            if entity_pos == -1:
                continue
            context_start = max(0, entity_pos - 150)
            context_end = min(len(text), entity_pos + len(entity_text) + 150)
            context = text_lower[context_start:context_end]
        except:
            context = entity_text_lower
        
        # Extract based on entity type and context
        if entity_type == 'QUANTITY':
            # Extract numbers with units
            numbers = re.findall(r'([\d,\.]+)', entity_text)
            if not numbers:
                continue
            
            value = numbers[0].replace(',', '')
            
            try:
                # Voltage
                if 'kv' in entity_text_lower and fields['voltage_level_kv'] is None:
                    fields['voltage_level_kv'] = float(value)
                
                # Line length - look for km in context
                elif 'km' in entity_text_lower:
                    if ('line' in context or 'stretch' in context or 'transmission' in context) and fields['line_length_km'] is None:
                        fields['line_length_km'] = float(value)
                
                # Rainfall
                elif 'mm' in entity_text_lower and 'rainfall' in context and fields['annual_rainfall_mm'] is None:
                    fields['annual_rainfall_mm'] = float(value)
                
                # Forest land
                elif ('hectare' in entity_text_lower or 'ha' in entity_text_lower) and 'forest' in context and fields['forest_land_required_ha'] is None:
                    fields['forest_land_required_ha'] = float(value)
                
                # Duration in days
                elif 'day' in entity_text_lower:
                    if ('duration' in context or 'target duration' in context or 'timeline' in context or '365' in value) and fields['target_duration_days'] is None:
                        fields['target_duration_days'] = int(float(value))
                    elif ('permit' in context or 'processing' in context or 'approval' in context) and fields['average_permit_lag_days'] is None:
                        fields['average_permit_lag_days'] = int(float(value))
                
                # Workers
                elif 'worker' in entity_text_lower and 'skilled' in context and fields['num_skilled_workers_required'] is None:
                    fields['num_skilled_workers_required'] = int(float(value))
                
                # Bays
                elif 'bay' in entity_text_lower and fields['number_of_bays'] is None:
                    fields['number_of_bays'] = int(float(value))
                
                # Permits count
                elif 'permit' in entity_text_lower and ('statutory' in context or 'number' in context) and fields['num_required_permits'] is None:
                    fields['num_required_permits'] = int(float(value))
                
                # Costs in crore
                elif 'crore' in entity_text_lower or 'crore' in context:
                    cost_value = float(value) * 10000000  # Convert crore to INR
                    if ('target' in context and 'project' in context) or 'target project cost' in context:
                        if fields['target_cost_inr'] is None:
                            fields['target_cost_inr'] = cost_value
                    elif 'labour' in context and fields['labour_cost_estimate_inr'] is None:
                        fields['labour_cost_estimate_inr'] = cost_value
                    elif 'material' in context and fields['material_cost_estimate_inr'] is None:
                        fields['material_cost_estimate_inr'] = cost_value
                
                # Fractions for ratings/indices
                elif '/' in entity_text_lower or 'out of' in entity_text_lower:
                    if 'terrain' in context and fields['terrain_complexity_index'] is None:
                        fraction_match = re.search(r'(\d+)\s*(?:/|out\s+of)\s*(\d+)', entity_text_lower)
                        if fraction_match:
                            fields['terrain_complexity_index'] = f"{fraction_match.group(1)}/{fraction_match.group(2)}"
                    elif 'environmental' in context and fields['environmental_impact_severity'] is None:
                        fraction_match = re.search(r'(\d+)\s*(?:/|out\s+of)\s*(\d+)', entity_text_lower)
                        if fraction_match:
                            fields['environmental_impact_severity'] = f"{fraction_match.group(1)}/{fraction_match.group(2)}"
                    elif 'vendor' in context and 'rating' in context and fields['vendor_performance_rating'] is None:
                        fraction_match = re.search(r'(\d+)\s*(?:/|out\s+of)\s*(\d+)', entity_text_lower)
                        if fraction_match:
                            fields['vendor_performance_rating'] = f"{fraction_match.group(1)}/{fraction_match.group(2)}"
            except:
                pass
        
        # Extract project type and classifications
        elif entity_type == 'OTHER' or entity_type == 'TITLE':
            if 'transmission' in entity_text_lower and 'line' in entity_text_lower and fields['project_type'] is None:
                fields['project_type'] = 'transmission line'
            elif entity_text_lower in ['high', 'medium', 'low']:
                if 'regulatory' in context and 'hotspot' in context and fields['regulatory_hotspot_region'] is None:
                    fields['regulatory_hotspot_region'] = entity_text_lower
                elif 'material' in context and 'availability' in context and fields['material_availability_issue'] is None:
                    fields['material_availability_issue'] = entity_text_lower
    
    # Use key phrases to extract missing fields
    for phrase_obj in key_phrases:
        phrase = phrase_obj['Text'].lower()
        
        # Project type
        if fields['project_type'] is None and 'transmission line' in phrase:
            fields['project_type'] = 'transmission line'
        
        # Regulatory hotspot
        if fields['regulatory_hotspot_region'] is None:
            if 'high regulatory hotspot' in phrase or 'hotspot rating marked as high' in phrase:
                fields['regulatory_hotspot_region'] = 'high'
            elif 'medium regulatory hotspot' in phrase:
                fields['regulatory_hotspot_region'] = 'medium'
            elif 'low regulatory hotspot' in phrase:
                fields['regulatory_hotspot_region'] = 'low'
        
        # Material availability
        if fields['material_availability_issue'] is None:
            if 'material supply risk is assessed as low' in phrase or 'material availability risk as low' in phrase:
                fields['material_availability_issue'] = 'low'
            elif 'material supply risk is assessed as high' in phrase or 'material availability risk as high' in phrase:
                fields['material_availability_issue'] = 'high'
            elif 'material supply risk is assessed as medium' in phrase or 'material availability risk as medium' in phrase:
                fields['material_availability_issue'] = 'medium'
    
    # Minimal fallback patterns for fields not found via NLP
    if fields['target_cost_inr'] is None:
        cost_match = re.search(r'target\s+project\s+cost\s*[:\-■]?\s*[■₹]?\s*([\d,\.]+)\s*crore', text_lower)
        if cost_match:
            try:
                fields['target_cost_inr'] = float(cost_match.group(1).replace(',', '')) * 10000000
            except:
                pass
    
    if fields['labour_cost_estimate_inr'] is None:
        labour_match = re.search(r'(?:estimated\s+)?labour\s+(?:cost|outlay)\s*[:\-■]?\s*[■₹]?\s*([\d,\.]+)\s*crore', text_lower)
        if labour_match:
            try:
                fields['labour_cost_estimate_inr'] = float(labour_match.group(1).replace(',', '')) * 10000000
            except:
                pass
    
    if fields['material_cost_estimate_inr'] is None:
        material_match = re.search(r'(?:estimated\s+)?material\s+(?:procurement|cost)\s*[:\-■]?\s*(?:of\s*)?[■₹]?\s*([\d,\.]+)\s*crore', text_lower)
        if material_match:
            try:
                fields['material_cost_estimate_inr'] = float(material_match.group(1).replace(',', '')) * 10000000
            except:
                pass
    
    return fields


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Extract text using Textract
            extracted_text = extract_text_from_image(filepath)
            
            # Use Comprehend for NLP
            entities, key_phrases = extract_entities_with_comprehend(extracted_text)
            
            # Extract specific fields
            fields = extract_fields_from_text(extracted_text, entities, key_phrases)
            
            # Clean up uploaded file
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'extracted_text': extracted_text,
                'fields': fields,
                'entities': [{'text': e['Text'], 'type': e['Type'], 'score': e['Score']} for e in entities[:10]],
                'key_phrases': [{'text': kp['Text'], 'score': kp['Score']} for kp in key_phrases[:10]]
            })
        
        except Exception as e:
            # Clean up on error
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f'Processing error: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400


@app.route('/capture', methods=['POST'])
def capture_image():
    """Handle camera captured image"""
    data = request.get_json()
    
    if 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400
    
    try:
        import base64
        
        # Extract base64 image data
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Save temporarily
        filename = 'captured_image.png'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        # Extract text using Textract
        extracted_text = extract_text_from_image(filepath)
        
        # Use Comprehend for NLP
        entities, key_phrases = extract_entities_with_comprehend(extracted_text)
        
        # Extract specific fields
        fields = extract_fields_from_text(extracted_text, entities, key_phrases)
        
        # Clean up
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'extracted_text': extracted_text,
            'fields': fields,
            'entities': [{'text': e['Text'], 'type': e['Type'], 'score': e['Score']} for e in entities[:10]],
            'key_phrases': [{'text': kp['Text'], 'score': kp['Score']} for kp in key_phrases[:10]]
        })
    
    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500


if __name__ == '__main__':
    # Run with HTTP (mobile camera now works without HTTPS!)
    print("\n📱 Mobile-friendly camera enabled!")
    print("🌐 Access from mobile: http://10.196.70.56:5000")
    print("💡 Camera works via file input - no HTTPS needed!\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
