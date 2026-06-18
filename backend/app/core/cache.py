"""
Caching system for agent responses
Speeds up repeated queries significantly
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from pathlib import Path


class ResponseCache:
    """Simple file-based cache for agent responses"""

    def __init__(self, cache_dir: str = "cache", ttl_hours: int = 24):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.ttl = timedelta(hours=ttl_hours)

    def _get_key(self, agent_id: str, prompt: str) -> str:
        """Generate cache key from agent ID and prompt"""
        combined = f"{agent_id}:{prompt}"
        return hashlib.md5(combined.encode()).hexdigest()

    def get(self, agent_id: str, prompt: str) -> Optional[str]:
        """Get cached response if it exists and is fresh"""
        key = self._get_key(agent_id, prompt)
        cache_file = self.cache_dir / f"{key}.json"

        if not cache_file.exists():
            return None

        try:
            with open(cache_file, 'r') as f:
                data = json.load(f)

            # Check if cache is expired
            created = datetime.fromisoformat(data['created'])
            if datetime.now() - created > self.ttl:
                cache_file.unlink()  # Delete expired cache
                return None

            return data['response']
        except Exception as e:
            print(f"Cache read error: {e}")
            return None

    def set(self, agent_id: str, prompt: str, response: str):
        """Cache a response"""
        key = self._get_key(agent_id, prompt)
        cache_file = self.cache_dir / f"{key}.json"

        try:
            with open(cache_file, 'w') as f:
                json.dump({
                    'agent_id': agent_id,
                    'prompt': prompt[:100],  # Store first 100 chars as reference
                    'response': response,
                    'created': datetime.now().isoformat()
                }, f)
        except Exception as e:
            print(f"Cache write error: {e}")

    def clear(self):
        """Clear all cache"""
        for f in self.cache_dir.glob("*.json"):
            f.unlink()

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        files = list(self.cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in files)

        return {
            "cached_responses": len(files),
            "cache_size_mb": total_size / (1024 * 1024),
            "cache_dir": str(self.cache_dir)
        }