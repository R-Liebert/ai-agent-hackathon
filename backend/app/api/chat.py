from fastapi import APIRouter, HTTPException
from app.models.schemas import MessageCreate, ConversationSchema
from app.services.graph_service import graph_service
from app.services.llm_service import llm_service
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/start")
async def start_conversation():
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    query = """
    CREATE (c:Conversation {id: $id, started_at: $started_at})
    RETURN c
    """
    graph_service.run_query(query, {"id": conv_id, "started_at": now})
    
    # Initial message from assistant
    welcome_msg = "Hello! I'm your AI Painpoint Discovery Assistant. To help our IT and AI teams understand your needs, could you describe a business challenge or 'pain point' you're currently facing?"
    msg_id = str(uuid.uuid4())
    
    msg_query = """
    MATCH (c:Conversation {id: $conv_id})
    CREATE (m:Message {id: $msg_id, role: 'assistant', content: $content, timestamp: $timestamp})
    CREATE (c)-[:HAS_MESSAGE]->(m)
    RETURN m
    """
    graph_service.run_query(msg_query, {
        "conv_id": conv_id,
        "msg_id": msg_id,
        "content": welcome_msg,
        "timestamp": now
    })
    
    return {"conversation_id": conv_id, "message": welcome_msg}

@router.post("/{conversation_id}/message")
async def send_message(conversation_id: str, message: MessageCreate):
    # 1. Save user message
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    save_msg_query = """
    MATCH (c:Conversation {id: $conv_id})
    CREATE (m:Message {id: $msg_id, role: $role, content: $content, timestamp: $timestamp})
    CREATE (c)-[:HAS_MESSAGE]->(m)
    RETURN m
    """
    graph_service.run_query(save_msg_query, {
        "conv_id": conversation_id,
        "msg_id": msg_id,
        "role": message.role,
        "content": message.content,
        "timestamp": now
    })
    
    # 2. Get history for LLM
    history_query = """
    MATCH (c:Conversation {id: $conv_id})-[:HAS_MESSAGE]->(m:Message)
    RETURN m.role as role, m.content as content
    ORDER BY m.timestamp ASC
    """
    history = graph_service.run_query(history_query, {"conv_id": conversation_id})
    
    # 3. Call LLM
    assistant_content = await llm_service.get_chat_response(history)
    
    # 3a. Detect completion marker
    is_completed = "[COMPLETE]" in assistant_content
    # Clean up content for the user
    clean_content = assistant_content.replace("[COMPLETE]", "").strip()
    
    # 4. Save assistant message
    asst_msg_id = str(uuid.uuid4())
    graph_service.run_query(save_msg_query, {
        "conv_id": conversation_id,
        "msg_id": asst_msg_id,
        "role": "assistant",
        "content": clean_content,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"content": clean_content, "completed": is_completed}

@router.post("/history")
async def get_all_conversations():
    query = """
    MATCH (c:Conversation)
    OPTIONAL MATCH (c)-[:HAS_MESSAGE]->(m:Message)
    WITH c, m
    ORDER BY m.timestamp ASC
    WITH c, COLLECT(m)[0] as first_msg
    RETURN c.id as id, 
           COALESCE(first_msg.content, 'New Conversation') as title,
           'Normal' as type,
           c.started_at as createdAt,
           c.started_at as updatedAt,
           c.started_at as date
    ORDER BY c.started_at DESC
    """
    conversations = graph_service.run_query(query)
    # Wrap in results for frontend compatibility
    return {"results": conversations, "continuationToken": None}

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    query = """
    MATCH (c:Conversation {id: $id})
    OPTIONAL MATCH (c)-[:HAS_MESSAGE]->(m:Message)
    DETACH DELETE c, m
    """
    graph_service.run_query(query, {"id": conversation_id})
    return {"status": "success"}

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    # This is a bit redundant but the frontend uses it
    query = """
    MATCH (c:Conversation {id: $conv_id})-[:HAS_MESSAGE]->(m:Message)
    RETURN m.id as id, m.role as role, m.content as content, m.timestamp as timestamp, m.timestamp as date
    ORDER BY m.timestamp ASC
    """
    history = graph_service.run_query(query, {"conv_id": conversation_id})
    return history
