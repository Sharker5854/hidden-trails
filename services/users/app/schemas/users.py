from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    nickname: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

    # hashed_password заполнит сервис
    hashed_password: Optional[str] = None
    

class UserUpdateForm(BaseModel):
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    surname: Optional[str] = None

    is_moder: bool = False
    is_admin: bool = False
    is_premium: bool = False

    rating: Optional[int] = None

    @model_validator(mode="after")
    def validate_required_fields(self):
        if not self.email:
            raise ValueError("Email обязателен!")
        if not self.nickname:
            raise ValueError("Nickname обязателен!")
        if self.rating is None:
            raise ValueError("Rating обязателен!")
        return self

    @field_validator("phone")
    @classmethod
    def empty_phone_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v == "":
            return None
        return v

    @field_validator("name", "surname")
    @classmethod
    def empty_str_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v == "":
            return None
        return v
    
    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if v is not None and not (1 <= v <= 100):
            raise ValueError("Rating: must be from 1 to 100")
        return v



class UserPublic(BaseModel):
    id: int
    email: EmailStr
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


