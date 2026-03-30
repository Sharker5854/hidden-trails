from sqlalchemy import Table, Integer, ForeignKey, Column
from .base import Base

user_saved_geotags = Table(
    "user_saved_geotags",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("geotag_id", Integer, ForeignKey("geotags.id"), primary_key=True),
)