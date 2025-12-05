╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║               🚀 ASTRA GRID - QUICK EC2 DEPLOYMENT GUIDE 🚀                    ║
║                      For: Your Friend (Collaborator)                          ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════

📋 QUICK START (5 STEPS)
═══════════════════════════════════════════════════════════════════════════════════

STEP 1: SSH INTO YOUR EC2 INSTANCE
──────────────────────────────────
$ ssh -i your-key.pem ubuntu@your-ec2-ip

STEP 2: CLONE THE REPOSITORY
──────────────────────────────────
$ sudo mkdir -p /opt/astra-grid
$ cd /opt/astra-grid
$ sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git .

STEP 3: MAKE SCRIPTS EXECUTABLE
──────────────────────────────────
$ sudo chmod +x deployment/*.sh

STEP 4: RUN DEPLOYMENT SCRIPT
──────────────────────────────────
$ sudo bash deployment/deploy.sh

(This will take 10-15 minutes - it installs everything automatically)

STEP 5: VERIFY DEPLOYMENT
──────────────────────────────────
$ bash deployment/health-check.sh

═══════════════════════════════════════════════════════════════════════════════════

✨ WHAT THE SCRIPT DOES AUTOMATICALLY
═══════════════════════════════════════════════════════════════════════════════════

✅ Updates system packages
✅ Installs Python 3.10+, Node.js, Nginx, MongoDB
✅ Creates Python virtual environment
✅ Installs 25+ Python packages
✅ Installs Node.js dependencies
✅ Builds React frontend
✅ Configures 5 backend services (ports 5000-5004)
✅ Sets up Nginx reverse proxy
✅ Starts all services automatically
✅ Configures systemd for auto-restart on failure

═══════════════════════════════════════════════════════════════════════════════════

📊 SERVICES THAT WILL RUN
═══════════════════════════════════════════════════════════════════════════════════

Service              │ Port  │ Purpose
─────────────────────┼───────┼───────────────────────────────────
Unified API          │ 5000  │ Main API gateway
Auth Service         │ 5001  │ User authentication
Simulation (ML)      │ 5002  │ Power grid prediction
Chatbot API          │ 5003  │ Chat functionality
Document Extractor   │ 5004  │ PDF/Document processing
─────────────────────┼───────┼───────────────────────────────────
Frontend             │ 80/443│ React application (via Nginx)
MongoDB              │ 27017 │ Database (local)

═══════════════════════════════════════════════════════════════════════════════════

🌐 ACCESS YOUR APPLICATION AFTER DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════════════

Frontend:           http://<your-ec2-ip>
API Health Check:   http://<your-ec2-ip>/api/health

All other services are accessible through the Nginx reverse proxy at port 80.

═══════════════════════════════════════════════════════════════════════════════════

⚙️ IMPORTANT: CONFIGURE AWS CREDENTIALS (OPTIONAL BUT RECOMMENDED)
═══════════════════════════════════════════════════════════════════════════════════

For document extraction with AWS Textract to work:

1. SSH into the instance
2. Edit the environment file:
   $ sudo nano /opt/astra-grid/backend/.env.production

3. Update these variables:
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1

4. Save (Ctrl+X, Y, Enter)

5. Restart services:
   $ sudo systemctl restart astra-*.service

═══════════════════════════════════════════════════════════════════════════════════

🔒 SECURITY: SETUP SSL/HTTPS (OPTIONAL BUT RECOMMENDED FOR PRODUCTION)
═══════════════════════════════════════════════════════════════════════════════════

If you have a domain name:

$ sudo bash /opt/astra-grid/deployment/enable-ssl.sh --domain your-domain.com

This will:
✅ Get free SSL certificate from Let's Encrypt
✅ Enable HTTPS automatically
✅ Redirect HTTP to HTTPS
✅ Auto-renew certificate

═══════════════════════════════════════════════════════════════════════════════════

📊 VERIFY EVERYTHING IS WORKING
═══════════════════════════════════════════════════════════════════════════════════

After deployment, run:

$ bash /opt/astra-grid/deployment/health-check.sh

This will show:
✅ All 5 services running
✅ All ports responding
✅ Database connectivity
✅ API endpoints healthy

═══════════════════════════════════════════════════════════════════════════════════

🔧 COMMON COMMANDS
═══════════════════════════════════════════════════════════════════════════════════

CHECK SERVICE STATUS:
$ sudo systemctl status astra-unified.service
$ sudo systemctl status astra-auth.service
$ sudo systemctl status astra-simulation.service
$ sudo systemctl status astra-chatbot.service
$ sudo systemctl status astra-document-extractor.service

VIEW LOGS:
$ sudo journalctl -u astra-unified.service -f
$ sudo journalctl -u astra-auth.service -f
$ sudo tail -f /var/log/nginx/error.log

RESTART ALL SERVICES:
$ sudo systemctl restart astra-*.service

CHECK RUNNING PORTS:
$ sudo netstat -tulpn | grep LISTEN

═══════════════════════════════════════════════════════════════════════════════════

📝 DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════════

For detailed information, check these files in the repository:

START HERE:
  👉 00_START_HERE_EC2_DEPLOYMENT.md    - Complete overview

GUIDES:
  👉 QUICK_START_EC2.md                 - Quick reference
  👉 EC2_DEPLOYMENT_SETUP.md            - Detailed setup guide
  👉 DEPLOYMENT_SUMMARY.md              - Architecture overview

TECHNICAL:
  👉 deployment/README.md               - Module reference
  👉 deployment/deploy.sh               - View the deployment script

═══════════════════════════════════════════════════════════════════════════════════

🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════════

Problem: Services not starting?
Solution: $ sudo journalctl -u astra-unified.service -f
          Check the error logs and look for missing dependencies

Problem: Can't access the application?
Solution: $ sudo netstat -tulpn | grep LISTEN
          Verify all 5 services + Nginx are running

Problem: Port conflicts?
Solution: Check if other services are using ports 5000-5004
          $ sudo lsof -i :5000

Problem: Deployment script fails?
Solution: Run with verbose output:
          $ sudo bash -x deployment/deploy.sh 2>&1 | tee deploy.log

═══════════════════════════════════════════════════════════════════════════════════

💡 TIPS FOR YOUR FRIEND
═══════════════════════════════════════════════════════════════════════════════════

1. The deployment script is idempotent - can be run multiple times safely
2. All services auto-restart on failure
3. Logs are persistent and viewable with journalctl
4. Database is automatically initialized on first run
5. Frontend is cached - changes to backend don't need frontend rebuild
6. Use `git pull` to update the code anytime

═══════════════════════════════════════════════════════════════════════════════════

📞 NEED HELP?
═══════════════════════════════════════════════════════════════════════════════════

Contact: Kesavamoorthig06 (Repository Owner)
Repository: https://github.com/Kesavamoorthig06/astra-grid
Issues: Use GitHub Issues for bug reports
Discussions: Use GitHub Discussions for questions

═══════════════════════════════════════════════════════════════════════════════════

✅ YOU'RE ALL SET! 
Ready to deploy? Follow the 5 steps above and you'll be live in 20 minutes!

═══════════════════════════════════════════════════════════════════════════════════
