from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi


def create_fastapi_app(lifespan: Callable = None) -> FastAPI:
    """Create and configure FastAPI application
    
    Args:
        lifespan: Optional async context manager for startup/shutdown events
        
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="Multi-Agent System",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Set custom OpenAPI schema
    app.openapi = lambda: custom_openapi(app)
    
    return app


def custom_openapi(app: FastAPI) -> dict:
    """Configure custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Multi-Agent System API",
        version="1.0.0",
        description="AI agents orchestrated for complex task decomposition",
        routes=app.routes,
    )

    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema