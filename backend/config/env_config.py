"""
Environment configuration using Pydantic Settings.
Manages all environment variables with type validation and defaults.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.
    
    Environment variables can override the default values.
    Example: export OPENAI_API_KEY="sk-..." in your shell
    """
    
    # ==================== LLM Configuration ====================
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key for GPT models"
    )
    open_router_api_key: str = Field(
        default="",
        description="OPEN_ROUTER_API_KEY"
    )
    openai_model: str = Field(
        default="",
        description="OpenAI model to use"
    )
    open_router_api_url: str = Field(
        default="",
        description="open_router_api_url"
    )
    default_model: str = Field(
        default="nvidia/nemotron-3-super-120b-a12b:free",
        description="default_model"
    )
    llm_provider: str = Field(
        default="openai",
        description="Default LLM provider: 'openai' or 'anthropic'"
    )
    
    # ==================== Server Configuration ====================
    app_name: str = Field(
        default="Multi-Agent Collaboration System",
        description="Application name"
    )
    
    debug: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    
    host: str = Field(
        default="0.0.0.0",
        description="Server host address"
    )
    
    port: int = Field(
        default=8000,
        description="Server port"
    )
    
    # ==================== Agent Configuration ====================
    max_agents: int = Field(
        default=10,
        description="Maximum number of agents"
    )
    
    agent_timeout: int = Field(
        default=300,
        description="Agent execution timeout in seconds"
    )
    
    # ==================== Task Configuration ====================
    max_retries: int = Field(
        default=3,
        description="Maximum number of retries for failed tasks"
    )
    
    max_concurrent_tasks: int = Field(
        default=5,
        description="Maximum concurrent tasks"
    )
    
    # ==================== Logging Configuration ====================
    log_level: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL"
    )
    
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format string"
    )
    
    # ==================== Database Configuration (Optional) ====================
    database_url: Optional[str] = Field(
        default=None,
        description="Database connection URL (optional)"
    )
    
    # ==================== Other Settings ====================
    environment: str = Field(
        default="development",
        description="Environment: 'development', 'staging', or 'production'"
    )
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False  # Allow both OPENAI_API_KEY and openai_api_key
    
    def __repr__(self) -> str:
        """String representation, hiding sensitive values"""
        sensitive_fields = {"openai_api_key", "anthropic_api_key"}
        config_dict = {}
        
        for field_name in self.model_fields:
            field_value = getattr(self, field_name)
            if field_name in sensitive_fields:
                config_dict[field_name] = "***HIDDEN***" if field_value else ""
            else:
                config_dict[field_name] = field_value
        
        return f"Settings({config_dict})"


# Create a singleton settings instance
settings = Settings()


def get_settings() -> Settings:
    """
    Get the settings instance.
    Can be used for dependency injection in FastAPI.
    """
    return settings



