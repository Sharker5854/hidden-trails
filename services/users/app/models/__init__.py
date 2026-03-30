from .users import User  # Импорт всех моделей в одном месте
from .geotags import Geotag
from .themes import Theme
from .achievments import Achievment
from .comments import Comment
from .geotag_themes import geotag_themes
from .user_achievments import user_achievments
from .user_themes import user_themes
from .user_follows import user_follows
from .user_saved_geotags import user_saved_geotags
from .base import Base


__all__ = ["Base", "User", "Geotag", "Theme", "Achievment", "Comment"]