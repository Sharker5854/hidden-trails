from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationPublic(BaseModel):
    id: int
    user_id: int
    actor_id: Optional[int]
    actor_nickname: Optional[str]
    geotag_id: Optional[int]
    geotag_title: Optional[str]
    comment_id: Optional[int]
    notification_type: str
    text: str
    is_read: bool
    created_at: datetime


class NotificationsListPublic(BaseModel):
    notifications: list[NotificationPublic]
    unread_count: int
