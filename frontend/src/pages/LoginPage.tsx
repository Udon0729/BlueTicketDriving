import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-primary to-blue-800 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bike size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">青切符ドライブ</h1>
        <p className="text-blue-200 text-sm mt-1">安全な自転車走行をサポート</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-blue-200 border border-white/20 focus:outline-none focus:border-white/50 text-base"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-blue-200 border border-white/20 focus:outline-none focus:border-white/50 text-base"
        />
        <button
          type="submit"
          className="w-full py-3 bg-white text-primary font-bold rounded-xl active:bg-gray-100 transition text-base"
        >
          ログイン
        </button>
        <p className="text-center text-blue-200 text-sm">
          アカウントをお持ちでない方は{' '}
          <button type="button" className="text-white underline" onClick={() => navigate('/')}>
            新規登録
          </button>
        </p>
      </form>
    </div>
  )
}
