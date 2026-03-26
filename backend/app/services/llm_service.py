from openai import OpenAI
from app.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # We use a custom base URL and a custom header for LiteLLM as per the curl example.
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            default_headers={"x-litellm-api-key": settings.OPENAI_API_KEY}
        )
        self.model_name = settings.OPENAI_MODEL_NAME

    async def get_chat_response(self, messages):
        """Get a response from the LLM for the conversation."""
        system_prompt = {
            "role": "system",
            "content": (
                "You are a friendly and helpful Innovation Assistant. Your goal is to help colleagues register new issues or ideas for the AI and Data teams.\n\n"
                "Maintain a professional yet conversational and encouraging tone. Your target audience includes colleagues from all departments (IT, Legal, Finance, Operations, etc.).\n\n"
                "You must collect the following information to complete a registration:\n"
                "1. Who is reporting this?: Get the sender's name and their department (e.g., IT, Legal, Finance, Ops).\n"
                "2. What is the issue?: A catchy title and a clear, detailed description of the problem or opportunity.\n"
                "3. Category: Identify the primary business area (IT, Legal, Finance, Ops, etc.). Suggest a category if they are unsure.\n"
                "4. Skills required: Identify what expertise might be needed (e.g., Data Science, Legal, Automation) to help tag the issue.\n\n"
                "Guidelines:\n"
                "- Ask only one question at a time to keep the conversation simple and focused.\n"
                "- Use plain, non-technical language. Avoid jargon.\n"
                "- Be empathetic toward the user's 'pain points'.\n"
                "- Once you have gathered all the necessary details (Name, Department, Title, Description, and Category), provide a friendly summary of the registration.\n"
                "- CRITICAL: End your final summary message with the exact marker [COMPLETE] to signify the end of the data collection phase."
            )
        }
        
        # Prepend system prompt if not present
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, system_prompt)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM Chat Error: {e}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."

    async def summarize_and_classify(self, transcript):
        """Summarize the conversation and classify the issue according to the new schema."""
        system_prompt = {
            "role": "system",
            "content": (
                "You are an expert AI solution architect. "
                "Analyze the provided transcript of a discovery session. "
                "Output a strict JSON object with the following structure:\n"
                "{\n"
                "  \"title\": \"Catchy title\",\n"
                "  \"description\": \"Detailed description\",\n"
                "  \"category\": \"IT/Legal/Finance/Ops/Other\",\n"
                "  \"required_skills\": [\"Skill 1\", \"Skill 2\"],\n"
                "  \"sender_name\": \"Name of reporter\",\n"
                "  \"department\": \"Department of reporter\"\n"
                "}"
            )
        }
        
        user_prompt = {"role": "user", "content": f"Transcript:\n{transcript}"}

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[system_prompt, user_prompt],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM Summarization Error: {e}")
            return None

llm_service = LLMService()
