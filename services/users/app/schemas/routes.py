from enum import Enum
from typing import Optional,List
from pydantic import BaseModel, Field, ConfigDict



class RouteCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str = Field(..., max_length=5000)
    warnings: Optional[str] = Field(None, max_length=2000)
    tips: Optional[str] = Field(None, max_length=2000)
    cached_route_id: str  # из кэша мы возьмем:  geotag_ids, transport_type, distance_km, travel_time_min, route_points
    # theme_ids мы возьмем из геометок, принадлежащих маршруту


class RouteCreateResponse(BaseModel):
    id: int
    title: str
    author_id: int
    geotag_ids: List[int]
    transport_type: str
    distance_km: float
    travel_time_min: int



class RouteMode(str, Enum):
    DRIVE = "drive"
    WALK = "walk"
    BICYCLE = "bicycle"

class RouteRequest(BaseModel):
    geotag_ids: List[int]
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