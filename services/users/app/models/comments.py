from typing import List, Optional
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.session import Base
from datetime import datetime


class Comment(Base):
    __tablename__ = "comments"
    
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )

    text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    
    author_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    author: Mapped["User"] = relationship(  # обратная связь, чтобы в таблице User в поле comments синхронизировались те комменты, которые принадлежат этому автору
        "User", back_populates="comments"
    )

    geotag_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("geotags.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    geotag: Mapped["Geotag"] = relationship(  # обратная связь, чтобы в таблице Geotag в поле comments синхронизировались те комменты, которые принадлежат этой геометке
        "Geotag", back_populates="comments"
    )

    likes_count: Mapped[int] = mapped_column(
        Integer, default=0
    )

    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("comments.id", ondelete="CASCADE"),  # Ссылка на себя
        nullable=True,  # может быть null, если это корневой коммент
        index=True
    )

    parent: Mapped[Optional["Comment"]] = relationship(  # родительский коммент
        "Comment", 
        remote_side=[id],  # указываем на id этой же модели Comment
        back_populates="replies"
    )
    replies: Mapped[List["Comment"]] = relationship(  # ответы на коммент
        "Comment", 
        back_populates="parent",
        cascade="all, delete-orphan"
    )


