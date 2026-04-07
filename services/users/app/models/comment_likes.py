from sqlalchemy import Table, Integer, ForeignKey, Column
from .base import Base


comment_likes = Table(
    "comment_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("comment_id", Integer, ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True),
)