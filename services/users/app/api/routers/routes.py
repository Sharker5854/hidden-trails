from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from ..deps import get_current_premium_user, get_routes_service, get_geotags_service
from app.schemas.routes import RouteRequest, RouteResponse, AvailableModesResponse
from app.services.routes import RoutesService
from app.services.geotags import GeotagsService
from app.models.users import User



router = APIRouter(prefix="/route", tags=["routes"])



@router.post("/calculate", response_model=RouteResponse)
async def build_route(
    request: RouteRequest,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
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
    for g_id in request.geotag_ids:
        if not await geotags_svc.is_geotag_moderated(g_id):
            raise HTTPException(status_code=404, detail=f"Геометка с id={g_id} еще не прошла модерацию, её нельзя использовать при построении маршрута.")

    route_data = await routes_svc.calculate_route(
        geotag_ids=request.geotag_ids,
        mode=request.mode.value,
    )

    return route_data



@router.get("/available-modes", response_model=AvailableModesResponse)
async def check_available_modes(
    geotag_ids: List[int] = Query(..., description="ID геотэгов", min_items=2),
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user)
):
    """
    Request body:
    - geotag_ids: ID геотэгов [1, 2, 3, ...]

    Response body:
    - available_modes: drive | walk (если не более 100км !!!) | bicycle (если не более 300км !!!)
    """
    for g_id in geotag_ids:
        if not await geotags_svc.is_geotag_moderated(g_id):
            raise HTTPException(status_code=404, detail=f"Геометка с id={g_id} еще не прошла модерацию, её нельзя использовать при построении маршрута.")

    if len(geotag_ids) < 2:
        raise HTTPException(status_code=400, detail="Pass at least two geotags to check route distance.")
    
    result = await routes_svc.get_available_modes(
        geotag_ids=geotag_ids
    )

    return result