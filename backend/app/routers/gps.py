"""GPS batch receive + violation detection (stop signs, wrong-side, sidewalk)."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Request

from app.models.schemas import GpsBatchRequest, GpsBatchResponse, ViolationOut
from app.services.gps_analysis import check_stop_violations
from app.services.road_analysis import check_road_violations
from app.store import GpsPoint, Violation, store

router = APIRouter(prefix="/api", tags=["gps"])

# Per-(trip, violation_type) cooldown tracking
_last_violation: dict[tuple[str, str], datetime] = {}


def _is_cooled_down(trip_id: str, vtype: str, cooldown_s: float) -> bool:
    """Return True if enough time has passed since the last violation of this type."""
    key = (trip_id, vtype)
    last = _last_violation.get(key)
    if last is None:
        return True
    return (datetime.now(timezone.utc) - last).total_seconds() >= cooldown_s


def _mark_violation(trip_id: str, vtype: str) -> None:
    _last_violation[(trip_id, vtype)] = datetime.now(timezone.utc)


@router.post("/gps", response_model=GpsBatchResponse)
async def receive_gps(body: GpsBatchRequest, request: Request) -> GpsBatchResponse:
    settings = request.app.state.settings
    cache = request.app.state.overpass_cache

    # Filter low-accuracy points
    valid = [p for p in body.points if p.accuracy_m <= 20]

    # Store points
    gps_list = store.gps_points.setdefault(body.trip_id, [])
    for p in valid:
        gps_list.append(
            GpsPoint(
                trip_id=body.trip_id,
                lat=p.lat,
                lng=p.lng,
                speed_kmh=p.speed_kmh,
                accuracy_m=p.accuracy_m,
                recorded_at=p.recorded_at,
            )
        )

    all_violations: list[dict] = []

    # Check for stop-sign violations
    stop_violations = await check_stop_violations(
        valid,
        cache,
        radius_m=settings.stop_sign_radius_m,
        speed_threshold=settings.stop_sign_speed_threshold,
    )
    all_violations.extend(stop_violations)

    # Check for wrong-side riding / sidewalk riding
    road_violations = await check_road_violations(
        valid,
        gps_list,
        cache,
        window_size=settings.road_analysis_window,
        wrong_side_ratio=settings.road_wrong_side_ratio,
        sidewalk_ratio=settings.road_sidewalk_ratio,
    )

    # Apply cooldown to road violations
    for v in road_violations:
        if _is_cooled_down(body.trip_id, v["type"], settings.road_violation_cooldown_s):
            all_violations.append(v)
            _mark_violation(body.trip_id, v["type"])

    # Store violations
    for v in all_violations:
        store.violations.setdefault(body.trip_id, []).append(
            Violation(
                id=str(uuid4()),
                trip_id=body.trip_id,
                type=v["type"],
                detected_at=v["detected_at"],
                lat=v["lat"],
                lng=v["lng"],
            )
        )

    return GpsBatchResponse(
        saved=len(valid),
        violations=[ViolationOut(**v) for v in all_violations],
    )
