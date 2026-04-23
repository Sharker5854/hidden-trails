import json
from fastapi import HTTPException, status
import redis.asyncio as redis
from typing import List
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from .geotags import GeotagsService
from .messages import MessagesService
from app.core.config import settings
from app.integrations.geoapify import Geoapify
from app.models.geotags import Geotag
from app.models.route import Route
from app.models.route_geotags import route_geotags
from app.schemas.geotags import GeotagPublic
from app.schemas.routes import (
    AvailableModesResponse,
    RoutePoint,
    RouteResponse,
    SavedRouteCreate,
    SavedRoutePublic,
)


class RoutesService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.geotags_svc = GeotagsService(db)
        self.geoapify = Geoapify()
        self.redis = redis.from_url(settings.redis_url)
    


    async def calculate_route(
        self,
        geotag_ids: List[int],
        mode: str,
        cache_id: str = None
    ) -> RouteResponse:
        geotags = await self._get_ordered_geotags(geotag_ids)
        coords = [[str(g.latitude), str(g.longitude)] for g in geotags]

        if not cache_id:
            cache_id = f"route:{ ':'.join(map(lambda x: ",".join(x), coords)) }:{mode}"

        cached_route_data = await self._try_route_from_cache(cache_id)

        if cached_route_data:
            return cached_route_data
        
        return await self._calculate_route_by_coords(coords, mode)



    async def calculate_route_by_points(
        self,
        points: List[RoutePoint],
        mode: str,
        cache_id: str = None
    ) -> RouteResponse:
        coords = self._route_points_to_geoapify_coords(points)

        if not cache_id:
            cache_id = f"route:{ ':'.join(map(lambda x: ",".join(x), coords)) }:{mode}"

        cached_route_data = await self._try_route_from_cache(cache_id)

        if cached_route_data:
            return cached_route_data
        
        return await self._calculate_route_by_coords(coords, mode)
        
        



    async def _calculate_route_by_coords(
        self,
        coords: List[List[str]],
        mode: str,
    ) -> RouteResponse:      
        route_data = await self.geoapify.get_route_data(coords, mode)

        redis_cache_id = f"route:{ ':'.join(map(lambda x: ",".join(x), coords)) }:{mode}"
        print("AAAAAAAAAAAAAAAAA", redis_cache_id)
        await self.redis.setex(redis_cache_id, 1800, json.dumps(route_data))

        route_data["cache_id"] = redis_cache_id

        response_data = RouteResponse.model_validate(route_data)

        return response_data
    

    async def _try_route_from_cache(self, cache_id: str) -> RouteResponse:
        route_data = await self.redis.get(cache_id)
        if not route_data:
            return None
        print(f"AAAAAAAAAAAAAAAAAAAAAAAAAAAAA ВЗЯЛ ИЗ КЭШААААА ЮХУУУУУУУУУУ | {cache_id}")
        return RouteResponse.model_validate(json.loads(route_data))



    async def get_available_modes(
        self,
        geotag_ids: List[int],
    ) -> dict:
        try:
            full_route_data = await self.calculate_route(geotag_ids, "drive")
        except HTTPException as e:
            raise e
        
        result = {
            "available_modes" : ["drive"],
            "distance_km": full_route_data.distance_km
        }

        if full_route_data.distance_km < 300:
            result["available_modes"].append("bicycle")
            if full_route_data.distance_km < 100:
                result["available_modes"].append("walk")

        response_data = AvailableModesResponse.model_validate(result)

        return response_data



    async def list_my_routes(self, user_id: int) -> List[SavedRoutePublic]:
        stmt = (
            select(Route)
            .options(selectinload(Route.author))
            .where(Route.author_id == user_id)
            .order_by(Route.created_at.desc())
        )
        result = await self.db.execute(stmt)
        routes = result.scalars().all()
        return [await self._route_public(route, user_id) for route in routes]



    async def list_public_routes(self, current_user_id: int) -> List[SavedRoutePublic]:
        stmt = (
            select(Route)
            .options(selectinload(Route.author))
            .where(Route.is_public.is_(True))
            .order_by(Route.created_at.desc())
        )
        result = await self.db.execute(stmt)
        routes = result.scalars().all()
        return [await self._route_public(route, current_user_id) for route in routes]



    async def get_route(self, route_id: int, current_user_id: int) -> SavedRoutePublic:
        route = await self._get_visible_route(route_id, current_user_id)
        return await self._route_public(route, current_user_id)



    async def save_route(
        self,
        user_id: int,
        payload: SavedRouteCreate,
    ) -> SavedRoutePublic:
        if payload.points:
            geotags = await self._get_ordered_geotags(payload.geotag_ids, min_count=0)
            calculated = await self.calculate_route_by_points(payload.points, payload.mode.value)
            start_point_id = geotags[0].id if geotags else None
            finish_point_id = geotags[-1].id if geotags else None
        else:
            geotags = await self._get_ordered_geotags(payload.geotag_ids)
            calculated = await self.calculate_route(payload.geotag_ids, payload.mode.value)
            start_point_id = geotags[0].id
            finish_point_id = geotags[-1].id

        route = Route(
            title=payload.title.strip(),
            description=payload.description,
            warnings=payload.warnings,
            tips=payload.tips,
            author_id=user_id,
            start_point_id=start_point_id,
            finish_point_id=finish_point_id,
            transport_type=calculated.mode.value,
            distance_km=calculated.distance_km,
            travel_time_min=calculated.duration_min,
            is_public=payload.is_public,
            route_points=json.dumps(calculated.coordinates),
        )
        self.db.add(route)
        await self.db.flush()

        await self._replace_route_geotags(route.id, payload.geotag_ids)
        await self.db.commit()
        await self.db.refresh(route)

        return await self._route_public(await self._get_owned_route(route.id, user_id), user_id)



    async def publish_route(
        self,
        route_id: int,
        user_id: int,
    ) -> SavedRoutePublic:
        route = await self._get_owned_route(route_id, user_id)
        route.is_public = True
        await self.db.commit()
        await self.db.refresh(route)
        return await self._route_public(route, user_id)



    async def share_route(
        self,
        route_id: int,
        sender_id: int,
        recipient_id: int,
    ) -> str:
        route = await self._get_visible_route(route_id, sender_id)
        public_route = await self._route_public(route, sender_id)
        geotag_titles = ", ".join(geotag.title for geotag in public_route.geotags)
        text = (
            f"Маршрут: {public_route.title}\n"
            f"{public_route.distance_km} км, {public_route.duration_min} мин.\n"
            f"Точки: {geotag_titles}\n"
            f"Открой раздел Маршруты и найди маршрут #{public_route.id}."
        )
        await MessagesService(self.db).send_message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            text=text,
        )
        return text



    def _route_points_to_geoapify_coords(self, points: List[RoutePoint]) -> List[List[str]]:
        if len(points) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pass at least two map points to build a route.",
            )

        return [
            [str(point.latitude), str(point.longitude)]
            for point in points
        ]



    async def _get_ordered_geotags(self, geotag_ids: List[int], min_count: int = 2) -> List[Geotag]:
        if len(geotag_ids) < min_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pass at least two geotags to build a route.",
            )
        if not geotag_ids:
            return []
        if len(set(geotag_ids)) != len(geotag_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Route geotags must be unique.",
            )

        result = await self.db.execute(select(Geotag).where(Geotag.id.in_(geotag_ids)))
        geotags_by_id = {geotag.id: geotag for geotag in result.scalars().all()}
        missing_ids = [geotag_id for geotag_id in geotag_ids if geotag_id not in geotags_by_id]
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Geotags not found: {missing_ids}",
            )

        return [geotags_by_id[geotag_id] for geotag_id in geotag_ids]




    async def _replace_route_geotags(self, route_id: int, geotag_ids: List[int]) -> None:
        await self.db.execute(delete(route_geotags).where(route_geotags.c.route_id == route_id))
        if not geotag_ids:
            return
        await self.db.execute(
            route_geotags.insert(),
            [
                {
                    "route_id": route_id,
                    "geotag_id": geotag_id,
                    "position": position,
                }
                for position, geotag_id in enumerate(geotag_ids)
            ],
        )




    async def _get_owned_route(self, route_id: int, user_id: int) -> Route:
        stmt = (
            select(Route)
            .options(selectinload(Route.author))
            .where(Route.id == route_id, Route.author_id == user_id)
        )
        result = await self.db.execute(stmt)
        route = result.scalar_one_or_none()
        if not route:
            raise HTTPException(status_code=404, detail="Route not found.")
        return route




    async def _get_visible_route(self, route_id: int, user_id: int) -> Route:
        stmt = (
            select(Route)
            .options(selectinload(Route.author))
            .where(Route.id == route_id)
        )
        result = await self.db.execute(stmt)
        route = result.scalar_one_or_none()
        if not route or (route.author_id != user_id and not route.is_public):
            raise HTTPException(status_code=404, detail="Route not found.")
        return route




    async def _get_route_geotags(self, route_id: int) -> List[Geotag]:
        stmt = (
            select(Geotag)
            .options(
                selectinload(Geotag.author),
                selectinload(Geotag.themes),
                selectinload(Geotag.likers),
            )
            .join(route_geotags, route_geotags.c.geotag_id == Geotag.id)
            .where(route_geotags.c.route_id == route_id)
            .order_by(route_geotags.c.position)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()




    async def _route_public(self, route: Route, current_user_id: int) -> SavedRoutePublic:
        geotags = await self._get_route_geotags(route.id)
        coordinates = json.loads(route.route_points or "[]")
        return SavedRoutePublic(
            id=route.id,
            title=route.title,
            description=route.description,
            warnings=route.warnings,
            tips=route.tips,
            author_id=route.author_id,
            author_nickname=getattr(route.author, "nickname", None),
            created_at=route.created_at,
            geotag_ids=[geotag.id for geotag in geotags],
            geotags=[
                GeotagPublic.from_orm(geotag, current_user_id=current_user_id)
                for geotag in geotags
            ],
            coordinates=coordinates,
            distance_km=route.distance_km or 0,
            duration_min=route.travel_time_min or 0,
            mode=route.transport_type or "drive",
            is_public=route.is_public,
        )
        




