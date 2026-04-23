from sqlalchemy import Table, Column, ForeignKey, Integer
from .base import Base


route_geotags = Table(
    "route_geotags",
    Base.metadata,
    Column("route_id", ForeignKey("routes.id", ondelete="CASCADE"), primary_key=True),
    Column("geotag_id", ForeignKey("geotags.id", ondelete="CASCADE"), primary_key=True),
    Column("position", Integer, nullable=False, default=0),
)
