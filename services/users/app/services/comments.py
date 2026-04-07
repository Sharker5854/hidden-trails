from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.models.comments import Comment
from app.models.users import User
from app.models.geotags import Geotag




class CommentsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    

    async def create_comment(
        self,
        author_id: int,
        text: str,
        geotag_id: int,
        parent_id: Optional[int] = None
    ) -> Dict[str, Any]:
        
        author_stmt = select(User).where(User.id == author_id)
        result = await self.db.execute(author_stmt)
        author = result.scalar_one_or_none()
        if not author:
            raise HTTPException(404, "Author not found.")
        
        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(geotag_stmt)
        geotag = result.scalar_one_or_none()
        if not geotag:
            raise HTTPException(404, "Geotag not found.")
        
        parent = None
        if parent_id:
            parent_stmt = select(Comment).where(Comment.id == parent_id)
            result = await self.db.execute(parent_stmt)
            parent = result.scalar_one_or_none()
            while parent.parent_id != None:  # если текущий создаваемый коммент явлется ответом на другой коммент тоже являющийся ответом, то поднимаемся по древу комментов до тех пор пока не найдем корневой коммент этого обсуждения. Для текущего создаваемого коммента родителем укажем корневой
                parent_stmt = select(Comment).where(Comment.id == parent.parent_id)
                result = await self.db.execute(parent_stmt)
                parent = result.scalar_one_or_none()
            if not parent:
                raise HTTPException(404, "Parent comment not found.")
            if parent.geotag_id != geotag_id:
                raise HTTPException(400, "Parent comment must belong to the same geotag.")
        
        comment = Comment(
            text=text,
            author_id=author_id,
            geotag_id=geotag_id,
            parent_id=parent.id
        )
        self.db.add(comment)
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
        }
    

    async def delete_comment(
        self,
        comment_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        
        stmt = select(Comment).options(
            selectinload(Comment.author),
            selectinload(Comment.replies)
        ).where(Comment.id == comment_id)
        
        result = await self.db.execute(stmt)
        comment = result.scalar_one_or_none()
        
        if not comment:
            raise HTTPException(404, "Comment not found.")
        
        if comment.author_id != user_id:
            raise HTTPException(403, "Only author can delete comment.")
        
        await self.db.delete(comment)
        await self.db.commit()
        
        return {"deleted": comment_id}
    

    async def get_comment_tree(
        self,
        geotag_id: int,
        limit: int = 50
    ) -> List[Dict]:
        """Получить дерево комментариев."""

        geotag_stmt = select(Geotag).where(Geotag.id == geotag_id)
        result = await self.db.execute(geotag_stmt)
        geotag = result.scalar_one_or_none()
        if not geotag:
            raise HTTPException(404, "Geotag not found.")

        stmt = select(Comment).options(
            selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.author)
        ).where(
            Comment.geotag_id == geotag_id,
            Comment.parent_id.is_(None)  # получаем только корневые комменты, а ответы на них подтянутся в поле replies
        ).order_by(Comment.created_at.desc()).limit(limit)
        
        result = await self.db.execute(stmt)
        root_comments = result.scalars().all()
        
        return [
            {
                "id": c.id,
                "text": c.text,
                "created_at": c.created_at,
                "author": {"id": c.author.id, "nickname": c.author.nickname},
                "likes_count": c.likes_count,
                "replies": [
                    {
                        "id": r.id,
                        "text": r.text,
                        "created_at": r.created_at,
                        "author": {"id": r.author.id, "nickname": r.author.nickname}
                    }
                    for r in c.replies
                ]
            }
            for c in root_comments
        ]