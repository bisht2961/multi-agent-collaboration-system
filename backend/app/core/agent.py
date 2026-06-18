import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.core.cache import ResponseCache
from app.core.llm_client import LLMClient
from app.core.memory import AgentMemory
from app.core.logging_setup import get_logger

logger = get_logger(__name__)

@dataclass
class Message:
    """Represents a message in agent communication"""
    sender: str
    receiver: str
    content: str
    timestamp: float
    message_type: str = "message"  # "message", "request", "response"


@dataclass
class AgentState:
    """Tracks agent execution state"""
    agent_id: str
    status: str  # "idle", "working", "done", "error"
    current_task: Optional[str] = None
    output: Optional[str] = None
    error: Optional[str] = None
    metadata: dict = None


def _format_context(context: dict) -> str:
    """Format previous agent outputs as context"""
    return "\n".join([
        f"{agent_id}: {output}"
        for agent_id, output in context.items()
    ])


class BaseAgent(ABC):
    """Abstract base class for all agents"""

    def __init__(self, agent_id: str, role: str, model: str = "llama-3.1-8b-instant"):
        self.agent_id = agent_id
        self.role = role
        self.model = model
        self.llm_client = LLMClient()
        self.state = AgentState(agent_id=agent_id, status="idle")
        self.message_history: list[Message] = []
        self.tools = []
        self.memory = AgentMemory(agent_id)
        self.memory.load()
        self.cache = ResponseCache()
        logger.info(f"Agent initialized: {agent_id} ({role})")

    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this agent"""
        pass

    async def execute(self, task: str, context: dict) -> str | None:
        """Execute with retry logic, timeout, and memory context"""
        if context is None:
            context = {}

        cached = self.cache.get(self.agent_id, task)
        if cached:
            print(f"✓ {self.agent_id}: Cache hit!")
            return cached

        self.state.status = "working"
        self.state.current_task = task
        self.state.error = None

        max_retries = 3
        base_delay = 1.0

        for attempt in range(max_retries):
            try:
                context_str = _format_context(context)
                memory_context = self.memory.get_for_context()

                full_prompt = task
                if context_str or memory_context:
                    full_prompt = f"{memory_context}\n{context_str}\n\n---\n\nYour task:\n{task}"

                response = await asyncio.wait_for(
                    asyncio.create_task(
                        self._call_llm(full_prompt, {})
                    ),
                    timeout=60.0
                )

                self.state.status = "done"
                self.state.output = response
                self.cache.set(self.agent_id, task, response)
                return response

            except asyncio.TimeoutError:
                self.state.error = "Request timed out"
                if attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt)
                    logger.warning(
                        f"{self.agent_id}: Timeout on attempt {attempt + 1}/{max_retries}. "
                        f"Retrying in {wait_time}s"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.state.status = "error"
                    raise

            except Exception as e:
                self.state.error = str(e)
                if attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt)
                    logger.warning(
                        f"{self.agent_id}: Error on attempt {attempt + 1}/{max_retries}: {e}. "
                        f"Retrying in {wait_time}s"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.state.status = "error"
                    raise
        return None

    async def _call_llm(self, task: str, context: dict) -> str:
        """Helper method to call LLM with system prompt and context"""
        context_str = _format_context(context)
        return await self.llm_client.call_agent(
            system_prompt=self.system_prompt(),
            user_message=task,
            context=context_str or None
        )

    def add_message(self, message: Message):
        """Track message in history"""
        self.message_history.append(message)

    def get_context_summary(self) -> str:
        """Return recent message history as context"""
        recent = self.message_history[-10:]
        return "\n".join([
            f"{m.sender}: {m.content}" for m in recent
        ])


class ResearchAgent(BaseAgent):
    """Agent specialized in researching and gathering information"""

    def system_prompt(self) -> str:
        return """You are a Research Agent specializing in finding and synthesizing information.
Your role:
- Identify key information needed to answer a question
- Break down research into searchable components
- Provide credible, sourced information
- Flag gaps or uncertain information
- Format findings clearly for other agents

Always be concise and structure your findings as:
1. KEY FINDINGS: Main points discovered
2. SOURCES: Where this information came from
3. GAPS: What's unclear or needs more research
4. CONFIDENCE: Your confidence level (High/Medium/Low)"""


class AnalystAgent(BaseAgent):
    """Agent specialized in analyzing and synthesizing information"""

    def system_prompt(self) -> str:
        return """You are an Analyst Agent specializing in processing and synthesizing information.
Your role:
- Take raw information and identify patterns
- Synthesize multiple sources into coherent insights
- Identify contradictions and resolve them
- Create structured analyses
- Prepare information for content creation

Always structure your analysis as:
1. PATTERNS: What themes/patterns emerge
2. INSIGHTS: What does this mean
3. STRUCTURE: How should this be organized
4. NEXT_STEPS: What information is needed next"""


class WriterAgent(BaseAgent):
    """Agent specialized in creating engaging content"""

    def system_prompt(self) -> str:
        return """You are a Writer Agent specializing in creating engaging, clear content.
Your role:
- Transform analyzed information into readable content
- Maintain consistent tone and style
- Create engaging narratives from data
- Optimize for audience understanding
- Follow content guidelines

Always structure your output as:
1. DRAFT: The main content
2. TONE_ASSESSMENT: How well it matches the requested tone
3. READING_LEVEL: Estimated difficulty/reading level
4. REFINEMENT_NOTES: What could be improved"""


class ValidatorAgent(BaseAgent):
    """Agent specialized in quality assurance and validation"""

    def system_prompt(self) -> str:
        return """You are a Validator Agent specializing in quality assurance.
Your role:
- Check content for accuracy and consistency
- Verify claims against known information
- Identify logical gaps or issues
- Ensure compliance with guidelines
- Provide improvement recommendations

Always structure your feedback as:
1. QUALITY_SCORE: Rate content 1-10 with explanation
2. ISSUES_FOUND: Specific problems identified
3. IMPROVEMENTS: Concrete suggestions for improvement
4. FINAL_VERDICT: Pass/Needs Revision/Reject"""
