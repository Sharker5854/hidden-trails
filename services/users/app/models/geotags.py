from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .geotag_themes import geotag_themes
from .user_likes import user_likes
from .user_saved_geotags import user_saved_geotags


class Geotag(Base):
    __tablename__ = "geotags"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    media_files: Mapped[List[str]] = mapped_column(
        ARRAY(String(500)),
        default=list,
        nullable=False,
    )

    author_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author: Mapped["User"] = relationship(
        "User",
        back_populates="geotags",
        foreign_keys=[author_id],
    )

    savers: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_saved_geotags,
        back_populates="saved_geotags",
    )

    themes: Mapped[List["Theme"]] = relationship(
        "Theme",
        secondary=geotag_themes,
        back_populates="geotags",
    )

    routes: Mapped[list["Route"]] = relationship(
        "Route",
        secondary="route_geotags",
        back_populates="geotags",
    )

    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="geotag",
        cascade="all, delete-orphan",
    )

    is_moderated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)

    moderation_status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False, index=True
    )

    moderator_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    last_moderated_by_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    last_moderated_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[last_moderated_by_id],
        back_populates="moderated_geotags",
    )

    moderation_actions: Mapped[List["ModerationAction"]] = relationship(
        "ModerationAction",
        back_populates="geotag",
        cascade="all, delete-orphan",
        order_by="ModerationAction.created_at.desc()",
    )

    latitude: Mapped[float] = mapped_column(
        "lat",
        Numeric(precision=10, scale=8),
        nullable=False,
        index=True,
    )
    longitude: Mapped[float] = mapped_column(
        "lng",
        Numeric(precision=11, scale=8),
        nullable=False,
        index=True,
    )

    warnings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tips: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    likes_count: Mapped[int] = mapped_column(Integer, default=0)

    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    likers: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_likes,
        back_populates="liked_geotags",
    )

    __table_args__ = ({"postgresql_ignore_search_path": True},)
