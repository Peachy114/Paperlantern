// features/profile/components/CreditsBalanceRow.tsx
import Link from 'next/link'

export default function CreditsBalanceRow({ credits }: { credits: number }) {
    return (
        <Link
            href="/credits"
            className="flex items-center justify-between border-2 border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1e1b14] px-3.5 py-2.5 mb-3 hover:translate-y-[-1px] transition-transform"
            style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
        >
            <div className="flex items-center gap-2">
                <span
                    className="w-5 h-5 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center text-[10px]"
                    style={{ background: '#f77c9b' }}
                >
                    ◆
                </span>
                <span className="text-[13px] font-semibold text-foreground dark:text-[#e8dfc8]">
                    {credits.toLocaleString()} credits
                </span>
            </div>
            <span className="text-foreground/40">›</span>
        </Link>
    )
}
