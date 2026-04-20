from fastapi import HTTPException
from typing import List
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from .geotags import GeotagsService
from app.models.geotags import Geotag
from app.schemas.moderation import ModerationRequest, ModerationResponse


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.geotags_svc = GeotagsService(db)
    
    async def moderate(
        self,
        geotag: Geotag,
        moderation_payload: ModerationRequest
    ):
        if not moderation_payload.approve and not moderation_payload.moderator_comment.strip():
            raise HTTPException(
                status_code=400,
                detail="При отклонении (approve=False) комментарий модератора обязателен!"
            )

        geotag.is_moderated = moderation_payload.approve
        geotag.moderator_comment = moderation_payload.moderator_comment

        self.db.add(geotag)
        await self.db.commit()
        await self.db.refresh(geotag)

        return ModerationResponse(
            geotag_id=geotag.id,
            approved=geotag.is_moderated,
            moderator_comment=geotag.moderator_comment
        )
    

    async def need_moderate_geotags(self) -> List[Geotag]:
        """Получаем все геотэги, которые ждут модерации"""
        
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.author),
                selectinload(Geotag.themes),
                selectinload(Geotag.likers),
                selectinload(Geotag.comments)
            )
            .where(
                and_(
                    Geotag.is_moderated == False,
                    or_(
                        Geotag.moderator_comment.is_(None),
                        Geotag.moderator_comment == ''
                    )
                )
            )
            .order_by(Geotag.created_at.asc())
        )
        
        result = await self.db.execute(stmt)
        return result.scalars().all()
            