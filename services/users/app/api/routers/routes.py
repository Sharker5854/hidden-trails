from typing import Annotated, Optional
from fastapi import APIRouter, Request, Depends, Body, HTTPException
from ..deps import get_current_premium_user, get_routes_service
from app.schemas.routes import RouteRequest, RouteResponse
from app.services.routes import RoutesService
from app.models.users import User



router = APIRouter(prefix="/route", tags=["routes"])


from fastapi import APIRouter, Depends, Body
from typing import List



@router.post("/calculate", response_model=RouteResponse)
async def build_route(
    request: RouteRequest,
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user)
):
    """
    Request body:
    - geotag_ids: ID геотэгов [1, 2, 3, ...]
    - mode: drive | walk | bicycle

    Response body:
    - coordinates: [[lon, lat], ...]
    - distance_km: float
    - duration_min: int
    - mode: drive | walk (если не более 100км !!! иначе 400 Bad Request) | bicycle (если не более 300км !!! иначе 400 Bad Request)
    """
    route_data = await routes_svc.calculate_route(
        geotag_ids=request.geotag_ids,
        mode=request.mode.value,
    )

    return route_data