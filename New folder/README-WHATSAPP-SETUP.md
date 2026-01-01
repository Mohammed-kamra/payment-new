# WhatsApp Automatic Sender Setup

**Automatically send WhatsApp messages from +9647505543003 to registered users!**

## Quick Setup (5 minutes):

### Step 1: Install Node.js
- Download from https://nodejs.org/
- Install it on your computer

### Step 2: Install Dependencies
Open terminal/command prompt in this folder and run:
```bash
npm install
```

### Step 3: Set Up Green API (Easiest - Recommended)
1. Go to https://green-api.com
2. Click "Register" and create a FREE account
3. After login, click "Create instance"
4. Scan QR code with WhatsApp on phone number +9647505543003
5. Copy your `idInstance` and `apiTokenInstance` from the dashboard
6. Open `whatsapp-sender.js` file
7. Find these lines (around line 30-31):
   ```javascript
   const GREEN_API_ID = 'YOUR_ID_INSTANCE';
   const GREEN_API_TOKEN = 'YOUR_API_TOKEN';
   ```
8. Replace `YOUR_ID_INSTANCE` with your idInstance
9. Replace `YOUR_API_TOKEN` with your apiTokenInstance
10. Save the file

### Step 4: Start the Backend Service
Run this command:
```bash
npm start
```
or
```bash
node whatsapp-sender.js
```

You should see:
```
✅ API credentials configured - Ready to send messages!
```

### Step 5: Test It!
1. Open `index.html` in your browser
2. Fill in the registration form with a test phone number
3. Submit the form
4. **The message will be sent automatically from +9647505543003!**

## Alternative: Using ChatAPI

If you prefer ChatAPI:
1. Go to https://chat-api.com
2. Sign up for a free account
3. Create a new instance
4. Connect your WhatsApp number +9647505543003
5. Get your Instance ID and Token
6. In `whatsapp-sender.js`, set:
   ```javascript
   const CHATAPI_INSTANCE = 'your-instance-id';
   const CHATAPI_TOKEN = 'your-token';
   ```

## How It Works:

1. User fills registration form → Form submits
2. Frontend automatically calls backend API
3. Backend sends WhatsApp message from +9647505543003
4. User receives message automatically - **No manual steps!**

## Important Notes:

- ✅ The backend service must be running for automatic sending
- ✅ Messages are sent from +9647505543003 automatically
- ✅ No manual clicking required once configured
- ✅ Works completely automatically after setup

## Troubleshooting:

- **"API not configured" error**: Make sure you've set your Green API credentials
- **"Backend API not available"**: Make sure `node whatsapp-sender.js` is running
- **Messages not sending**: Check your API credentials and make sure WhatsApp is connected

