# EC2 SSH Authentication Issue - Resolution Guide

## Problem
The SSH connection to your EC2 instance (54.166.135.149) is failing with:
```
Permission denied (publickey,gssapi-keyex,gssapi-with-mic)
```

## Diagnosis
✅ The instance IS reachable on port 22 (TCP connection succeeded)
❌ The SSH key `astra1.pem` does NOT match the instance's public key

## Solution Options

### Option 1: Verify Your EC2 Instance Key Pair (RECOMMENDED)
1. Go to AWS Console → EC2 → Instances
2. Find instance `54.166.135.149`
3. Look at the "Key pair name" field
4. Does it say "astra1"?
   - **YES** → Go to Option 2
   - **NO** → Your instance uses a different key pair. You need that key's .pem file

### Option 2: Verify Your Key Pair Name in AWS
1. Go to AWS Console → EC2 → Key Pairs
2. Find the key pair used for this instance
3. Look for "astra1" in the list
4. If not found → Check EC2 instance details again for correct key name
5. If found → Download the .pem file again (only works if never downloaded before)

### Option 3: Create New Instance with astra1 Key
If the instance wasn't created with "astra1" key:
1. Terminate the current instance: `54.166.135.149`
2. Launch a NEW instance with key pair "astra1"
3. Then run the deployment script

## Temporary Workaround: EC2 Instance Connect
If you have AWS console access but no SSH key:
1. Go to AWS Console → EC2 → Instances
2. Select the instance `54.166.135.149`
3. Click "Connect" button → "EC2 Instance Connect" tab
4. Click "Connect"
5. Run deployment commands directly:
   ```bash
   sudo mkdir -p /opt/astra-grid
   cd /opt/astra-grid
   sudo git clone https://github.com/Kesavamoorthig06/astra-grid.git .
   sudo chmod +x deployment/*.sh
   sudo bash deployment/deploy.sh
   ```

## What To Do Next

**IMPORTANT:** Please verify:
1. Is the EC2 instance key pair name "astra1"?
2. Is 54.166.135.149 the correct instance IP?

Once confirmed, we can proceed with SSH deployment.

---

## Files Ready for Deployment:
✅ `/opt/astra-grid/deployment/deploy.sh` - Main deployment script
✅ `backend/.env.production` - AWS credentials configured with your keys
✅ All 5 systemd service files - Ready to deploy
✅ Nginx configuration - Ready to deploy

Just need SSH access to proceed!
