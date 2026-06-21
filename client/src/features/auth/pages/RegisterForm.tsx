import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M1 8C1 8 3.2 3 8 3C12.8 3 15 8 15 8C15 8 12.8 13 8 13C3.2 13 1 8 1 8Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M1 8C1 8 3.2 3 8 3C12.8 3 15 8 15 8C15 8 12.8 13 8 13C3.2 13 1 8 1 8Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    )
}

export default function RegisterForm() {
    const { handleRegister, error, loading } = useAuth()
    const [data, setData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'wanderer' as 'wanderer' | 'storyteller',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const inputClass =
        'w-full px-3 py-2.5 border-2 border-[#1a1a1a] bg-white dark:bg-[#fffdf5] text-[13px] font-semibold text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none transition-all duration-100 focus:border-pink-400 focus:shadow-[3px_3px_0_#ec4899]'
    const labelClass =
        'flex items-center gap-1.5 text-[11px] tracking-[0.18em] text-[#6b7280] mb-1.5'
    const dot = <span className="w-[5px] h-[5px] rounded-full bg-pink-400 shrink-0" />

    const eyeButtonClass =
        'absolute right-0 top-0 h-full w-9 flex items-center justify-center text-[#9ca3af] hover:text-[#1a1a1a] transition-colors cursor-pointer'

    return (
        <div className="flex flex-col gap-3">
            {error && (
                <div
                    className="px-3 py-2 border-2 border-red-500 bg-red-50 text-[13px] tracking-[0.08em] text-red-500"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        boxShadow: '2px 2px 0 #ef4444',
                    }}
                >
                    ⚠ {error}
                </div>
            )}

            <div className="flex flex-col">
                <label className={labelClass} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {dot} FULL NAME
                </label>
                <input
                    placeholder="Your name"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    className={inputClass}
                />
            </div>

            <div className="flex flex-col">
                <label className={labelClass} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {dot} USERNAME
                </label>
                <input
                    placeholder="@username"
                    value={data.username}
                    onChange={(e) => setData({ ...data, username: e.target.value })}
                    className={inputClass}
                />
            </div>

            <div className="flex flex-col">
                <label className={labelClass} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {dot} EMAIL
                </label>
                <input
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                    <label
                        className={labelClass}
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        {dot} PASSWORD
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                            className={`${inputClass} pr-9`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className={eyeButtonClass}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col">
                    <label
                        className={labelClass}
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        {dot} CONFIRM
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData({ ...data, password_confirmation: e.target.value })
                            }
                            className={`${inputClass} pr-9`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className={eyeButtonClass}
                            tabIndex={-1}
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => handleRegister(data)}
                disabled={loading}
                className="w-full py-3 mt-1 bg-amber-400 border-[2.5px] border-[#1a1a1a] text-[#1a1a1a] tracking-[0.12em] cursor-pointer disabled:opacity-50 transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px]"
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '16px',
                    boxShadow: loading ? 'none' : '3px 3px 0 #1a1a1a',
                }}
            >
                {loading ? 'CREATING ACCOUNT…' : '▶ CREATE ACCOUNT'}
            </button>
        </div>
    )
}
