from typing import Optional, List
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.session import Base
from .user_achievments import user_achievments


class Achievment(Base):
    __tablename__ = "achievments"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )

    title: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False
    )

    picture_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=False
    )

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_achievments,
        back_populates="achievements"
    )