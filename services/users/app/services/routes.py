import datetime
from fastapi import HTTPException, status
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, case, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from .geotags import GeotagsService
from app.integrations.geoapify import Geoapify
from app.schemas.routes import RouteResponse


class RoutesService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.geotags_svc = GeotagsService(db)
        self.geoapify = Geoapify()
    
    async def calculate_route(
        self,
        geotag_ids: List[int],
        mode: str
    ) -> str:
        geotags = [await self.geotags_svc.get_by_id(g_id) for g_id in geotag_ids]
        coords = [[str(g.latitude), str(g.longitude)] for g in geotags]

        route_data = await self.geoapify.get_route_data(coords, mode)
        response_data = RouteResponse.model_validate(route_data)

        return response_data




