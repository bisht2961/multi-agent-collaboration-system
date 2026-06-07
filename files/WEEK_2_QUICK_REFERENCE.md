# Week 2 Quick Reference & Checklist

## Files You Need to Create/Update

### NEW Files (Create these)
```
core/resilience.py      ← Retry logic, circuit breaker, rate limiting
core/parsers.py         ← Output parsing & validation
core/memory.py          ← Agent memory system
core/evaluation.py      ← Quality evaluation
core/logging_setup.py   ← Centralized logging
```

### UPDATE Files (Modify existing Week 1 code)
```
core/agent.py           ← Add retry logic, validation, memory
core/orchestrator.py    ← Add memory persistence
main.py                 ← Add logging setup
requirements.txt        ← (Keep same as Week 1)
```

### CREATE Directories
```
mkdir -p memory logs
```

---

## Implementation Order (Fastest Path)

### Day 1: Start Here
```bash
# 1. Create resilience.py
# Copy: core/resilience.py section from WEEK_2_IMPLEMENTATION.md
# Lines: Everything in "core/resilience.py" block

# 2. Test it
python -c "from core.resilience import retry_with_backoff; print('✓ Imports work')"

# 3. Run: python tests/test_resilience.py
# Expected: All backoff strategies working
```

### Day 2: Parsing
```bash
# 1. Create parsers.py
# Copy: core/parsers.py section from WEEK_2_IMPLEMENTATION.md

# 2. Update core/agent.py with validation
# Find: async def execute(self, task: str, context: Dict...
# Replace: with the updated execute() method that includes validation

# 3. Test it
python tests/test_parsing.py
# Expected: All parsing tests pass
```

### Day 3: Memory System
```bash
# 1. Create memory.py
# Copy: core/memory.py section from WEEK_2_IMPLEMENTATION.md

# 2. Create logging_setup.py
# Copy: core/logging_setup.py section from WEEK_2_IMPLEMENTATION.md

# 3. Update core/agent.py __init__
# Add: self.memory = AgentMemory(agent_id)
#      self.memory.load()

# 4. Update core/orchestrator.py execute_task()
# Add: Save memory after task completion
```

### Day 4: Quality Evaluation
```bash
# 1. Create evaluation.py
# Copy: core/evaluation.py section from WEEK_2_IMPLEMENTATION.md

# 2. Update main.py with logging
# Copy: Updated main.py from WEEK_2_IMPLEMENTATION.md

# 3. Test full flow
python main.py
# Expected: See logging output, memory loading, quality scores
```

### Day 5: Integration & Testing
```bash
# 1. Run full test suite
python tests/test_resilience.py
python tests/test_parsing.py
python main.py

# 2. Run twice
# First run: See agents working, memory created
# Second run: See "Memory loaded: X items"

# 3. Check for logs
ls logs/execution_*.log
cat logs/execution_latest.log | head -20
```

---

## Common Copy-Paste Mistakes (Avoid These!)

### ❌ Don't
```python
# Wrong - tries to await a non-async function
result = await self._call_claude(prompt)

# Wrong - imports datetime wrong
from datetime import datetime  # Missing
result.timestamp = datetime  # This is a class, not a timestamp

# Wrong - missing API key in environment
client = anthropic.Anthropic()  # Will fail if ANTHROPIC_API_KEY not in .env
```

### ✅ Do
```python
# Right - call_claude is async
response = await self._call_claude(prompt)

# Right - create instance
from datetime import datetime
result.timestamp = datetime.now()

# Right - load API key from environment
import os
from dotenv import load_dotenv
load_dotenv()
client = anthropic.Anthropic()  # Reads from .env
```

---

## File Structure After Week 2

```
multi-agent-system/
├── core/
│   ├── __init__.py
│   ├── agent.py              # UPDATED
│   ├── orchestrator.py       # UPDATED
│   ├── resilience.py         # NEW
│   ├── parsers.py            # NEW
│   ├── memory.py             # NEW
│   ├── evaluation.py         # NEW
│   └── logging_setup.py      # NEW
├── memory/                   # NEW
│   └── (agent memory files created at runtime)
├── logs/                     # NEW
│   └── (log files created at runtime)
├── tests/
│   ├── test_basic.py
│   ├── test_resilience.py    # NEW
│   └── test_parsing.py       # NEW
├── .env
├── requirements.txt
├── main.py                   # UPDATED
└── README.md
```

---

## Testing Quick Commands

```bash
# Test imports
python -c "from core.resilience import *; from core.parsers import *; from core.memory import *; print('✓ All imports OK')"

# Test individual features
python tests/test_resilience.py
python tests/test_parsing.py

# Full integration test
python main.py

# Check logs were created
ls -la logs/

# Check memory was saved
ls -la memory/

# See latest log
tail -20 logs/execution_*.log
```

---

## What Each New Module Does

### `core/resilience.py`
**Purpose**: Handle API failures gracefully

**Key Classes**:
- `retry_with_backoff()`: Decorator that retries async functions
- `CircuitBreaker`: Stop hitting failing APIs
- `RateLimiter`: Avoid API rate limits

**When Used**: Every time an agent calls Claude

```python
# Usage in agent code:
@retry_with_backoff(max_retries=3)
async def _call_claude(self, prompt: str) -> str:
    # This will retry 3 times if it fails
    return await self.client.messages.create(...)
```

---

### `core/parsers.py`
**Purpose**: Extract structured data from agent responses

**Key Classes**:
- `OutputParser`: Generic JSON extraction (tries 3 strategies)
- `ResearchOutputValidator`: Validates research agent output
- `AnalystOutputValidator`: Validates analyst output
- `WriterOutputValidator`: Validates writer output
- `ValidatorOutputValidator`: Validates validator output

**When Used**: After each agent runs, before storing output

```python
# Usage:
validator = get_validator("research")
result = validator.validate(agent_output)
if not result.success:
    print(f"Parsing failed: {result.error}")
```

---

### `core/memory.py`
**Purpose**: Agents learn from past tasks

**Key Classes**:
- `AgentMemory`: Per-agent memory storage
- `MemoryManager`: Manages memory for all agents

**When Used**: On agent init (load) and after task completion (save)

```python
# Usage:
memory = self.agent.memory
memory.add("Task X was successful", task_id, success=True)
memory.save()  # Persist to disk

# Next time:
memory.load()  # Load from disk
context = memory.get_for_context()  # Use in prompt
```

---

### `core/evaluation.py`
**Purpose**: Measure output quality objectively

**Key Classes**:
- `QualityEvaluator`: Uses Claude to evaluate outputs
- `QualityMetrics`: Scores (accuracy, relevance, clarity, etc)

**When Used**: After validator agent runs (optional but recommended)

```python
# Usage:
evaluator = QualityEvaluator()
metrics = await evaluator.evaluate(content, original_task)
print(f"Quality: {metrics.overall_score}/1.0")
```

---

### `core/logging_setup.py`
**Purpose**: Centralized logging to console + file

**Key Functions**:
- `setup_logging()`: Configure logging once at startup
- `get_logger()`: Get logger for any module

**When Used**: Once at program start in main.py

```python
# Usage:
setup_logging(log_file="logs/execution.log", level="INFO")
logger = get_logger(__name__)
logger.info("Task started")
```

---

## Debug Checklist

### If parsing fails:
```python
# 1. Check if agent returns JSON
print(f"Raw output: {agent_output[:500]}")

# 2. Check if parser finds JSON
from core.parsers import OutputParser
result = OutputParser.extract_json(agent_output)
print(f"Parse success: {result.success}")
print(f"Confidence: {result.confidence}")
```

### If memory doesn't load:
```bash
# 1. Check memory files exist
ls -la memory/

# 2. Check file content
cat memory/research_memory.json | head -20

# 3. Check permissions
chmod 644 memory/*.json
```

### If logging doesn't work:
```bash
# 1. Check logs directory exists
mkdir -p logs

# 2. Check log file was created
ls logs/execution_*.log

# 3. View recent logs
tail -50 logs/execution_*.log | grep ERROR
```

### If retry logic doesn't trigger:
```python
# 1. Add print statement in retry handler
logger.warning(f"Attempt {attempt + 1} failed, retrying...")

# 2. Temporarily break API call to test:
# In _call_claude():
if attempt == 0:
    raise Exception("Test error")  # Will trigger retry
```

---

## Expected Output - End of Week 2

### First Run:
```
📊 Logging level: INFO
📝 Logging to logs/execution_20250120_143022.log
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: research
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: analyze
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: write
2025-01-20 14:30:22 | core.agent        | INFO     | Agent initialized: validate

[1/4] Running RESEARCH Agent...
✓ research: Complete

[2/4] Running ANALYZE Agent...
✓ analyze: Complete

[3/4] Running WRITE Agent...
✓ write: Complete

[4/4] Running VALIDATE Agent...
✓ validate: Complete

Quality Metrics:
- Accuracy: 0.92/1.0
- Relevance: 0.95/1.0
- Clarity: 0.88/1.0
- Completeness: 0.85/1.0
- Overall Score: 0.90/1.0

Saving agent memories...
✓ Memory saved: 1 items
```

### Second Run (see memory loading):
```
Memory loaded: 1 items
2025-01-20 14:35:01 | core.memory      | INFO     | Memory loaded: 1 items

Based on past successful tasks:
- Task task_001: Write a comprehensive blog post about AI agents...

[1/4] Running RESEARCH Agent...
✓ research: Complete
```

---

## GitHub Commit Messages (Optional)

```bash
# Day 1
git add core/resilience.py
git commit -m "feat: Add retry logic with exponential backoff"

# Day 2
git add core/parsers.py
git commit -m "feat: Add output parsing and validation for agents"

# Day 3
git add core/memory.py core/logging_setup.py
git commit -m "feat: Add agent memory persistence and structured logging"

# Day 4
git add core/evaluation.py
git commit -m "feat: Add quality evaluation system"

# Day 5
git add -A
git commit -m "refactor: Integrate all Week 2 production features"
git push origin main
```

---

## Interview Talking Points You'll Own After Week 2

**"How do you handle API failures?"**
> "Exponential backoff retry logic - first failure waits 1s, second waits 2s, third waits 4s. Also a circuit breaker pattern to stop hammering a failing API. This is critical for reliability in production."

**"How do you ensure output quality?"**
> "Three-layer validation: First, the agent's built-in output validator. Second, I parse JSON with multiple strategies to handle different formats. Third, I use Claude to objectively evaluate accuracy, relevance, and clarity."

**"How do agents improve over time?"**
> "Persistent memory system. After each successful task, the agent stores a summary. Next time, it loads its memory context and sees what worked before. This reduces errors and improves consistency."

**"How do you monitor what's happening?"**
> "Structured logging to both console and file. Every important action is logged: agent initialization, API calls, retries, validation results. Makes debugging production issues much easier."

**"What's the biggest challenge you faced?"**
> "Output format consistency. Agents don't always return data in the expected structure. Solved it with a parsing system that tries JSON extraction, markdown blocks, and section extraction. Also added a validation layer that retries if output structure is wrong."

---

## Week 2 vs Week 1 Comparison

| Feature | Week 1 | Week 2 |
|---------|--------|--------|
| API Failures | Crash on error | Retry 3x with backoff |
| Output Format | Raw text, hope it works | Validated JSON with fallbacks |
| Agent Learning | Starts fresh each task | Learns from past 100 tasks |
| Logging | Print statements | Structured logs to file |
| Quality Assurance | No check | Objective scoring 0-1 |
| Debug Difficulty | Hard (no logs) | Easy (comprehensive logging) |
| Production Ready | No (too fragile) | Yes (handles edge cases) |

---

## Next: Week 3 Preview

After Week 2 is solid, Week 3 adds:
- [ ] FastAPI web server with WebSocket for real-time updates
- [ ] React frontend showing agent execution flow
- [ ] Benchmark suite proving 3x faster claim
- [ ] Parallel agent execution
- [ ] Deploy to Railway/Vercel

By Week 3, you'll have a **live demo** you can click and show recruiters.

---

## If You Get Stuck

### "ImportError: No module named 'core'"
```bash
# Make sure you're in project root
cd /path/to/multi-agent-system

# Add it to path if running from subdirectory
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run from project root
python main.py
```

### "No API key found"
```bash
# Check .env exists
cat .env

# Should show:
# ANTHROPIC_API_KEY=sk-ant-...

# If missing:
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY" > .env
```

### "Memory not loading"
```bash
# Make sure memory/ directory exists
mkdir -p memory

# Check file permissions
ls -la memory/

# Try removing old memory and starting fresh
rm -rf memory/
python main.py  # Will create new memory
```

### "Tests failing"
```bash
# Run with verbose output
python -m pytest tests/ -v

# Or if not using pytest, run directly:
python tests/test_parsing.py

# Check for import errors:
python -c "import sys; sys.path.insert(0, '.'); from core.parsers import *"
```

---

**You've got this! Week 2 is about making the system bulletproof.** 🚀
