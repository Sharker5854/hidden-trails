import httpx
from typing import Optional, Dict, Any, Union, List
from pydantic import BaseModel


class HttpxClient():
    def __init__(self, host: str, timeout: float = 10.0):
        """
        Универсальный HTTP клиент для внешних сервисов.
        """
        self.host = host.rstrip('/')
        self.timeout = httpx.Timeout(timeout)
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.host,
            timeout=self.timeout,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        cookies: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        if not self._client:
            raise RuntimeError("Клиент не инициализирован! Используй async with.")
        
        return await self._client.get(
            endpoint,
            params=params,
            headers=headers,
            cookies=cookies,
        )
    

    async def post(
        self,
        endpoint: str,
        json: Optional[Union[Dict[str, Any], BaseModel]] = None,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        cookies: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """POST запрос (JSON/form-data/files)."""
        if not self._client:
            raise RuntimeError("Клиент не инициализирован!")
        
        if isinstance(json, BaseModel):
            json = json.model_dump()
        
        return await self._client.post(
            endpoint,
            json=json,
            data=data,
            files=files,
            params=params,
            headers=headers,
            cookies=cookies,
        )
    

    async def request(
        self,
        method: str,
        endpoint: str,
        **kwargs,
    ) -> httpx.Response:
        """Универсальный метод для запроса."""
        if not self._client:
            raise RuntimeError("Клиент не инициализирован!")
        return await self._client.request(method, endpoint, **kwargs)