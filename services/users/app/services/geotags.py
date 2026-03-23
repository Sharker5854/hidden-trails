from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.geotags import Geotag
from app.models.geotag_themes import geotag_themes
from app.schemas.geotags import GeotagCreateForm, GeotagPublic



class GeotagsService:
    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_by_id(self, geotag_id: int) -> Optional[Geotag]:
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.themes),
                selectinload(Geotag.author)
            )
            .where(Geotag.id == geotag_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_geotag(
        self,
        form: GeotagCreateForm,
        author_id: int,
        media_files: List[str] = [],
    ) -> Geotag:
        geotag = Geotag(
            title=form.title,
            text=form.text,
            media_files=media_files,
            author_id=author_id,
            latitude=form.latitude,
            longitude=form.longitude,
            warnings=form.warnings,
            tips=form.tips,
            likes_count=0,
        )
        self.db.add(geotag)
        await self.db.flush()
        
        for theme_id in form.theme_ids:
            stmt = geotag_themes.insert().values(
                geotag_id=geotag.id,
                theme_id=theme_id
            )
            await self.db.execute(stmt)
        
        await self.db.commit()
        await self.db.refresh(geotag)
        return geotag
    

    async def get_geotag_public(self, geotag_id: int) -> Optional[GeotagPublic]:
        geotag = await self.get_by_id(geotag_id)
        if not geotag:
            return None
        return GeotagPublic.from_orm(geotag)
