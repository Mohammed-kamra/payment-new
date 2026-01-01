// WhatsApp Auto-Send Backend Service
// This automatically sends WhatsApp messages from +9647505543003 to registered users
// Install: npm install express axios
// Run: node whatsapp-sender.js

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('.')); // Serve your HTML file

// CORS enable for frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// WhatsApp API endpoint - sends from +9647505543003 to the registered person
app.post('/send-whatsapp', async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        // Validate input
        if (!phone || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number and message are required' 
            });
        }
        
        console.log('Received request to send WhatsApp message');
        console.log('Phone:', phone);
        console.log('Message length:', message.length);
        
        // Clean phone number
        let cleanPhone = phone.toString().replace(/[^\d]/g, '');
        cleanPhone = cleanPhone.replace(/^0+/, '');
        if (!cleanPhone.startsWith('964') && cleanPhone.length > 0) {
            cleanPhone = '964' + cleanPhone;
        }
        
        console.log('Cleaned phone:', cleanPhone);
    
    // ============================================
    // CONFIGURE YOUR WHATSAPP API CREDENTIALS
    // ============================================
    // Step 1: Go to https://green-api.com
    // Step 2: Create FREE account and create instance
    // Step 3: Connect +9647505543003 by scanning QR code
    // Step 4: Copy idInstance and apiTokenInstance from dashboard
    // Step 5: Replace the values below:
    const GREEN_API_ID = 'YOUR_ID_INSTANCE'; // Replace with your idInstance
    const GREEN_API_TOKEN = 'YOUR_API_TOKEN'; // Replace with your apiTokenInstance
    
    // ============================================
    
    // Try Green API first (easiest setup)
    if (GREEN_API_ID !== 'YOUR_ID_INSTANCE' && GREEN_API_TOKEN !== 'YOUR_API_TOKEN') {
        try {
            const response = await axios.post(
                `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`,
                {
                    chatId: `${cleanPhone}@c.us`,
                    message: message
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.idMessage) {
                console.log(`✅ Message sent successfully from +9647505543003 to ${cleanPhone}`);
                console.log(`Message ID: ${response.data.idMessage}`);
                return res.json({ 
                    success: true, 
                    message: 'WhatsApp message sent automatically',
                    messageId: response.data.idMessage
                });
            } else {
                throw new Error('No message ID returned from Green API');
            }
        } catch (error) {
            console.error('❌ Green API error:', error.response?.data || error.message);
            console.error('Error details:', error.response?.status, error.response?.statusText);
            // Continue to fallback
        }
    }
    
    // Fallback: ChatAPI (if Green API not configured)
    const CHATAPI_INSTANCE = 'YOUR_INSTANCE_ID';
    const CHATAPI_TOKEN = 'YOUR_TOKEN';
    
    if (CHATAPI_INSTANCE !== 'YOUR_INSTANCE_ID' && CHATAPI_TOKEN !== 'YOUR_TOKEN') {
        try {
            const response = await axios.post(
                `https://api.chat-api.com/instance${CHATAPI_INSTANCE}/sendMessage?token=${CHATAPI_TOKEN}`,
                {
                    phone: cleanPhone,
                    body: message
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.sent) {
                console.log(`✅ Message sent successfully from +9647505543003 to ${cleanPhone}`);
                return res.json({ 
                    success: true, 
                    message: 'WhatsApp message sent automatically',
                    messageId: response.data.id
                });
            } else {
                throw new Error('Message not sent by ChatAPI');
            }
        } catch (error) {
            console.error('❌ ChatAPI error:', error.response?.data || error.message);
            console.error('Error details:', error.response?.status, error.response?.statusText);
        }
    }
    
    // If no API is configured or all methods failed
    console.error('❌ All WhatsApp sending methods failed');
    return res.status(500).json({ 
        success: false, 
        error: 'WhatsApp API not configured or failed. Please set up Green API credentials in whatsapp-sender.js (see README-WHATSAPP-SETUP.md)',
        details: 'Make sure: 1) Backend is running, 2) Green API credentials are set, 3) WhatsApp is connected to Green API'
    });
    } catch (error) {
        console.error('❌ Unexpected error in send-whatsapp endpoint:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error: ' + error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('WhatsApp Auto-Sender Service Started');
    console.log('========================================');
    console.log(`Server running on port ${PORT}`);
    console.log('Sending messages from: +9647505543003');
    console.log('');
    if (GREEN_API_ID === 'YOUR_ID_INSTANCE') {
        console.log('⚠️  SETUP REQUIRED:');
        console.log('   1. Go to https://green-api.com');
        console.log('   2. Create FREE account');
        console.log('   3. Create instance and connect +9647505543003');
        console.log('   4. Copy idInstance and apiTokenInstance');
        console.log('   5. Update GREEN_API_ID and GREEN_API_TOKEN in this file');
        console.log('   See README-WHATSAPP-SETUP.md for detailed instructions');
    } else {
        console.log('✅ API credentials configured - Ready to send messages automatically!');
    }
    console.log('========================================');
});

