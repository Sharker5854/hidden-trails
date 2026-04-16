from enum import Enum
from pydantic import BaseModel
from typing import List


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