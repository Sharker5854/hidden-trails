from typing import Optional
from fastapi import Path as QueryPath
from fastapi import APIRouter, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.models import User
from app.services.comments import CommentsService
from app.api.deps import get_current_user, get_comments_service



router = APIRouter(prefix="/comment", tags=["comments"])



@router.post("/create")
async def api_create_comment(
    text: str = Form(..., min_length=1),
    geotag_id: int = Form(..., gt=0),
    parent_id: Optional[int] = Form(None),
    
    user: User = Depends(get_current_user),
    comments_svc: CommentsService = Depends(get_comments_service)
):
    """Создать комментарий/сабкоммент."""
    result = await comments_svc.create_comment(
        author_id=user.id,
        text=text,
        geotag_id=geotag_id,
        parent_id=parent_id
    )
    return JSONResponse(status_code=200, content=jsonable_encoder(result))



@router.post("/delete/{comment_id}")
async def api_delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user),
    comments_svc: CommentsService = Depends(get_comments_service)
):
    """Удалить комментарий."""
    result = await comments_svc.delete_comment(comment_id, user.id)
    return JSONResponse(status_code=200, content=jsonable_encoder(result))



@router.get("/comments/{geotag_id}")
async def api_get_comments(
    geotag_id: int,
    comments_svc: CommentsService = Depends(get_comments_service)
):
    """Получить всё дерево комментариев к геометке."""
    comments = await comments_svc.get_comment_tree(geotag_id)
    result = {"comments": comments}
    return JSONResponse(status_code=200, content=jsonable_encoder(result))