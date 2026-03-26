from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageCreate(BaseModel):
    content: str
    role: str = "user"

class MessageSchema(BaseModel):
    id: str
    content: str
    role: str
    timestamp: datetime

class ConversationSchema(BaseModel):
    id: str
    started_at: datetime
    messages: List[MessageSchema]

class CapabilityDomainInfo(BaseModel):
    name: str
    confidence: float
    rationale: str

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    required_skills: List[str] = []
    sender_name: str
    department: str

class IssueSchema(BaseModel):
    id: str
    title: str
    description: str
    category: str
    required_skills: List[str] = []
    sender_name: str
    department: str
    created_at: datetime
    status: str
    is_processed: bool = False
    notified_experts: List[str] = []
