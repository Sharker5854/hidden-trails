from typing import Optional, Dict, Any, List
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from sqlalchemy import select
from app.models.users import User
from app.models.themes import Theme
from app.schemas.users import UserCreate, UserUpdateForm


class UsersService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_nickname(self, nickname: str) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.nickname == nickname)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.id == user_id)
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
        avatar_url: Optional[str] = None
    ) -> User:
        data = form.model_dump()

        if data["email"] != user.email:
            if await self.get_by_email(data["email"]):
                raise ValueError("Email уже занят другим пользователем!")

        if data["nickname"] != user.nickname:
            if await self.get_by_nickname(data["nickname"]):
                raise ValueError("Nickname уже занят!")

        for field, value in data.items():
            if field in ["email", "nickname", "phone", "name", "surname", "is_moder", "is_admin", "is_premium", "rating"]:
                setattr(user, field, value)

        if avatar_url is not None:
            user.avatar_url = avatar_url

        await self.sync_user_themes(user, form.theme_ids)

        await self.db.commit()
        await self.db.refresh(user)
        return user
    

    async def sync_user_themes(self, user: User, theme_ids: List[int]):

        themes_stmt = select(Theme).where(Theme.id.in_(theme_ids))
        result = await self.db.execute(themes_stmt)
        new_themes = result.scalars().all()
        
        user.themes.clear()
        
        user.themes.extend(new_themes)
    


    async def follow_user(
        self, 
        follower_id: int, 
        following_id: int
    ) -> Dict[str, Any]:
        
        follower_stmt = select(User).options(
            selectinload(User.following)
        ).where(User.id == follower_id)
        
        result = await self.db.execute(follower_stmt)
        follower = result.scalar_one_or_none()
        
        if not follower:
            raise HTTPException(status_code=404, detail=f"Follower user with ID={follower_id} not found.")
        
        target_stmt = select(User).where(User.id == following_id)
        result = await self.db.execute(target_stmt)
        target = result.scalar_one_or_none()
        
        if not target:
            raise HTTPException(f"Target following user with ID={following_id} not found.")
        
        if target in follower.following:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already following."
            )
        
        follower.following.append(target)
        await self.db.commit()
        await self.db.refresh(follower)
        
        return {
            "status": "followed",
            "follower_id": follower_id,
            "following_id": following_id
        }
    

    async def unfollow_user(
        self, 
        follower_id: int, 
        following_id: int
    ) -> Dict[str, Any]:
        
        follower_stmt = select(User).options(
            selectinload(User.following)
        ).where(User.id == follower_id)
        
        result = await self.db.execute(follower_stmt)
        follower = result.scalar_one_or_none()
        
        if not follower:
            raise HTTPException(status_code=404, detail=f"Follower user with ID={follower_id} not found.")
        
        target_stmt = select(User).where(User.id == following_id)
        result = await self.db.execute(target_stmt)
        target = result.scalar_one_or_none()
        
        if not target:
            raise HTTPException(f"Following user with ID={following_id} not found.")
        
        if target not in follower.following:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Already not following."
            )
        
        follower.following.remove(target)
        await self.db.commit()
        
        return {
            "status": "unfollowed",
            "unfollower_id": follower_id,
            "unfollowing_id": following_id
        }