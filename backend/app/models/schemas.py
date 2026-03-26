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
    business_process: str
    impact_description: str
    impact_level: str
    urgency: str
    data_types: List[str]
    data_sources: str
    current_workaround: str
    capability_domains: List[CapabilityDomainInfo]

class IssueSchema(BaseModel):
    id: str
    title: str
    description: str
    business_process: str
    impact_level: str
    urgency: str
    status: str
    created_at: datetime
    recommended_teams: List[str] = []
    capability_domains: List[str] = []
