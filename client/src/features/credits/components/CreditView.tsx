// components/CreditView.tsx
// All logic lives here — fetching, state, handlers
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCreditPackages, useWallet, initiateCheckout } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import type { CreditPackage } from '@/types/wallet'
import CreditPackageCard from './CreditPackage'

export interface PackageCardProps {
    pkg: CreditPackage
    index: number
    total: number
    purchasing: string | null
    onPurchase: (pkg: CreditPackage) => void
}

export default function CreditView() {
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()
    const user = useAuthStore((s) => s.user)
    const { wallet, loading: walletLoading } = useWallet()
    const { packages, loading: pkgsLoading } = useCreditPackages()
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [justPurchased, setJustPurchased] = useState(false)

    useEffect(() => {
        if (!user) navigate('/', { replace: true })
    }, [user, navigate])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        if (params.get('success') === '1') {
            queryClient.refetchQueries({ queryKey: ['wallet'] })
            setJustPurchased(true)
        }
    }, [location.search, queryClient])

    async function handlePurchase(pkg: CreditPackage) {
        setPurchasing(pkg.id)
        setError(null)
        try {
            const { checkout_url } = await initiateCheckout(pkg.id)
            window.location.href = checkout_url
        } catch {
            setError('Could not open checkout. Please try again.')
            setPurchasing(null)
        }
    }

    if (!user) return null

    return (
        <CreditPackageCard
            wallet={wallet}
            walletLoading={walletLoading}
            packages={packages}
            pkgsLoading={pkgsLoading}
            purchasing={purchasing}
            error={error}
            justPurchased={justPurchased}
            onPurchase={handlePurchase}
            onDismissSuccess={() => setJustPurchased(false)}
            onDismissError={() => setError(null)}
        />
    )
}
