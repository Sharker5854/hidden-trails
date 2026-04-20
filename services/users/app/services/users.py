from typing import Optional, Dict, Any, List
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from sqlalchemy import func, select
from app.models.users import User
from app.models.themes import Theme
from app.models.geotags import Geotag
from app.models.comments import Comment
from app.models.user_achievments import user_achievments
from app.schemas.geotags import GeotagPublic
from app.schemas.users import PublicUserProfile, UserCreate, UserMiniPublic, UserUpdateForm, UsersListPublic


VIEW_SCORE = 1
LIKE_SCORE = 6
COMMENT_SCORE = 3
POST_SCORE = 12
ACHIEVEMENT_SCORE = 25


class UsersService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalars().first()
        if user:
            await self.recalculate_user_rating(user)
        return user
    

    async def get_by_nickname(self, nickname: str) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.nickname == nickname)
        result = await self.db.execute(stmt)
        user = result.scalars().first()
        if user:
            await self.recalculate_user_rating(user)
        return user


    async def search_by_nickname(self, nickname: str, current_user_id: int, limit: int = 12) -> List[UserMiniPublic]:
        query = nickname.strip()
        if not query:
            return []

        stmt = (
            select(User)
            .where(
                User.nickname.ilike(f"%{query}%"),
                User.id != current_user_id,
            )
            .order_by(User.nickname)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        users = result.scalars().all()
        for user in users:
            await self.recalculate_user_rating(user)
        return [UserMiniPublic.model_validate(user) for user in users]


    async def get_top_users(self, limit: int = 7) -> List[UserMiniPublic]:
        stmt = select(User)
        result = await self.db.execute(stmt)
        users = result.scalars().all()

        for user in users:
            await self.recalculate_user_rating(user)

        top_users = sorted(
            users,
            key=lambda item: (item.rating, item.register_at),
            reverse=True,
        )[:limit]
        return [UserMiniPublic.model_validate(user) for user in top_users]


    async def list_users(self, page: int = 1, page_size: int = 10) -> UsersListPublic:
        stmt = select(User).order_by(User.nickname)
        result = await self.db.execute(stmt)
        users = result.scalars().all()

        for user in users:
            await self.recalculate_user_rating(user)

        total = len(users)
        total_pages = max(1, (total + page_size - 1) // page_size)
        current_page = min(max(page, 1), total_pages)
        start = (current_page - 1) * page_size
        page_users = users[start:start + page_size]

        return UsersListPublic(
            users=[UserMiniPublic.model_validate(user) for user in page_users],
            page=current_page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )


    async def get_public_profile(
        self,
        user_id: int,
        current_user_id: int,
    ) -> PublicUserProfile:
        stmt = (
            select(User)
            .options(
                selectinload(User.followers),
                selectinload(User.following),
                selectinload(User.achievements),
                selectinload(User.geotags).selectinload(Geotag.themes),
                selectinload(User.geotags).selectinload(Geotag.author),
                selectinload(User.geotags).selectinload(Geotag.likers),
            )
            .where(User.id == user_id)
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        await self.recalculate_user_rating(user)

        return PublicUserProfile(
            id=user.id,
            nickname=user.nickname,
            avatar_url=user.avatar_url,
            name=user.name,
            surname=user.surname,
            rating=user.rating,
            register_at=user.register_at,
            followers_count=len(user.followers),
            following_count=len(user.following),
            is_followed_by_current_user=any(
                follower.id == current_user_id for follower in user.followers
            ),
            is_current_user=user.id == current_user_id,
            followers=[UserMiniPublic.model_validate(follower) for follower in user.followers],
            following=[UserMiniPublic.model_validate(following) for following in user.following],
            achievements=[
                {
                    "id": achievement.id,
                    "title": achievement.title,
                    "picture_url": achievement.picture_url,
                }
                for achievement in user.achievements
            ],
            geotags=[
                GeotagPublic.from_orm(geotag, current_user_id=current_user_id).model_dump(mode="json")
                for geotag in sorted(user.geotags, key=lambda item: item.created_at, reverse=True)
            ],
        )

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = select(User).options(selectinload(User.themes)).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalars().first()
        if user:
            await self.recalculate_user_rating(user)
        return user


    async def recalculate_user_rating(self, user: User | int) -> int:
        user_id = user if isinstance(user, int) else user.id

        geotag_stats_stmt = select(
            func.coalesce(func.sum(Geotag.likes_count), 0),
            func.coalesce(func.sum(Geotag.views_count), 0),
            func.count(Geotag.id),
        ).where(Geotag.author_id == user_id)
        geotag_stats_result = await self.db.execute(geotag_stats_stmt)
        likes_count, views_count, posts_count = geotag_stats_result.one()

        comments_stmt = (
            select(func.count(Comment.id))
            .join(Geotag, Comment.geotag_id == Geotag.id)
            .where(Geotag.author_id == user_id)
        )
        comments_result = await self.db.execute(comments_stmt)
        comments_count = int(comments_result.scalar_one() or 0)

        achievements_stmt = select(func.count()).select_from(user_achievments).where(
            user_achievments.c.user_id == user_id
        )
        achievements_result = await self.db.execute(achievements_stmt)
        achievements_count = int(achievements_result.scalar_one() or 0)

        rating = int(
            (int(likes_count or 0) * LIKE_SCORE)
            + (int(views_count or 0) * VIEW_SCORE)
            + (comments_count * COMMENT_SCORE)
            + (int(posts_count or 0) * POST_SCORE)
            + (achievements_count * ACHIEVEMENT_SCORE)
        )

        target_user = user
        if isinstance(user, int):
            target_user = await self.db.get(User, user_id)

        if target_user:
            target_user.rating = rating

        return rating


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
            if field in ["email", "nickname", "phone", "name", "surname", "is_moder", "is_admin", "is_premium"]:
                setattr(user, field, value)

        if avatar_url is not None:
            user.avatar_url = avatar_url

        await self.sync_user_themes(user, form.theme_ids)
        await self.recalculate_user_rating(user)

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
