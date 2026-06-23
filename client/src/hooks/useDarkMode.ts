import { useEffect, useState } from 'react'
import { useAuthStore, type User } from '@/store/authStore'
import { authApi } from '@/api/auth'

export function useDarkMode() {
    const { user, token, setUser } = useAuthStore()

    const [dark, setDark] = useState(() => {
        if (user?.dark_mode !== undefined) return user.dark_mode
        if ('darkMode' in localStorage) return localStorage.getItem('darkMode') === 'true'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    // Apply dark class to <html>
    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('darkMode', 'true')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('darkMode', 'false')
        }
    }, [dark])

    // Sync when user object loads (after login or refresh)
    useEffect(() => {
        if (user?.dark_mode !== undefined) {
            setDark(user.dark_mode)
        }
    }, [user?.dark_mode])

    const toggle = async () => {
        const next = !dark
        setDark(next)

        if (token) {
            try {
                await authApi.updatePreferences(next)
                setUser({ ...user, dark_mode: next } as User)
            } catch {
                // silently fail, localStorage still saves it
            }
        }
    }

    return { dark, toggle }
}
