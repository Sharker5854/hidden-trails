from collections import defaultdict
from typing import List

from fastapi import HTTPException
from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.geotags import Geotag
from app.models.moderation import ModerationAction
from app.models.users import User
from app.schemas.moderation import (
    ModerationActionPublic,
    ModerationDashboardPublic,
    ModerationRequest,
    ModerationResponse,
    ModeratorSummaryPublic,
)
from app.services.users import UsersService


ACTION_TO_STATUS = {
    "approve": "approved",
    "revision": "revision",
    "block": "blocked",
}

QUEUE_STATUSES = {"pending", "revision"}


class ModerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def moderate(
        self,
        geotag: Geotag,
        moderation_payload: ModerationRequest,
        moderator: User,
    ) -> ModerationResponse:
        comment = (moderation_payload.moderator_comment or "").strip()
        action = moderation_payload.action

        if action in {"revision", "block"} and not comment:
            raise HTTPException(
                status_code=400,
                detail="Нужен комментарий модератора.",
            )

        if geotag.author_id == moderator.id and action == "block":
            raise HTTPException(
                status_code=400,
                detail="Нельзя блокировать собственную карточку.",
            )

        geotag.moderation_status = ACTION_TO_STATUS[action]
        geotag.is_moderated = action == "approve"
        geotag.moderator_comment = comment or None
        geotag.last_moderated_by_id = moderator.id

        action_row = ModerationAction(
            geotag_id=geotag.id,
            moderator_id=moderator.id,
            author_id=geotag.author_id,
            action=action,
            comment=comment or None,
        )

        self.db.add(geotag)
        self.db.add(action_row)
        await UsersService(self.db).recalculate_user_rating(geotag.author_id)
        await self.db.commit()
        await self.db.refresh(geotag)

        return ModerationResponse(
            geotag_id=geotag.id,
            action=action,
            moderation_status=geotag.moderation_status,
            approved=geotag.is_moderated,
            moderator_comment=geotag.moderator_comment,
        )

    def _queue_stmt(self) -> Select[tuple[Geotag]]:
        return (
            select(Geotag)
            .options(
                selectinload(Geotag.author),
                selectinload(Geotag.themes),
                selectinload(Geotag.likers),
                selectinload(Geotag.comments),
                selectinload(Geotag.last_moderated_by),
            )
            .where(Geotag.moderation_status.in_(QUEUE_STATUSES))
            .order_by(Geotag.created_at.asc())
        )

    async def need_moderate_geotags(self) -> List[Geotag]:
        result = await self.db.execute(self._queue_stmt())
        return result.scalars().all()

    async def get_visible_geotag_for_review(
        self,
        geotag_id: int,
    ) -> Geotag | None:
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.author),
                selectinload(Geotag.themes),
                selectinload(Geotag.likers),
                selectinload(Geotag.comments),
                selectinload(Geotag.last_moderated_by),
            )
            .where(Geotag.id == geotag_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_dashboard(self) -> ModerationDashboardPublic:
        actions_stmt = (
            select(ModerationAction)
            .options(
                selectinload(ModerationAction.moderator),
                selectinload(ModerationAction.author),
                selectinload(ModerationAction.geotag),
            )
            .order_by(ModerationAction.created_at.desc())
        )
        actions_result = await self.db.execute(actions_stmt)
        actions = actions_result.scalars().all()

        moderators_stmt = select(User).where(
            or_(User.is_moder == True, User.is_admin == True)
        ).order_by(User.nickname)
        moderators_result = await self.db.execute(moderators_stmt)
        moderators = moderators_result.scalars().all()

        grouped_actions: dict[int, list[ModerationActionPublic]] = defaultdict(list)
        counts: dict[int, dict[str, int]] = defaultdict(
            lambda: {"approve": 0, "revision": 0, "block": 0}
        )

        for action in actions:
            moderator = action.moderator
            author = action.author
            geotag = action.geotag
            if not moderator or not author or not geotag:
                continue

            counts[moderator.id][action.action] += 1
            if len(grouped_actions[moderator.id]) < 12:
                grouped_actions[moderator.id].append(
                    ModerationActionPublic(
                        id=action.id,
                        geotag_id=action.geotag_id,
                        geotag_title=geotag.title,
                        moderator_id=moderator.id,
                        moderator_nickname=moderator.nickname,
                        author_id=author.id,
                        author_nickname=author.nickname,
                        action=action.action,
                        comment=action.comment,
                        created_at=action.created_at,
                    )
                )

        return ModerationDashboardPublic(
            moderators=[
                ModeratorSummaryPublic(
                    moderator_id=moderator.id,
                    moderator_nickname=moderator.nickname,
                    approved_count=counts[moderator.id]["approve"],
                    revision_count=counts[moderator.id]["revision"],
                    blocked_count=counts[moderator.id]["block"],
                    actions=grouped_actions[moderator.id],
                )
                for moderator in moderators
            ]
        )
