from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.achievments import Achievment
from app.schemas.achievments import AchievmentsCreate


class AchievmentsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, achievment_id: int) -> Optional[Achievment]:
        stmt = select(Achievment).where(Achievment.id == achievment_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_title(self, title: str) -> Optional[Achievment]:
        stmt = select(Achievment).where(Achievment.title == title)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_achievment(
        self,
        data: AchievmentsCreate,
        picture_url: str = "default.png",
    ) -> Achievment:
        
        if await self.get_by_title(data.title):
            raise ValueError(f"Достижение '{data.title}' уже существует!")
        
        achievment = Achievment(
            title=data.title,
            picture_url=picture_url,
        )
        self.db.add(achievment)
        await self.db.commit()
        await self.db.refresh(achievment)
        return achievment