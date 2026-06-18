import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginForm() {
  const { handleLogin, error, loading } = useAuth()
  const [data, setData] = useState({ login: '', password: '' })

  const inputClass = "w-full px-3 py-2.5 border-2 border-[#1a1a1a] bg-white dark:bg-[#fffdf5] text-[13px] font-semibold text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none transition-all duration-100 focus:border-pink-400 focus:shadow-[3px_3px_0_#ec4899]"
  const labelClass = "flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-[#6b7280] mb-1.5"
  const dot = <span className="w-[5px] h-[5px] rounded-full bg-pink-400 shrink-0" />

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          className="px-3 py-2 border-2 border-red-500 bg-red-50 text-[13px] tracking-[0.08em] text-red-500"
          style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: '2px 2px 0 #ef4444' }}
        >
          ⚠ {error}
        </div>
      )}

      <div className="flex flex-col">
        <label className={labelClass} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {dot} EMAIL OR USERNAME
        </label>
        <input
          placeholder="you@example.com"
          value={data.login}
          onChange={(e) => setData({ ...data, login: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col">
        <label className={labelClass} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {dot} PASSWORD
        </label>
        <input
          type="password"
          placeholder="••••••••"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          className={inputClass}
        />
      </div>

      <button
        onClick={() => handleLogin(data)}
        disabled={loading}
        className="w-full py-3 mt-1 bg-amber-400 border-[2.5px] border-[#1a1a1a] text-[#1a1a1a] tracking-[0.12em] cursor-pointer disabled:opacity-50 transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px]"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '16px',
          boxShadow: loading ? 'none' : '3px 3px 0 #1a1a1a',
        }}
      >
        {loading ? 'LOGGING IN…' : '▶ LOGIN'}
      </button>
    </div>
  )
}