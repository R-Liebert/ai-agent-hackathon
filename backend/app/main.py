from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, issues
from app.services.graph_service import graph_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Painpoint Discovery Assistant")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to seed data
@app.on_event("startup")
async def startup_event():
    try:
        graph_service.seed_initial_data()
    except Exception as e:
        logger.error(f"Failed to seed data: {e}")

# Include Routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])

@app.get("/")
async def root():
    return {"message": "AI Painpoint Discovery Assistant API is running"}

def run_server():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
