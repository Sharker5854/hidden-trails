from fastapi import APIRouter, Depends, Path, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from app.api.deps import get_current_user, get_users_service
from app.models.users import User
from app.services.users import UsersService



router = APIRouter(prefix="/user", tags=["users"])
templates = Jinja2Templates(directory="app/templates")



@router.get("/search")
async def search_users(
    nickname: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    users = await users_svc.search_by_nickname(
        nickname=nickname,
        current_user_id=user.id,
    )
    return JSONResponse(
        status_code=200,
        content={"users": [item.model_dump(mode="json") for item in users]},
    )


@router.get("/top")
async def get_top_users(
    limit: int = Query(7, ge=1, le=20),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    users = await users_svc.get_top_users(limit=limit)
    return JSONResponse(
        status_code=200,
        content={"users": [item.model_dump(mode="json") for item in users]},
    )


@router.get("/list")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=30),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    users_page = await users_svc.list_users(page=page, page_size=page_size)
    return JSONResponse(status_code=200, content=users_page.model_dump(mode="json"))


@router.get("/{target_id}")
async def get_user_profile(
    target_id: int = Path(..., ge=1),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    profile = await users_svc.get_public_profile(
        user_id=target_id,
        current_user_id=user.id,
    )
    return JSONResponse(status_code=200, content=profile.model_dump(mode="json"))


@router.post("/follow/{target_id}")
async def follow_user(
    target_id: int = Path(..., ge=1),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    
    if user.id == target_id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot follow yourself."
        )
    
    result = await users_svc.follow_user(
        follower_id=user.id,
        following_id=target_id
    )
    
    return JSONResponse(status_code=200, content=result)



@router.post("/unfollow/{target_id}")
async def unfollow_user(
    target_id: int = Path(..., ge=1),
    user: User = Depends(get_current_user),
    users_svc: UsersService = Depends(get_users_service),
):
    
    result = await users_svc.unfollow_user(
        follower_id=user.id,
        following_id=target_id
    )
    
    return JSONResponse(status_code=200, content=result)
