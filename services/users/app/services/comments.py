from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comments import Comment
from app.models.geotags import Geotag
from app.models.users import User
from app.services.notifications import NotificationsService
from app.services.users import UsersService


class CommentsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_comment(
        self,
        author_id: int,
        text: str,
        geotag_id: int,
        parent_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        author_stmt = select(User).where(User.id == author_id)
        author_result = await self.db.execute(author_stmt)
        author = author_result.scalar_one_or_none()
        if not author:
            raise HTTPException(404, "Author not found.")

        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        geotag_result = await self.db.execute(geotag_stmt)
        geotag = geotag_result.scalar_one_or_none()
        if not geotag or geotag.moderation_status == "blocked":
            raise HTTPException(404, "Geotag not found.")

        parent = None
        reply_target = None
        if parent_id:
            parent_stmt = select(Comment).where(Comment.id == parent_id)
            parent_result = await self.db.execute(parent_stmt)
            parent = parent_result.scalar_one_or_none()
            reply_target = parent
            if not parent:
                raise HTTPException(404, "Parent comment not found.")

            while parent.parent_id is not None:
                root_stmt = select(Comment).where(Comment.id == parent.parent_id)
                root_result = await self.db.execute(root_stmt)
                parent = root_result.scalar_one_or_none()
                if not parent:
                    raise HTTPException(404, "Parent comment not found.")

            if parent.geotag_id != geotag_id:
                raise HTTPException(400, "Parent comment must belong to the same geotag.")

        comment = Comment(
            text=text,
            author_id=author_id,
            geotag_id=geotag_id,
            parent_id=parent.id if parent else None,
        )
        self.db.add(comment)
        await self.db.flush()

        if reply_target and reply_target.author_id != author_id:
            await NotificationsService(self.db).create_comment_reply_notification(
                user_id=reply_target.author_id,
                actor_id=author_id,
                geotag_id=geotag.id,
                geotag_title=geotag.title,
                comment_id=comment.id,
                actor_nickname=author.nickname,
            )

        await UsersService(self.db).recalculate_user_rating(geotag.author_id)
        await self.db.commit()
        await self.db.refresh(comment, ["author", "replies"])

        return {
            "id": comment.id,
            "text": comment.text,
            "created_at": comment.created_at,
            "author_id": comment.author_id,
            "geotag_id": comment.geotag_id,
            "parent_id": comment.parent_id,
            "likes_count": comment.likes_count,
            "author": {
                "id": comment.author.id,
                "nickname": comment.author.nickname,
            },
            "replies": [],
        }

    async def delete_comment(
        self,
        comment_id: int,
        user_id: int,
    ) -> Dict[str, Any]:
        stmt = (
            select(Comment)
            .options(selectinload(Comment.author), selectinload(Comment.replies))
            .where(Comment.id == comment_id)
        )
        result = await self.db.execute(stmt)
        comment = result.scalar_one_or_none()

        if not comment:
            raise HTTPException(404, "Comment not found.")

        if comment.author_id != user_id:
            raise HTTPException(403, "Only author can delete comment.")

        geotag_stmt = select(Geotag.author_id).where(Geotag.id == comment.geotag_id)
        geotag_result = await self.db.execute(geotag_stmt)
        geotag_author_id = geotag_result.scalar_one_or_none()

        await self.db.delete(comment)
        await self.db.flush()
        if geotag_author_id:
            await UsersService(self.db).recalculate_user_rating(geotag_author_id)
        await self.db.commit()

        return {"deleted": comment_id}

    async def get_comment_tree(
        self,
        geotag_id: int,
        limit: int = 50,
    ) -> List[Dict]:
        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        geotag_result = await self.db.execute(geotag_stmt)
        geotag = geotag_result.scalar_one_or_none()
        if not geotag or geotag.moderation_status == "blocked":
            raise HTTPException(404, "Geotag not found.")

        stmt = (
            select(Comment)
            .options(
                selectinload(Comment.author),
                selectinload(Comment.replies).selectinload(Comment.author),
            )
            .where(Comment.geotag_id == geotag_id, Comment.parent_id.is_(None))
            .order_by(Comment.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        root_comments = result.scalars().all()

        return [
            {
                "id": comment.id,
                "text": comment.text,
                "created_at": comment.created_at,
                "author": {"id": comment.author.id, "nickname": comment.author.nickname},
                "likes_count": comment.likes_count,
                "replies": [
                    {
                        "id": reply.id,
                        "text": reply.text,
                        "created_at": reply.created_at,
                        "author": {
                            "id": reply.author.id,
                            "nickname": reply.author.nickname,
                        },
                        "parent_id": reply.parent_id,
                        "likes_count": reply.likes_count,
                        "replies": [],
                    }
                    for reply in comment.replies
                ],
            }
            for comment in root_comments
        ]

    async def like_comment(
        self,
        user_id: int,
        comment_id: int,
    ) -> Dict[str, Any]:
        user_stmt = select(User).options(selectinload(User.liked_comments)).where(User.id == user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "User not found.")

        comment_stmt = select(Comment).options(selectinload(Comment.likers)).where(Comment.id == comment_id)
        comment_result = await self.db.execute(comment_stmt)
        comment = comment_result.scalar_one_or_none()
        if not comment:
            raise HTTPException(404, "Comment not found.")

        if comment in user.liked_comments:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already liked.")

        user.liked_comments.append(comment)
        comment.likes_count += 1

        await self.db.commit()
        await self.db.refresh(comment)
        return {"status": "liked", "user_id": user_id, "comment_id": comment_id}

    async def unlike_comment(
        self,
        user_id: int,
        comment_id: int,
    ) -> Dict[str, Any]:
        user_stmt = select(User).options(selectinload(User.liked_comments)).where(User.id == user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "User not found.")

        comment_stmt = select(Comment).where(Comment.id == comment_id)
        comment_result = await self.db.execute(comment_stmt)
        comment = comment_result.scalar_one_or_none()
        if not comment:
            raise HTTPException(404, "Comment not found.")

        if comment not in user.liked_comments:
            raise HTTPException(404, "Already not liked.")

        user.liked_comments.remove(comment)
        comment.likes_count -= 1

        await self.db.commit()
        await self.db.refresh(comment)
        return {"status": "unliked", "user_id": user_id, "comment_id": comment_id}
