from sqlalchemy import Table, Column, ForeignKey
from .base import Base


route_themes = Table(
    "route_themes",
    Base.metadata,
    Column("route_id", ForeignKey("routes.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", ForeignKey("themes.id", ondelete="CASCADE"), primary_key=True),
)