from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth import AuthService
from app.services.users import UsersService
from app.models.users import User
from app.schemas.auth import TokenPayload
from ..db.session import AsyncSessionLocal



async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session



async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


async def get_users_service(db: AsyncSession = Depends(get_db)) -> UsersService:
    return UsersService(db)


async def get_current_user(
    request: Request,
    auth_svc: Annotated[AuthService, Depends(get_auth_service)],
    users_svc: Annotated[UsersService, Depends(get_users_service)],
) -> User:
    """По факту, роутеры в которых будет использована эта dependency - будут доступно только для авторизованных пользователей."""
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
    else:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    try:
        payload = auth_svc.decode_token(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    if payload.type != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type.")
    
    user = await users_svc.get_by_id(int(payload.sub))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    
    return user