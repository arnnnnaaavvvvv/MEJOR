import asyncio
import json
from typing import Optional, AsyncGenerator, Dict, Set
import redis.asyncio as aioredis
from apps.api.core.config import settings
from apps.api.core.logging import logger

class MemoryQueue:
    def __init__(self):
        self.queues: Dict[str, asyncio.Queue] = {}
        self.subscribers: Dict[str, Set[asyncio.Queue]] = {}

    def get_queue(self, name: str) -> asyncio.Queue:
        if name not in self.queues:
            self.queues[name] = asyncio.Queue()
        return self.queues[name]

    async def push(self, queue_name: str, data: dict):
        q = self.get_queue(queue_name)
        await q.put(data)

    async def pop(self, queue_name: str, timeout: float = 1.0) -> Optional[dict]:
        q = self.get_queue(queue_name)
        try:
            return await asyncio.wait_for(q.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None

    async def publish(self, channel: str, message: dict):
        if channel in self.subscribers:
            for sub_queue in list(self.subscribers[channel]):
                await sub_queue.put(message)

    def subscribe(self, channel: str) -> asyncio.Queue:
        if channel not in self.subscribers:
            self.subscribers[channel] = set()
        q = asyncio.Queue()
        self.subscribers[channel].add(q)
        return q

    def unsubscribe(self, channel: str, q: asyncio.Queue):
        if channel in self.subscribers:
            self.subscribers[channel].discard(q)
            if not self.subscribers[channel]:
                del self.subscribers[channel]

memory_broker = MemoryQueue()

class RedisService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._client: Optional[aioredis.Redis] = None
        self.is_connected = False

    async def connect(self):
        try:
            self._client = aioredis.from_url(self.redis_url, decode_responses=True)
            await asyncio.wait_for(self._client.ping(), timeout=1.5)
            self.is_connected = True
            logger.info("Connected to Redis", url=self.redis_url)
        except Exception as e:
            self.is_connected = False
            logger.warning("Redis not reachable, falling back to in-memory broker", error=str(e))

    async def push_task(self, queue_name: str, payload: dict):
        if self.is_connected and self._client:
            try:
                await self._client.rpush(queue_name, json.dumps(payload))
                return
            except Exception:
                pass
        await memory_broker.push(queue_name, payload)

    async def pop_task(self, queue_name: str, timeout: int = 1) -> Optional[dict]:
        if self.is_connected and self._client:
            try:
                item = await self._client.blpop(queue_name, timeout=timeout)
                if item:
                    return json.loads(item[1])
            except Exception:
                pass
        return await memory_broker.pop(queue_name, timeout=float(timeout))

    async def publish_event(self, channel: str, payload: dict):
        if self.is_connected and self._client:
            try:
                await self._client.publish(channel, json.dumps(payload))
                return
            except Exception:
                pass
        await memory_broker.publish(channel, payload)

    async def event_generator(self, channel: str) -> AsyncGenerator[str, None]:
        if self.is_connected and self._client:
            try:
                pubsub = self._client.pubsub()
                await pubsub.subscribe(channel)
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        yield message["data"]
                return
            except Exception:
                pass
        
        # Memory fallback
        q = memory_broker.subscribe(channel)
        try:
            while True:
                item = await q.get()
                yield json.dumps(item)
        finally:
            memory_broker.unsubscribe(channel, q)

redis_service = RedisService()
