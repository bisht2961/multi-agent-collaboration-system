from datetime import datetime
import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from app.core.orchestrator import ParallelOrchestrator, Task
from app.core.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)


class CreateTaskRequest(BaseModel):
    """Request model for creating a new task.
    
    This model defines the payload structure for the POST /api/tasks endpoint.
    All fields are optional and have sensible defaults.
    """
    task_id: Optional[str] = Field(
        default=None,
        description="Unique identifier for the task. If not provided, a timestamp-based ID will be generated."
    )
    description: str = Field(
        default="",
        description="The task description or instruction that the agents will process."
    )
    workflow: List[str] = Field(
        default=["research", "analyze", "write", "validate"],
        description="Ordered list of agent IDs to execute in sequence. Each agent will process the results from the previous agent."
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "task_id": "task_research_2026_06_12",
                    "description": "Research the latest developments in AI safety and provide a comprehensive analysis.",
                    "workflow": ["research", "analyze", "write", "validate"]
                }
            ]
        }
    }


def create_router(orchestrator: ParallelOrchestrator, manager: ConnectionManager) -> APIRouter:
    router = APIRouter()

    @router.get("/")
    async def get_index():
        return FileResponse("app/static/index.html")

    @router.get("/api/health")
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "agents": list(orchestrator.agents.keys())
        }

    @router.get("/api/metrics")
    async def get_metrics():
        metrics = orchestrator.get_execution_metrics()
        return {
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }

    @router.post("/api/tasks")
    async def create_task(request: CreateTaskRequest):
        task = Task(
            task_id=request.task_id or f"task_{datetime.now().timestamp()}",
            description=request.description,
            workflow=request.workflow
        )

        result = await orchestrator.execute_task_parallel(task)

        for agent in orchestrator.agents.values():
            if hasattr(agent, 'memory'):
                agent.memory.save()

        return result

    @router.get("/api/cache/stats")
    async def get_cache_stats():
        """Get caching statistics"""
        stats = {}
        for agent in orchestrator.agents.values():
            if hasattr(agent, 'cache'):
                stats[agent.agent_id] = agent.cache.get_stats()
        return {"cache_stats": stats}

    @router.post("/api/cache/clear")
    async def clear_cache():
        """Clear all caches"""
        for agent in orchestrator.agents.values():
            if hasattr(agent, 'cache'):
                agent.cache.clear()
        return {"status": "cache cleared"}
    
    @router.websocket("/ws/task")
    async def websocket_task_endpoint(websocket: WebSocket):
        await manager.connect(websocket)

        try:
            while True:
                data = await websocket.receive_text()
                task_data = json.loads(data)

                task = Task(
                    task_id=task_data.get("task_id", f"task_{datetime.now().timestamp()}"),
                    description=task_data.get("description", ""),
                    workflow=task_data.get("workflow", ["research", "analyze", "write", "validate"])
                )

                logger.info(f"WebSocket task started: {task.task_id}")

                await manager.broadcast({
                    "event": "task_start",
                    "task_id": task.task_id,
                    "timestamp": datetime.now().isoformat()
                })

                start_time = datetime.now()

                try:
                    # Use parallel execution
                    results = await orchestrator.execute_task_parallel(task)
                    task.results = results

                    # Broadcast individual agent completion events
                    for agent_id, result in results.items():
                        await manager.broadcast({
                            "event": "agent_complete",
                            "agent_id": agent_id,
                            "output_preview": result[:300] if isinstance(result, str) else str(result)[:300],
                            "output_length": len(result) if isinstance(result, str) else len(str(result)),
                            "timestamp": datetime.now().isoformat()
                        })

                except Exception as e:
                    await manager.broadcast({
                        "event": "error",
                        "message": f"Task execution failed: {str(e)}",
                        "timestamp": datetime.now().isoformat()
                    })
                    logger.error(f"Task execution error: {e}")

                execution_time = (datetime.now() - start_time).total_seconds()

                for agent in orchestrator.agents.values():
                    if hasattr(agent, 'memory'):
                        agent.memory.save()

                await manager.broadcast({
                    "event": "task_complete",
                    "task_id": task.task_id,
                    "results": task.results,
                    "execution_time": execution_time,
                    "timestamp": datetime.now().isoformat()
                })

                logger.info(f"Task completed in {execution_time:.2f}s")

        except WebSocketDisconnect:
            manager.disconnect(websocket)
            logger.info("WebSocket disconnected")
        except Exception as e:
            manager.disconnect(websocket)
            logger.error(f"WebSocket error: {e}")

    return router
