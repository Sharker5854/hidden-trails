from sqlalchemy import Table, Integer, ForeignKey, Column
from .base import Base


user_likes = Table(
    "user_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("geotag_id", Integer, ForeignKey("geotags.id", ondelete="CASCADE"), primary_key=True),
)