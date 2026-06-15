import logging
from datetime import datetime

from app.core.connection_manager import ConnectionManager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config.env_config import settings

from app.core.agent import ResearchAgent, AnalystAgent, WriterAgent, ValidatorAgent
from app.core.orchestrator import Orchestrator, Task
from app.core.logging_setup import setup_logging, get_logger
from app.routes.routes import create_router

logger = get_logger(__name__)

# ============================================================================
# INITIALIZATION
# ============================================================================

app = FastAPI(title="Multi-Agent System", version="1.0.0")

# CORS - Allow requests from anywhere (important for deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize orchestrator and agents
orchestrator = Orchestrator()

# Register agents
research_agent = ResearchAgent("research", "Research Specialist")
analyst_agent = AnalystAgent("analyze", "Data Analyst")
writer_agent = WriterAgent("write", "Content Writer")
validator_agent = ValidatorAgent("validate", "QA Validator")

orchestrator.register_agent(research_agent)
orchestrator.register_agent(analyst_agent)
orchestrator.register_agent(writer_agent)
orchestrator.register_agent(validator_agent)

manager = ConnectionManager()

# Include all routes
app.include_router(create_router(orchestrator, manager))


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on server start"""
    setup_logging(level="INFO")
    logger.info("FastAPI server started")
    logger.info(f"Agents registered: {list(orchestrator.agents.keys())}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown"""
    logger.info("FastAPI server shutting down")


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unexpected errors"""
    logger.error(f"Unhandled exception: {exc}")
    return {
        "status": "error",
        "message": str(exc),
        "timestamp": datetime.now().isoformat()
    }


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