from typing import List
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from .user_themes import user_themes


class Theme(Base):
    __tablename__ = "themes"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )
    name: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False
    )
    
    geotags: Mapped[List["Geotag"]] = relationship(
        "Geotag", 
        secondary="geotag_themes",
        back_populates="themes"
    )

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_themes,
        back_populates="themes"
    )