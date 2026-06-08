import json
import logging
import asyncio
import sys
import os
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.agent import ResearchAgent, AnalystAgent, WriterAgent, ValidatorAgent
from core.orchestrator import Orchestrator, Task
from core.logging_setup import setup_logging, get_logger

# Setup logging
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting Multi-Agent Collaboration System...")
    # Setup logging
    setup_logging(
        log_file=f"logs/execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
        level="INFO"
    )
    logger.info(" Initializing agents...")
    
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
        description="Write a comprehensive blog post about AI agents and why they matter. Include: definition, use cases, benefits, and challenges.",
        workflow=["research", "analyze", "write", "validate"]
    )
    logger.info(f"Task created: {task.task_id}")

    # Execute
    logger.info(f"Starting task: {task.task_id}")
    try:
        result = await orchestrator.execute_task(task)
        if result["status"] == "success":
            logger.info(f" Task completed in {result['execution_time']:.2f}s")

            # Save agent memories
            logger.info("Saving agent memories...")
            for agent in orchestrator.agents.values():
                if hasattr(agent, 'memory'):
                    agent.memory.save()

            print(f"\n{'=' * 60}")
            print("FINAL CONTENT")
            print(f"{'=' * 60}")
            print(result["results"]["write"])
        else:
            logger.error(f"Task failed: {result['error']}")
    except Exception as e:
        logger.error(f"Task execution failed: {str(e)}", exc_info=True)
        print(f"Error: {str(e)}")

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())