import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/axios'

export function useBecomeCreator() {
    const { user, setAuth } = useAuthStore()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const becomeCreator = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post('/auth/become-creator')
            // update user role in store, keep same token
            setAuth(res.data.user, useAuthStore.getState().token!)
            navigate('/studio')
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    const alreadyCreator = user?.role === 'storyteller'

    return { becomeCreator, loading, error, alreadyCreator }
}
