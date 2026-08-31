"""
ASTRA GRID - Document Extraction Routes
File upload and document processing
"""
from flask import Blueprint, request, jsonify
from app.services.document_service import DocumentExtractionService
from app.middleware.auth import token_required
import os

# Create blueprint
document_bp = Blueprint('document', __name__, url_prefix='/api/document')

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'}

def allowed_file(filename):
    """Check if file is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@document_bp.route('/upload', methods=['POST'])
@token_required
def upload_document(current_user):
    """
    Upload document for extraction
    POST /api/document/upload
    
    Form data:
    - file: Document file (PDF, PNG, JPG, etc.)
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file has name
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Validate file
        valid, message = DocumentExtractionService.validate_file(file)
        if not valid:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        # Extract data from document
        result, error = DocumentExtractionService.extract_text_from_document(file)
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 500
        
        # Return extracted fields
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@document_bp.route('/status/<file_id>', methods=['GET'])
@token_required
def get_extraction_status(current_user, file_id):
    """
    Get document extraction status
    GET /api/document/status/<file_id>
    """
    try:
        return jsonify({
            'success': True,
            'file_id': file_id,
            'status': 'processing',
            'message': 'Document is being processed'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@document_bp.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """
    Get list of supported file formats
    GET /api/document/supported-formats
    """
    return jsonify({
        'success': True,
        'supported_formats': list(ALLOWED_EXTENSIONS),
        'max_file_size_mb': 50
    })
