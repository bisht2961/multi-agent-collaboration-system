import logging
from contextlib import asynccontextmanager
from datetime import datetime

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config.env_config import settings
from app.config.fastapi_config import create_fastapi_app
from app.core.connection_manager import ConnectionManager
from app.core.logging_setup import setup_logging, get_logger
from app.core.orchestrator_setup import setup_orchestrator
from app.routes.routes import create_router

logger = get_logger(__name__)

# ============================================================================
# LIFESPAN MANAGER (replaces deprecated on_event decorators)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events
    
    This replaces the deprecated @app.on_event("startup") and 
    @app.on_event("shutdown") decorators.
    """
    # Startup
    setup_logging(level="INFO")
    logger.info("FastAPI server started")
    logger.info(f"Agents registered: {list(app.state.orchestrator.agents.keys())}")
    
    yield
    
    # Shutdown
    logger.info("FastAPI server shutting down")


# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================

# Create and configure FastAPI app with CORS, OpenAPI, and lifespan
app = create_fastapi_app(lifespan=lifespan)

# Initialize orchestrator with all agents and connection manager
orchestrator = setup_orchestrator()
manager = ConnectionManager()

# Store in app state for access throughout the application
app.state.orchestrator = orchestrator
app.state.manager = manager

# Include all API routes
app.include_router(create_router(orchestrator, manager))


# ============================================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors with proper logging and response
    
    Args:
        request: The incoming request that caused the error
        exc: The exception that was raised
        
    Returns:
        JSONResponse with error details and timestamp
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )