import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Shield, Square } from 'lucide-react'

export function RidingPage() {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [violations, setViolations] = useState(0)
  const [gpsAccuracy, setGpsAccuracy] = useState(5)
  const [showAlert, setShowAlert] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const alertTypes = useRef<string[]>([])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
      setSpeed(Math.round((8 + Math.random() * 12) * 10) / 10)
      setGpsAccuracy(Math.round((3 + Math.random() * 7) * 10) / 10)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Simulate violations at 8s and 20s
  useEffect(() => {
    if (elapsed === 8) {
      setViolations((prev) => prev + 1)
      alertTypes.current.push('signal_ignore')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }
    if (elapsed === 20) {
      setViolations((prev) => prev + 1)
      alertTypes.current.push('no_stop')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }
  }, [elapsed])

  const handleEnd = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    navigate('/result/trip-1')
  }, [navigate])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Camera placeholder */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="text-center text-gray-600">
          <Camera size={64} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm opacity-50">カメラプレビュー</p>
        </div>

        {/* Recording indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-mono">REC</span>
        </div>

        {/* Timer */}
        <div className="absolute top-4 right-4 bg-black/50 rounded-full px-3 py-1.5">
          <span className="text-white text-sm font-mono">{formatTime(elapsed)}</span>
        </div>

        {/* Wake Lock indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/80 rounded-full px-3 py-1">
          <span className="text-white text-[10px] font-bold">画面ON維持中</span>
        </div>
      </div>

      {/* Violation alert overlay */}
      {showAlert && (
        <div className="absolute inset-x-0 top-1/3 flex justify-center z-10 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
            <Shield size={20} />
            <span className="font-bold">違反を検知しました</span>
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="bg-black/70 backdrop-blur-sm px-4 pt-4 pb-6 safe-area-bottom">
        {/* Stats row */}
        <div className="flex justify-around mb-4">
          <div className="text-center">
            <p className="text-gray-400 text-xs">速度</p>
            <p className="text-white text-2xl font-bold font-mono">{speed.toFixed(1)}</p>
            <p className="text-gray-400 text-xs">km/h</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">GPS精度</p>
            <div className="flex items-center justify-center gap-1">
              <MapPin size={14} className={gpsAccuracy < 10 ? 'text-green-400' : 'text-yellow-400'} />
              <p className="text-white text-2xl font-bold font-mono">{gpsAccuracy.toFixed(0)}</p>
            </div>
            <p className="text-gray-400 text-xs">m</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">違反</p>
            <p className={`text-2xl font-bold font-mono ${violations > 0 ? 'text-red-400' : 'text-white'}`}>
              {violations}
            </p>
            <p className="text-gray-400 text-xs">件</p>
          </div>
        </div>

        {/* End ride button */}
        <button
          onClick={handleEnd}
          className="w-full bg-danger active:bg-danger-dark text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <Square size={20} fill="currentColor" />
          走行終了
        </button>
      </div>
    </div>
  )
}
