from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.achievments import Achievment
from app.schemas.achievments import AchievmentsCreateUpdate, AchievmentPublic


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
    
    async def get_all_achievments(self) -> List[AchievmentPublic]:
        stmt = select(Achievment).order_by(Achievment.id.desc())
        result = await self.db.execute(stmt)
        achievments = result.scalars().all()
        return [AchievmentPublic.model_validate(a) for a in achievments]


    async def create_achievment(
        self,
        data: AchievmentsCreateUpdate,
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
    

    async def update_achievment(
        self,
        achievment: Achievment,
        form: AchievmentsCreateUpdate,
        picture_url: str
    ) -> Achievment:
        
        if form.title != achievment.title:
            existing = await self.get_by_title(form.title)
            if existing and existing.id != achievment.id:
                raise ValueError(f"Достижение с названием '{form.title}' уже существует!")
        
        achievment.title = form.title
        achievment.picture_url = picture_url
        
        await self.db.commit()
        await self.db.refresh(achievment)
        return achievment
