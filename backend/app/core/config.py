from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str = "sk-ant-placeholder"
    database_url: str = "postgresql://postgres:password@localhost:5432/mnemosyne"
    backend_url: str = "http://localhost:8000"

    class Config:
        env_file = "../.env"

settings = Settings()
