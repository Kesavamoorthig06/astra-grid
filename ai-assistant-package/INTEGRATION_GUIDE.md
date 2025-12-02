# Power Grid AI Assistant - Integration Package

A standalone AI-powered chat assistant for Power Grid project queries, with database search, web search, voice recognition, and file upload capabilities.

## 📁 Package Structure

```
ai-assistant-package/
├── backend/                    # Flask Backend Server
│   ├── app.py                  # Main Flask application
│   ├── config.py               # Configuration settings
│   ├── database_handler.py     # SQLite database operations
│   ├── nlp_processor.py        # Natural language processing
│   ├── web_search_handler.py   # Web search + knowledge base
│   ├── ml_predictor.py         # ML risk prediction
│   ├── file_processor.py       # File upload processing
│   ├── start_server.py         # Server starter script
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Components
│   ├── components/
│   │   ├── ChatAssistant.jsx   # Main chat component
│   │   └── ChatAssistant.css   # Styles
│   ├── hooks/
│   │   └── useVoiceRecognition.js  # Voice input hook
│   └── services/
│       └── api.js              # API service layer
│
├── data/                       # Data Files (copy from main project)
│   ├── Final_dataset.csv       # Project data CSV
│   ├── power_grid.db           # SQLite database (auto-generated)
│   └── powergrid_risk_model_package.pkl  # ML model
│
└── INTEGRATION_GUIDE.md        # This file
```

---

## 🚀 Quick Setup

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Copy data files to backend folder:**
   - `Final_dataset.csv` (required)
   - `powergrid_risk_model_package.pkl` (optional, for ML prediction)

5. **Start the server:**
   ```bash
   python start_server.py
   ```
   
   Server runs on `http://localhost:5000`

---

### Frontend Integration

#### Option 1: Import into Existing React App

1. **Copy these folders to your React project:**
   - `frontend/components/` → `src/components/`
   - `frontend/hooks/` → `src/hooks/`
   - `frontend/services/` → `src/services/`

2. **Install dependencies:**
   ```bash
   npm install axios
   ```

3. **Add Font Awesome (for icons) to your `index.html`:**
   ```html
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
   ```

4. **Import and use the component:**
   ```jsx
   import ChatAssistant from './components/ChatAssistant';
   
   function App() {
     return (
       <div style={{ height: '100vh' }}>
         <ChatAssistant />
       </div>
     );
   }
   ```

5. **Configure API URL (optional):**
   
   Create `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

#### Option 2: Use in Plain HTML/JavaScript

See the example in `examples/standalone.html`

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send chat message, get AI response |
| `/api/stats` | GET | Get dashboard statistics |
| `/api/projects` | GET | Get project list |
| `/api/upload` | POST | Upload file for ML analysis |

### Example: Chat Request

```javascript
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'What is the highest cost project?' })
});

const data = await response.json();
console.log(data.response);  // AI response text
console.log(data.data);      // Project data (if applicable)
```

---

## 🎯 Features

### 1. Natural Language Queries
- **Database queries:** "What is the highest cost project?"
- **Follow-up questions:** "What problems did it face?"
- **Regional data:** "Show me projects in Maharashtra"
- **Typo correction:** Handles "hightest" → "highest"

### 2. Web Search + Knowledge Base
- General power grid knowledge: "What is smart grid?"
- Built-in fallback knowledge base for offline use

### 3. Voice Recognition
- Click microphone to speak queries
- Supports English (India)

### 4. File Upload & ML Prediction
- Upload PDF/DOCX/TXT project documents
- Extract project details automatically
- Risk prediction using ML model

---

## ⚙️ Configuration

### Backend (`config.py`)

```python
ENABLE_WEB_SEARCH = True      # Enable/disable web search
MAX_WEB_SEARCH_RESULTS = 3    # Number of web results
DATABASE_PATH = 'power_grid.db'
```

### Frontend (`services/api.js`)

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🧪 Testing

### Test Backend
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the highest cost project?"}'
```

### Test Frontend
Open browser and interact with the chat interface.

---

## 📝 Sample Queries

| Query | Type |
|-------|------|
| "What is the highest cost project?" | Database |
| "Show me projects in Gujarat" | Database |
| "How many projects are delayed?" | Database |
| "What is smart grid?" | Web/Knowledge |
| "Explain HVDC technology" | Web/Knowledge |
| "What problems did it face?" | Follow-up |
| "Show similar projects" | Follow-up |

---

## 🐛 Troubleshooting

### Backend not starting?
- Check Python version (3.8+)
- Ensure all requirements installed
- Check if port 5000 is free

### CORS errors?
- Backend includes CORS support by default
- Check frontend API URL matches backend

### Voice not working?
- Only works in Chrome/Edge browsers
- Requires HTTPS in production

---

## 📄 License

MIT License - Free to use and modify.
