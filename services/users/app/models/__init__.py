from .users import User  # Импорт всех моделей в одном месте
from .geotags import Geotag
from .themes import Theme
from .route import Route
from .achievments import Achievment
from .comments import Comment
from .messages import Conversation, Message
from .moderation import ModerationAction
from .notifications import Notification
from .geotag_themes import geotag_themes
from .user_achievments import user_achievments
from .user_themes import user_themes
from .user_follows import user_follows
from .user_likes import user_likes
from .user_saved_geotags import user_saved_geotags
from .comment_likes import comment_likes
from .route_geotags import route_geotags
from .route_themes import route_themes
from .base import Base


__all__ = [
    "Base",
    "User",
    "Geotag",
    "Theme",
    "Achievment",
    "Comment",
    "Route",
    "Conversation",
    "Message",
    "ModerationAction",
    "Notification",
]
