from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import (
    get_current_premium_user,
    get_current_user,
    get_geotags_service,
    get_routes_service,
)
from app.models.users import User
from app.schemas.routes import (
    AvailableModesResponse,
    RoutePointsRequest,
    RouteRequest,
    RouteResponse,
    RouteShareRequest,
    RouteShareResponse,
    SavedRouteCreate,
    SavedRoutePublic,
    SavedRoutesListResponse,
)
from app.services.geotags import GeotagsService
from app.services.routes import RoutesService


router = APIRouter(prefix="/route", tags=["routes"])


@router.get("/my", response_model=SavedRoutesListResponse)
async def list_my_routes(
    routes_svc: RoutesService = Depends(get_routes_service),
    user: User = Depends(get_current_user),
):
    routes = await routes_svc.list_my_routes(user.id)
    return {"routes": routes}


@router.get("/feed", response_model=SavedRoutesListResponse)
async def list_public_routes(
    routes_svc: RoutesService = Depends(get_routes_service),
    user: User = Depends(get_current_user),
):
    routes = await routes_svc.list_public_routes(user.id)
    return {"routes": routes}


@router.post("/calculate", response_model=RouteResponse)
async def build_route(
    request: RouteRequest,
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user),
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
    for geotag_id in request.geotag_ids:
        if not await geotags_svc.is_geotag_moderated(geotag_id):
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Геометка с id={geotag_id} еще не прошла модерацию, "
                    "её нельзя использовать при построении маршрута."
                ),
            )

    return await routes_svc.calculate_route(
        geotag_ids=request.geotag_ids,
        mode=request.mode.value,
    )


@router.post("/calculate-points", response_model=RouteResponse)
async def build_route_by_points(
    request: RoutePointsRequest,
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user),
):
    return await routes_svc.calculate_route_by_points(
        points=request.points,
        mode=request.mode.value,
    )


@router.post("/save", response_model=SavedRoutePublic)
async def save_route(
    request: SavedRouteCreate,
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user),
):
    return await routes_svc.save_route(premium_user.id, request)


@router.post("/{route_id}/publish", response_model=SavedRoutePublic)
async def publish_route(
    route_id: int,
    routes_svc: RoutesService = Depends(get_routes_service),
    user: User = Depends(get_current_user),
):
    return await routes_svc.publish_route(route_id, user.id)


@router.post("/{route_id}/share", response_model=RouteShareResponse)
async def share_route(
    route_id: int,
    request: RouteShareRequest,
    routes_svc: RoutesService = Depends(get_routes_service),
    user: User = Depends(get_current_user),
):
    text = await routes_svc.share_route(
        route_id=route_id,
        sender_id=user.id,
        recipient_id=request.recipient_id,
    )
    return {"message": text}


@router.get("/available-modes", response_model=AvailableModesResponse)
async def check_available_modes(
    geotag_ids: List[int] = Query(..., description="ID геотэгов", min_items=2),
    geotags_svc: GeotagsService = Depends(get_geotags_service),
    routes_svc: RoutesService = Depends(get_routes_service),
    premium_user: User = Depends(get_current_premium_user),
):
    """
    Request body:
    - geotag_ids: ID геотэгов [1, 2, 3, ...]

    Response body:
    - available_modes: drive | walk (если не более 100км !!!) | bicycle (если не более 300км !!!)
    """
    for geotag_id in geotag_ids:
        if not await geotags_svc.is_geotag_moderated(geotag_id):
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Геометка с id={geotag_id} еще не прошла модерацию, "
                    "её нельзя использовать при построении маршрута."
                ),
            )

    if len(geotag_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Pass at least two geotags to check route distance.",
        )

    return await routes_svc.get_available_modes(geotag_ids=geotag_ids)


@router.get("/{route_id}", response_model=SavedRoutePublic)
async def get_saved_route(
    route_id: int,
    routes_svc: RoutesService = Depends(get_routes_service),
    user: User = Depends(get_current_user),
):
    return await routes_svc.get_route(route_id, user.id)
