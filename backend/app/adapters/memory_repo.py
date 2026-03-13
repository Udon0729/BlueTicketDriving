"""In-memory repository — implements all domain repository ports.

Replace with SupabaseRepository when ready for production.
"""

from app.domain.models import GpsPoint, IntersectionResult, Route, Trip


class InMemoryRepository:
    """Satisfies TripRepository, GpsRepository, and RouteRepository protocols."""

    def __init__(self) -> None:
        self._trips: dict[str, Trip] = {}
        self._gps: dict[str, list[GpsPoint]] = {}
        self._routes: dict[str, Route] = {}
        self._intersection_results: dict[str, list[IntersectionResult]] = {}

    # -- TripRepository --

    def get(self, trip_id: str) -> Trip | None:
        return self._trips.get(trip_id)

    def save(self, trip: Trip) -> None:
        self._trips[trip.id] = trip

    def list_all(self) -> list[Trip]:
        return sorted(self._trips.values(), key=lambda t: t.started_at, reverse=True)

    # -- GpsRepository --

    def get_points(self, trip_id: str) -> list[GpsPoint]:
        return self._gps.get(trip_id, [])

    def append_points(self, trip_id: str, points: list[GpsPoint]) -> None:
        self._gps.setdefault(trip_id, []).extend(points)

    # -- RouteRepository --

    def save_route(self, trip_id: str, route: Route) -> None:
        self._routes[trip_id] = route

    def get_route(self, trip_id: str) -> Route | None:
        return self._routes.get(trip_id)

    def save_intersection_results(
        self, trip_id: str, results: list[IntersectionResult],
    ) -> None:
        self._intersection_results[trip_id] = results

    def get_intersection_results(self, trip_id: str) -> list[IntersectionResult]:
        return self._intersection_results.get(trip_id, [])
