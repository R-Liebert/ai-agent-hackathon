import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch

@pytest.mark.asyncio
async def test_start_conversation():
    transport = ASGITransport(app=app)
    # Mock graph_service.run_query to avoid needing a real Neo4j
    with patch("app.services.graph_service.graph_service.run_query") as mock_query:
        mock_query.return_value = []
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post("/api/chat/start")
    
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert "message" in data
    assert "AI Painpoint Discovery Assistant" in data["message"]
    assert mock_query.call_count == 2

@pytest.mark.asyncio
async def test_send_message():
    transport = ASGITransport(app=app)
    conv_id = "test-conv-id"
    
    with patch("app.services.graph_service.graph_service.run_query") as mock_query, \
         patch("app.services.llm_service.llm_service.get_chat_response") as mock_llm:
        
        mock_query.return_value = [{"role": "user", "content": "hello"}]
        mock_llm.return_value = "I am an assistant [COMPLETE]"
        
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                f"/api/chat/{conv_id}/message",
                json={"role": "user", "content": "hello"}
            )
            
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "I am an assistant"
    assert data["completed"] is True
    assert mock_llm.called
    assert mock_query.call_count >= 2 # Save user msg, Get history, Save asst msg
