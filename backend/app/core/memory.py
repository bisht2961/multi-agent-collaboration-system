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