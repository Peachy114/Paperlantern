// features/profile/components/MembershipPromoBanner.tsx
import Link from 'next/link'

export default function MembershipPromoBanner() {
    return (
        <Link
            href="/credits"
            className="block border-2 border-[#1a1a1a] bg-[#fff8e7] dark:bg-[#2a2518] px-3.5 py-3 mb-3 hover:translate-y-[-1px] transition-transform"
            style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] tracking-[0.1em] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                    ◆ Membership · Join now to unlock perks
                </span>
                <span className="text-foreground/40">›</span>
            </div>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-foreground/60 dark:text-[#e8dfc8]/60">
                        Up to
                    </span>
                    <span className="text-[18px] font-bold text-amber-600 dark:text-amber-400">
                        5,000
                    </span>
                    <span className="text-[11px] text-foreground/60 dark:text-[#e8dfc8]/60">
                        bonus credits
                    </span>
                </div>
                <div className="h-7 w-[1.5px] bg-foreground/15" />
                <div className="text-[11px] text-foreground/60 dark:text-[#e8dfc8]/60 leading-tight">
                    Unlimited library, no limit
                </div>
            </div>
        </Link>
    )
}
