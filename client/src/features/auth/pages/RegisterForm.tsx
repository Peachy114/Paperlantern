import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path
                d="M1 8C1 8 3.2 3 8 3C12.8 3 15 8 15 8C15 8 12.8 13 8 13C3.2 13 1 8 1 8Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
    ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
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

    return (
        <div className="flex flex-col gap-4">
            {error && <p className="text-xs text-destructive">{error}</p>}

            {/* Identity group */}
            <div className="border border-border rounded-md divide-y divide-border">
                <div className="flex flex-col px-3 pt-2.5 pb-2">
                    <label
                        htmlFor="name"
                        className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-1"
                    >
                        Full Name
                    </label>
                    <input
                        id="name"
                        placeholder="Your name"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        className="text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                    />
                </div>
                <div className="flex flex-col px-3 pt-2.5 pb-2">
                    <label
                        htmlFor="username"
                        className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-1"
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        placeholder="@username"
                        value={data.username}
                        onChange={(e) => setData({ ...data, username: e.target.value })}
                        className="text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                    />
                </div>
                <div className="flex flex-col px-3 pt-2.5 pb-2">
                    <label
                        htmlFor="email"
                        className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-1"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        className="text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                    />
                </div>
            </div>

            {/* Password group */}
            <div className="border border-border rounded-md divide-y divide-border">
                <div className="flex flex-col px-3 pt-2.5 pb-2">
                    <label
                        htmlFor="password"
                        className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-1"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                            className="w-full pr-8 text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide' : 'Show'}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col px-3 pt-2.5 pb-2">
                    <label
                        htmlFor="confirm"
                        className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-1"
                    >
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirm"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData({ ...data, password_confirmation: e.target.value })
                            }
                            className="w-full pr-8 text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                            aria-label={showConfirm ? 'Hide' : 'Show'}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => handleRegister(data)}
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium bg-foreground text-background rounded-md hover:opacity-80 disabled:opacity-40 transition-opacity cursor-pointer"
            >
                {loading ? 'Creating account…' : 'Create account'}
            </button>
        </div>
    )
}
