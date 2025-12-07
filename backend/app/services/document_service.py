"""
ASTRA GRID - Document Extraction Service
Handles PDF/image document processing and data extraction
"""
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DocumentExtractionService:
    """Handles document extraction and data processing"""
    
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
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
    def extract_text_from_document(file_path):
        """
        Extract text from document using AWS Textract
        Note: Requires AWS credentials configured
        """
        try:
            # Placeholder for AWS Textract integration
            # In production, implement actual Textract calls
            logger.info(f"Document extraction for: {file_path}")
            return {
                'status': 'processing',
                'message': 'Document extraction in progress'
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
