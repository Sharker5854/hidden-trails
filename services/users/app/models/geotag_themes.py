from sqlalchemy import Table, Integer, ForeignKey, Column
from ..db.session import Base


# Промежуточная таблица многие-ко-многим для геометок и тем
geotag_themes = Table(
    "geotag_themes",
    Base.metadata,
    Column("geotag_id", Integer, ForeignKey("geotags.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Integer, ForeignKey("themes.id", ondelete="CASCADE"), primary_key=True),
)