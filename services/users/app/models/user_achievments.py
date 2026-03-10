from sqlalchemy import Table, Integer, ForeignKey, Column
from .base import Base


# Промежуточная таблица многие-ко-многим для юзеров и ачивок
user_achievments = Table(
    "user_achievements",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("achievement_id", Integer, ForeignKey("achievments.id", ondelete="CASCADE"), primary_key=True),
)