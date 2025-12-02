# Power Grid AI Assistant

🤖 A standalone AI-powered chat assistant for Power Grid project queries.

## Features

- 💬 **Natural Language Chat** - Ask questions in plain English
- 📊 **Database Queries** - Query 12,000+ power grid projects
- 🌐 **Web Search** - Get general power grid knowledge
- 🎤 **Voice Input** - Speak your questions
- 📁 **File Upload** - Upload project documents for ML risk analysis
- 🔄 **Context-Aware** - Understands follow-up questions
- ✏️ **Typo Correction** - Handles common spelling mistakes

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Copy your data files:
# - Final_dataset.csv
# - powergrid_risk_model_package.pkl (optional)

python start_server.py
```

### 2. Frontend Integration

Copy the `frontend/` files to your React project and import:

```jsx
import ChatAssistant from './components/ChatAssistant';

<ChatAssistant />
```

See `INTEGRATION_GUIDE.md` for detailed instructions.

## Sample Queries

- "What is the highest cost project?"
- "Show me projects in Maharashtra"
- "How many delayed projects?"
- "What is smart grid?"
- "What problems did this project face?"

## Tech Stack

- **Backend:** Flask + SQLite + BeautifulSoup
- **Frontend:** React + Axios
- **AI/NLP:** Regex-based intent classification + typo correction

---

Made with ❤️ for Power Grid Analysis
