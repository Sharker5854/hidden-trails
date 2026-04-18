from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.users import UserMiniPublic


class MessageCreate(BaseModel):
    recipient_id: int = Field(..., ge=1)
    text: str = Field(..., min_length=1, max_length=4000)


class MessagePublic(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    recipient_id: int
    text: str
    created_at: datetime
    is_read: bool
    is_mine: bool


class ConversationPublic(BaseModel):
    id: int
    partner: UserMiniPublic
    last_message: Optional[MessagePublic] = None
    unread_count: int = 0
    updated_at: datetime
