# ASTRA GRID

ASTRA GRID is an AI-powered power transmission project intelligence platform for monitoring, forecasting, and optimizing large-scale grid infrastructure projects.

It combines a modern dashboard, predictive models, scenario simulation, and an interactive project assistant to help users evaluate project risk, cost overruns, schedule delays, and operational bottlenecks across India's transmission network.

## What the project does

- Monitors transmission project data and substation information
- Analyzes cost, timeline, and risk exposure using project metadata
- Highlights regions with regulatory or permitting risk
- Simulates project scenarios with delay propagation and cascading impacts
- Provides an AI chatbot for project-related questions
- Exposes backend APIs for prediction, simulation, auth, and dashboard metrics
- Visualizes transmission project health through a React-based dashboard

## Core architecture

- Frontend: React + Vite dashboard UI
- Backend: Flask REST API with JWT auth and ML-ready services
- Data layer: CSV-based project and geospatial datasets
- AI features: prediction and simulation services for transmission planning
- Deployment: Docker-ready setup with Nginx and backend services

## Project structure

```text
ASTRA_GRID/
├── backend/                  # Flask API, services, routes, ML integrations
├── frontend/                 # React dashboard and UI components
├── public/                   # Static assets and supporting files
├── package.json              # Frontend app scripts and dependencies
├── Dockerfile                # Frontend container setup
├── docker-compose.yml        # Local multi-service orchestration
├── nginx.conf               # Reverse proxy config
├── Final_dataset.csv         # Main power grid project dataset
├── cable_coordinates.json    # Transmission/cable coordinate data
├── substation...csv          # Geocoded substation dataset
├── .env.example              # Example environment configuration
├── README.md                 # Project overview
└── ...
```

## Main features

### Dashboard and analytics
- Project health metrics across cost, schedule, and risk
- Visual charts for project mix, voltage levels, hotspots, and delays
- Map-based substation and transmission analysis

### AI-based prediction and simulation
- Risk classification and cost/timeline forecasting
- Scenario generation for project adjustments
- Delay propagation and cascade modeling

### Project assistant
- Chatbot interface for power grid and project questions
- Natural-language support for project insights and analysis

## Tech stack

- React 19
- Vite
- Flask
- Python ML stack (scikit-learn, XGBoost, LightGBM, pandas, numpy)
- MongoDB-ready backend configuration
- Docker / Docker Compose

## Local setup

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

## Production / docker

```bash
docker-compose up --build
```

## Notes

This repository is intended to be a clean public-facing version of the application. Legacy deployment notes, local-only artifacts, generated caches, and secrets are intentionally excluded from the Git history before publishing.

## License

This project is provided as-is for portfolio and demonstration purposes.
