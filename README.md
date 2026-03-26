# AI Painpoint Discovery Assistant

## Product Overview
Managers often face business pain points but lack the technical vocabulary (e.g., NLP vs. CV vs. forecasting) to know which internal IT/AI team can help. 

The **AI Painpoint Discovery Assistant** is a chat application where managers describe their pain points in natural language. An LLM acts as an internal AI product discovery assistant, driving the conversation and asking follow-up questions. Once enough context is gathered, the system automatically structures the issue, classifies it into relevant capability domains, and routes it to the most appropriate internal IT/AI team using a graph database.

## Key Features (MVP)
*   **LLM-Driven Discovery:** Guides non-technical users to provide actionable business context (impact, urgency, data availability) without jargon.
*   **Automated Classification:** Analyzes chat transcripts to output structured data and confidence scores for various capability domains.
*   **Graph-Based Architecture:** Uses Neo4j to store and create relationships between Users, Departments, Conversations, Issues, Capability Domains, and Teams.
*   **Smart Routing:** Automatically maps the LLM's recommended capability domains (e.g., "Computer Vision") to internal owning teams.

## Tech Stack
*   **Backend:** Python, FastAPI
*   **Database:** Neo4j (Local Graph Database)
*   **LLM:** Azure OpenAI
*   **Data Validation:** Pydantic

## Setup Instructions

### Prerequisites
*   Python 3.9+
*   uv (Fast Python package and project manager)
*   Neo4j instance (running locally or via Docker container)
*   Azure OpenAI credentials

### 1. Installation
Navigate to the backend directory and use `uv` to install the dependencies and set up the virtual environment:

```bash
cd backend
uv sync
```
*(Note: Ensure you have `fastapi`, `uvicorn`, `neo4j`, `openai`, and `pydantic` in your requirements.txt)*

### 2. Environment Variables
Create a `.env` file in the `backend` directory to store your configuration securely:

```env
# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_password

# Azure OpenAI Service
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your_model_deployment_name
```

### 3. Run the Application
Start the FastAPI server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

**Automatic Data Seeding:** Upon startup, the application will automatically connect to your Neo4j database and seed the initial constraints, capability domains, departments, and teams.

The interactive API documentation (Swagger UI) will be available at: http://localhost:8000/docs

## API Endpoints Overview

**Chat Flow (`/api/chat/`)**
*   `POST /start` - Initializes a new conversation and returns the first question.
*   `POST /{conversation_id}/message` - Sends a user message to the LLM and gets the next question.
*   `GET /{conversation_id}/history` - Retrieves the full chat transcript.

**Issue Management (`/api/issues/`)**
*   `POST /finalize/{conversation_id}` - Triggers the LLM to summarize the conversation, structures the JSON output, and persists the Issue/Domain/Team relationships to Neo4j.
*   `GET /` - Browse issues (supports filtering by domain, team, status, and text search).
*   `GET /{issue_id}` - Fetch detailed issue context, relationships, and classifications.

## Testing Locally

Once your local server is running and your `.env` file is properly configured with your LLM endpoint (Azure OpenAI) and Neo4j credentials, you can test the entire flow using the automatically generated Swagger UI.

### Simulating a Discovery Session

1. **Open Swagger UI:** Navigate to http://localhost:8000/docs in your browser.
2. **Start a Conversation:** Find the `POST /api/chat/start` endpoint. Click "Try it out" and "Execute". 
   * *Save the `conversation_id` returned in the response body.*
3. **Send Messages:** Find the `POST /api/chat/{conversation_id}/message` endpoint. Click "Try it out". 
   * Paste the `conversation_id` into the parameter field.
   * Modify the request body to describe a problem. For example:
     ```json
     {
       "content": "Our HR team is spending too much time manually reviewing candidate resumes. We need to automatically extract skills and categorize them.",
       "role": "user"
     }
     ```
   * "Execute" to get the LLM's follow-up questions. Repeat this until the assistant indicates it has enough information (e.g., outputs `[COMPLETE]`).
4. **Finalize the Issue:** Find the `POST /api/issues/finalize/{conversation_id}` endpoint. Paste your `conversation_id` and execute. This calls the LLM one last time to output the structured JSON based on your chat history and saves it to the Neo4j database.
5. **Verify:** Use the `GET /api/issues/` endpoint to retrieve and verify the newly structured issue in your local graph database.