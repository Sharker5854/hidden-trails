from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ModerationRequest(BaseModel):
    action: Literal["approve", "revision", "block"]
    moderator_comment: str = Field("", max_length=1000)


class ModerationResponse(BaseModel):
    geotag_id: int
    action: Literal["approve", "revision", "block"]
    moderation_status: Literal["pending", "approved", "revision", "blocked"]
    approved: bool
    moderator_comment: Optional[str] = Field(..., max_length=1000)


class ModerationActionPublic(BaseModel):
    id: int
    geotag_id: int
    geotag_title: str
    moderator_id: int
    moderator_nickname: str
    author_id: int
    author_nickname: str
    action: str
    comment: Optional[str]
    created_at: datetime


class ModeratorSummaryPublic(BaseModel):
    moderator_id: int
    moderator_nickname: str
    approved_count: int = 0
    revision_count: int = 0
    blocked_count: int = 0
    actions: List[ModerationActionPublic] = Field(default_factory=list)


class ModerationDashboardPublic(BaseModel):
    moderators: List[ModeratorSummaryPublic] = Field(default_factory=list)


class ModerationRoleUpdateRequest(BaseModel):
    is_moder: bool
