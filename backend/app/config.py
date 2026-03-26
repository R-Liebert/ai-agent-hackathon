from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # OpenAI / LiteLLM Config
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str = "https://aiml-llmgateway-litellm-api-ai-tooling.dev.aiml.azure.dsb.dk"
    OPENAI_MODEL_NAME: str = "gpt-4o-standard_flow11"

    # Neo4j Config
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = ""

    # Backend Config
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
