from openai import AzureOpenAI
from app.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment_name = settings.AZURE_OPENAI_DEPLOYMENT_NAME

    async def get_chat_response(self, messages):
        """Get a response from the LLM for the conversation."""
        system_prompt = {
            "role": "system",
            "content": (
                "You are an internal AI product discovery assistant. "
                "Target users are non-technical managers. "
                "Goal: Help the user describe their business pain points so data/AI teams can assess them. "
                "Ask clear, concise questions, one at a time. "
                "Avoid technical jargon. If technical topics appear, explain them briefly. "
                "You must collect: problem description, business impact, process context, data types/availability, current workarounds, and urgency. "
                "When you believe you have enough information, propose a concise summary in plain language and end with the marker [COMPLETE]."
            )
        }
        
        # Prepend system prompt if not present
        if not messages or messages[0]["role"] != "system":
            messages.insert(0, system_prompt)

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM Chat Error: {e}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."

    async def summarize_and_classify(self, transcript):
        """Summarize the conversation and classify the issue."""
        system_prompt = {
            "role": "system",
            "content": (
                "You are an expert AI solution architect. "
                "Analyze the provided transcript of a discovery session. "
                "Output a strict JSON object with the following structure: "
                "{"
                "  \"title\": \"One-line problem statement\","
                "  \"description\": \"Detailed description\","
                "  \"business_process\": \"Process affected\","
                "  \"impact_description\": \"Impact detail\","
                "  \"impact_level\": \"low/medium/high\","
                "  \"urgency\": \"low/medium/high\","
                "  \"data_types\": [\"text\", \"images\", \"sensor\", \"logs\", \"structured\", \"audio\", \"other\"],"
                "  \"data_sources\": \"Where data lives\","
                "  \"current_workaround\": \"How it's handled now\","
                "  \"capability_domains\": ["
                "    {\"name\": \"NLP\", \"confidence\": 0.9, \"rationale\": \"...\"}"
                "  ]"
                "}"
                "Valid capability domains are: NLP, Computer Vision, GenAI, Time Series Forecasting, Analytics/BI, Integration/Automation, Data Engineering, Other."
            )
        }
        
        user_prompt = {"role": "user", "content": f"Transcript:\n{transcript}"}

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[system_prompt, user_prompt],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM Summarization Error: {e}")
            return None

llm_service = LLMService()
