from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    nickname: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

    # hashed_password Р·Р°РїРѕР»РЅРёС‚ СЃРµСЂРІРёСЃ
    hashed_password: Optional[str] = None
    

class UserUpdateForm(BaseModel):
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    surname: Optional[str] = None

    theme_ids: Optional[List[int]] = []

    is_moder: bool = False
    is_admin: bool = False
    is_premium: bool = False
    @model_validator(mode="after")
    def validate_required_fields(self):
        if not self.email:
            raise ValueError("Email РѕР±СЏР·Р°С‚РµР»РµРЅ!")
        if not self.nickname:
            raise ValueError("Nickname is required.")
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



class UserPublic(BaseModel):
    id: int
    email: EmailStr
    phone: Optional[str]
    name: Optional[str]
    surname: Optional[str]
    nickname: str
    avatar_url: str
    theme_ids: Optional[List[int]] = [] 
    is_moder: bool
    is_admin: bool
    is_premium: bool
    rating: int
    register_at: datetime

    class Config:
        from_attributes = True


class UserMiniPublic(BaseModel):
    id: int
    nickname: str
    avatar_url: str
    rating: int = 0

    class Config:
        from_attributes = True


class UsersListPublic(BaseModel):
    users: List[UserMiniPublic] = []
    page: int
    page_size: int
    total: int
    total_pages: int


class PublicUserProfile(BaseModel):
    id: int
    nickname: str
    avatar_url: str
    name: Optional[str]
    surname: Optional[str]
    rating: int
    register_at: datetime
    followers_count: int
    following_count: int
    is_followed_by_current_user: bool
    is_current_user: bool
    followers: List[UserMiniPublic] = []
    following: List[UserMiniPublic] = []
    achievements: List[dict] = []
    geotags: List[dict] = []

    class Config:
        from_attributes = True


