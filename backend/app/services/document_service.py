"""
ASTRA GRID - Document Extraction Service
Handles PDF/image document processing and data extraction
"""
import os
import logging
import re
from datetime import datetime
import PyPDF2
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class DocumentExtractionService:
    """Handles document extraction and data processing"""
    
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'txt'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Field extraction patterns - using snake_case to match frontend form
    FIELD_PATTERNS = {
        'project_type': [
            r'Project\s+Type\s+([^\n]+?)(?:\s+Target|$)',
            r'Project Type[:\s]+([A-Za-z\s]+)',
        ],
        'target_cost_inr': [
            r'Target\s+Project\s+Cost\s+[■₹]?\s*([\d.]+)\s*Crore',
            r'Project\s+Cost\s+[■₹]?\s*([\d.]+)\s*Crore',
            r'Target.*?Cost.*?[■₹]?\s*([\d.]+)\s*Crore',
        ],
        'target_duration_days': [
            r'Target\s+Duration\s+([\d]+)\s*Days',
            r'Duration\s+([\d]+)\s*Days',
        ],
        'voltage_level_kv': [
            r'Voltage\s+Level\s+([\d]+)\s*kV',
            r'(\d{2,4})\s*kV',
        ],
        'line_length_km': [
            r'Transmission\s+Line\s+Length\s+([\d]+)\s*km',
            r'Line\s+Length\s+([\d]+)\s*km',
            r'(\d{2,4})\s*km\s+long',
        ],
        'number_of_bays': [
            r'Number\s+of\s+Bays\s+([\d]+)',
            r'(\d+)\s+new\s+bays',
            r'with\s+(\d+)\s+bays',
        ],
        'terrain_complexity_index': [
            r'Terrain\s+Complexity\s+Index\s+([\d]+)\s*/\s*10',
            r'terrain\s+index\s+of\s+([\d]+)',
        ],
        'environmental_impact_severity': [
            r'Environmental\s+Impact\s+Severity\s+([\d]+)\s*/\s*5',
            r'Environmental.*?Severity\s+([\d]+)',
        ],
        'forest_land_required_ha': [
            r'Forest\s+Land\s+Requirement\s+([\d]+)\s*Hectares',
            r'(\d+)\s+hectares\s+of.*?forest',
        ],
        'annual_rainfall_mm': [
            r'Annual\s+Rainfall\s+([\d]+)\s*mm',
            r'rainfall\s+of\s+([\d]+)\s*mm',
        ],
        'num_required_permits': [
            r'Number\s+of\s+Statutory\s+Permits\s+([\d]+)',
            r'(\d+)\s+mandatory\s+permits',
            r'(\d+).*?permits',
        ],
        'average_permit_lag_days': [
            r'Average\s+Permit\s+Processing\s+Time\s+([\d]+)\s*Days',
            r'(\d+)[-\s]day\s+approval',
        ],
        'regulatory_hotspot_region': [
            r'Regulatory\s+Hotspot\s+Classification\s+([A-Za-z]+)',
            r'hotspot\s+rating\s+marked\s+as\s+([A-Za-z]+)',
        ],
        'labour_cost_estimate_inr': [
            r'Estimated\s+Labour\s+Cost\s+[■₹]?\s*([\d.]+)\s*[Cc]rore',
            r'Labour\s+Cost\s+[■₹]?\s*([\d.]+)\s*crore',
            r'labour\s+outlay\s+of\s+[■₹]?\s*([\d.]+)\s*crore',
        ],
        'material_cost_estimate_inr': [
            r'Estimated\s+Material\s+Cost\s+[■₹]?\s*([\d.]+)\s*[Cc]rore',
            r'Material\s+Cost\s+[■₹]?\s*([\d.]+)\s*crore',
            r'material\s+procurement\s+of\s+[■₹]?\s*([\d.]+)\s*crore',
        ],
        'num_skilled_workers_required': [
            r'Skilled\s+Workforce\s+Requirement\s+([\d]+)\s*Workers',
            r'(\d+)\s+skilled\s+workers',
        ],
        'vendor_performance_rating': [
            r'Vendor\s+Performance\s+Rating\s+([\d]+)\s*/\s*5',
            r'vendor.*?rating\s+of\s+([\d]+)',
        ],
        'material_availability_issue': [
            r'Material\s+Availability\s+Risk\s+([A-Za-z]+)',
            r'Material\s+supply\s+risk\s+is\s+assessed\s+as\s+([A-Za-z]+)',
        ],
    }
    
    @staticmethod
    def is_allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in DocumentExtractionService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_file(file):
        """Validate file for upload"""
        try:
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > DocumentExtractionService.MAX_FILE_SIZE:
                return False, f"File too large. Maximum size: {DocumentExtractionService.MAX_FILE_SIZE / 1024 / 1024}MB"
            
            if not DocumentExtractionService.is_allowed_file(file.filename):
                return False, f"Unsupported file type. Allowed: {', '.join(DocumentExtractionService.ALLOWED_EXTENSIONS)}"
            
            return True, "File valid"
        
        except Exception as e:
            logger.error(f"File validation error: {e}")
            return False, str(e)
    
    @staticmethod
    def extract_text_from_pdf(file):
        """Extract text from PDF file"""
        try:
            # Reset file pointer
            file.seek(0)
            
            # Read PDF
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Extract text from all pages
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            logger.info(f"✓ Extracted {len(text)} characters from PDF")
            return text, None
        
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return None, str(e)
    
    @staticmethod
    def extract_fields_from_text(text):
        """Extract specific fields from text using pattern matching"""
        extracted_fields = {}
        
        try:
            # Try each field pattern
            for field_name, patterns in DocumentExtractionService.FIELD_PATTERNS.items():
                for pattern in patterns:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        value = match.group(1).strip()
                        
                        # Convert values to appropriate types
                        if field_name in ['target_cost_inr', 'labour_cost_estimate_inr', 'material_cost_estimate_inr']:
                            # Convert Crore to raw INR value (multiply by 10,000,000)
                            try:
                                crore_value = float(value)
                                inr_value = crore_value * 10000000
                                extracted_fields[field_name] = str(int(inr_value))
                            except ValueError:
                                extracted_fields[field_name] = value
                        elif field_name == 'material_availability_issue':
                            # Convert "Low" to 0, "Medium" to 1, "High" to 2
                            value_lower = value.lower()
                            if 'low' in value_lower:
                                extracted_fields[field_name] = "Low"
                            elif 'medium' in value_lower:
                                extracted_fields[field_name] = "Medium"
                            elif 'high' in value_lower:
                                extracted_fields[field_name] = "High"
                            else:
                                extracted_fields[field_name] = value
                        elif field_name == 'regulatory_hotspot_region':
                            # Capitalize first letter
                            extracted_fields[field_name] = value.capitalize()
                        else:
                            extracted_fields[field_name] = value
                        
                        break  # Found match, move to next field
            
            logger.info(f"✓ Extracted {len(extracted_fields)} fields from document")
            return extracted_fields, None
        
        except Exception as e:
            logger.error(f"Field extraction error: {e}")
            return None, str(e)
    
    @staticmethod
    def extract_text_from_document(file):
        """
        Extract text and fields from document
        """
        try:
            filename = secure_filename(file.filename)
            file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            # Extract text based on file type
            if file_ext == 'pdf':
                text, error = DocumentExtractionService.extract_text_from_pdf(file)
                if error:
                    return None, error
            elif file_ext == 'txt':
                file.seek(0)
                text = file.read().decode('utf-8')
            else:
                return None, f"Unsupported file type for text extraction: {file_ext}"
            
            # Extract structured fields from text
            fields, error = DocumentExtractionService.extract_fields_from_text(text)
            if error:
                return None, error
            
            if not fields:
                return None, "No recognizable fields found in document"
            
            return {
                'success': True,
                'fields': fields,
                'extracted_text': text[:500]  # First 500 chars for preview
            }, None
        
        except Exception as e:
            logger.error(f"Document extraction error: {e}")
            return None, str(e)
    
    @staticmethod
    def process_extracted_data(raw_data):
        """Process and structure extracted data"""
        try:
            # Parse and structure the extracted data
            processed = {
                'extraction_date': datetime.utcnow().isoformat(),
                'data': raw_data
            }
            return processed, None
        
        except Exception as e:
            logger.error(f"Data processing error: {e}")
            return None, str(e)
