from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from .user_achievments import user_achievments
from .user_saved_geotags import user_saved_geotags
from .user_themes import user_themes
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )
    name: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    surname: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    nickname: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=False # по умолчанию заполняем ссылкой на дефолтный аватар
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    
    register_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    
    is_moder: Mapped[bool] = mapped_column(
        Boolean, default=False, index=True
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean, default=False
    )
    is_premium: Mapped[bool] = mapped_column(
        Boolean, default=False, index=True
    )
    

    rating: Mapped[int] = mapped_column(
        Integer, default=0  # в pydantic валидировать, чтобы 1 <= x <= 100
    )
    
    achievements: Mapped[List["Achievment"]] = relationship(
        "Achievment",
        secondary=user_achievments,
        back_populates="users"
    )

    themes: Mapped[List["Theme"]] = relationship(
        "Theme",
        secondary=user_themes,
        back_populates="users"
    )

    geotags: Mapped[List["Geotag"]] = relationship(
        "Geotag", 
        back_populates="author",
        cascade="all, delete-orphan"
    )

    saved_geotags: Mapped[List["Geotag"]] = relationship(
        "Geotag",
        secondary=user_saved_geotags,
        back_populates="savers",
        lazy="selectin"
    )

    comments: Mapped[List["Comment"]] = relationship(
        "Comment", 
        back_populates="author",
        cascade="all, delete-orphan"
    )


    followers: Mapped[List["User"]] = relationship(  # кто на меня подписан
        "User",
        secondary="user_follows",
        primaryjoin="User.id == user_follows.c.following_id",   # я = following_id
        secondaryjoin="User.id == user_follows.c.follower_id",  # они = follower_id
        back_populates="following",
        lazy="selectin" 
    )
    
    following: Mapped[List["User"]] = relationship(  # на кого подписан я
        "User",
        secondary="user_follows",
        primaryjoin="User.id == user_follows.c.follower_id",    # я = follower_id
        secondaryjoin="User.id == user_follows.c.following_id", # они = following_id
        back_populates="followers"
    )