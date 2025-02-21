// backend/app.js

const express = require('express');
const { google } = require('googleapis');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies for POST requests (for the /ask endpoint)
app.use(express.json());

// Create an OAuth2 client using credentials from .env
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,       
  process.env.GOOGLE_CLIENT_SECRET,   
  process.env.REDIRECT_URI            
);

// Home route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the OAuth flow by redirecting to Google's consent screen
app.get('/google-auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // to get a refresh token
    scope: ['https://www.googleapis.com/auth/drive'], // Full access to Google Drive
  });
  res.redirect(authUrl);
});

// OAuth callback route - exchange code for tokens
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send('Authentication successful! You can now close this window.');
  } catch (err) {
    console.error('Error during OAuth callback', err);
    res.status(500).send('Authentication failed');
  }
});

// List files from Google Drive with pagination support
app.get('/files', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // Get pagination parameters from query string
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageToken = req.query.pageToken;
    
    const response = await drive.files.list({
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, owners, modifiedTime)',
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).send('Error fetching files');
  }
});

// Setup OpenAI API using the API key from .env
const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,  // Your OpenAI API key
});
const openai = new OpenAIApi(openaiConfig);

// AI Question Interface endpoint using OpenAI
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: question,
      max_tokens: 150,
    });
    
    const answer = completion.data.choices[0].text.trim();
    res.json({ answer });
  } catch (err) {
    console.error('Error asking question:', err);
    res.status(500).send('Error processing your question');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
