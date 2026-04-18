from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.users import UserPublic


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    type: str
    exp: int
    iat: int


class RegisterForm(BaseModel):
    email: EmailStr = Field(..., min_length=5)
    nickname: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=4)
    password_repeat: str = Field(...)

    def validate_passwords_match(self) -> None:
        if self.password != self.password_repeat:
            raise ValueError("Пароли не совпадают!")
        

class LoginForm(BaseModel):
    email: EmailStr = Field(..., min_length=5)
    password: str = Field(..., min_length=4)
        

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserPublic


class SessionResponse(BaseModel):
    user: Optional[UserPublic] = None
    can_refresh: bool = False
