# 📄 AWS Textract & Comprehend Field Extractor

A web application that extracts structured project fields from documents and images using AWS Textract for OCR and AWS Comprehend for NLP analysis.

## ✨ Features

- **📤 File Upload**: Support for PNG, JPG, JPEG, PDF, and TIFF files (up to 16MB)
- **📷 Camera Capture**: Capture images directly from your device camera
- **🤖 AWS Textract**: Extract text from images and documents with high accuracy
- **🧠 AWS Comprehend**: NLP analysis to detect entities and key phrases
- **📊 Field Extraction**: Automatically extract 18 project-related fields:
  - Project Type
  - Target Cost (INR)
  - Target Duration (Days)
  - Voltage Level (kV)
  - Line Length (km)
  - Number of Bays
  - Terrain Complexity Index
  - Environmental Impact Severity
  - Forest Land Required (ha)
  - Annual Rainfall (mm)
  - Number of Required Permits
  - Average Permit Lag (Days)
  - Regulatory Hotspot Region
  - Labour Cost Estimate (INR)
  - Material Cost Estimate (INR)
  - Skilled Workers Required
  - Vendor Performance Rating
  - Material Availability Issue

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8 or higher
- AWS Account with:
  - AWS Textract access
  - AWS Comprehend access
  - IAM user with appropriate permissions

### Installation

1. **Clone or navigate to the project directory**:
   ```powershell
   cd c:\Users\koion\Desktop\slm\textract-nlp-webapp
   ```

2. **Create a virtual environment**:
   ```powershell
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you encounter execution policy errors, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Install dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

5. **Configure AWS credentials**:
   - Copy `.env.example` to `.env`:
     ```powershell
     Copy-Item .env.example .env
     ```
   - Edit `.env` and add your AWS credentials:
     ```
     AWS_ACCESS_KEY_ID=your_actual_access_key
     AWS_SECRET_ACCESS_KEY=your_actual_secret_key
     AWS_REGION=us-east-1
     ```

### AWS Setup

1. **Create IAM User**:
   - Go to AWS Console → IAM → Users → Add User
   - Enable "Programmatic access"
   - Save the Access Key ID and Secret Access Key

2. **Attach Policies**:
   - `AmazonTextractFullAccess`
   - `ComprehendFullAccess`

## 🎯 Running the Application

1. **Start the Flask server**:
   ```powershell
   python app\app.py
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

3. **Use the application**:
   - Upload a document/image with project information
   - Or use the camera to capture an image
   - View extracted fields and NLP insights

## 📁 Project Structure

```
textract-nlp-webapp/
├── app/
│   ├── static/
│   │   └── style.css          # Application styling
│   ├── templates/
│   │   └── index.html         # Main UI template
│   ├── uploads/               # Temporary file storage
│   └── app.py                 # Flask application
├── .env.example               # Environment variables template
├── .env                       # Your AWS credentials (not in git)
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🔧 Usage Tips

1. **Document Quality**: Ensure text is clear and readable for best results
2. **Field Format**: Use consistent labeling (e.g., "Project Type: Transmission")
3. **Camera**: Use good lighting when capturing images
4. **File Size**: Keep files under 16MB for optimal performance

## 🛡️ Security Notes

- Never commit `.env` file to version control
- Keep AWS credentials secure
- Use IAM roles with minimum required permissions
- Consider implementing request rate limiting for production

## 🐛 Troubleshooting

### AWS Credentials Error
- Verify credentials in `.env` file
- Check IAM user has correct permissions
- Ensure AWS region is correct

### Camera Not Working
- Allow camera permissions in browser
- Try using HTTPS (required for some browsers)
- Check if camera is already in use by another application

### Text Extraction Issues
- Ensure image quality is good
- Check if text is horizontal and readable
- Try with different file formats

## 📝 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📧 Support

For issues or questions, please create an issue in the project repository.
