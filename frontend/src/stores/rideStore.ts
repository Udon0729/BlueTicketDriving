import { create } from 'zustand'

export interface RouteData {
  geometry: number[][]
  intersections: Array<{
    index: number
    lat: number
    lng: number
    num_roads: number
    stopped: boolean
    min_speed_kmh: number | null
  }>
  distance_m: number
  duration_s: number
}

interface RideState {
  isRiding: boolean
  tripId: string | null
  currentSpeed: number
  currentAccuracy: number
  currentLat: number | null
  currentLng: number | null
  elapsedSeconds: number

  // Destination & route
  destinationLat: number | null
  destinationLng: number | null
  destinationName: string | null
  route: RouteData | null

  // Intersection tracking
  totalIntersections: number
  stoppedIntersections: number

  startRide: (tripId: string) => void
  endRide: () => void
  updateGps: (lat: number, lng: number, speed: number, accuracy: number) => void
  setDestination: (lat: number, lng: number, name: string | null) => void
  setRoute: (route: RouteData) => void
  updateIntersections: (total: number, stopped: number) => void
  tick: () => void
}

export const useRideStore = create<RideState>((set) => ({
  isRiding: false,
  tripId: null,
  currentSpeed: 0,
  currentAccuracy: 0,
  currentLat: null,
  currentLng: null,
  elapsedSeconds: 0,
  destinationLat: null,
  destinationLng: null,
  destinationName: null,
  route: null,
  totalIntersections: 0,
  stoppedIntersections: 0,

  startRide: (tripId) =>
    set({
      isRiding: true,
      tripId,
      currentSpeed: 0,
      currentAccuracy: 0,
      currentLat: null,
      currentLng: null,
      elapsedSeconds: 0,
      // NOTE: route, destination, totalIntersections, stoppedIntersections
      // are intentionally NOT reset — they are set during route planning
      // and must survive into the riding phase.
    }),

  endRide: () =>
    set({
      isRiding: false,
      tripId: null,
      currentSpeed: 0,
      currentAccuracy: 0,
      currentLat: null,
      currentLng: null,
      destinationLat: null,
      destinationLng: null,
      destinationName: null,
      route: null,
      totalIntersections: 0,
      stoppedIntersections: 0,
    }),

  updateGps: (lat, lng, speed, accuracy) =>
    set({ currentLat: lat, currentLng: lng, currentSpeed: speed, currentAccuracy: accuracy }),

  setDestination: (lat, lng, name) =>
    set({ destinationLat: lat, destinationLng: lng, destinationName: name }),

  setRoute: (route) =>
    set({
      route,
      totalIntersections: route.intersections.length,
      stoppedIntersections: route.intersections.filter((ix) => ix.stopped).length,
    }),

  updateIntersections: (total, stopped) =>
    set({ totalIntersections: total, stoppedIntersections: stopped }),

  tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
}))
