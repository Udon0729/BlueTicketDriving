export interface Trip {
  id: string
  startedAt: string
  endedAt: string
  distanceM: number
  violationCount: number
}

export interface Violation {
  id: string
  tripId: string
  type: 'signal_ignore' | 'no_stop'
  detectedAt: string
  lat: number
  lng: number
}

export interface GpsPoint {
  lat: number
  lng: number
  speedKmh: number
  accuracyM: number
  recordedAt: string
}

export const mockTrips: Trip[] = [
  {
    id: 'trip-1',
    startedAt: '2026-03-10T08:00:00+09:00',
    endedAt: '2026-03-10T08:25:00+09:00',
    distanceM: 3200,
    violationCount: 2,
  },
  {
    id: 'trip-2',
    startedAt: '2026-03-09T07:30:00+09:00',
    endedAt: '2026-03-09T07:50:00+09:00',
    distanceM: 2100,
    violationCount: 0,
  },
  {
    id: 'trip-3',
    startedAt: '2026-03-08T15:00:00+09:00',
    endedAt: '2026-03-08T15:35:00+09:00',
    distanceM: 4500,
    violationCount: 1,
  },
  {
    id: 'trip-4',
    startedAt: '2026-03-07T08:10:00+09:00',
    endedAt: '2026-03-07T08:30:00+09:00',
    distanceM: 2800,
    violationCount: 3,
  },
  {
    id: 'trip-5',
    startedAt: '2026-03-05T16:00:00+09:00',
    endedAt: '2026-03-05T16:20:00+09:00',
    distanceM: 1900,
    violationCount: 0,
  },
]

export const mockViolations: Record<string, Violation[]> = {
  'trip-1': [
    {
      id: 'v-1',
      tripId: 'trip-1',
      type: 'signal_ignore',
      detectedAt: '2026-03-10T08:12:00+09:00',
      lat: 35.6595,
      lng: 139.7005,
    },
    {
      id: 'v-2',
      tripId: 'trip-1',
      type: 'no_stop',
      detectedAt: '2026-03-10T08:18:00+09:00',
      lat: 35.6612,
      lng: 139.7035,
    },
  ],
  'trip-3': [
    {
      id: 'v-3',
      tripId: 'trip-3',
      type: 'no_stop',
      detectedAt: '2026-03-08T15:20:00+09:00',
      lat: 35.6580,
      lng: 139.6980,
    },
  ],
  'trip-4': [
    {
      id: 'v-4',
      tripId: 'trip-4',
      type: 'signal_ignore',
      detectedAt: '2026-03-07T08:15:00+09:00',
      lat: 35.6600,
      lng: 139.7020,
    },
    {
      id: 'v-5',
      tripId: 'trip-4',
      type: 'no_stop',
      detectedAt: '2026-03-07T08:20:00+09:00',
      lat: 35.6590,
      lng: 139.6990,
    },
    {
      id: 'v-6',
      tripId: 'trip-4',
      type: 'signal_ignore',
      detectedAt: '2026-03-07T08:25:00+09:00',
      lat: 35.6615,
      lng: 139.7040,
    },
  ],
}

// GPS route for trip-1 (around Shibuya)
export const mockGpsRoute: GpsPoint[] = [
  { lat: 35.6580, lng: 139.6970, speedKmh: 0, accuracyM: 5, recordedAt: '2026-03-10T08:00:00+09:00' },
  { lat: 35.6582, lng: 139.6975, speedKmh: 8.5, accuracyM: 4, recordedAt: '2026-03-10T08:01:00+09:00' },
  { lat: 35.6585, lng: 139.6982, speedKmh: 12.3, accuracyM: 3, recordedAt: '2026-03-10T08:03:00+09:00' },
  { lat: 35.6590, lng: 139.6990, speedKmh: 15.1, accuracyM: 4, recordedAt: '2026-03-10T08:05:00+09:00' },
  { lat: 35.6595, lng: 139.7005, speedKmh: 14.2, accuracyM: 3, recordedAt: '2026-03-10T08:08:00+09:00' },
  { lat: 35.6600, lng: 139.7015, speedKmh: 11.8, accuracyM: 5, recordedAt: '2026-03-10T08:12:00+09:00' },
  { lat: 35.6605, lng: 139.7025, speedKmh: 13.5, accuracyM: 4, recordedAt: '2026-03-10T08:15:00+09:00' },
  { lat: 35.6612, lng: 139.7035, speedKmh: 10.2, accuracyM: 3, recordedAt: '2026-03-10T08:18:00+09:00' },
  { lat: 35.6618, lng: 139.7045, speedKmh: 8.0, accuracyM: 5, recordedAt: '2026-03-10T08:22:00+09:00' },
  { lat: 35.6620, lng: 139.7050, speedKmh: 0, accuracyM: 4, recordedAt: '2026-03-10T08:25:00+09:00' },
]

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(ms / 60000)
  return `${minutes}分`
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${meters} m`
}

export function violationTypeLabel(type: 'signal_ignore' | 'no_stop'): string {
  return type === 'signal_ignore' ? '信号無視' : '一時不停止'
}
