/**
 * Centralized API client — decouples frontend from backend URL.
 *
 * In development with Vite proxy, VITE_API_BASE_URL can be left empty
 * (relative paths go through the proxy).
 * In production, set VITE_API_BASE_URL to the backend origin
 * (e.g. "https://api.example.com").
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''

/** Standard fetch wrapper that prepends the API base URL. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, init)
}

/** Search addresses via Nominatim geocoding API. */
export async function searchAddress(
  query: string,
): Promise<Array<{ lat: number; lng: number; display_name: string }>> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'jp',
    limit: '5',
  })
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'Accept-Language': 'ja' } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.map((item: { lat: string; lon: string; display_name: string }) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    display_name: item.display_name,
  }))
}
