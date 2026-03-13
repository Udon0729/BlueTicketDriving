import { useRef, useCallback, useState } from 'react'
import { db } from '../lib/db'
import { haversineDistance } from '../lib/geo'
import { apiFetch } from '../lib/api'
import { useRideStore } from '../stores/rideStore'

const SYNC_INTERVAL_MS = 5000

export function useGpsTracker() {
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const prevPointRef = useRef<{ lat: number; lng: number; time: number } | null>(null)
  const totalDistanceRef = useRef(0)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startSync = useCallback((tripId: string) => {
    syncIntervalRef.current = setInterval(async () => {
      try {
        const unsynced = await db.gpsPoints
          .where('tripId')
          .equals(tripId)
          .and((p) => !p.synced)
          .toArray()

        if (unsynced.length === 0) return

        const res = await apiFetch('/api/gps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: tripId,
            points: unsynced.map((p) => ({
              lat: p.lat,
              lng: p.lng,
              speed_kmh: p.speedKmh,
              accuracy_m: p.accuracyM,
              recorded_at: p.recordedAt,
            })),
          }),
        })

        if (res.ok) {
          const ids = unsynced.map((p) => p.id!).filter(Boolean)
          await db.gpsPoints.where('id').anyOf(ids).modify({ synced: true })

          const data = await res.json()

          if (data.rerouted) {
            // Reroute happened — intersection indices changed.
            // Skip incremental intersection_updates (they reference new indices
            // that don't exist in IndexedDB yet). Instead, fetch the full updated
            // trip and replace all local route/intersection data.
            try {
              const tripRes = await apiFetch(`/api/trips/${tripId}`)
              if (tripRes.ok) {
                const tripData = await tripRes.json()
                if (tripData.route) {
                  useRideStore.getState().setRoute(tripData.route)

                  await db.routes.put({
                    tripId,
                    geometry: tripData.route.geometry,
                    distanceM: tripData.route.distance_m,
                    durationS: tripData.route.duration_s,
                  })

                  await db.intersectionResults.where('tripId').equals(tripId).delete()
                  for (const ix of tripData.route.intersections) {
                    await db.intersectionResults.add({
                      tripId,
                      index: ix.index,
                      lat: ix.lat,
                      lng: ix.lng,
                      numRoads: ix.num_roads,
                      stopped: ix.stopped,
                      minSpeedKmh: ix.min_speed_kmh,
                    })
                  }
                }
              }
            } catch {
              // Reroute data will sync on next interval
            }
          } else if (data.intersection_updates?.length > 0) {
            // Normal case — apply incremental intersection updates
            for (const update of data.intersection_updates) {
              await db.intersectionResults
                .where('[tripId+index]')
                .equals([tripId, update.index])
                .modify({
                  stopped: update.stopped,
                  minSpeedKmh: update.min_speed_kmh,
                })
            }

            const allResults = await db.intersectionResults
              .where('tripId')
              .equals(tripId)
              .toArray()
            const stopped = allResults.filter((r) => r.stopped).length
            useRideStore.getState().updateIntersections(allResults.length, stopped)
          }
        }
      } catch {
        // Network error — will retry next interval
      }
    }, SYNC_INTERVAL_MS)
  }, [])

  const start = useCallback(
    (tripId: string) => {
      if (!navigator.geolocation) {
        setError('この端末ではGPSが利用できません')
        return
      }

      setError(null)
      prevPointRef.current = null
      totalDistanceRef.current = 0

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed } = pos.coords
          const now = Date.now()

          if (accuracy > 20) return

          let speedKmh = 0
          if (speed != null && speed >= 0) {
            speedKmh = speed * 3.6
          } else if (prevPointRef.current) {
            const dist = haversineDistance(
              prevPointRef.current.lat,
              prevPointRef.current.lng,
              latitude,
              longitude,
            )
            const timeDiffSec = (now - prevPointRef.current.time) / 1000
            if (timeDiffSec > 0) {
              speedKmh = (dist / timeDiffSec) * 3.6
            }
          }
          speedKmh = Math.round(speedKmh * 10) / 10

          if (prevPointRef.current) {
            totalDistanceRef.current += haversineDistance(
              prevPointRef.current.lat,
              prevPointRef.current.lng,
              latitude,
              longitude,
            )
          }
          prevPointRef.current = { lat: latitude, lng: longitude, time: now }

          useRideStore.getState().updateGps(latitude, longitude, speedKmh, accuracy)

          db.gpsPoints.add({
            tripId,
            lat: latitude,
            lng: longitude,
            speedKmh,
            accuracyM: accuracy,
            recordedAt: new Date(pos.timestamp).toISOString(),
            synced: false,
          })
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('GPS の使用が許可されていません。ブラウザの設定を確認してください。')
              break
            case err.POSITION_UNAVAILABLE:
              setError('現在地を取得できません')
              break
            case err.TIMEOUT:
              setError('GPS の応答がタイムアウトしました')
              break
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        },
      )

      // Start batch sync to backend
      startSync(tripId)
    },
    [startSync],
  )

  const stop = useCallback(async (tripId: string) => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }

    // Final flush of unsynced points
    try {
      const unsynced = await db.gpsPoints
        .where('tripId')
        .equals(tripId)
        .and((p) => !p.synced)
        .toArray()

      if (unsynced.length > 0) {
        const res = await apiFetch('/api/gps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trip_id: tripId,
            points: unsynced.map((p) => ({
              lat: p.lat,
              lng: p.lng,
              speed_kmh: p.speedKmh,
              accuracy_m: p.accuracyM,
              recorded_at: p.recordedAt,
            })),
          }),
        })
        if (res.ok) {
          const ids = unsynced.map((p) => p.id!).filter(Boolean)
          await db.gpsPoints.where('id').anyOf(ids).modify({ synced: true })

          // Process final intersection results so ResultPage is accurate
          const data = await res.json()
          if (data.intersection_updates?.length > 0) {
            for (const update of data.intersection_updates) {
              await db.intersectionResults
                .where('[tripId+index]')
                .equals([tripId, update.index])
                .modify({
                  stopped: update.stopped,
                  minSpeedKmh: update.min_speed_kmh,
                })
            }
          }
        }
      }
    } catch {
      // Offline — data remains in IndexedDB for later sync
    }

    // Finalize trip
    await db.trips.update(tripId, {
      endedAt: new Date().toISOString(),
      distanceM: Math.round(totalDistanceRef.current),
    })
  }, [])

  return { start, stop, error }
}
