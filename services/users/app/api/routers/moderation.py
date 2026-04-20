from fastapi import APIRouter, Depends, HTTPException
from app.services.geotags import GeotagsService
from app.services.moderation import ModerationService
from app.schemas.moderation import ModerationRequest, ModerationResponse
from ..deps import get_current_moder_user, get_geotags_service, get_moderation_service
from app.models.users import User



router = APIRouter(prefix="/moderation", tags=["moderation"])



@router.get("/moderate/{geotag_id}")
async def moderate(
    geotag_id: int,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    moder_user: User = Depends(get_current_moder_user)
):
    geotag = await geotags_svc.get_by_id(geotag_id)

    if not geotag:
        return HTTPException(404, "Geotag not found.")

    return geotag



@router.post("/moderate/{geotag_id}", response_model=ModerationResponse)
async def moderate(
    geotag_id: int,
    request: ModerationRequest,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    moderation_svc: ModerationService = Depends(get_moderation_service),
    moder_user: User = Depends(get_current_moder_user)
):
    geotag = await geotags_svc.get_by_id(geotag_id)

    if not geotag:
        return HTTPException(404, "Geotag not found.")
    
    result = await moderation_svc.moderate(
        geotag, 
        request
    )
    
    return result