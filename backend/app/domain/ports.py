"""Port interfaces (Protocol classes) for dependency inversion.

Domain and use-case layers depend on these protocols.
Adapter layer provides concrete implementations.
"""

from __future__ import annotations

from typing import Protocol

from .models import GpsPoint, IntersectionResult, Route, Trip


# ---------------------------------------------------------------------------
# Repository ports
# ---------------------------------------------------------------------------


class TripRepository(Protocol):
    def get(self, trip_id: str) -> Trip | None: ...
    def save(self, trip: Trip) -> None: ...
    def list_all(self) -> list[Trip]: ...


class GpsRepository(Protocol):
    def get_points(self, trip_id: str) -> list[GpsPoint]: ...
    def append_points(self, trip_id: str, points: list[GpsPoint]) -> None: ...


class RouteRepository(Protocol):
    def save_route(self, trip_id: str, route: Route) -> None: ...
    def get_route(self, trip_id: str) -> Route | None: ...
    def save_intersection_results(
        self, trip_id: str, results: list[IntersectionResult],
    ) -> None: ...
    def get_intersection_results(self, trip_id: str) -> list[IntersectionResult]: ...


# ---------------------------------------------------------------------------
# Gateway ports (external services)
# ---------------------------------------------------------------------------


class RoutingService(Protocol):
    """ルーティングサービス"""
    async def get_bicycle_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> Route: ...
