import asyncio
import json
import logging

from core.agent import ResearchAgent, AnalystAgent, WriterAgent, ValidatorAgent
from core.orchestrator import Orchestrator, Task

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting Multi-Agent Collaboration System...")
    
    # Initialize orchestrator
    orchestrator = Orchestrator()
    logger.info("Orchestrator initialized")

    # Create and register agents
    logger.info("Creating and registering agents...")
    research_agent = ResearchAgent("research", "Research Specialist")
    analyst_agent = AnalystAgent("analyze", "Data Analyst")
    writer_agent = WriterAgent("write", "Content Writer")
    validator_agent = ValidatorAgent("validate", "QA Validator")

    orchestrator.register_agent(research_agent)
    orchestrator.register_agent(analyst_agent)
    orchestrator.register_agent(writer_agent)
    orchestrator.register_agent(validator_agent)
    logger.info(f"Registered {len(orchestrator.agents)} agents")

    # Create a task
    logger.info("Creating task...")
    task = Task(
        task_id="task_001",
        description="Write a blog post about AI agents",
        workflow=["research", "analyze", "write", "validate"]
    )
    logger.info(f"Task created: {task.task_id}")

    # Execute
    logger.info("Executing task workflow...")
    try:
        result = await orchestrator.execute_task(task)
        logger.info("Task execution completed!")
        print(json.dumps(result, indent=2))
        print("\nMetrics:", orchestrator.get_execution_metrics())
    except Exception as e:
        logger.error(f"Task execution failed: {str(e)}", exc_info=True)
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())