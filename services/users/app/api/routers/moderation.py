from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.api.deps import (
    admin_user,
    get_current_moder_user,
    get_geotags_service,
    get_moderation_service,
    get_users_service,
)
from app.models.users import User
from app.schemas.geotags import GeotagPublic
from app.schemas.moderation import (
    ModerationRequest,
    ModerationResponse,
    ModerationRoleUpdateRequest,
)
from app.schemas.users import UserMiniPublic
from app.services.geotags import GeotagsService
from app.services.moderation import ModerationService
from app.services.users import UsersService


router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.get("/queue")
async def get_all_pending_moderation(
    moder_user: User = Depends(get_current_moder_user),
    moderation_svc: ModerationService = Depends(get_moderation_service),
):
    geotags = await moderation_svc.need_moderate_geotags()
    payload = [
        GeotagPublic.from_orm(geotag, current_user_id=moder_user.id).model_dump(mode="json")
        for geotag in geotags
    ]
    return JSONResponse(status_code=200, content={"geotags": payload})


@router.get("/geotag/{geotag_id}")
async def get_geotag_for_review(
    geotag_id: int,
    moderation_svc: ModerationService = Depends(get_moderation_service),
    moder_user: User = Depends(get_current_moder_user),
):
    geotag = await moderation_svc.get_visible_geotag_for_review(geotag_id)
    if not geotag:
        raise HTTPException(status_code=404, detail="Geotag not found.")

    return JSONResponse(
        status_code=200,
        content=GeotagPublic.from_orm(geotag, current_user_id=moder_user.id).model_dump(
            mode="json"
        ),
    )


@router.post("/geotag/{geotag_id}", response_model=ModerationResponse)
async def moderate_geotag(
    geotag_id: int,
    request: ModerationRequest,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    moderation_svc: ModerationService = Depends(get_moderation_service),
    moder_user: User = Depends(get_current_moder_user),
):
    geotag = await geotags_svc.get_by_id(geotag_id)
    if not geotag:
        raise HTTPException(status_code=404, detail="Geotag not found.")

    return await moderation_svc.moderate(geotag, request, moder_user)


@router.get("/admin/dashboard")
async def get_moderation_dashboard(
    current_admin: User = Depends(admin_user),
    moderation_svc: ModerationService = Depends(get_moderation_service),
):
    dashboard = await moderation_svc.get_dashboard()
    return JSONResponse(status_code=200, content=dashboard.model_dump(mode="json"))


@router.post("/admin/roles/{user_id}")
async def update_moderator_role(
    user_id: int,
    payload: ModerationRoleUpdateRequest,
    current_admin: User = Depends(admin_user),
    users_svc: UsersService = Depends(get_users_service),
):
    user = await users_svc.set_moderator_role(user_id, payload.is_moder)
    return JSONResponse(
        status_code=200,
        content=UserMiniPublic.model_validate(user).model_dump(mode="json"),
    )
