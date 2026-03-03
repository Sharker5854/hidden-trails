from sqlalchemy import Table, Integer, ForeignKey, Column
from ..db.session import Base


# Промежуточная таблица многие-ко-многим для юзеров и тем
user_themes = Table(
    "user_themes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("theme_id", Integer, ForeignKey("themes.id", ondelete="CASCADE"), primary_key=True),
)