// backend/app.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Added CORS
import { google } from 'googleapis';
import OpenAI from 'openai';

console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies for POST and PUT/PATCH requests
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
    scope: ['https://www.googleapis.com/auth/drive'] // Full access to Google Drive
  });
  res.redirect(authUrl);
});

// OAuth callback route - exchange code for tokens
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect('http://localhost:8080/'); // Redirect to front end
  } catch (err) {
    console.error('Error during OAuth callback', err);
    res.status(500).send('Authentication failed');
  }
});


/**
 * GET /files
 * - Lists actual files (excludes folders) from Google Drive with pagination
 * - Supports optional date filters via ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
app.get('/files', async (req, res) => {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageToken = req.query.pageToken || null;

    // Optional date filters and excluding folders
    const { startDate, endDate } = req.query;
    const qParts = [];
    // Exclude folders
    qParts.push("mimeType != 'application/vnd.google-apps.folder'");
    if (startDate) {
      qParts.push(`modifiedTime >= '${startDate}T00:00:00'`);
    }
    if (endDate) {
      qParts.push(`modifiedTime <= '${endDate}T23:59:59'`);
    }
    const q = qParts.length ? qParts.join(' and ') : undefined;

    const response = await drive.files.list({
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, size, modifiedTime, owners(displayName), mimeType)',
      q
    });
    
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).send('Error fetching files');
  }
});

/**
 * GET /files/:id
 * - View a single file's metadata
 */
app.get('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, owners, modifiedTime'
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error getting file:', err);
    res.status(500).send('Error getting file');
  }
});

/**
 * PUT /files/:id
 * - Edit/rename a file's metadata (e.g., file name)
 */
app.put('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { name } = req.body; // For now, we only rename

    if (!name) {
      return res.status(400).send('No "name" field provided');
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.update({
      fileId,
      requestBody: { name }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error updating file:', err);
    res.status(500).send('Error updating file');
  }
});

/**
 * DELETE /files/:id
 * - Delete a file from Google Drive
 */
app.delete('/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    await drive.files.delete({ fileId });
    res.sendStatus(204); // 204: Success, no content
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).send('Error deleting file');
  }
});

// Setup OpenAI API using the new default export from v4
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /ask
 * - AI Question Interface endpoint using OpenAI
 *   Fetches file metadata if the question involves file details,
 *   excludes folders,
 *   and includes name, size, modifiedTime, and owners in the context.
 */
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    let prompt = question; // Default prompt is just the user question

    // Check if the user's question seems to involve file details
    const qLower = question.toLowerCase();
    if (qLower.includes("largest") || qLower.includes("modified") || qLower.includes("file")) {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      // Exclude folders explicitly
      const response = await drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, size, modifiedTime, mimeType, owners(displayName))',
        q: "mimeType != 'application/vnd.google-apps.folder'"
      });

      let context = "";
      if (response.data.files && response.data.files.length > 0) {
        context = response.data.files.map(f => {
          const fileName = f.name || "Unknown file";
          const sizeInfo = f.size ? `${f.size} bytes` : "size not available";
          const lastModified = f.modifiedTime || "N/A";
          let ownerNames = "N/A";
          if (f.owners && Array.isArray(f.owners) && f.owners.length > 0) {
            ownerNames = f.owners.map(owner => owner.displayName).join(", ");
          }
          return `${fileName}\n  Last Modified: ${lastModified}\n  Owners: ${ownerNames}\n  Size: ${sizeInfo}`;
        }).join("\n\n");
      }
      
      prompt = `Based on the following file details:\n${context}\n\nAnswer the question: ${question}`;
    }

    // Use GPT-4 model; change to "gpt-3.5-turbo" if GPT-4 is unavailable
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150
    });

    const answer = completion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error('Error processing question:', err);
    res.status(500).send('Error processing your question');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
