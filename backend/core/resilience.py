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