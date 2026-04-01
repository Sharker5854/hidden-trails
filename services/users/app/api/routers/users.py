from fastapi import APIRouter, Depends, Path, HTTPException
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from app.api.deps import get_current_user, get_users_service
from app.models.users import User
from app.services.users import UsersService



router = APIRouter(prefix="/user", tags=["users"])
templates = Jinja2Templates(directory="app/templates")



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