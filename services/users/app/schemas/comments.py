from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime



class CommentCreate(BaseModel):
    """Создание коммента/сабкоммента."""
    text: str = Field(..., min_length=1, max_length=2000)
    geotag_id: int = Field(..., gt=0)
    parent_id: Optional[int] = Field(None, gt=0)  # NULL = корневой коммент



class CommentPublic(BaseModel):
    id: int
    text: str
    created_at: datetime
    author_id: int
    geotag_id: int
    parent_id: Optional[int]
    likes_count: int
    
    class Config:
        from_attributes = True