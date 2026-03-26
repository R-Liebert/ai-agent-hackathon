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
*   Neo4j instance (running locally or via Docker container)
*   Azure OpenAI credentials

### 1. Installation
Navigate to the backend directory and install the required dependencies:

```bash
cd backend
pip install -r requirements.txt
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