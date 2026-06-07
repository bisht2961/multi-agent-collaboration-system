# Week 2: At a Glance

## What You're Doing This Week

**Week 1** got agents talking to Claude API.  
**Week 2** makes it production-ready.

Three words: **Resilience, Validation, Learning.**

---

## The 5-Minute Overview

### You're Adding 5 New Modules

```
Week 1 Code:
  agent.py (bare minimum) → calls Claude → returns text

Week 2 Code:
  agent.py (enhanced) → calls Claude with retry logic → validates output 
                      → stores in memory → logs everything
```

**Each module solves one production problem:**

| Problem | Solution | File |
|---------|----------|------|
| API fails? | Retry with backoff | `resilience.py` |
| Output format broken? | Parse + validate JSON | `parsers.py` |
| Agent repeats mistakes? | Save & load memory | `memory.py` |
| Quality unclear? | Score objectively | `evaluation.py` |
| Debugging nightmare? | Log everything | `logging_setup.py` |

### Why This Matters for Interviews

When they ask "how production-ready is this?", you say:

> "It retries on failures. Validates all outputs. Learns from past tasks. Has comprehensive logging for debugging. Objectively measures quality. That's production-grade."

They'll be impressed. Most people shipping AI projects skip this stuff.

---

## Implementation Strategy

### Option A: Copy-Paste Fast (4-5 hours)
1. Copy entire file blocks from `WEEK_2_IMPLEMENTATION.md`
2. Drop into your project
3. Done

### Option B: Understand While Building (8-10 hours)
1. Read code section
2. Copy it
3. Run it
4. Break it intentionally to understand why
5. Fix it
6. Move to next section

**Recommendation**: Start with Option A (get it working), then read through Option B (understand it). You'll be faster and learn more.

---

## The 5 Files You're Creating

### 1. `core/resilience.py` (70 lines)
**Does**: Retry failing API calls with backoff

**Key idea**: If Claude API fails, retry automatically before giving up

```
Request fails → Wait 1s → Retry → Still fails → Wait 2s → Retry → Works ✓
```

**You'll use**: When implementing retry logic in agent.py

---

### 2. `core/parsers.py` (150 lines)
**Does**: Extract JSON from agent responses (handles 3 different formats)

**Key idea**: Agents don't always output perfect JSON, so try multiple strategies

```
Agent output: "Here's the JSON: {key: value} and more text"
             → Tries direct JSON parse (fails)
             → Tries regex JSON extraction (finds it!)
             → Returns {key: value}
```

**You'll use**: When validating agent output before storing

---

### 3. `core/memory.py` (100 lines)
**Does**: Store summaries of past tasks so agents learn

**Key idea**: Agent sees its past successful tasks before doing a new one

```
Task 1: Research → Success → Store "Found X sources about AI"
Task 2: New research request → Load memory → See past success → Better research
```

**You'll use**: In agent init (load) and after task completion (save)

---

### 4. `core/evaluation.py` (60 lines)
**Does**: Use Claude to score output quality (0-1 scale)

**Key idea**: Objective measurement of accuracy/relevance/clarity

```
Output: "AI agents are..."
Score:  Accuracy 0.92, Relevance 0.95, Clarity 0.88 → Overall 0.91/1.0
```

**You'll use**: After validator agent runs (optional but recommended for metrics)

---

### 5. `core/logging_setup.py` (40 lines)
**Does**: Log everything to file + console in structured format

**Key idea**: When things break, you have a complete trace

```
2025-01-20 14:30:22 | core.agent | INFO | Task started
2025-01-20 14:30:35 | core.agent | INFO | Agent validated output
2025-01-20 14:30:35 | core.agent | INFO | Memory saved
```

**You'll use**: Once at program start, then automatic throughout

---

## Modified Files (What Changes in Week 1 Code)

### `core/agent.py`
```python
# Add imports
from core.memory import AgentMemory
from core.resilience import retry_with_backoff
from core.parsers import get_validator

class BaseAgent:
    def __init__(self, ...):
        # NEW: Add memory
        self.memory = AgentMemory(agent_id)
        self.memory.load()
    
    @retry_with_backoff(max_retries=3)  # NEW: Retry decorator
    async def execute(self, task, context):
        # ... existing code ...
        
        # NEW: Validate output before returning
        validator = get_validator(self.agent_id)
        if validator:
            parse_result = validator.validate(response)
        
        # NEW: Store in memory
        if self.state.status == "done":
            self.memory.add(response, task_id)
        
        return response
```

### `core/orchestrator.py`
```python
async def execute_task(self, task):
    # ... existing code ...
    
    # NEW: After task, save all agent memories
    for agent in self.agents.values():
        if hasattr(agent, 'memory'):
            agent.memory.save()
```

### `main.py`
```python
# NEW: Import logging
from core.logging_setup import setup_logging, get_logger

async def main():
    # NEW: Setup logging at start
    setup_logging(
        log_file=f"logs/execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
        level="INFO"
    )
    
    # ... rest is same ...
```

---

## What Happens When You Run It

### First Run:
```
📊 Logging level: INFO
📝 Logging to logs/execution_20250120_143022.log

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

### Second Run (Notice memory loads):
```
2025-01-20 14:35:01 | core.memory | INFO | Memory loaded: 1 items

Based on past successful tasks:
- Task task_001: Write a comprehensive blog post...

[1/4] Running RESEARCH Agent...
✓ research: Complete (Better quality because it remembers past success!)
```

---

## The Implementation Roadmap

```
Monday (Day 1-2):  Create resilience.py, test it
Tuesday (Day 3-4): Create parsers.py, integrate with agents
Wednesday (Day 5): Create memory.py + logging_setup.py
Thursday (Day 6):  Create evaluation.py, integrate everything
Friday (Day 7):    Run full integration test, commit to GitHub
```

**Total time**: 4-8 hours depending on how deep you want to understand each piece.

---

## Interview Gold You'll Have

After Week 2, you can say (and **mean it**):

> "The system retries failed API calls with exponential backoff. Every agent output is validated against a schema before being stored. Agents have persistent memory across tasks. All execution is logged to disk for debugging. Output quality is objectively scored on a 0-1 scale."

That's **5 distinct production practices** in one sentence. Most people building AI projects are nowhere near this.

---

## Quick Start (TL;DR)

1. **Download both files**: `WEEK_2_IMPLEMENTATION.md` and `WEEK_2_QUICK_REFERENCE.md`
2. **Follow the implementation order** in WEEK_2_QUICK_REFERENCE.md (Day 1, Day 2, etc)
3. **Copy-paste code blocks** from WEEK_2_IMPLEMENTATION.md
4. **Run tests** after each day to verify
5. **By Friday**: Full integration test passing

**Estimated time**: 5-8 hours total

---

## Files You'll Have by End of Week 2

```
multi-agent-system/
├── core/
│   ├── agent.py              ✓ Updated with retry + memory + validation
│   ├── orchestrator.py       ✓ Updated with memory persistence
│   ├── resilience.py         ✓ NEW - Retry logic
│   ├── parsers.py            ✓ NEW - Output validation
│   ├── memory.py             ✓ NEW - Agent memory
│   ├── evaluation.py         ✓ NEW - Quality scoring
│   └── logging_setup.py      ✓ NEW - Logging system
├── memory/                   ✓ NEW - Persistent storage
├── logs/                     ✓ NEW - Execution logs
├── tests/
│   ├── test_resilience.py    ✓ NEW
│   └── test_parsing.py       ✓ NEW
├── main.py                   ✓ Updated
└── .env                      ✓ (Same as Week 1)
```

**Total new code**: ~600 lines (copy-paste, not from scratch)

---

## Comparison: Before & After

### Before Week 2 (Week 1)
```
❌ API fails once → Entire task crashes
❌ Agent outputs weird JSON → Parser breaks
❌ Agent makes same mistake twice → No learning
❌ Something broke? → Have no idea where
❌ Is output good? → Hope for the best
```

### After Week 2
```
✅ API fails → Retry 3x with smart backoff
✅ Agent outputs weird JSON → Parser tries 3 strategies
✅ Agent makes same mistake twice → Memory prevents it
✅ Something broke? → Check the logs, exact line number
✅ Is output good? → Scored 0.92/1.0 on accuracy
```

---

## What's Next (Week 3 Preview)

Week 2 gets the system working reliably.  
Week 3 gets it looking professional.

- [ ] Web interface (FastAPI + WebSocket)
- [ ] Real-time dashboard (see agents working)
- [ ] Benchmark suite (prove 3x faster)
- [ ] Parallel execution (agents work simultaneously)
- [ ] Deploy (Railway/Vercel)

By end of Week 3, you'll have a **live demo URL** to show recruiters.

---

## You're Ready

You have:
- ✅ Complete implementation guide
- ✅ Copy-paste code (no need to write from scratch)
- ✅ Daily checklist
- ✅ Common mistakes to avoid
- ✅ Testing commands
- ✅ Interview talking points

**Start with Day 1. Copy resilience.py, run tests. One step at a time.**

You'll have a production-grade multi-agent system by Friday.

Good luck! 🚀
