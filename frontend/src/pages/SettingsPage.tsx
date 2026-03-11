import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Bell, LogOut } from 'lucide-react'

export function SettingsPage() {
  const navigate = useNavigate()
  const [parentEmail, setParentEmail] = useState('parent@example.com')
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-6">設定</h1>

      {/* Profile */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <User size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">テストユーザー</p>
            <p className="text-xs text-gray-500">test@example.com</p>
          </div>
        </div>
      </div>

      {/* Parent Email */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-2">
          <Mail size={16} />
          保護者メールアドレス
        </h2>
        <p className="text-xs text-gray-400 mb-3">走行結果を保護者にメールで通知します</p>
        <input
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-primary text-base"
        />
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">通知を有効にする</span>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              notifications ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${
                notifications ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full bg-primary active:bg-primary-dark text-white font-bold py-3 rounded-xl transition mb-4"
      >
        {saved ? '保存しました' : '保存する'}
      </button>

      {/* Logout */}
      <button
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center gap-2 text-gray-400 text-sm py-3"
      >
        <LogOut size={16} />
        ログアウト
      </button>
    </div>
  )
}
