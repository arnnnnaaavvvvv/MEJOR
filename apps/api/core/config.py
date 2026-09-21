import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./auditor.db")
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    ARTIFACTS_DIR: str = Field(default="./artifacts")
    
    # Security & limits
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    JOB_TIMEOUT_SECONDS_QUICK: int = Field(default=90)
    JOB_TIMEOUT_SECONDS_DEEP: int = Field(default=300)
    MAX_CRAWL_PAGES: int = Field(default=5)
    
    # LLM Settings
    DEFAULT_LLM_PROVIDER: str = Field(default="mock")
    OPENAI_API_KEY: str = Field(default="")
    ANTHROPIC_API_KEY: str = Field(default="")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
