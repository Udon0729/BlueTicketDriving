import { useNavigate } from 'react-router-dom'
import { Bike, ChevronRight } from 'lucide-react'
import { mockTrips, formatDate, formatDuration, formatDistance } from '../lib/mockData'

export function HomePage() {
  const navigate = useNavigate()
  const recentTrips = mockTrips.slice(0, 3)
  const monthlyRides = mockTrips.length
  const monthlyViolations = mockTrips.reduce((sum, t) => sum + t.violationCount, 0)

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-gray-900">こんにちは</h1>
      <p className="text-sm text-gray-500 mb-6">安全な走行を心がけましょう</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">今月の走行</p>
          <p className="text-2xl font-bold text-gray-900">
            {monthlyRides}
            <span className="text-sm font-normal text-gray-500"> 回</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">今月の違反</p>
          <p className={`text-2xl font-bold ${monthlyViolations > 0 ? 'text-danger' : 'text-success'}`}>
            {monthlyViolations}
            <span className="text-sm font-normal text-gray-500"> 件</span>
          </p>
        </div>
      </div>

      {/* Start Ride Button */}
      <button
        onClick={() => navigate('/riding')}
        className="w-full bg-primary active:bg-primary-dark text-white rounded-2xl p-6 flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition mb-6"
      >
        <Bike size={28} />
        <span className="text-xl font-bold">走行開始</span>
      </button>

      {/* Recent Rides */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">最近の走行</h2>
        <div className="space-y-2">
          {recentTrips.map((trip) => (
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
                  <span className="bg-red-100 text-danger text-xs font-bold px-2 py-1 rounded-full">
                    違反 {trip.violationCount}
                  </span>
                ) : (
                  <span className="bg-green-100 text-success text-xs font-bold px-2 py-1 rounded-full">
                    安全
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
