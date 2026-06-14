import requests
import json
import asyncio
from typing import Optional
from app.config.env_config import settings




class LLMClient:
    """Wrapper around OpenRouter API"""

    def __init__(self):
        self.api_key = settings.open_router_api_key
        self.model = getattr(settings, "openrouter_model", settings.default_model)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _post(self, messages: list, max_tokens: int, reasoning: bool = False) -> dict:
        """Make a POST request to the OpenRouter API."""
        if not self.api_key:
            raise ValueError("OPEN_ROUTER_API_KEY environment variable is not set")
        if not settings.open_router_api_url:
            raise ValueError("OPEN_ROUTER_API_URL environment variable is not set")
            
        payload = {
            "model": self.model,
            "messages": messages,
        }
        
        # Only include max_tokens if it's explicitly set and not the default
        if max_tokens and max_tokens > 0:
            payload["max_tokens"] = max_tokens
            
        if reasoning:
            payload["reasoning"] = {"enabled": True}

        response = requests.post(
            url=settings.open_router_api_url,
            headers=self.headers,
            data=json.dumps(payload),
            timeout=30
        )
        response.raise_for_status()
        return response.json()

    async def call_agent(
        self,
        system_prompt: str,
        user_message: str,
        context: Optional[str] = None,
        max_tokens: int = 1000,
        reasoning: bool = False,
    ) -> str:
        """
        Call OpenRouter API with an agent system prompt.

        Args:
            system_prompt: The system-level instruction for the model.
            user_message: The user's input message.
            context: Optional prior context prepended to the user message.
            max_tokens: Maximum tokens to generate.
            reasoning: Whether to enable chain-of-thought reasoning (OpenRouter feature).

        Returns:
            The assistant's response text.
        """
        full_context = f"Previous context:\n{context}\n\n" if context else ""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{full_context}{user_message}"},
        ]

        try:
            # Run the synchronous request in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, self._post, messages, max_tokens, reasoning
            )
            return response["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"LLM API call failed: {str(e)}")

    async def call_agent_multi_turn(
        self,
        system_prompt: str,
        conversation: list[dict],
        max_tokens: int = 1000,
        reasoning: bool = False,
    ) -> str:
        """
        Call OpenRouter API with a full multi-turn conversation history.
        Preserves reasoning_details for continued reasoning across turns.

        Args:
            system_prompt: The system-level instruction for the model.
            conversation: List of message dicts (role + content, optionally reasoning_details).
            max_tokens: Maximum tokens to generate.
            reasoning: Whether to enable reasoning on this turn.

        Returns:
            The assistant's response text.
        """
        messages = [{"role": "system", "content": system_prompt}] + conversation
        
        try:
            # Run the synchronous request in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, self._post, messages, max_tokens, reasoning
            )
            return response["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"LLM API call failed: {str(e)}")


class BaseAgent(LLMClient):
    """Base agent that uses LLMClient to call OpenRouter."""

    def __init__(self, agent_id: str, role: str):
        super().__init__()
        self.agent_id = agent_id
        self.role = role

    def system_prompt(self) -> str:
        """Override in subclasses to define agent behaviour."""
        return f"You are a {self.role} agent."

    async def execute(self, task: str, context: dict) -> str:
        """Execute a task using the OpenRouter API."""
        context_str = self._format_context(context)
        response = await self.call_agent(
            system_prompt=self.system_prompt(),
            user_message=task,
            context=context_str,
        )
        return response

    def _format_context(self, context: dict) -> str:
        """Format previous agent outputs as context."""
        return "\n".join(
            f"{agent_id}: {output}" for agent_id, output in context.items()
        )