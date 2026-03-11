from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings
from app.services.users import UsersService
from app.schemas.users import UserPublic, UserCreate
from app.schemas.auth import TokenPayload


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db):
        self.users_svc = UsersService(db)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    def create_access_token(self, user_id: int) -> str:
        payload = {"sub": str(user_id), "type": "access"}
        return self._create_token(payload, settings.access_token_expire_minutes)

    def create_refresh_token(self, user_id: int) -> str:
        payload = {"sub": str(user_id), "type": "refresh"}
        return self._create_token(payload, settings.refresh_token_expire_days * 24 * 60)

    def _create_token(self, payload: dict, minutes: int) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        to_encode = payload.copy()
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    def decode_token(self, token: str) -> TokenPayload:
        try:
            return TokenPayload.model_validate(jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm]))
        except JWTError:
            raise ValueError("Invalid token.")


    async def authenticate(self, email: str, password: str) -> Optional[UserPublic]:
        user = await self.users_svc.get_by_email(email)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return UserPublic.model_validate(user)


    async def register(self, email: str, nickname: str, password: str) -> UserPublic:
        # проверка уникальности пользователя
        if await self.users_svc.get_by_email(email):
            raise ValueError(f"Пользователь с почтой {email} уже существует!")
        if await self.users_svc.get_by_nickname(nickname):
            raise ValueError(f"Пользователь с никнеймом {nickname} уже существует!")

        hashed_password = self.hash_password(password)
        user = await self.users_svc.create_user(
            UserCreate(
                email=email,
                nickname=nickname,
                password=password,
                hashed_password=hashed_password,
            )
        )
        return UserPublic.model_validate(user)