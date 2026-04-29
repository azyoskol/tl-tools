import json
import time
import hashlib
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

in_memory_cache = {}

class CacheMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host="redis",
                    port=6379,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                self.redis_client.ping()
            except:
                self.redis_client = None

    async def dispatch(self, request: Request, call_next):
        if request.method != "GET":
            return await call_next(request)
        
        if self._should_skip_cache(request):
            return await call_next(request)
        
        cache_key = self._get_cache_key(request)
        cached_data = self._get_from_cache(cache_key)
        
        if cached_data is not None:
            return Response(
                content=cached_data,
                media_type="application/json"
            )
        
        response = await call_next(request)
        
        if response.status_code == 200:
            try:
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                if self.redis_client:
                    self.redis_client.setex(cache_key, 300, body.decode('utf-8'))
                else:
                    in_memory_cache[cache_key] = {
                        "data": body.decode('utf-8'),
                        "expires": time.time() + 300
                    }
                
                return Response(
                    content=body,
                    media_type="application/json"
                )
            except Exception:
                return response
        
        return response
    
    def _should_skip_cache(self, request: Request) -> bool:
        skip_paths = ["/health", "/docs", "/openapi", "/api/v1/collectors"]
        for path in skip_paths:
            if request.url.path.startswith(path):
                return True
        return False
    
    def _get_cache_key(self, request: Request) -> str:
        params = str(request.query_params)
        return f"cache:{request.url.path}:{hashlib.md5(params.encode()).hexdigest()}"
    
    def _get_from_cache(self, key: str) -> str | None:
        if self.redis_client:
            try:
                data = self.redis_client.get(key)
                return data
            except:
                pass
        
        if key in in_memory_cache:
            entry = in_memory_cache[key]
            if entry["expires"] > time.time():
                return entry["data"]
            else:
                del in_memory_cache[key]
        
        return None