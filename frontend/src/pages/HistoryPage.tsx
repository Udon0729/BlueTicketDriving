import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { mockTrips, formatDate, formatDuration, formatDistance } from '../lib/mockData'

export function HistoryPage() {
  const navigate = useNavigate()

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-1">走行履歴</h1>
      <p className="text-sm text-gray-500 mb-6">過去の走行記録を確認できます</p>

      <div className="space-y-2">
        {mockTrips.map((trip) => (
          <button
            key={trip.id}
            onClick={() => navigate(`/result/${trip.id}`)}
            className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50 transition text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{formatDate(trip.startedAt)}</p>
              <p className="text-xs text-gray-500">
                {formatDuration(trip.startedAt, trip.endedAt)} / {formatDistance(trip.distanceM)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {trip.violationCount > 0 ? (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  違反 {trip.violationCount}
                </span>
              ) : (
                <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                  安全
                </span>
              )}
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
