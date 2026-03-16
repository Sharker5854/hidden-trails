from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.users import User
from app.schemas.users import UserCreate, UserUpdateForm


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
    
    async def update_user(
        self,
        user: User,
        form: UserUpdateForm,
        avatar_url: Optional[str] = None,
    ) -> User:
        data = form.model_dump()

        if data["email"] != user.email:
            if await self.get_by_email(data["email"]):
                raise ValueError("Email уже занят другим пользователем!")

        # Nickname изменился?
        if data["nickname"] != user.nickname:
            if await self.get_by_nickname(data["nickname"]):
                raise ValueError("Nickname уже занят!")

        user.email = data["email"]
        user.nickname = data["nickname"]
        user.phone = data.get("phone")
        user.name = data.get("name")
        user.surname = data.get("surname")
        user.is_moder = data["is_moder"]
        user.is_admin = data["is_admin"]
        user.is_premium = data["is_premium"]
        user.rating = data["rating"]

        if avatar_url is not None:
            user.avatar_url = avatar_url

        await self.db.commit()
        await self.db.refresh(user)
        return user