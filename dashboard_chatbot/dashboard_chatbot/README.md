# Local RAG Chatbot - Production

A production-ready, 100% offline chatbot application with React frontend and FastAPI backend, using real power grid risk analysis data.

## 🚀 Quick Start

**Simply double-click:** `START_APP.bat`

This will automatically:
1. Start the Python backend server (port 8501)
2. Start the React frontend (port 3000)
3. Open the application in your browser

## 📋 Prerequisites

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Python** (v3.8+) - [Download](https://www.python.org/)
- **npm** (comes with Node.js)

## 📦 Installation

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## 📁 Project Structure

```
local-chatbot-frontend/
├── backend.py                    # FastAPI backend server
├── requirements.txt              # Python dependencies
├── Final_dataset.csv            # Power grid dataset
├── powergrid_risk_model_package (1).pkl  # Trained ML model
├── START_APP.bat                # One-click launcher
├── start-backend.bat            # Backend launcher
├── start.bat                    # Frontend launcher
├── package.json                 # Node dependencies
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── App.jsx                 # Main React component
│   ├── App.css                 # Styling
│   └── index.js                # React entry point
└── README.md                   # This file
```

## 🔧 Features

✅ **100% Offline** - No external API calls  
✅ **Real Data** - Uses actual power grid dataset  
✅ **ML Model** - Pre-trained risk prediction model  
✅ **Modern UI** - Beautiful dark-themed interface  
✅ **Responsive** - Works on desktop and mobile  
✅ **Production Ready** - Optimized and clean codebase

## Configuration

The frontend connects to your Streamlit backend on `http://localhost:8501` by default. To change this, edit the `fetch` URL in `src/App.jsx`:

```javascript
const response = await fetch('http://localhost:8501/api/chat', {
  // ... your configuration
});
```

## Components Overview

### Sidebar
- System status monitoring
- Chat history
- Quick action buttons
- Export functionality

### Main Chat Area
- Message display with avatars
- Markdown rendering
- Source attribution
- Typing indicators
- Loading states

### Input Area
- Auto-expanding textarea
- Quick action chips
- System information display

### Status Tab
- Detailed system information
- Component status cards
- Setup instructions

## Responsive Breakpoints

- **Desktop**: Full sidebar visible
- **Tablet (< 1024px)**: Collapsible sidebar
- **Mobile (< 640px)**: Full-screen sidebar overlay

## Customization

### Colors
Edit CSS variables in `src/App.css`:

```css
:root {
  --primary-color: #6366f1;
  --bg-color: #0f172a;
  /* ... more variables */
}
```

### Quick Actions
Modify the `quickActions` array in `src/App.jsx`:

```javascript
const quickActions = [
  { 
    text: "Your action", 
    icon: <YourIcon size={16} />,
    prompt: "Your prompt" 
  },
  // Add more...
];
```

## Backend Integration

This frontend expects your Streamlit backend to provide an endpoint that:

1. Accepts POST requests at `/api/chat`
2. Receives JSON: `{ "message": "user input" }`
3. Returns JSON: `{ "response": "bot reply", "sources": ["source1", "source2"] }`

## Troubleshooting

### Connection Errors
- Ensure Streamlit backend is running on port 8501
- Check that Ollama service is active
- Verify CORS settings if using proxy

### Styling Issues
- Clear browser cache
- Check for CSS conflicts
- Verify all imports are correct

### Missing Icons
- Ensure `lucide-react` is installed
- Check import statements in `App.jsx`

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run proxy` - Start proxy server

## License

MIT

## Support

For issues or questions, please check:
1. Backend is running correctly
2. All dependencies are installed
3. Ports are not blocked by firewall
4. Browser console for errors

---

**Built with ❤️ for local-first AI applications**
