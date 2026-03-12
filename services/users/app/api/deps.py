from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
import httpx

from app.core.config import settings
from app.services.auth import AuthService
from app.services.users import UsersService
from app.models.users import User
from app.schemas.auth import TokenPayload
from ..db.session import AsyncSessionLocal



async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_httpx_client(request: Request) -> httpx.AsyncClient:
    """Внутренний HTTP-клиент для обращения из роутера к другим эндпоинтам нашего приложения"""
    client = httpx.AsyncClient(
        base_url=settings.app_host,  # конкретный path эндпоинта целевого эндпоинта передается следующим образом:   client.post("/auth/refresh", headers={"Host": "Settings.app_host"}) , где Settings.app_host - это хост текущего микросервиса, откуда шлем запрос
        cookies=request.cookies,  # передаем cookies, которые установит целевой эндпоинт, к которому обратимся
        timeout=1.0
    )
    try:
        yield client
    finally:
        await client.aclose()




async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


async def get_users_service(db: AsyncSession = Depends(get_db)) -> UsersService:
    return UsersService(db)


async def get_current_user(
    request: Request,
    response: Response,
    auth_svc: Annotated[AuthService, Depends(get_auth_service)],
    users_svc: Annotated[UsersService, Depends(get_users_service)],
    client: httpx.AsyncClient = Depends(get_httpx_client),
) -> User:
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
    else:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(401, "Not authenticated.")
    
    try:
        payload = auth_svc.decode_token(token)
    except jwt.ExpiredSignatureError:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(401, "Access expired and no refresh token.")
        
        # шлём внутренний запрос на обновление access-токена с использованием переданного refresh-токена
        refresh_resp = await client.post(
            "/auth/refresh",
            headers={"Host": settings.app_host}
        )
        
        if refresh_resp.status_code != 200:
            raise HTTPException(401, "Refresh failed.")
        
        new_token = refresh_resp.cookies.get("access_token")
        if not new_token:
            raise HTTPException(401, "No new access token.")
        
        payload = auth_svc.decode_token(new_token)
    
    except ValueError as e:
        raise HTTPException(401, str(e))
    
    if payload.type != "access":
        raise HTTPException(401, "Wrong token type.")
    
    user = await users_svc.get_by_id(int(payload.sub))
    if not user:
        raise HTTPException(401, "User not found.")
    
    response.set_cookie("access_token", new_token, httponly=True, max_age=15 * 60, samesite="lax")

    print("------------------------------------")
    print("Refresh:", refresh_token)
    print("New access:", new_token)
    print("------------------------------------")
    
    return user