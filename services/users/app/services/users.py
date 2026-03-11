from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.users import User
from app.schemas.users import UserCreate


class UsersService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_nickname(self, nickname: str) -> Optional[User]:
        stmt = select(User).where(User.nickname == nickname)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_user(self, data: UserCreate) -> User:
        user_data = data.dict(exclude={"password"})
        user_data["avatar_url"] = "default.png"
        user = User(**user_data)  # hashed_password уже сгенерирован
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user