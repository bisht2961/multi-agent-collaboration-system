from enum import Enum
from typing import Optional
import logging
from datetime import datetime
import asyncio
from typing import List, Set, Dict

from app.core.agent import BaseAgent

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Task:
    """Represents a task to be executed by agents"""

    def __init__(self, task_id: str, description: str, workflow: List[str]):
        self.task_id = task_id
        self.description = description
        self.workflow = workflow  # Order of agents: ["research", "analyze", "write", "validate"]
        self.status = TaskStatus.PENDING
        self.results: Dict[str, str] = {}
        self.created_at = datetime.now()
        self.completed_at: Optional[datetime] = None


class Orchestrator:
    """Manages task execution across multiple agents"""

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.tasks: Dict[str, Task] = {}
        self.execution_log: List[Dict] = []

    def register_agent(self, agent: BaseAgent):
        """Register an agent with the orchestrator"""
        self.agents[agent.agent_id] = agent

    async def execute_task(self, task: Task) -> Dict:
        """Execute task through agent workflow"""
        logger.info(f"Starting execution of task: {task.task_id}")
        task.status = TaskStatus.IN_PROGRESS
        context = {}

        start_time = datetime.now()

        try:
            for agent_id in task.workflow:
                logger.info(f"Preparing to execute agent: {agent_id}")
                if agent_id not in self.agents:
                    raise ValueError(f"Agent {agent_id} not registered")

                agent = self.agents[agent_id]
                agent.state.status = "working"
                logger.info(f"Executing agent: {agent_id}")

                # Execute agent with accumulated context
                result = await agent.execute(task.description, context)
                context[agent_id] = result
                task.results[agent_id] = result

                agent.state.status = "done"
                agent.state.output = result
                logger.info(f"Agent {agent_id} completed successfully")

            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()

            # Save all agent memories (NEW)
            for agent in self.agents.values():
                if hasattr(agent, 'memory'):
                    agent.memory.save()

            # Log execution
            execution_time = (task.completed_at - start_time).total_seconds()
            self.execution_log.append({
                "task_id": task.task_id,
                "workflow": task.workflow,
                "execution_time": execution_time,
                "timestamp": start_time.isoformat()
            })
            
            logger.info(f"Task {task.task_id} completed in {execution_time:.2f} seconds")

            return {
                "status": "success",
                "task_id": task.task_id,
                "results": task.results,
                "execution_time": execution_time
            }

        except Exception as e:
            logger.error(f"Task execution failed: {str(e)}", exc_info=True)
            task.status = TaskStatus.FAILED
            return {
                "status": "error",
                "task_id": task.task_id,
                "error": str(e)
            }

    def get_execution_metrics(self) -> Dict:
        """Calculate performance metrics"""
        if not self.execution_log:
            return {}

        times = [log["execution_time"] for log in self.execution_log]
        return {
            "total_tasks": len(self.execution_log),
            "avg_execution_time": sum(times) / len(times),
            "min_execution_time": min(times),
            "max_execution_time": max(times),
            "total_time": sum(times)
        }


class ParallelOrchestrator(Orchestrator):
    """Execute agents in parallel where dependencies allow"""

    def get_dependencies(self) -> Dict[str, Set[str]]:
        """Define which agents depend on which"""
        return {
            "research": set(),  # No dependencies
            "analyze": {"research"},  # Depends on research
            "write": {"research", "analyze"},  # Depends on both
            "validate": {"write"}  # Depends on write
        }

    async def execute_task_parallel(self, task):
        """Execute with parallelization where possible"""

        dependencies = self.get_dependencies()
        completed = set()
        results = {}

        while len(completed) < len(self.agents):
            # Find agents with no pending dependencies
            ready = [
                agent_id for agent_id in self.agents
                if agent_id not in completed
                   and dependencies[agent_id].issubset(completed)
            ]

            if not ready:
                break

            # Execute ready agents in parallel
            tasks = [
                self.agents[agent_id].execute(task.description, results)
                for agent_id in ready
            ]

            responses = await asyncio.gather(*tasks)

            for agent_id, response in zip(ready, responses):
                results[agent_id] = response
                completed.add(agent_id)

        return results