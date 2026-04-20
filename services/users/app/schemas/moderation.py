from pydantic import BaseModel, Field
from typing import Optional


class ModerationRequest(BaseModel):
    approve: bool
    moderator_comment: str = Field(..., max_length=1000)


class ModerationResponse(BaseModel):
    geotag_id: int
    approved: bool
    moderator_comment: Optional[str] = Field(..., max_length=1000)
    