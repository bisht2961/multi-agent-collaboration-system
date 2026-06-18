"""
Initialize and configure the orchestrator with all agents
"""

from app.core.orchestrator import ParallelOrchestrator
from app.core.agent import ResearchAgent, AnalystAgent, WriterAgent, ValidatorAgent


def setup_orchestrator() -> ParallelOrchestrator:
    """
    Initialize orchestrator and register all agents
    
    Returns:
        ParallelOrchestrator: Configured parallel orchestrator with all agents registered
    """
    orchestrator = ParallelOrchestrator()
    
    # Create agents
    research_agent = ResearchAgent("research", "Research Specialist")
    analyst_agent = AnalystAgent("analyze", "Data Analyst")
    writer_agent = WriterAgent("write", "Content Writer")
    validator_agent = ValidatorAgent("validate", "QA Validator")
    
    # Register agents
    orchestrator.register_agent(research_agent)
    orchestrator.register_agent(analyst_agent)
    orchestrator.register_agent(writer_agent)
    orchestrator.register_agent(validator_agent)
    
    return orchestrator

