from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import BackgroundTasks, HTTPException

from app.core.config import settings
from app.services.users import UsersService
from app.schemas.users import UserPublic, UserCreate
from app.schemas.auth import TokenPayload
from app.integrations.resend import Resend


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db):
        self.db = db
        self.users_svc = UsersService(db)
        self.resend_client = Resend()


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
            raise jwt.ExpiredSignatureError("Invalid token.")


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
    


    def create_reset_token(self, email: str) -> str:
        """Создать токен сброса пароля."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_expire_minutes)
        payload = {"sub": email, "exp": expire, "iat": datetime.now(timezone.utc), "type": "reset"}
        return jwt.encode(payload, settings.reset_token_secret, algorithm=settings.algorithm)
    
    async def verify_reset_token(self, token: str) -> Optional[str]:
        """Проверить токен --> email."""
        try:
            payload = jwt.decode(token, settings.reset_token_secret, algorithms=[settings.algorithm])
            email: str = payload.get("sub")
            if email is None:
                return None
            return email
        except JWTError:
            return None


    async def request_password_reset(self, email: str, background_tasks: BackgroundTasks) -> Dict[str, Any]:
        """Запрос сброса пароля."""
        user = await self.users_svc.get_by_email(email)
        
        if not user:
            return {"message": "Если email существует, ссылка отправлена."}
        
        token = self.create_reset_token(email)
        reset_url = f"{settings.app_host}/auth/reset-password?token={token}"
        
        background_tasks.add_task(
            self.resend_client.send_reset_password_email, 
            email, 
            reset_url, 
            user.nickname
        )
        
        return {"message": "Ссылка для сброса отправлена на email."}
    

    async def reset_password(
        self,
        token: str,
        new_password: str
    ) -> Dict[str, Any]:
        """Сброс пароля по токену."""
        email = await self.verify_reset_token(token)
        if not email:
            raise HTTPException(400, "Invalid or expired token.")
        
        user = await self.users_svc.get_by_email(email)
        
        if not user:
            raise HTTPException(404, "User not found.")
        
        user.hashed_password = self.hash_password(new_password)
        
        await self.db.commit()
        
        return {"message": "Пароль успешно сброшен."}