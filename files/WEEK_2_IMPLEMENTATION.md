# Week 2: Production Features & Robustness

## Overview

Week 1 got agents talking to Claude. Week 2 makes it **production-grade**:
- ✅ Robust error handling with retries
- ✅ Structured output parsing (agents output JSON)
- ✅ Agent memory system (learn from past tasks)
- ✅ Quality evaluation (measure output quality)
- ✅ Comprehensive logging (debug everything)
- ✅ Better metrics tracking (prove 3x faster)

---

## Key Additions This Week

```
Week 1 Foundation:
  Agent Framework + Orchestrator + Claude API

Week 2 Enhancements:
  + Retry Logic (handle API failures)
  + Output Parsing (structured responses)
  + Memory System (agents learn)
  + Quality Evaluation (assess results)
  + Logging & Monitoring (track everything)
  + Better Metrics (prove improvements)
```

---

## Day 1-2: Retry Logic & Error Handling

### File: `core/resilience.py` (NEW)

```python
"""
Resilience: Retry logic, error handling, graceful degradation
"""

import asyncio
import logging
from functools import wraps
from typing import Optional, Callable, Any
from enum import Enum
import random
from datetime import datetime

logger = logging.getLogger(__name__)

class RetryStrategy(Enum):
    """Different retry strategies"""
    EXPONENTIAL = "exponential"  # 1s, 2s, 4s, 8s...
    LINEAR = "linear"            # 1s, 2s, 3s, 4s...
    FIBONACCI = "fibonacci"      # 1s, 1s, 2s, 3s, 5s...
    RANDOM = "random"            # 1-10s random jitter

class APIError(Exception):
    """Base exception for API errors"""
    pass

class RateLimitError(APIError):
    """Rate limit exceeded"""
    pass

class ValidationError(APIError):
    """Output validation failed"""
    pass

def calculate_backoff(attempt: int, strategy: RetryStrategy, base_delay: float = 1.0) -> float:
    """Calculate backoff time based on strategy"""
    if strategy == RetryStrategy.EXPONENTIAL:
        return base_delay * (2 ** attempt)
    elif strategy == RetryStrategy.LINEAR:
        return base_delay * (attempt + 1)
    elif strategy == RetryStrategy.FIBONACCI:
        fib = [1, 1, 2, 3, 5, 8, 13, 21, 34]
        return base_delay * fib[min(attempt, len(fib) - 1)]
    elif strategy == RetryStrategy.RANDOM:
        return random.uniform(base_delay, base_delay * 10)
    return base_delay

def retry_with_backoff(
    max_retries: int = 3,
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL,
    base_delay: float = 1.0,
    on_retry: Optional[Callable] = None
):
    """
    Decorator: Retry async function with backoff strategy
    
    Usage:
        @retry_with_backoff(max_retries=3)
        async def some_api_call():
            ...
    """
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs) -> Any:
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except RateLimitError as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        delay = calculate_backoff(attempt, strategy, base_delay)
                        logger.warning(
                            f"Rate limited. Retry {attempt + 1}/{max_retries} "
                            f"in {delay:.1f}s"
                        )
                        if on_retry:
                            on_retry(attempt, delay)
                        await asyncio.sleep(delay)
                except APIError as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        delay = calculate_backoff(attempt, strategy, base_delay)
                        logger.warning(
                            f"API error: {e}. Retry {attempt + 1}/{max_retries} "
                            f"in {delay:.1f}s"
                        )
                        if on_retry:
                            on_retry(attempt, delay)
                        await asyncio.sleep(delay)
                except Exception as e:
                    # Non-retryable error
                    raise
            
            # All retries exhausted
            if last_error:
                raise last_error
        
        return wrapper
    return decorator

class CircuitBreaker:
    """
    Circuit breaker pattern: Stop calling failing service
    
    States: CLOSED (working) → OPEN (failing) → HALF_OPEN (testing)
    """
    
    def __init__(self, failure_threshold: int = 5, reset_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func: Callable) -> Any:
        """Wrap function call with circuit breaker"""
        if self.state == "OPEN":
            if self._should_attempt_reset():
                self.state = "HALF_OPEN"
            else:
                raise APIError("Circuit breaker is OPEN")
        
        try:
            result = func()
            self._record_success()
            return result
        except Exception as e:
            self._record_failure()
            raise
    
    def _record_success(self):
        """Reset on success"""
        self.failure_count = 0
        self.state = "CLOSED"
    
    def _record_failure(self):
        """Count failures"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time passed to retry"""
        if not self.last_failure_time:
            return True
        
        time_since_failure = (datetime.now() - self.last_failure_time).total_seconds()
        return time_since_failure >= self.reset_timeout

class RateLimiter:
    """Simple rate limiter to avoid API throttling"""
    
    def __init__(self, calls_per_minute: int = 60):
        self.calls_per_minute = calls_per_minute
        self.call_times: list = []
    
    async def acquire(self):
        """Wait until we can make a call"""
        now = datetime.now()
        
        # Remove calls older than 1 minute
        self.call_times = [
            t for t in self.call_times 
            if (now - t).total_seconds() < 60
        ]
        
        # If at limit, wait
        if len(self.call_times) >= self.calls_per_minute:
            oldest = self.call_times[0]
            wait_time = 60 - (now - oldest).total_seconds()
            if wait_time > 0:
                logger.info(f"Rate limit approaching. Waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
        
        self.call_times.append(datetime.now())
```

### Update: `core/agent.py` (ADD RETRY LOGIC)

Replace the `execute` method in `BaseAgent`:

```python
async def execute(self, task: str, context: Dict[str, str] = None) -> str:
    """
    Execute with retry logic and error handling
    """
    if context is None:
        context = {}
    
    self.state.status = "working"
    self.state.current_task = task
    
    # Retry configuration
    max_retries = 3
    base_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            # Format context from previous agents
            context_str = self._format_context(context)
            
            # Build the full prompt
            full_prompt = task
            if context_str:
                full_prompt = f"Previous agent outputs:\n{context_str}\n\n---\n\nYour task:\n{task}"
            
            # Call Claude with timeout
            message = asyncio.wait_for(
                asyncio.create_task(
                    self._call_claude(full_prompt)
                ),
                timeout=60.0  # 60 second timeout
            )
            
            response = await message
            
            self.state.status = "done"
            self.state.output = response
            
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

async def _call_claude(self, prompt: str) -> str:
    """Actual Claude API call"""
    message = self.client.messages.create(
        model=self.model,
        max_tokens=2000,
        system=self.system_prompt(),
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return message.content[0].text
```

### Day 2 Testing

Create `tests/test_resilience.py`:

```python
"""Test resilience features"""

import asyncio
import sys
sys.path.insert(0, '..')

from core.resilience import calculate_backoff, RetryStrategy

def test_backoff_strategies():
    """Test different backoff calculations"""
    print("Testing backoff strategies...\n")
    
    strategies = [
        RetryStrategy.EXPONENTIAL,
        RetryStrategy.LINEAR,
        RetryStrategy.FIBONACCI
    ]
    
    for strategy in strategies:
        print(f"{strategy.value}:")
        times = [calculate_backoff(i, strategy) for i in range(5)]
        print(f"  Delays: {[f'{t:.1f}s' for t in times]}")
    
    print("\n✓ All backoff strategies working")

if __name__ == "__main__":
    test_backoff_strategies()
```

Run: `python tests/test_resilience.py`

---

## Day 3-4: Output Parsing & Structured Data

### File: `core/parsers.py` (NEW)

The key insight: **Agents output structured data, not free text.**

```python
"""
Output parsing: Extract structured data from agent responses
"""

import json
import re
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ParseResult:
    """Result of parsing agent output"""
    success: bool
    data: Dict[str, Any]
    raw_content: str
    confidence: float  # 0-1, how confident we are in parse
    error: Optional[str] = None

class OutputParser:
    """Parse structured output from agents"""
    
    @staticmethod
    def extract_json(content: str) -> ParseResult:
        """
        Extract JSON from agent response
        Tries multiple strategies
        """
        
        # Strategy 1: Direct parsing (agent returns pure JSON)
        try:
            data = json.loads(content)
            return ParseResult(
                success=True,
                data=data,
                raw_content=content,
                confidence=1.0
            )
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Find JSON block in text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_pattern, content, re.DOTALL)
        
        for match in matches:
            try:
                data = json.loads(match)
                return ParseResult(
                    success=True,
                    data=data,
                    raw_content=content,
                    confidence=0.9
                )
            except json.JSONDecodeError:
                continue
        
        # Strategy 3: Markdown code block
        markdown_pattern = r'```(?:json)?\s*\n(.*?)\n```'
        match = re.search(markdown_pattern, content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                return ParseResult(
                    success=True,
                    data=data,
                    raw_content=content,
                    confidence=0.85
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback: Return raw content
        return ParseResult(
            success=False,
            data={"raw_content": content},
            raw_content=content,
            confidence=0.0,
            error="Could not parse JSON"
        )
    
    @staticmethod
    def extract_sections(content: str, section_names: List[str]) -> Dict[str, str]:
        """
        Extract labeled sections from text
        
        Example:
            content = "KEY_FINDINGS: point 1\\nSOURCES: source 1"
            sections = extract_sections(content, ["KEY_FINDINGS", "SOURCES"])
            → {"KEY_FINDINGS": "point 1", "SOURCES": "source 1"}
        """
        result = {}
        
        for section in section_names:
            # Match section header followed by content until next section
            pattern = f"{section}[:\\s]*(.+?)(?=\n[A-Z_]+[:\\s]|$)"
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            
            if match:
                result[section] = match.group(1).strip()
        
        return result
    
    @staticmethod
    def validate_structure(data: Dict, required_keys: List[str]) -> bool:
        """Check if parsed data has required keys"""
        return all(key in data for key in required_keys)

class ResearchOutputValidator:
    """Validate Research Agent output"""
    
    REQUIRED_KEYS = ["key_findings", "sources", "gaps", "confidence"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        """Validate and parse research output"""
        
        result = OutputParser.extract_json(output)
        
        if not result.success:
            # Try section extraction
            sections = OutputParser.extract_sections(
                output,
                ["KEY_FINDINGS", "SOURCES", "GAPS", "CONFIDENCE"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        # Validate required keys
        if result.success:
            if not OutputParser.validate_structure(
                result.data,
                ResearchOutputValidator.REQUIRED_KEYS
            ):
                missing = [
                    k for k in ResearchOutputValidator.REQUIRED_KEYS
                    if k not in result.data
                ]
                logger.warning(f"Missing keys in research output: {missing}")
                result.confidence *= 0.8
        
        return result

class AnalystOutputValidator:
    """Validate Analyst Agent output"""
    
    REQUIRED_KEYS = ["patterns", "key_insights", "logical_structure", "content_outline"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["PATTERNS", "KEY_INSIGHTS", "LOGICAL_STRUCTURE", "CONTENT_OUTLINE"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        if result.success:
            if not OutputParser.validate_structure(
                result.data,
                AnalystOutputValidator.REQUIRED_KEYS
            ):
                result.confidence *= 0.8
        
        return result

class WriterOutputValidator:
    """Validate Writer Agent output"""
    
    REQUIRED_KEYS = ["content", "tone", "length"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["CONTENT", "TONE", "LENGTH", "IMPROVEMENTS"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        return result

class ValidatorOutputValidator:
    """Validate Validator Agent output"""
    
    REQUIRED_KEYS = ["quality_score", "final_verdict"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["QUALITY_SCORE", "ISSUES_FOUND", "IMPROVEMENTS", "FINAL_VERDICT"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        return result

# Mapping of agent to validator
AGENT_VALIDATORS = {
    "research": ResearchOutputValidator,
    "analyze": AnalystOutputValidator,
    "write": WriterOutputValidator,
    "validate": ValidatorOutputValidator,
}

def get_validator(agent_id: str):
    """Get appropriate validator for agent"""
    return AGENT_VALIDATORS.get(agent_id)
```

### Update `core/agent.py` - Add Validation

```python
# Add to BaseAgent class

from core.parsers import get_validator, ParseResult

async def execute(self, task: str, context: Dict[str, str] = None) -> str:
    """Execute with validation"""
    
    if context is None:
        context = {}
    
    self.state.status = "working"
    self.state.current_task = task
    
    max_retries = 3
    base_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            context_str = self._format_context(context)
            full_prompt = task
            if context_str:
                full_prompt = f"Previous agent outputs:\n{context_str}\n\n---\n\nYour task:\n{task}"
            
            response = await asyncio.wait_for(
                asyncio.create_task(self._call_claude(full_prompt)),
                timeout=60.0
            )
            
            # Validate output
            validator = get_validator(self.agent_id)
            if validator:
                parse_result = validator.validate(response)
                
                if not parse_result.success and attempt < max_retries - 1:
                    logger.warning(
                        f"{self.agent_id}: Output validation failed. "
                        f"Retrying... (attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(base_delay * (2 ** attempt))
                    continue
            
            self.state.status = "done"
            self.state.output = response
            return response
        
        except asyncio.TimeoutError:
            self.state.error = "Request timed out"
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                await asyncio.sleep(wait_time)
            else:
                self.state.status = "error"
                raise
        
        except Exception as e:
            self.state.error = str(e)
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                await asyncio.sleep(wait_time)
            else:
                self.state.status = "error"
                raise
```

### Test Parsing

Create `tests/test_parsing.py`:

```python
"""Test output parsing"""

import sys
sys.path.insert(0, '..')

from core.parsers import OutputParser, ResearchOutputValidator

def test_json_extraction():
    """Test JSON extraction from various formats"""
    
    print("Test 1: Pure JSON")
    json_str = '{"key_findings": ["A", "B"], "sources": "web"}'
    result = OutputParser.extract_json(json_str)
    assert result.success
    assert result.confidence == 1.0
    print("✓ Pure JSON parsed\n")
    
    print("Test 2: JSON in markdown")
    md_str = '```json\n{"key": "value"}\n```'
    result = OutputParser.extract_json(md_str)
    assert result.success
    assert result.confidence > 0.8
    print("✓ Markdown JSON parsed\n")
    
    print("Test 3: JSON in text")
    text = 'Here is the data: {"result": "success"} and more text'
    result = OutputParser.extract_json(text)
    assert result.success
    print("✓ JSON extracted from text\n")
    
    print("Test 4: Section extraction")
    sections_text = """
KEY_FINDINGS: Point A, Point B
SOURCES: Wikipedia, Research Papers
GAPS: Nothing certain about X
CONFIDENCE: High
"""
    sections = OutputParser.extract_sections(
        sections_text,
        ["KEY_FINDINGS", "SOURCES", "GAPS", "CONFIDENCE"]
    )
    assert "key_findings" in str(sections).lower()
    print("✓ Sections extracted\n")

if __name__ == "__main__":
    test_json_extraction()
    print("✅ All parsing tests passed!")
```

Run: `python tests/test_parsing.py`

---

## Day 5: Memory System & Logging

### File: `core/memory.py` (NEW)

```python
"""
Agent Memory: Persistent learning across tasks
"""

import json
import logging
from typing import List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class Memory:
    """A single memory entry"""
    content: str
    timestamp: datetime
    task_id: str
    success: bool  # Was this memory from a successful task?
    agent_id: str
    metadata: dict = None

class AgentMemory:
    """
    Memory system for agents
    Stores learnings from past tasks
    """
    
    def __init__(self, agent_id: str, max_items: int = 100):
        self.agent_id = agent_id
        self.memories: List[Memory] = []
        self.max_items = max_items
        self.storage_file = f"memory/{agent_id}_memory.json"
    
    def add(self, content: str, task_id: str, success: bool = True, metadata: dict = None):
        """Add a memory"""
        memory = Memory(
            content=content,
            timestamp=datetime.now(),
            task_id=task_id,
            success=success,
            agent_id=self.agent_id,
            metadata=metadata or {}
        )
        
        self.memories.append(memory)
        
        # FIFO: Remove oldest if over limit
        if len(self.memories) > self.max_items:
            self.memories.pop(0)
        
        logger.debug(f"{self.agent_id}: Memory added ({len(self.memories)} total)")
    
    def get_recent_summary(self, count: int = 5) -> str:
        """Get summary of recent successful memories"""
        successful = [m for m in self.memories if m.success]
        recent = successful[-count:]
        
        if not recent:
            return "No prior successful tasks."
        
        summary_lines = []
        for memory in recent:
            summary_lines.append(f"- Task {memory.task_id}: {memory.content[:100]}...")
        
        return "\n".join(summary_lines)
    
    def get_for_context(self) -> str:
        """Get memory formatted for inclusion in prompts"""
        successful = [m for m in self.memories if m.success]
        
        if not successful:
            return ""
        
        recent = successful[-3:]  # Last 3 successful tasks
        
        context = "Based on past successful tasks:\n"
        for memory in recent:
            context += f"- {memory.content[:150]}\n"
        
        return context
    
    def save(self):
        """Save memory to disk (optional persistence)"""
        try:
            import os
            os.makedirs("memory", exist_ok=True)
            
            data = [
                {
                    **asdict(m),
                    "timestamp": m.timestamp.isoformat()
                }
                for m in self.memories
            ]
            
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Memory saved: {len(self.memories)} items")
        except Exception as e:
            logger.error(f"Failed to save memory: {e}")
    
    def load(self):
        """Load memory from disk"""
        try:
            with open(self.storage_file, 'r') as f:
                data = json.load(f)
            
            self.memories = []
            for item in data:
                item['timestamp'] = datetime.fromisoformat(item['timestamp'])
                self.memories.append(Memory(**item))
            
            logger.info(f"Memory loaded: {len(self.memories)} items")
        except FileNotFoundError:
            logger.info(f"No existing memory file: {self.storage_file}")
        except Exception as e:
            logger.error(f"Failed to load memory: {e}")

class MemoryManager:
    """Manages memory for all agents"""
    
    def __init__(self):
        self.agent_memories = {}
    
    def get_agent_memory(self, agent_id: str) -> AgentMemory:
        """Get or create memory for agent"""
        if agent_id not in self.agent_memories:
            memory = AgentMemory(agent_id)
            memory.load()  # Load from disk if exists
            self.agent_memories[agent_id] = memory
        
        return self.agent_memories[agent_id]
    
    def add_memory(self, agent_id: str, content: str, task_id: str, success: bool = True):
        """Add memory for specific agent"""
        memory = self.get_agent_memory(agent_id)
        memory.add(content, task_id, success)
    
    def save_all(self):
        """Save all agent memories"""
        for memory in self.agent_memories.values():
            memory.save()
```

### File: `core/logging_setup.py` (NEW)

```python
"""
Logging configuration for the entire system
"""

import logging
import sys
from datetime import datetime

def setup_logging(log_file: str = None, level: str = "INFO"):
    """Configure logging for all modules"""
    
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Format
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(name)-15s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)  # File gets everything
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        print(f"📝 Logging to {log_file}")
    
    print(f"📊 Logging level: {level}")

def get_logger(name: str) -> logging.Logger:
    """Get logger for a module"""
    return logging.getLogger(name)
```

### Update `core/agent.py` - Add Memory

```python
# Add to imports
from core.memory import AgentMemory
from core.logging_setup import get_logger

logger = get_logger(__name__)

# Update BaseAgent.__init__
def __init__(self, agent_id: str, role: str, model: str = "claude-3-5-sonnet-20241022"):
    self.agent_id = agent_id
    self.role = role
    self.model = model
    self.state = AgentState(agent_id=agent_id, status="idle")
    self.message_history: List[Message] = []
    self.client = anthropic.Anthropic()
    self.memory = AgentMemory(agent_id)  # NEW
    self.memory.load()  # Load past memories
    
    logger.info(f"Agent initialized: {agent_id} ({role})")

# Update execute method to use memory
async def execute(self, task: str, context: Dict[str, str] = None) -> str:
    # ... existing code ...
    
    # Before API call, include memory context
    context_str = self._format_context(context)
    memory_context = self.memory.get_for_context()  # NEW
    
    full_prompt = task
    if context_str or memory_context:
        full_prompt = f"{memory_context}\n{context_str}\n\n---\n\nYour task:\n{task}"
    
    # ... make API call ...
    
    # After successful execution, store in memory
    if self.state.status == "done":
        self.memory.add(
            content=response[:500],  # Store first 500 chars
            task_id=task_id,
            success=True
        )
```

### Update `core/orchestrator.py` - Add Memory Persistence

```python
# Add to Orchestrator class

async def execute_task(self, task: Task) -> Dict:
    # ... existing code ...
    
    # After task completion
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.now()
    
    # Save all agent memories (NEW)
    for agent in self.agents.values():
        if hasattr(agent, 'memory'):
            agent.memory.save()
    
    # ... rest of code ...
```

### Update `main.py` - With Logging

```python
import asyncio
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.agent import ResearchAgent, AnalystAgent, WriterAgent, ValidatorAgent
from core.orchestrator import Orchestrator, Task
from core.logging_setup import setup_logging, get_logger

logger = get_logger(__name__)

async def main():
    """Main execution with logging"""
    
    # Setup logging
    setup_logging(
        log_file=f"logs/execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
        level="INFO"
    )
    
    logger.info("🤖 Initializing agents...")
    
    # Initialize orchestrator
    orchestrator = Orchestrator()
    
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
    
    # Create a task
    task = Task(
        task_id="task_001",
        description="Write a comprehensive blog post about AI agents and why they matter. Include: definition, use cases, benefits, and challenges.",
        workflow=["research", "analyze", "write", "validate"]
    )
    
    # Execute
    logger.info(f"Starting task: {task.task_id}")
    result = await orchestrator.execute_task(task)
    
    # Print results
    if result["status"] == "success":
        logger.info(f"✓ Task completed in {result['execution_time']:.2f}s")
        
        # Save agent memories
        logger.info("Saving agent memories...")
        for agent in orchestrator.agents.values():
            if hasattr(agent, 'memory'):
                agent.memory.save()
        
        print(f"\n{'='*60}")
        print("FINAL CONTENT")
        print(f"{'='*60}")
        print(result["results"]["write"])
    else:
        logger.error(f"Task failed: {result['error']}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Day 6: Quality Evaluation System

### File: `core/evaluation.py` (NEW)

```python
"""
Quality evaluation: Measure output quality using Claude
"""

import logging
from typing import Optional
from dataclasses import dataclass
import json
import anthropic

logger = logging.getLogger(__name__)

@dataclass
class QualityMetrics:
    """Quality scores for agent output"""
    accuracy: float  # 0-1: How accurate/factually correct
    relevance: float  # 0-1: How relevant to task
    clarity: float  # 0-1: How clear/understandable
    completeness: float  # 0-1: How complete
    overall_score: float  # 0-1: Average of above
    feedback: str  # Detailed feedback

class QualityEvaluator:
    """Evaluate quality of agent outputs"""
    
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        self.client = anthropic.Anthropic()
        self.model = model
    
    async def evaluate(
        self,
        content: str,
        original_task: str,
        agent_type: str = "general"
    ) -> QualityMetrics:
        """
        Evaluate content quality using Claude
        
        Args:
            content: The output to evaluate
            original_task: The original task description
            agent_type: Type of agent (research, write, etc)
        """
        
        evaluation_prompt = self._build_prompt(content, original_task, agent_type)
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": evaluation_prompt
                }
            ]
        )
        
        eval_text = response.content[0].text
        return self._parse_evaluation(eval_text)
    
    def _build_prompt(self, content: str, task: str, agent_type: str) -> str:
        """Build evaluation prompt"""
        
        base_criteria = """
Evaluate the content on these dimensions (0-1 scale):
1. Accuracy: How factually correct is the content?
2. Relevance: How well does it address the original task?
3. Clarity: How clear and understandable is it?
4. Completeness: Is it thorough and complete?

Provide your evaluation in JSON format:
{
  "accuracy": 0.85,
  "relevance": 0.90,
  "clarity": 0.95,
  "completeness": 0.80,
  "feedback": "Brief explanation of scores"
}
"""
        
        return f"""Evaluate this {agent_type} content.

Original Task:
{task}

Content to Evaluate:
{content[:2000]}

{base_criteria}"""
    
    def _parse_evaluation(self, response_text: str) -> QualityMetrics:
        """Parse Claude's evaluation response"""
        
        try:
            # Try to extract JSON
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                data = json.loads(response_text)
            
            overall = (
                data.get("accuracy", 0.5) +
                data.get("relevance", 0.5) +
                data.get("clarity", 0.5) +
                data.get("completeness", 0.5)
            ) / 4
            
            return QualityMetrics(
                accuracy=data.get("accuracy", 0.5),
                relevance=data.get("relevance", 0.5),
                clarity=data.get("clarity", 0.5),
                completeness=data.get("completeness", 0.5),
                overall_score=overall,
                feedback=data.get("feedback", "")
            )
        
        except Exception as e:
            logger.warning(f"Failed to parse evaluation: {e}")
            return QualityMetrics(
                accuracy=0.5,
                relevance=0.5,
                clarity=0.5,
                completeness=0.5,
                overall_score=0.5,
                feedback=f"Evaluation failed: {str(e)}"
            )
```

---

## Week 2 Directory Structure

```
multi-agent-system/
├── core/
│   ├── __init__.py
│   ├── agent.py          # UPDATED: With retry logic, memory, logging
│   ├── orchestrator.py   # UPDATED: With memory persistence
│   ├── llm_client.py     # (Optional: Refactor API calls)
│   ├── resilience.py     # NEW: Retry, circuit breaker
│   ├── parsers.py        # NEW: Output parsing & validation
│   ├── memory.py         # NEW: Agent memory system
│   ├── evaluation.py     # NEW: Quality evaluation
│   └── logging_setup.py  # NEW: Centralized logging
├── memory/               # NEW: Persistent memory storage
│   ├── research_memory.json
│   ├── analyze_memory.json
│   ├── write_memory.json
│   └── validate_memory.json
├── logs/                 # NEW: Execution logs
│   └── execution_*.log
├── tests/
│   ├── test_basic.py
│   ├── test_resilience.py
│   ├── test_parsing.py
│   └── test_quality.py   # NEW: Quality evaluation tests
├── .env
├── requirements.txt
├── main.py
└── README.md
```

---

## Week 2 Daily Checklist

### Day 1-2: Retry Logic ✓
- [ ] Create `core/resilience.py` with retry strategies
- [ ] Update `BaseAgent.execute()` with retry logic
- [ ] Test with `tests/test_resilience.py`
- [ ] Run `main.py` and verify retries work on failures

### Day 3-4: Output Parsing ✓
- [ ] Create `core/parsers.py` with OutputParser
- [ ] Create agent-specific validators
- [ ] Update agents to validate output
- [ ] Test with `tests/test_parsing.py`
- [ ] Verify parsing works with various formats

### Day 5: Memory & Logging ✓
- [ ] Create `core/memory.py` with AgentMemory
- [ ] Create `core/logging_setup.py`
- [ ] Update agents to use memory
- [ ] Update orchestrator to persist memory
- [ ] Test memory loading in second run

### Day 6: Quality Evaluation ✓
- [ ] Create `core/evaluation.py`
- [ ] Update orchestrator to evaluate outputs
- [ ] Create test suite
- [ ] Update main.py to show quality scores

### Day 7: Integration & Testing
- [ ] Run full integration test
- [ ] Create benchmark test (vs Week 1)
- [ ] Document improvements
- [ ] Push to GitHub

---

## Quick Start - Week 2

```bash
# 1. You already have Week 1 code, just update files:

# 2. Add new files:
touch core/resilience.py core/parsers.py core/memory.py core/evaluation.py core/logging_setup.py

# 3. Copy code from sections above into each file

# 4. Update existing files (agent.py, orchestrator.py, main.py)

# 5. Create directories:
mkdir -p memory logs

# 6. Update requirements.txt:
# (Same as Week 1, but ensure all imports work)

# 7. Test:
python tests/test_resilience.py
python tests/test_parsing.py
python main.py

# Should see:
# - Logging output
# - Memory being saved
# - Quality scores printed
```

---

## Expected Output - Week 2

```
📊 Logging level: INFO
📝 Logging to logs/execution_20250120_143022.log
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: research (Research Specialist)
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: analyze (Data Analyst)
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: write (Content Writer)
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: validate (QA Validator)
✓ Agent registered: research
✓ Agent registered: analyze
✓ Agent registered: write
✓ Agent registered: validate

🤖 Initializing agents...

============================================================
Starting task: task_001
Workflow: research → analyze → write → validate
============================================================

[1/4] Running RESEARCH Agent...
------------------------------------------------------------
Memory loaded: 2 items  (from previous runs!)
✓ research: Complete
  Output: Key findings about AI agents...

[2/4] Running ANALYZE Agent...
------------------------------------------------------------
✓ analyze: Complete

[3/4] Running WRITE Agent...
------------------------------------------------------------
✓ write: Complete

[4/4] Running VALIDATE Agent...
------------------------------------------------------------
✓ validate: Complete

============================================================
FINAL RESULTS
============================================================

✓ Task completed successfully!
Execution time: 48.2 seconds (FASTER than Week 1!)

Quality Metrics:
- Accuracy: 0.92/1.0
- Relevance: 0.95/1.0
- Clarity: 0.88/1.0
- Completeness: 0.85/1.0
- Overall Score: 0.90/1.0

Feedback: Content is well-structured and comprehensive.

Saving agent memories...
```

---

## Interview Value - Week 2

Now you can talk about:

**"How do you handle failures?"**
> "I implemented exponential backoff retry logic. If Claude API fails, we retry up to 3 times with increasing delays. Also a circuit breaker pattern to stop hitting failing endpoints."

**"How do you ensure output quality?"**
> "Each agent has a custom output validator. I parse JSON, handle multiple formats, and validate required fields. If parsing fails, the agent retries."

**"How do agents learn?"**
> "Agents have persistent memory - they store summaries of successful past tasks. On new tasks, they see their memory context, improving consistency and reducing errors."

**"How do you measure performance?"**
> "I evaluate every output using Claude itself - checking accuracy, relevance, clarity, completeness. Shows objective quality metrics, not just speed."

---

## Next: Week 3 Preview

Week 3 will add:
- [ ] Web interface (FastAPI + WebSocket)
- [ ] Real-time agent monitoring dashboard
- [ ] Benchmark suite (prove 3x faster)
- [ ] Parallel agent execution
- [ ] Advanced error recovery

By end of Week 3, you'll have a **deployable system** ready for portfolio.

---

**Questions on Week 2?** Ask about:
- Any code section
- Logging configuration
- Memory persistence strategy
- Quality evaluation approach
- Integration with existing code

Good luck! This week transforms it from "working" to "production-grade" 🚀