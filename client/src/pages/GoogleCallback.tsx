import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function GoogleCallback() {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const user = params.get('user')
        const error = params.get('error')

        if (error || !token || !user) {
            navigate('/?error=google_failed')
            return
        }

        setAuth(JSON.parse(decodeURIComponent(user)), token)
        navigate('/')
    }, [])

    return (
        <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
            Signing you in...
        </div>
    )
}
