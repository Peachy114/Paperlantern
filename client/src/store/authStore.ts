import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    name: string
    username: string
    email: string
    role: 'super_admin' | 'storyteller' | 'wanderer'
    is_banned: boolean
    dark_mode?: boolean
    avatar?: string | null
    bio?: string | null
}

interface AuthState {
    user: User | null
    token: string | null
    setAuth: (user: User, token: string) => void
    clearAuth: () => void
    setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => set({ user, token }),
            clearAuth: () => set({ user: null, token: null }),
            setUser: (user) => set({ user }),
        }),
        { name: 'auth-storage' }
    )
)
