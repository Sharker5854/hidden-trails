from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models.geotags import Geotag


class GeotagPublic(BaseModel):
    id: int
    title: str
    created_at: datetime
    text: str
    media_files: List[str]
    author_id: int
    theme_ids: List[int]
    latitude: float
    longitude: float
    warnings: Optional[str]
    tips: Optional[str]
    likes_count: int
    
    @classmethod
    def from_orm(cls, geotag: Geotag) -> "GeotagPublic":
        """Кастомная сериализация SQLAlchemy."""
        media_files = []
        raw_media = getattr(geotag, 'media_files', [])
        if isinstance(raw_media, list):
            for item in raw_media:
                if isinstance(item, list):
                    media_files.extend(item)
                else:
                    media_files.append(item)

        return cls(
            id=geotag.id,
            title=geotag.title,
            created_at=geotag.created_at,
            text=geotag.text,
            media_files=media_files,
            theme_ids=[theme.id for theme in getattr(geotag, 'themes', [])],
            author_id=geotag.author_id,
            latitude=float(geotag.latitude),
            longitude=float(geotag.longitude),
            warnings=geotag.warnings,
            tips=geotag.tips,
            likes_count=geotag.likes_count,
        )


    class Config:
        from_attributes = True


class GeotagCreateForm(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    text: str = Field(..., max_length=10000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    warnings: Optional[str] = Field(None, max_length=3000)
    tips: Optional[str] = Field(None, max_length=3000)
    theme_ids: Optional[List[int]] = Field(..., min_items=1, max_items=5)