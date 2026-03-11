from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    nickname: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

    # hashed_password заполнит сервис
    hashed_password: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    name: Optional[str]
    surname: Optional[str]
    nickname: str
    avatar_url: str
    is_moder: bool
    is_admin: bool
    is_premium: bool
    rating: int
    register_at: datetime

    class Config:
        from_attributes = True