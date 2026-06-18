import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { authApi } from '@/api/auth'
import { useQueryClient } from '@tanstack/react-query'

export function useAuth() {
  const { setAuth, clearAuth } = useAuthStore()
  const { close } = useModalStore()
  const queryClient = useQueryClient()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (data: { login: string; password: string }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(data)
      setAuth(res.data.user, res.data.token)
      close()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: {
    name: string
    username: string
    email: string
    password: string
    password_confirmation: string
    role: 'wanderer' | 'storyteller'
  }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register(data)
      setAuth(res.data.user, res.data.token)
      close()
    } catch (err: any) {
      const errors = err.response?.data?.errors
      if (errors) {
        const first = Object.values(errors)[0] as string[]
        setError(first[0])
      } else {
        setError(err.response?.data?.message ?? 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      queryClient.clear()
    }
  }

  return { handleLogin, handleRegister, handleLogout, error, loading }
}