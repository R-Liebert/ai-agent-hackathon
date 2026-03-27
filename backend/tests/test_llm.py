import pytest
from unittest.mock import AsyncMock, patch
from app.services.llm_service import LLMService
import httpx

@pytest.mark.asyncio
async def test_get_chat_response_success():
    llm_service = LLMService()
    
    # Mock response data
    mock_response_data = {
        "choices": [
            {
                "message": {
                    "content": "Hello! How can I help you today?"
                }
            }
        ]
    }
    
    mock_response = AsyncMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", return_value=mock_response) as mock_post:
        messages = [{"role": "user", "content": "Hi"}]
        response = await llm_service.get_chat_response(messages)
        
        assert response == "Hello! How can I help you today?"
        mock_post.assert_called_once()
        # Verify headers
        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["x-litellm-api-key"] == llm_service.headers["x-litellm-api-key"]

@pytest.mark.asyncio
async def test_get_chat_response_failure():
    llm_service = LLMService()
    
    with patch("httpx.AsyncClient.post", side_effect=Exception("Connection error")):
        messages = [{"role": "user", "content": "Hi"}]
        response = await llm_service.get_chat_response(messages)
        
        assert "I'm sorry, I'm having trouble connecting" in response
