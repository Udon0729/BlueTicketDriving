"""Pydantic models for API request/response serialization."""

from __future__ import annotations

from pydantic import BaseModel


# --- GPS ---


class GpsPointIn(BaseModel):
    lat: float
    lng: float
    speed_kmh: float
    accuracy_m: float
    recorded_at: str


class GpsBatchRequest(BaseModel):
    trip_id: str
    points: list[GpsPointIn]


class IntersectionUpdateOut(BaseModel):
    index: int
    stopped: bool
    min_speed_kmh: float | None = None


class GpsBatchResponse(BaseModel):
    saved: int
    intersection_updates: list[IntersectionUpdateOut]
    rerouted: bool = False


# --- Trips ---


class TripCreateRequest(BaseModel):
    id: str | None = None
    destination_lat: float | None = None
    destination_lng: float | None = None


class IntersectionOut(BaseModel):
    index: int
    lat: float
    lng: float
    num_roads: int
    stopped: bool = False
    min_speed_kmh: float | None = None


class RouteOut(BaseModel):
    geometry: list[list[float]]  # [[lat, lng], ...]
    intersections: list[IntersectionOut]
    distance_m: float
    duration_s: float


class TripOut(BaseModel):
    id: str
    started_at: str
    ended_at: str | None = None
    distance_m: float = 0.0
    destination_lat: float | None = None
    destination_lng: float | None = None
    route: RouteOut | None = None


class IntersectionsSummaryOut(BaseModel):
    total: int
    stopped: int
    results: list[IntersectionOut]
