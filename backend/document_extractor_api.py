import os
import boto3
import json
import re
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from PIL import Image
from pdf2image import convert_from_path
import PyPDF2

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'backend/uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'pdf', 'tiff'}

# Initialize AWS clients (with fallback)
aws_available = False
textract_client = None
comprehend_client = None

try:
    if os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('AWS_SECRET_ACCESS_KEY'):
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
        aws_available = True
        print("✓ AWS clients initialized successfully")
    else:
        print("⚠ AWS credentials not found - using fallback extraction")
except Exception as e:
    print(f"⚠ AWS initialization failed: {str(e)} - using fallback extraction")

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def extract_text_with_fallback(file_path):
    """Extract text with AWS Textract, fallback to PyPDF2 or PIL if needed"""
    file_ext = file_path.lower().split('.')[-1]
    all_text = ""
    
    # Try AWS Textract first if available
    if aws_available and textract_client:
        try:
            if file_ext == 'pdf':
                # For large PDFs, limit to first 30 pages to avoid timeout
                images = convert_from_path(file_path, dpi=150, first_page_only=False)
                max_pages = min(len(images), 30)
                print(f"Processing {max_pages} pages of {len(images)} total pages...")
                
                for i, image in enumerate(images[:max_pages]):
                    img_byte_arr = io.BytesIO()
                    image.save(img_byte_arr, format='PNG')
                    img_byte_arr = img_byte_arr.getvalue()
                    
                    if len(img_byte_arr) > 5 * 1024 * 1024:
                        image.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
                        img_byte_arr = io.BytesIO()
                        image.save(img_byte_arr, format='PNG')
                        img_byte_arr = img_byte_arr.getvalue()
                    
                    response = textract_client.detect_document_text(
                        Document={'Bytes': img_byte_arr}
                    )
                    for block in response['Blocks']:
                        if block['BlockType'] == 'LINE':
                            all_text += block['Text'] + "\n"
                
                if len(images) > max_pages:
                    all_text += f"\n[... {len(images) - max_pages} more pages not processed ...]"
            else:
                with open(file_path, 'rb') as document:
                    image_bytes = document.read()
                
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
            
            if all_text.strip():
                return all_text
        except Exception as e:
            print(f"Textract failed: {str(e)}, using fallback...")
    
    # Fallback extraction methods
    print("Using fallback extraction method...")
    try:
        if file_ext == 'pdf':
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    all_text += page.extract_text() + "\n"
        else:
            # For images, try to read metadata or generate sample data
            # In production, you'd use pytesseract or easyocr here
            image = Image.open(file_path)
            all_text = f"Image extracted from {file_path}: {image.size} pixels, {image.format} format"
        
        return all_text if all_text.strip() else "Document extracted (content limited without OCR library)"
    except Exception as e:
        print(f"Fallback extraction failed: {str(e)}")
        raise


def extract_text_from_image(file_path):
    """Extract text from image/PDF using AWS Textract with fallback"""
    return extract_text_with_fallback(file_path)


def extract_entities_with_comprehend(text):
    """Use AWS Comprehend to extract entities and key phrases, with fallback"""
    entities = []
    key_phrases = []
    
    if len(text.strip()) > 0:
        text_limited = text[:5000] if len(text) > 5000 else text
        
        # Try AWS Comprehend first
        if aws_available and comprehend_client:
            try:
                entity_response = comprehend_client.detect_entities(
                    Text=text_limited,
                    LanguageCode='en'
                )
                entities = entity_response.get('Entities', [])
                
                key_phrase_response = comprehend_client.detect_key_phrases(
                    Text=text_limited,
                    LanguageCode='en'
                )
                key_phrases = key_phrase_response.get('KeyPhrases', [])
                return entities, key_phrases
            except Exception as e:
                print(f"Comprehend failed: {str(e)}, using fallback...")
        
        # Fallback: Simple regex-based entity extraction
        print("Using fallback entity extraction...")
        words = text_limited.split()
        
        # Extract numbers and quantities
        numbers = re.findall(r'\b(\d+(?:\.\d+)?)\s*(km|KV|kV|ha|days?|mm|INR|Rs)\b', text_limited, re.IGNORECASE)
        for number, unit in numbers:
            entities.append({
                'Text': f"{number} {unit}",
                'Type': 'QUANTITY',
                'Score': 0.9
            })
        
        # Extract key phrases (capitalized words and common terms)
        common_terms = ['transmission', 'line', 'substation', 'voltage', 'terrain', 'environmental', 
                       'permit', 'cost', 'duration', 'rainfall', 'forest', 'workers', 'vendor']
        for term in common_terms:
            if term.lower() in text_limited.lower():
                key_phrases.append({
                    'Text': term,
                    'Score': 0.8
                })
    
    return entities, key_phrases


def extract_fields_from_text(text, entities, key_phrases):
    """Extract specific fields using AWS Comprehend NLP entities and key phrases"""
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
    
    # Table patterns for common field formats
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
                        if len(match.groups()) > 1:
                            fields[field_name] = int(match.group(1))
                        else:
                            fields[field_name] = int(match.group(1))
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
        
        try:
            entity_pos = text_lower.find(entity_text_lower)
            if entity_pos == -1:
                continue
            context_start = max(0, entity_pos - 150)
            context_end = min(len(text), entity_pos + len(entity_text) + 150)
            context = text_lower[context_start:context_end]
        except:
            context = entity_text_lower
        
        if entity_type == 'QUANTITY':
            numbers = re.findall(r'([\d,\.]+)', entity_text)
            if not numbers:
                continue
            
            value = numbers[0].replace(',', '')
            
            try:
                # Voltage
                if 'kv' in entity_text_lower and fields['voltage_level_kv'] is None:
                    fields['voltage_level_kv'] = float(value)
                
                # Line length
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
                    cost_value = float(value) * 10000000
                    if ('target' in context and 'project' in context) or 'target project cost' in context:
                        if fields['target_cost_inr'] is None:
                            fields['target_cost_inr'] = cost_value
                    elif 'labour' in context and fields['labour_cost_estimate_inr'] is None:
                        fields['labour_cost_estimate_inr'] = cost_value
                    elif 'material' in context and fields['material_cost_estimate_inr'] is None:
                        fields['material_cost_estimate_inr'] = cost_value
            except:
                pass
        
        # Extract project type and classifications
        elif entity_type == 'OTHER' or entity_type == 'TITLE':
            if 'transmission' in entity_text_lower and 'line' in entity_text_lower and fields['project_type'] is None:
                fields['project_type'] = 'Transmission Line'
            elif entity_text_lower in ['high', 'medium', 'low']:
                if 'regulatory' in context and 'hotspot' in context and fields['regulatory_hotspot_region'] is None:
                    fields['regulatory_hotspot_region'] = entity_text_lower
                elif 'material' in context and 'availability' in context and fields['material_availability_issue'] is None:
                    fields['material_availability_issue'] = entity_text_lower
    
    # Fallback patterns for fields not found via NLP
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


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'document-extractor'}), 200


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


if __name__ == '__main__':
    print("\n📄 Document Extractor API")
    print("🌐 Running on: http://localhost:5004")
    print("📤 Endpoint: POST /upload\n")
    
    app.run(debug=True, host='0.0.0.0', port=5004)
