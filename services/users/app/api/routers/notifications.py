from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user, get_notifications_service
from app.models.users import User
from app.services.notifications import NotificationsService


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user: User = Depends(get_current_user),
    notifications_svc: NotificationsService = Depends(get_notifications_service),
):
    data = await notifications_svc.list_notifications(user.id)
    return JSONResponse(status_code=200, content=jsonable_encoder(data))


@router.post("/read-all")
async def mark_all_as_read(
    user: User = Depends(get_current_user),
    notifications_svc: NotificationsService = Depends(get_notifications_service),
):
    result = await notifications_svc.mark_all_as_read(user.id)
    return JSONResponse(status_code=200, content=result)
