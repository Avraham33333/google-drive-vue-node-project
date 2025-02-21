# Google Drive Vue Node Project

This project is a full-stack web application that integrates:
- Google OAuth & Google Drive API: For authenticating users and fetching file data (with pagination and CRUD operations).
- OpenAI API: For answering natural language questions about your data.
- Vue.js Frontend: A simple UI for listing files and asking questions.

## Features

- OAuth Integration: Securely log in using Google.
- File Management: List, paginate, and perform CRUD operations on Google Drive files.
- AI Question Interface: Ask questions (e.g., “Which file was modified most recently?”) and receive responses generated by OpenAI.
- Separate Backend & Frontend: A Node.js backend and a Vue.js frontend.

## Prerequisites

- Node.js (v14 or later recommended)
- npm
- A Google Cloud project with OAuth credentials for Google Drive (and Gmail if needed)
- An OpenAI account with an API key

## Project Structure

The repository is organized as follows:

  google-drive-vue-node-project/
  ├── backend/
  │   ├── app.js
  │   ├── .env         # (Not committed; see .env.example)
  │   └── package.json
  ├── frontend/
  │   ├── src/
  │   │   ├── App.vue
  │   │   └── components/
  │   │       ├── FileList.vue
  │   │       └── AskQuestion.vue
  │   ├── package.json
  │   └── ...
  ├── .env.example     # Sample file for environment variables
  └── README.txt       # This file

## Setup Instructions

### 1. Clone the Repository

Clone the project from GitHub and navigate into the project directory:
git clone https://github.com/Avraham33333/google-drive-vue-node-project.git cd google-drive-vue-node-project

markdown
Copy
Edit

### 2. Setup Environment Variables

- Navigate to the backend folder:
cd backend

bash
Copy
Edit

- Copy the sample .env file:
cp .env.example .env

sql
Copy
Edit

- Open the .env file and replace placeholder values with your actual credentials:

PORT=3000

Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here GOOGLE_CLIENT_SECRET=your_google_client_secret_here REDIRECT_URI=http://localhost:3000/oauth2callback

OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

shell
Copy
Edit

### 3. Install Dependencies

#### For the Backend:
cd backend npm install

shell
Copy
Edit

#### For the Frontend:
cd ../frontend npm install

shell
Copy
Edit

### 4. Run the Application

#### Start the Backend Server:
cd backend node app.js

markdown
Copy
Edit

**Key endpoints** (by default, `http://localhost:3000/...`):
- `/google-auth` — Initiates the Google OAuth flow.
- `/oauth2callback` — Handles the OAuth callback.
- `GET /files` — Lists Google Drive files (supports pagination via `?pageSize=` and date filters via `?startDate=` & `?endDate=`).
- `GET /files/:id` — Returns metadata for a specific file.
- `PUT /files/:id` — Renames a file (with JSON body like `{"name": "NewName"}`).
- `DELETE /files/:id` — Deletes a file.
- `POST /ask` — Sends questions to OpenAI. Expects JSON like `{"question": "Some question here"}`.

#### Start the Frontend Server:
cd ../frontend npm run serve

markdown
Copy
Edit
This will serve the Vue.js app (e.g., at [http://localhost:8080](http://localhost:8080) or a similar local port).

### 5. Testing Your Application

- **Google Authentication**: Visit [http://localhost:3000/google-auth](http://localhost:3000/google-auth) in your browser.
- **File Listing**: The `/files` endpoint should return your Google Drive files.
- **File CRUD**: Test `GET /files/:id`, `PUT /files/:id`, and `DELETE /files/:id`.
- **AI Question**: Use the AskQuestion component in the Vue app to send a question to [http://localhost:3000/ask](http://localhost:3000/ask).

## Additional Notes

- **Security**: Do not commit your `.env` file. Use `.env.example` to indicate required variables.
- **Push Protection**: If any sensitive information is accidentally committed, follow best practices to remove it from history.
- **Dependencies**: Address any vulnerabilities by running `npm audit fix` (use `--force` with caution).

## Running the Solution

1. **Backend**: Run `node app.js` from the `backend` folder.
2. **Frontend**: Run `npm run serve` from the `frontend` folder.
3. **Testing**: Use a browser or Postman to interact with the endpoints.

## License

This project is licensed under the MIT License.