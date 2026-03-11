import { Outlet, NavLink } from 'react-router-dom'
import { Home, Clock, Settings } from 'lucide-react'

export function Layout() {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
        <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`
            }
          >
            <Home size={22} />
            <span>ホーム</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`
            }
          >
            <Clock size={22} />
            <span>履歴</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`
            }
          >
            <Settings size={22} />
            <span>設定</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
