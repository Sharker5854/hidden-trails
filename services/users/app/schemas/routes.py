from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from app.schemas.geotags import GeotagPublic


class RouteMode(str, Enum):
    DRIVE = "drive"
    WALK = "walk"
    BICYCLE = "bicycle"


class RouteRequest(BaseModel):
    geotag_ids: List[int]
    mode: RouteMode = RouteMode.DRIVE


class RoutePoint(BaseModel):
    latitude: float
    longitude: float


class RoutePointsRequest(BaseModel):
    points: List[RoutePoint]
    mode: RouteMode = RouteMode.DRIVE


class RouteResponse(BaseModel):
    coordinates: List[List[float]] # [[lon, lat], ...]
    distance_km: float
    duration_min: int
    mode: RouteMode


class AvailableModesRequest(BaseModel):
    geotag_ids: List[int]

class AvailableModesResponse(BaseModel):
    available_modes: List[RouteMode]
    distance_km: float


class SavedRouteCreate(BaseModel):
    title: str
    description: Optional[str] = None
    warnings: Optional[str] = None
    tips: Optional[str] = None
    geotag_ids: List[int] = []
    points: List[RoutePoint] = []
    mode: RouteMode = RouteMode.DRIVE
    is_public: bool = False


class SavedRoutePublic(RouteResponse):
    id: int
    title: str
    description: Optional[str] = None
    warnings: Optional[str] = None
    tips: Optional[str] = None
    author_id: int
    author_nickname: Optional[str] = None
    created_at: datetime
    geotag_ids: List[int]
    geotags: List[GeotagPublic] = []
    is_public: bool = False


class SavedRoutesListResponse(BaseModel):
    routes: List[SavedRoutePublic]


class RouteShareRequest(BaseModel):
    recipient_id: int


class RouteShareResponse(BaseModel):
    message: str
