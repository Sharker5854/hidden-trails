from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ModerationAction(Base):
    __tablename__ = "moderation_actions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    geotag_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("geotags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    moderator_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    geotag: Mapped["Geotag"] = relationship(
        "Geotag",
        back_populates="moderation_actions",
    )
    moderator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[moderator_id],
        back_populates="moderation_actions",
    )
    author: Mapped["User"] = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="moderation_penalties",
    )
