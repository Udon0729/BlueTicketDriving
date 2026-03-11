"""Detect wrong-side (right-side) riding violations.

Japan requires bicycles to ride on the LEFT side of the road.
"""

import math

from app.models.schemas import GpsPointIn
from app.services.overpass import OverpassCache, RoadWay
from app.store import GpsPoint


def _bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Bearing in degrees [0, 360) from point 1 to point 2."""
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlng = lng2 - lng1
    x = math.sin(dlng) * math.cos(lat2)
    y = (
        math.cos(lat1) * math.sin(lat2)
        - math.sin(lat1) * math.cos(lat2) * math.cos(dlng)
    )
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def _bearing_diff(b1: float, b2: float) -> float:
    """Absolute angular difference in degrees [0, 180]."""
    d = abs(b1 - b2) % 360
    return d if d <= 180 else 360 - d


def _point_seg_dist_and_cross(
    plat: float,
    plng: float,
    alat: float,
    alng: float,
    blat: float,
    blng: float,
    cos_lat: float,
) -> tuple[float, float]:
    """Squared distance (m^2) from point to segment, plus cross product sign.

    Uses flat-earth projection. Cross product > 0 means point is to the LEFT
    of the segment direction A→B.
    """
    s_lng = cos_lat * 111_320
    s_lat = 111_320

    px, py = plng * s_lng, plat * s_lat
    ax, ay = alng * s_lng, alat * s_lat
    bx, by = blng * s_lng, blat * s_lat

    dx, dy = bx - ax, by - ay
    len_sq = dx * dx + dy * dy

    if len_sq < 1e-10:
        return (px - ax) ** 2 + (py - ay) ** 2, 0.0

    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / len_sq))
    proj_x = ax + t * dx
    proj_y = ay + t * dy
    dist_sq = (px - proj_x) ** 2 + (py - proj_y) ** 2

    cross = dx * (py - ay) - dy * (px - ax)
    return dist_sq, cross


def _find_nearest_road(
    lat: float,
    lng: float,
    roads: list[RoadWay],
    max_dist_m: float = 30.0,
) -> tuple[RoadWay | None, int, float, float]:
    """Find nearest road segment.

    Returns (road, segment_index, distance_m, cross_product).
    """
    cos_lat = math.cos(math.radians(lat))
    best_road: RoadWay | None = None
    best_idx = -1
    best_dsq = max_dist_m**2
    best_cross = 0.0

    for road in roads:
        geom = road.geometry
        for i in range(len(geom) - 1):
            dsq, cross = _point_seg_dist_and_cross(
                lat, lng, geom[i][0], geom[i][1], geom[i + 1][0], geom[i + 1][1], cos_lat
            )
            if dsq < best_dsq:
                best_dsq = dsq
                best_road = road
                best_idx = i
                best_cross = cross

    dist = math.sqrt(best_dsq) if best_road else float("inf")
    return best_road, best_idx, dist, best_cross



def _is_wrong_side(
    lat: float,
    lng: float,
    cyclist_bearing: float,
    roads: list[RoadWay],
) -> bool | None:
    """Determine if cyclist is on the wrong side of the road.

    Returns True (wrong side), False (correct side), or None (can't determine).
    Japan: ride on the LEFT.
    """
    road, seg_idx, dist, cross = _find_nearest_road(lat, lng, roads)
    if road is None or dist > 20.0:
        return None

    a = road.geometry[seg_idx]
    b = road.geometry[seg_idx + 1]
    road_bearing = _bearing(a[0], a[1], b[0], b[1])

    same_direction = _bearing_diff(cyclist_bearing, road_bearing) < 90
    is_on_left = cross > 0

    # In Japan: same direction → should be on LEFT, opposite → should be on RIGHT
    wrong = is_on_left != same_direction

    # One-way road: going opposite direction is always a violation
    if road.oneway and not same_direction:
        wrong = True

    return wrong


async def check_road_violations(
    new_points: list[GpsPointIn],
    all_points: list[GpsPoint],
    cache: OverpassCache,
    *,
    window_size: int = 20,
    wrong_side_ratio: float = 0.70,
    min_speed: float = 5.0,
    min_classifiable: int = 5,
) -> list[dict]:
    """Check for wrong-side (right-side) riding.

    Uses a sliding window over accumulated GPS history.
    Returns a list of violation dicts: {type, lat, lng, detected_at}.
    """
    if not new_points or not all_points:
        return []

    center_lat = sum(p.lat for p in new_points) / len(new_points)
    center_lng = sum(p.lng for p in new_points) / len(new_points)

    roads, _sidewalks = await cache.get_road_geometry(center_lat, center_lng)
    if not roads:
        return []

    # Use last `window_size` points from accumulated history
    recent = all_points[-window_size:]
    if len(recent) < min_classifiable:
        return []

    wrong_side_votes: list[bool] = []

    for i in range(len(recent)):
        pt = recent[i]
        if pt.accuracy_m > 20 or pt.speed_kmh < min_speed:
            continue

        # Compute cyclist bearing from consecutive points
        if i + 1 < len(recent):
            nxt = recent[i + 1]
            cyc_bearing = _bearing(pt.lat, pt.lng, nxt.lat, nxt.lng)
        elif i > 0:
            prv = recent[i - 1]
            cyc_bearing = _bearing(prv.lat, prv.lng, pt.lat, pt.lng)
        else:
            continue

        ws = _is_wrong_side(pt.lat, pt.lng, cyc_bearing, roads)
        if ws is not None:
            wrong_side_votes.append(ws)

    if (
        len(wrong_side_votes) >= min_classifiable
        and sum(wrong_side_votes) / len(wrong_side_votes) >= wrong_side_ratio
    ):
        ref = new_points[-1]
        return [{
            "type": "right_side_riding",
            "lat": ref.lat,
            "lng": ref.lng,
            "detected_at": ref.recorded_at,
        }]

    return []
