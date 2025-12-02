import re
from typing import Dict, Any
import os

class FileProcessor:
    """Extract project information from uploaded files"""
    
    def __init__(self):
        self.patterns = {
            'project_type': r'(?:project type|type)[:\s]+([^\n]+)',
            'cost': r'(?:cost|budget|investment)[:\s]+(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(?:cr|crore|lakh)?',
            'duration': r'(?:duration|timeline|period)[:\s]+([\d]+)\s*(?:days|months)',
            'voltage': r'(765|400|220|132)\s*kV',
            'region': r'(?:region|state|location)[:\s]+([^\n]+)',
            'line_length': r'(?:length|distance)[:\s]+([\d.]+)\s*(?:km|kilometer)',
            'terrain': r'(?:terrain|complexity)[:\s]+([^\n]+)',
        }
    
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        """Extract project information from text content"""
        extracted_data = {}
        text_lower = text.lower()
        
        match = re.search(self.patterns['project_type'], text_lower, re.IGNORECASE)
        if match:
            extracted_data['project_type'] = match.group(1).strip()
        
        match = re.search(self.patterns['cost'], text_lower, re.IGNORECASE)
        if match:
            cost_str = match.group(1).replace(',', '')
            extracted_data['cost_inr'] = float(cost_str)
        
        match = re.search(self.patterns['duration'], text_lower, re.IGNORECASE)
        if match:
            extracted_data['duration_days'] = int(match.group(1))
        
        match = re.search(self.patterns['voltage'], text, re.IGNORECASE)
        if match:
            extracted_data['voltage_level'] = int(match.group(1))
        
        match = re.search(self.patterns['region'], text_lower, re.IGNORECASE)
        if match:
            extracted_data['region'] = match.group(1).strip()
        
        match = re.search(self.patterns['line_length'], text_lower, re.IGNORECASE)
        if match:
            extracted_data['line_length_km'] = float(match.group(1))
        
        match = re.search(self.patterns['terrain'], text_lower, re.IGNORECASE)
        if match:
            extracted_data['terrain'] = match.group(1).strip()
        
        return extracted_data
    
    def extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text()
            return text
        except ImportError:
            return "PyPDF2 not installed. Please install: pip install PyPDF2"
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"
    
    def extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            from docx import Document
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except ImportError:
            return "python-docx not installed. Please install: pip install python-docx"
        except Exception as e:
            return f"Error extracting DOCX: {str(e)}"
    
    def extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            return f"Error reading file: {str(e)}"
    
    def process_file(self, file_path: str) -> Dict[str, Any]:
        """Process uploaded file and extract project information"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            text = self.extract_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            text = self.extract_from_docx(file_path)
        elif file_ext == '.txt':
            text = self.extract_from_txt(file_path)
        else:
            return {'error': 'Unsupported file format. Please upload PDF, DOCX, or TXT files.'}
        
        extracted_data = self.extract_from_text(text)
        extracted_data['original_text'] = text[:500]
        
        return extracted_data
