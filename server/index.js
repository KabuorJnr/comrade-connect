const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Base URLs
const DARAJA_BASE_URL = process.env.DARAJA_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Middleware to get OAuth token
const getOAuthToken = async (req, res, next) => {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret || consumerKey === 'YOUR_CONSUMER_KEY_HERE') {
    return res.status(500).json({ error: 'Daraja Consumer Key/Secret are not configured.' });
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    req.safaricomAccessToken = response.data.access_token;
    next();
  } catch (error) {
    console.error('OAuth Token Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with Safaricom' });
  }
};

// Route: Initiate STK Push
app.post('/api/stkpush', getOAuthToken, async (req, res) => {
  let { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required' });
  }

  // Format phone number to start with 254
  if (phoneNumber.startsWith('0')) {
    phoneNumber = `254${phoneNumber.substring(1)}`;
  } else if (phoneNumber.startsWith('+254')) {
    phoneNumber = phoneNumber.substring(1);
  } else if (!phoneNumber.startsWith('254')) {
    phoneNumber = `254${phoneNumber}`;
  }

  const shortCode = process.env.DARAJA_SHORTCODE;
  const passkey = process.env.DARAJA_PASSKEY;
  const callbackUrl = process.env.CALLBACK_URL;

  // Generate Timestamp (YYYYMMDDHHmmss)
  const date = new Date();
  const timestamp = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0') + 
    date.getHours().toString().padStart(2, '0') + 
    date.getMinutes().toString().padStart(2, '0') + 
    date.getSeconds().toString().padStart(2, '0');

  // Generate Password
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: 'ComradeConnect Pro',
    TransactionDesc: 'Pro Seller Subscription'
  };

  try {
    const response = await axios.post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${req.safaricomAccessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate STK Push', details: error.response?.data });
  }
});

// Route: STK Push Callback (Webhook)
app.post('/api/callback', (req, res) => {
  console.log('--- STK Push Callback Received ---');
  console.log(JSON.stringify(req.body, null, 2));

  // In a real app, you would:
  // 1. Verify the ResultCode (0 means success)
  // 2. Extract the CheckoutRequestID
  // 3. Update your database to mark the payment as successful
  // 4. Optionally notify the frontend via WebSockets/Server-Sent Events

  res.status(200).json({ message: 'Callback received successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Make sure to update the .env file with your Daraja credentials!`);
});
