import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LOCK_OPTIONS = [
    {
        value: 'free',
        label: 'Free',
        emoji: '🔓',
        desc: 'Everyone can read immediately',
    },
    {
        value: 'early_access',
        label: 'Early Access',
        emoji: '⏳',
        desc: 'Locked for 7 days with credits, then free for all',
    },
    {
        value: 'premium',
        label: 'Premium',
        emoji: '💎',
        desc: 'Always locked — readers need credits to unlock',
    },
] as const

type LockType = 'free' | 'early_access' | 'premium'

interface ChapterEditAccessProps {
    lockType: LockType
    creditsRequired: number
    onLockTypeChange: (value: LockType) => void // ✅ typed as LockType, not string
    onCreditsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChapterEditAccess({
    lockType,
    creditsRequired,
    onLockTypeChange,
    onCreditsChange,
}: ChapterEditAccessProps) {
    const needsCredits = lockType === 'early_access' || lockType === 'premium'

    return (
        <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Access type</Label>

            <div className="flex flex-col gap-2">
                {LOCK_OPTIONS.map((option) => {
                    const active = lockType === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onLockTypeChange(option.value)}
                            className={cn(
                                'flex items-center gap-3 w-full rounded-lg border px-4 py-3 text-left transition-all',
                                active
                                    ? 'border-foreground bg-muted/40'
                                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/20'
                            )}
                        >
                            <span className="text-base leading-none">{option.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground leading-none mb-0.5">
                                    {option.label}
                                </p>
                                <p className="text-xs text-muted-foreground">{option.desc}</p>
                            </div>
                            {active && (
                                <Badge variant="secondary" className="shrink-0 text-[10px] h-5">
                                    Selected
                                </Badge>
                            )}
                        </button>
                    )
                })}
            </div>

            {needsCredits && (
                <div className="flex items-center gap-3 pt-1 pl-1">
                    <Label htmlFor="credits" className="text-sm text-muted-foreground shrink-0">
                        Credits to unlock
                    </Label>
                    <Input
                        id="credits"
                        type="number"
                        name="credits_required"
                        value={creditsRequired}
                        onChange={onCreditsChange}
                        min={3}
                        max={20}
                        className="w-20 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">min 3 · max 20</span>
                </div>
            )}
        </div>
    )
}
