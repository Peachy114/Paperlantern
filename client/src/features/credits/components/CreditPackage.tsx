// components/CreditPackage.tsx
// Pure UI — no data fetching, no routing
import { Coins, Gem, Zap, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CreditPackage } from '@/types/wallet'

// ─── Tier config ────────────────────────────────────────────────────────────

type TierKey = 'starter' | 'popular' | 'best'

interface Tier {
    key: TierKey
    label: string
    icon: React.ReactNode
    accentClass: string // Tailwind text color for accent
    accentHex: string // For the left border stripe
    badgeVariant: 'outline' | 'secondary' | 'default'
}

function getTier(index: number, total: number): Tier {
    const isPopular = total >= 3 && index === Math.floor(total / 2)
    const isBest = index === total - 1

    if (isBest)
        return {
            key: 'best',
            label: 'Best Value',
            icon: <Gem className="w-4 h-4" />,
            accentClass: 'text-amber-500',
            accentHex: '#F59E0B',
            badgeVariant: 'default',
        }

    if (isPopular)
        return {
            key: 'popular',
            label: 'Popular',
            icon: <Zap className="w-4 h-4" />,
            accentClass: 'text-rose-500',
            accentHex: '#F43F5E',
            badgeVariant: 'secondary',
        }

    return {
        key: 'starter',
        label: 'Starter',
        icon: <Coins className="w-4 h-4" />,
        accentClass: 'text-zinc-400',
        accentHex: '#A1A1AA',
        badgeVariant: 'outline',
    }
}

// ─── Package row ─────────────────────────────────────────────────────────────

interface PackageRowProps {
    pkg: CreditPackage
    index: number
    total: number
    purchasing: string | null
    onPurchase: (pkg: CreditPackage) => void
}

function PackageRow({ pkg, index, total, purchasing, onPurchase }: PackageRowProps) {
    const tier = getTier(index, total)
    const isLoading = purchasing === pkg.id
    const isDisabled = purchasing !== null

    return (
        <div className="relative flex items-center gap-4 px-5 py-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm group">
            {/* Left accent stripe */}
            <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-70"
                style={{ background: tier.accentHex }}
            />

            {/* Icon */}
            <div className={`shrink-0 ${tier.accentClass} opacity-80`}>{tier.icon}</div>

            {/* Credits + tier */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {pkg.credits.toLocaleString()} credits
                    </span>
                    <Badge
                        variant={tier.badgeVariant}
                        className="text-[10px] h-4 px-1.5 tracking-wide uppercase"
                    >
                        {tier.label}
                    </Badge>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    ₱{(Number(pkg.price) / pkg.credits).toFixed(2)} per credit
                </p>
            </div>

            {/* Price */}
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                ₱{Number(pkg.price).toFixed(2)}
            </div>

            {/* Buy button */}
            <Button
                size="sm"
                variant={tier.key === 'best' ? 'default' : 'outline'}
                className="shrink-0 h-8 px-4 text-xs tracking-wide"
                onClick={() => onPurchase(pkg)}
                disabled={isDisabled}
            >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
            </Button>
        </div>
    )
}

// ─── Root props ──────────────────────────────────────────────────────────────

interface CreditPackageProps {
    wallet: { balance: number } | null
    walletLoading: boolean
    packages: CreditPackage[]
    pkgsLoading: boolean
    purchasing: string | null
    error: string | null
    justPurchased: boolean
    onPurchase: (pkg: CreditPackage) => void
    onDismissSuccess: () => void
    onDismissError: () => void
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function CreditPackage({
    wallet,
    walletLoading,
    packages,
    pkgsLoading,
    purchasing,
    error,
    justPurchased,
    onPurchase,
    onDismissSuccess,
    onDismissError,
}: CreditPackageProps) {
    const isLoading = walletLoading || pkgsLoading

    return (
        <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                    Wallet
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Top up credits
                </h1>
            </div>

            {/* Balance pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {walletLoading ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400">Loading…</span>
                ) : (
                    <>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                            {(wallet?.balance ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-amber-500/70 dark:text-amber-500/60">
                            credits available
                        </span>
                    </>
                )}
            </div>

            {/* Alerts */}
            {justPurchased && (
                <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <AlertDescription className="flex items-center justify-between">
                        <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                            Payment successful — credits added.
                        </span>
                        <button
                            onClick={onDismissSuccess}
                            className="text-emerald-400 hover:text-emerald-600 ml-3"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span className="text-sm">{error}</span>
                        <button
                            onClick={onDismissError}
                            className="ml-3 opacity-60 hover:opacity-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            <Separator />

            {/* Package list */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-300 dark:text-zinc-600" />
                </div>
            ) : packages.length === 0 ? (
                <p className="text-center py-12 text-sm text-zinc-400 dark:text-zinc-500">
                    No packages available right now.
                </p>
            ) : (
                <div className="space-y-2.5">
                    {packages.map((pkg, i) => (
                        <PackageRow
                            key={pkg.id}
                            pkg={pkg}
                            index={i}
                            total={packages.length}
                            purchasing={purchasing}
                            onPurchase={onPurchase}
                        />
                    ))}
                </div>
            )}

            {/* Footer note */}
            {!isLoading && packages.length > 0 && (
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 pt-2">
                    Payments are processed securely. Credits are non-refundable.
                </p>
            )}
        </div>
    )
}
