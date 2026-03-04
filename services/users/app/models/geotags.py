from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.session import Base
from .geotag_themes import geotag_themes
from datetime import datetime


class Geotag(Base):
    __tablename__ = "geotags"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    media_files: Mapped[List[str]] = mapped_column(
        ARRAY(String(500)),
        default=list,
        nullable=False
    )

    author_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    author: Mapped["User"] = relationship(  # обратная связь, чтобы в таблице User в поле geotags синхронизировались те статьи, которые принадлежат автору
        "User", back_populates="geotags"
    )


    themes: Mapped[List["Theme"]] = relationship(
        "Theme",
        secondary=geotag_themes,
        back_populates="geotags"
    )


    comments: Mapped[List["Comment"]] = relationship(
        "Comment", 
        back_populates="geotag",
        cascade="all, delete-orphan"
    )



    latitude: Mapped[float] = mapped_column(
        "lat", 
        Numeric(precision=10, scale=8),
        nullable=False,
        index=True
    )
    longitude: Mapped[float] = mapped_column(
        "lng", 
        Numeric(precision=11, scale=8),
        nullable=False,
        index=True
    )
    
    warnings: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    tips: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    
    likes_count: Mapped[int] = mapped_column(
        Integer, default=0
    )
    
    __table_args__ = (
        # Индекс по координатам (для гео-поиска)
        {"postgresql_ignore_search_path": True}
    )