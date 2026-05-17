from typing import List, Tuple
from fastapi import HTTPException
from .utils import HttpxClient
from app.core.config import settings



class Geoapify:
    def __init__(self):
        self.__api_key = settings.geoapify_api_key
        self.httpx_client = HttpxClient(host="https://api.geoapify.com", timeout=30)

    async def get_route_data(
        self,
        coordinates: List[Tuple[str, str]],
        mode: str   
    ) -> str:
        if not self.__api_key:
            raise HTTPException(
                status_code=503,
                detail="Geoapify API key is not configured."
            )

        waypoints = "|".join(list(f"{point[0]},{point[1]}" for point in coordinates))

        try:
            async with self.httpx_client as client:
                response = await client.get(
                    "/v1/routing",
                    params={
                        "waypoints": waypoints,
                        "mode": mode,
                        "apiKey": self.__api_key,
                        "lang": "ru",
                        "type": "balanced"
                    }
                )
        except Exception as e:
            raise e

        route_json = response.json()

        if response.status_code != 200 or response.json().get("statusCode") == 400:
            raise HTTPException(
                status_code=int(response.json()["statusCode"]),
                detail=route_json
            )
        
        parsed_route_json = self._parse_route_data(route_json)

        return parsed_route_json
    


    def _parse_route_data(self, route_json: dict) -> dict:
        feature = route_json["features"][0]
        
        all_coords = []
        geometry = feature['geometry']
        
        if geometry['type'] == 'LineString':
            coords = geometry['coordinates']
            all_coords.extend(coords)
        elif geometry['type'] == 'MultiLineString':
            for line in geometry['coordinates']:
                all_coords.extend(line)
        
        properties = feature['properties']

        return {
            "coordinates": all_coords,
            "distance_km": round(properties["distance"] / 1000, 1),
            "duration_min": int(properties["time"] // 60),
            "mode": properties["mode"]
        }
