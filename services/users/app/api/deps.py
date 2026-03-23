from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
import httpx

from app.core.config import settings
from app.services.auth import AuthService
from app.services.users import UsersService
from app.models.users import User
from app.services.achievments import AchievmentsService
from app.services.themes import ThemesService
from app.services.geotags import GeotagsService
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
        access_token = auth.split(" ")[1]
    else:
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")
        if not access_token:
            if not refresh_token:
                raise HTTPException(401, "Not authenticated.")
    
    try:
        if not access_token:  # но есть рефреш
            raise jwt.ExpiredSignatureError("Access token expired. Going to refresh...")
        payload = auth_svc.decode_token(access_token)
    except jwt.ExpiredSignatureError:
        
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
        response.set_cookie("access_token", new_token, httponly=True, max_age=15 * 60, samesite="lax")
    except ValueError as e:
        raise HTTPException(401, str(e))
    
    if payload.type != "access":
        raise HTTPException(401, "Wrong token type.")
    
    user = await users_svc.get_by_id(int(payload.sub))
    if not user:
        raise HTTPException(401, "User not found.")
    
    return user



async def admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверяем, что пользователь — админ.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access.",
        )
    return current_user



async def get_achievments_service(
    db: AsyncSession = Depends(get_db)
) -> AchievmentsService:
    return AchievmentsService(db)



async def get_themes_service(
    db: AsyncSession = Depends(get_db)
) -> ThemesService:
    return ThemesService(db)



def get_geotags_service(
    db: AsyncSession = Depends(get_db)
) -> GeotagsService:
    return GeotagsService(db)