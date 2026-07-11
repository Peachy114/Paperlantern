// components/CreditView.tsx
// All logic lives here — fetching, state, handlers
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCreditPackages, useWallet, initiateCheckout } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import type { CreditPackage } from '@/types/wallet'
import CreditPackageCard from './CreditPackage'
import BoostModal from '@/features/boosts/components/BoostModal'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

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
    const [profileBoostOpen, setProfileBoostOpen] = useState(false)
    const [handledPaymentNotice, setHandledPaymentNotice] = useState('')

    useEffect(() => {
        if (!user) navigate('/', { replace: true })
    }, [user, navigate])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const legacySuccess = params.get('success') === '1'
        const paymentStatus = params.get('payment_status')
        const noticeKey = location.search

        if (!noticeKey || handledPaymentNotice === noticeKey) return

        if (legacySuccess || paymentStatus === 'success') {
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
            setJustPurchased(true)
            toast.success('Payment successful. Checking your wallet balance.')
        } else if (paymentStatus === 'failed') {
            setError('Payment failed or was cancelled. No credits were added.')
            toast.error('Payment failed or was cancelled.')
        } else if (paymentStatus === 'expired') {
            setError('Payment expired. No credits were added.')
            toast.warning('Payment expired.')
        }

        if (legacySuccess || paymentStatus) {
            setHandledPaymentNotice(noticeKey)
            navigate('/credits', { replace: true })
        }
    }, [handledPaymentNotice, location.search, navigate, queryClient])

    async function handlePurchase(pkg: CreditPackage) {
        setPurchasing(pkg.id)
        setError(null)
        try {
            const result = await initiateCheckout(pkg.id)
            navigate(result.payment_url || '/credits')
        } catch {
            const message = 'Could not start payment. Please try again.'
            setError(message)
            toast.error(message)
            setPurchasing(null)
        }
    }

    if (!user) return null

    return (
        <>
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

            {user.role === 'storyteller' && (
                <section className="max-w-lg mx-auto px-4 pb-10">
                    <div className="rounded-xl border bg-background p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Feature / Boost
                                </p>
                                <h2 className="mt-1 text-lg font-semibold">Boost Artist Profile</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Feature your artist profile in Featured Artists for the number
                                    of days you choose.
                                </p>
                            </div>
                            <Button onClick={() => setProfileBoostOpen(true)}>
                                <Sparkles className="h-4 w-4" />
                                Boost
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            <BoostModal
                open={profileBoostOpen}
                onOpenChange={setProfileBoostOpen}
                kind="artist_profile"
                targetType="artist_profile"
                title="Artist Profile"
                placement="Featured Artists"
            />
        </>
    )
}
