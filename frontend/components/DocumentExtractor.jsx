import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatureToggle } from '../hooks/useFeatureToggle';

const DocumentExtractor = ({ isOpen, onClose, onComplete }) => {
  const isDocumentExtractorEnabled = useFeatureToggle('documentExtractor');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFields, setExtractedFields] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // If document extractor is disabled, don't render anything
  if (!isDocumentExtractorEnabled) {
    return null;
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError(`File is too large. Maximum size is 100MB (your file: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleCameraCapture = (e) => {
    const capturedFile = e.target.files[0];
    if (capturedFile) {
      setFile(capturedFile);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(capturedFile);
    }
  };

  const processDocument = async () => {
    if (!file) {
      setError('Please select a file or capture an image');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Attempt extraction with backend
      let response;
      try {
        const token = localStorage.getItem('token');
        const apiUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/document/upload`;
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
      } catch (fetchErr) {
        throw new Error('Cannot connect to extraction service. Make sure the backend is running on port 5000.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.fields) {
        setExtractedFields(data.fields);
        setExtractedText(data.extracted_text || '');
        
        // Call onComplete with extracted fields immediately
        if (onComplete) {
          onComplete(data.fields);
        }
      } else {
        throw new Error(data.error || 'No fields could be extracted from the document');
      }
    } catch (err) {
      console.error('Document processing error:', err);
      setError(err.message || 'An error occurred while processing the document');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setExtractedFields(null);
    setExtractedText('');
    setError('');
    setUseCamera(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <FileText className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Document Field Extractor
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload or capture a document to auto-fill form fields
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!extractedFields ? (
              <div className="space-y-6">
                {/* Upload Options */}
                {!file && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3"
                    >
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">Upload File</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          PNG, JPG, PDF (Max 100MB)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Camera Capture */}
                    <div
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3"
                    >
                      <Camera className="w-12 h-12 text-gray-400" />
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white">Take Photo</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Use device camera
                        </p>
                      </div>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Preview and Process */}
                {file && (
                  <div className="space-y-4">
                    {preview && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800" />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={reset}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={processDocument}
                      disabled={isProcessing}
                      className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing with AI...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Extract Fields
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Results */
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Fields Extracted Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Review the extracted fields below
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extractedFields).map(([key, value]) => {
                    if (value === null || value === undefined) return null;
                    return (
                      <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {value.toString()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentExtractor;
