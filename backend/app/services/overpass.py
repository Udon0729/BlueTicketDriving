"""Overpass API client for querying OSM data, with grid-based caching."""

import time
from dataclasses import dataclass, field

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


@dataclass
class StopSign:
    lat: float
    lng: float
    osm_id: int


@dataclass
class RoadWay:
    osm_id: int
    highway: str
    oneway: bool
    geometry: list[tuple[float, float]] = field(default_factory=list)  # [(lat, lng), ...]


@dataclass
class SidewalkWay:
    osm_id: int
    geometry: list[tuple[float, float]] = field(default_factory=list)


class OverpassCache:
    def __init__(self, ttl_seconds: int = 86400, query_radius_m: float = 500.0) -> None:
        self.ttl = ttl_seconds
        self.radius = query_radius_m
        self._cache: dict[str, tuple[float, list[StopSign]]] = {}
        self._road_cache: dict[str, tuple[float, list[RoadWay], list[SidewalkWay]]] = {}

    def _grid_key(self, lat: float, lng: float) -> str:
        """Quantize coordinates to ~500 m grid cells."""
        grid_size = 0.005  # ~500 m at mid-latitudes
        glat = round(lat / grid_size) * grid_size
        glng = round(lng / grid_size) * grid_size
        return f"{glat:.3f},{glng:.3f}"

    async def get_stop_signs(self, lat: float, lng: float) -> list[StopSign]:
        key = self._grid_key(lat, lng)
        now = time.time()

        if key in self._cache:
            ts, signs = self._cache[key]
            if now - ts < self.ttl:
                return signs

        center_lat, center_lng = (float(v) for v in key.split(","))
        query = (
            f'[out:json][timeout:10];'
            f'node["highway"="stop"](around:{self.radius},{center_lat},{center_lng});'
            f'out body;'
        )

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    OVERPASS_URL,
                    data={"data": query},
                    timeout=15.0,
                )
                resp.raise_for_status()

            elements = resp.json().get("elements", [])
            signs = [
                StopSign(lat=e["lat"], lng=e["lon"], osm_id=e["id"])
                for e in elements
            ]
        except (httpx.HTTPError, KeyError):
            signs = []

        self._cache[key] = (now, signs)
        return signs

    async def get_road_geometry(
        self, lat: float, lng: float,
    ) -> tuple[list[RoadWay], list[SidewalkWay]]:
        """Get nearby road and sidewalk geometries from OSM."""
        key = "road_" + self._grid_key(lat, lng)
        now = time.time()

        if key in self._road_cache:
            ts, roads, sidewalks = self._road_cache[key]
            if now - ts < self.ttl:
                return roads, sidewalks

        center_lat, center_lng = (float(v) for v in self._grid_key(lat, lng).split(","))

        road_types = (
            "trunk|primary|secondary|tertiary|residential|unclassified"
            "|living_street|cycleway"
            "|trunk_link|primary_link|secondary_link|tertiary_link"
        )
        query = (
            f'[out:json][timeout:15];'
            f'('
            f'way["highway"~"^({road_types})$"]'
            f'(around:{self.radius},{center_lat},{center_lng});'
            f'way["highway"="footway"]'
            f'(around:{self.radius},{center_lat},{center_lng});'
            f'way["highway"="pedestrian"]'
            f'(around:{self.radius},{center_lat},{center_lng});'
            f');'
            f'out body geom;'
        )

        roads: list[RoadWay] = []
        sidewalks: list[SidewalkWay] = []

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    OVERPASS_URL,
                    data={"data": query},
                    timeout=20.0,
                )
                resp.raise_for_status()

            for e in resp.json().get("elements", []):
                if e.get("type") != "way" or "geometry" not in e:
                    continue

                geom = [(n["lat"], n["lon"]) for n in e["geometry"]]
                if len(geom) < 2:
                    continue

                tags = e.get("tags", {})
                hw = tags.get("highway", "")

                if hw in ("footway", "pedestrian"):
                    sidewalks.append(SidewalkWay(osm_id=e["id"], geometry=geom))
                else:
                    oneway = tags.get("oneway") in ("yes", "1", "true")
                    roads.append(RoadWay(
                        osm_id=e["id"],
                        highway=hw,
                        oneway=oneway,
                        geometry=geom,
                    ))
        except (httpx.HTTPError, KeyError):
            pass

        self._road_cache[key] = (now, roads, sidewalks)
        return roads, sidewalks
