╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║             🚀 ASTRA GRID - EC2 DEPLOYMENT STEP-BY-STEP GUIDE 🚀               ║
║                                                                                ║
║                        Complete Instructions for EC2                          ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════

📋 PREREQUISITES (Before You Start)
═══════════════════════════════════════════════════════════════════════════════════

✓ EC2 Instance running (Ubuntu 22.04 LTS, t3.medium or larger)
✓ Security group allows ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
✓ .pem key file saved on your computer
✓ EC2 instance IP address (example: 54.166.135.149)

═══════════════════════════════════════════════════════════════════════════════════

STEP 1: CONNECT TO EC2 INSTANCE VIA SSH
═══════════════════════════════════════════════════════════════════════════════════

On your local computer terminal (PowerShell/Terminal), run:

    ssh -i "path/to/your-key.pem" ubuntu@YOUR_EC2_IP

Example:
    ssh -i "C:\Users\viper\Desktop\astra1.pem" ubuntu@54.166.135.149

If successful, you'll see:
    ubuntu@ip-172-31-xx-xx:~$

This means you're connected! ✓

═══════════════════════════════════════════════════════════════════════════════════

STEP 2: CREATE APPLICATION DIRECTORY
═══════════════════════════════════════════════════════════════════════════════════

Run these commands in the SSH terminal:

    sudo mkdir -p /opt/astra-grid
    cd /opt/astra-grid

═══════════════════════════════════════════════════════════════════════════════════

STEP 3: CLONE THE REPOSITORY
═══════════════════════════════════════════════════════════════════════════════════

Clone your GitHub repository:

    sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git .

This downloads ALL your code, including:
    ✓ Backend services (5 different APIs)
    ✓ Frontend React app
    ✓ ML prediction model (model.pkl)
    ✓ Deployment scripts
    ✓ Configuration files

═══════════════════════════════════════════════════════════════════════════════════

STEP 4: MAKE SCRIPTS EXECUTABLE
═══════════════════════════════════════════════════════════════════════════════════

    sudo chmod +x deployment/*.sh

This allows the deployment script to run.

═══════════════════════════════════════════════════════════════════════════════════

STEP 5: RUN THE DEPLOYMENT SCRIPT (MAIN STEP)
═══════════════════════════════════════════════════════════════════════════════════

THIS ONE COMMAND DOES EVERYTHING:

    sudo bash deployment/deploy.sh

What this script does automatically:
    ✓ Updates system packages (apt-get update/upgrade)
    ✓ Installs Python 3, Node.js, Nginx, MongoDB
    ✓ Creates Python virtual environment
    ✓ Installs all Python packages (from requirements.txt)
    ✓ Installs all Node.js packages (npm install)
    ✓ Builds React frontend (npm run build)
    ✓ Creates systemd service files for all 6 services
    ✓ Configures Nginx reverse proxy
    ✓ Starts all services automatically

Expected time: 10-15 minutes ⏱️

═══════════════════════════════════════════════════════════════════════════════════

STEP 6: WAIT FOR COMPLETION
═══════════════════════════════════════════════════════════════════════════════════

The script will print:
    ✓ Each installation step as it completes
    ✓ Service startup status
    ✓ Final access information

Look for:
    ✓✓✓ DEPLOYMENT SUCCESSFUL ✓✓✓

═══════════════════════════════════════════════════════════════════════════════════

STEP 7: VERIFY ALL SERVICES ARE RUNNING
═══════════════════════════════════════════════════════════════════════════════════

After deployment completes, run:

    sudo systemctl status astra-*.service

You should see:
    ✓ astra-prediction-model.service (Port 5000) - ACTIVE
    ✓ astra-auth.service (Port 5001) - ACTIVE
    ✓ astra-simulation.service (Port 5002) - ACTIVE
    ✓ astra-chatbot.service (Port 5003) - ACTIVE
    ✓ astra-document-extractor.service (Port 5004) - ACTIVE

All should show "active (running)" in green. ✓

═══════════════════════════════════════════════════════════════════════════════════

STEP 8: ACCESS YOUR APPLICATION
═══════════════════════════════════════════════════════════════════════════════════

Open your web browser and go to:

    http://YOUR_EC2_IP

Example:
    http://54.166.135.149

You should see:
    ✓ ASTRA GRID homepage
    ✓ Dashboard, Prediction, Simulation tabs
    ✓ Full application UI

═══════════════════════════════════════════════════════════════════════════════════

ARCHITECTURE OVERVIEW
═══════════════════════════════════════════════════════════════════════════════════

When deployment is complete, here's what's running:

┌─────────────────────────────────────────────────────────────┐
│                     Your EC2 Instance                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Nginx (Port 80/443)                       │ │
│  │      Reverse Proxy & Frontend Server                   │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │ Proxies requests to:                     │
│  ┌────────────────┴───────────────────────────────────────┐ │
│  │         5 Independent Backend Services                │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Port 5000 ← Prediction Model (model.pkl)             │ │
│  │  Port 5001 ← Auth Service (login/register)            │ │
│  │  Port 5002 ← Simulation API (ML models)               │ │
│  │  Port 5003 ← Chatbot API (conversations)              │ │
│  │  Port 5004 ← Document Extractor (PDF processing)      │ │
│  │                                                        │ │
│  │  Port 27017 ← MongoDB (Database)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

User's Internet
      ↓
    Port 80
      ↓
   Nginx (Reverse Proxy)
      ↓
Routes to appropriate backend service
      ↓
Returns response back to user

═══════════════════════════════════════════════════════════════════════════════════

USEFUL COMMANDS AFTER DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════════

Check if a specific service is running:
    sudo systemctl status astra-prediction-model.service

View logs for prediction model:
    sudo journalctl -u astra-prediction-model.service -f

View logs for auth service:
    sudo journalctl -u astra-auth.service -f

Restart all services:
    sudo systemctl restart astra-*.service

Stop all services:
    sudo systemctl stop astra-*.service

View Nginx logs:
    sudo tail -f /var/log/nginx/error.log

Check which ports are listening:
    sudo netstat -tulpn | grep LISTEN

═══════════════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════════

Problem: "Cannot connect to http://YOUR_EC2_IP"
Solution: 
    1. Check security group allows port 80
    2. Verify Nginx is running: sudo systemctl status nginx
    3. Check Nginx error: sudo journalctl -u nginx -f

Problem: "Service failed to start"
Solution:
    1. Check service logs: sudo journalctl -u astra-prediction-model.service -f
    2. Look for error messages (usually missing dependencies)
    3. Restart service: sudo systemctl restart astra-prediction-model.service

Problem: "Permission denied" errors
Solution:
    Make sure you're using "sudo" before commands that need root access

Problem: "Module not found" errors
Solution:
    Make sure deployment script completed successfully
    Run: sudo bash deployment/deploy.sh again

═══════════════════════════════════════════════════════════════════════════════════

OPTIONAL: ENABLE SSL/HTTPS
═══════════════════════════════════════════════════════════════════════════════════

If you have a domain name, enable SSL:

    sudo bash deployment/enable-ssl.sh --domain your-domain.com

This will:
    ✓ Get free SSL certificate from Let's Encrypt
    ✓ Enable HTTPS
    ✓ Auto-redirect HTTP to HTTPS
    ✓ Setup auto-renewal

═══════════════════════════════════════════════════════════════════════════════════

QUICK SUMMARY
═══════════════════════════════════════════════════════════════════════════════════

Just 5 commands to deploy everything:

1️⃣  ssh -i "your-key.pem" ubuntu@YOUR_EC2_IP

2️⃣  sudo mkdir -p /opt/astra-grid && cd /opt/astra-grid

3️⃣  sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git .

4️⃣  sudo chmod +x deployment/*.sh

5️⃣  sudo bash deployment/deploy.sh

Then access: http://YOUR_EC2_IP

That's it! Everything else is automatic. 🚀

═══════════════════════════════════════════════════════════════════════════════════

SERVICES EXPLANATION
═══════════════════════════════════════════════════════════════════════════════════

Port 5000 - PREDICTION MODEL (The ML Engine)
    File: backend/Model/app.py
    Model: backend/Model/model.pkl (11MB)
    Purpose: Takes input data → Returns risk predictions
    Used by: Frontend Prediction page

Port 5001 - AUTH SERVICE (User Management)
    File: backend/auth_app.py
    Purpose: User login, registration, token verification
    Used by: Frontend login page

Port 5002 - SIMULATION API (Power Grid Simulation)
    File: backend/simulation_api.py
    Purpose: ML-based power grid simulations
    Used by: Frontend Simulation page

Port 5003 - CHATBOT API (Chat Support)
    File: backend/chatbot_api.py
    Purpose: AI chatbot for user queries
    Used by: Frontend Chat feature

Port 5004 - DOCUMENT EXTRACTOR (PDF Processing)
    File: backend/document_extractor_api.py
    Purpose: Extract text and data from PDFs using AWS Textract
    Used by: Document upload feature

Port 27017 - MONGODB (Database)
    Purpose: Stores all user data, predictions, logs
    Used by: All backend services

═══════════════════════════════════════════════════════════════════════════════════

WHAT THE DEPLOY.SH SCRIPT CREATES
═══════════════════════════════════════════════════════════════════════════════════

Systemd Service Files:
    /etc/systemd/system/astra-prediction-model.service
    /etc/systemd/system/astra-auth.service
    /etc/systemd/system/astra-simulation.service
    /etc/systemd/system/astra-chatbot.service
    /etc/systemd/system/astra-document-extractor.service

Nginx Configuration:
    /etc/nginx/sites-available/astra-grid.conf
    /etc/nginx/sites-enabled/astra-grid.conf

Virtual Environment:
    /opt/astra-grid/venv/

Built Frontend:
    /opt/astra-grid/dist/

Log Files:
    /var/log/astra-grid/

═══════════════════════════════════════════════════════════════════════════════════

AFTER DEPLOYMENT - NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════════

1. Test the application:
   - Open http://YOUR_EC2_IP in browser
   - Try the prediction page
   - Try login/signup
   - Test document extraction

2. Configure AWS credentials (if using document extraction):
   - Edit: /opt/astra-grid/backend/.env.production
   - Add: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   - Restart: sudo systemctl restart astra-document-extractor.service

3. Setup monitoring:
   - Run: bash deployment/health-check.sh (if available)
   - Check logs regularly

4. Enable SSL (if you have a domain):
   - Run: sudo bash deployment/enable-ssl.sh --domain your-domain.com

5. Setup backups:
   - Backup MongoDB regularly
   - Backup /opt/astra-grid directory

═══════════════════════════════════════════════════════════════════════════════════

FINAL CHECKLIST
═══════════════════════════════════════════════════════════════════════════════════

Before calling it "DONE", verify:

☐ SSH connection works
☐ Repository cloned successfully
☐ Deployment script ran without errors
☐ All 5 services are running (systemctl status)
☐ Frontend loads at http://EC2_IP
☐ Prediction page works
☐ Auth login/signup works
☐ Can see prediction results
☐ MongoDB is storing data
☐ Nginx is serving frontend

If all ☑️ = SUCCESS! 🎉

═══════════════════════════════════════════════════════════════════════════════════

ANY ISSUES? DEBUG WITH:

Get full system status:
    sudo systemctl status astra-*.service

See all logs:
    sudo journalctl -u astra-prediction-model.service -n 50

Check running processes:
    ps aux | grep python

Test prediction API directly:
    curl http://localhost:5000/health

Check disk space:
    df -h

Check memory:
    free -h

═══════════════════════════════════════════════════════════════════════════════════

You're all set! 🚀 Your ASTRA GRID application is now running on EC2!

═══════════════════════════════════════════════════════════════════════════════════
