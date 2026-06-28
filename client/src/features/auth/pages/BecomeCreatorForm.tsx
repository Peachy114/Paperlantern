import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBecomeCreator } from '@/features/auth/hooks/useBecomeCreator'
import { useAuthStore } from '@/store/authStore'
import BecomeCreatorView from '../components/become-storyteller/BecomeCreatorView'

export default function BecomeCreator() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const [agreed, setAgreed] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const { becomeCreator, loading, alreadyCreator } = useBecomeCreator()

    useEffect(() => {
        if (!user) navigate('/', { replace: true })
    }, [user, navigate])

    if (!user) return null

    const handleSubmit = () => {
        if (!agreed) {
            setShowWarning(true)
            setTimeout(() => setShowWarning(false), 2500)
            return
        }
        becomeCreator()
    }

    return (
        <BecomeCreatorView
            agreed={agreed}
            loading={loading}
            alreadyCreator={alreadyCreator}
            showWarning={showWarning}
            onToggle={() => setAgreed((a) => !a)}
            onSubmit={handleSubmit}
            onBack={() => navigate(-1)}
        />
    )
}
