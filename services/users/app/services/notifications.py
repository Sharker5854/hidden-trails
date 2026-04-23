from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notifications import Notification


class NotificationsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_comment_reply_notification(
        self,
        user_id: int,
        actor_id: int,
        geotag_id: int,
        geotag_title: str,
        comment_id: int,
        actor_nickname: str,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            actor_id=actor_id,
            geotag_id=geotag_id,
            comment_id=comment_id,
            notification_type="comment_reply",
            text=f"@{actor_nickname} ответил(а) на твой комментарий к карточке «{geotag_title}».",
        )
        self.db.add(notification)
        await self.db.flush()
        return notification

    async def list_notifications(self, user_id: int, limit: int = 25) -> dict:
        stmt = (
            select(Notification)
            .options(
                selectinload(Notification.actor),
                selectinload(Notification.geotag),
            )
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        notifications = result.scalars().all()

        unread_stmt = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        unread_result = await self.db.execute(unread_stmt)
        unread_count = int(unread_result.scalar_one() or 0)

        return {
            "notifications": [
                {
                    "id": notification.id,
                    "user_id": notification.user_id,
                    "actor_id": notification.actor_id,
                    "actor_nickname": getattr(notification.actor, "nickname", None),
                    "geotag_id": notification.geotag_id,
                    "geotag_title": getattr(notification.geotag, "title", None),
                    "comment_id": notification.comment_id,
                    "notification_type": notification.notification_type,
                    "text": notification.text,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at,
                }
                for notification in notifications
            ],
            "unread_count": unread_count,
        }

    async def mark_all_as_read(self, user_id: int) -> dict:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.db.execute(stmt)
        await self.db.commit()
        return {"status": "ok"}
