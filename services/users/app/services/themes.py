from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.themes import Theme
from app.schemas.themes import ThemesCreateUpdate, ThemePublic


class ThemesService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, theme_id: int) -> Optional[Theme]:
        stmt = select(Theme).where(Theme.id == theme_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Optional[Theme]:
        stmt = select(Theme).where(Theme.name == name)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_all_themes(self) -> List[ThemePublic]:
        stmt = select(Theme).order_by(Theme.id.desc())
        result = await self.db.execute(stmt)
        themes = result.scalars().all()
        return [ThemePublic.model_validate(a) for a in themes]


    async def create_theme(
        self,
        data: ThemesCreateUpdate,
    ) -> Theme:
        
        if await self.get_by_name(data.name):
            raise ValueError(f"Тема '{data.name}' уже существует!")
        
        theme = Theme(
            name=data.name,
        )
        self.db.add(theme)
        await self.db.commit()
        await self.db.refresh(theme)
        return theme
    

    async def update_theme(
        self,
        theme: Theme,
        form: ThemesCreateUpdate,
    ) -> Theme:
        
        if form.name != theme.name:
            existing = await self.get_by_name(form.name)
            if existing and existing.id != theme.id:
                raise ValueError(f"Тема с названием '{form.name}' уже существует!")
        
        theme.name = form.name
        
        await self.db.commit()
        await self.db.refresh(theme)
        return theme
