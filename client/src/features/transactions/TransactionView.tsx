import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router-dom'
import WandererTransaction from './WandererTransaction'
import StorytellerTransaction from './StorytellerTransaction'

export default function TransactionView() {
    const { user } = useAuthStore()

    if (user?.role === 'storyteller') return <StorytellerTransaction />
    if (user?.role === 'wanderer') return <WandererTransaction />
    return <Navigate to="/" replace />
}
