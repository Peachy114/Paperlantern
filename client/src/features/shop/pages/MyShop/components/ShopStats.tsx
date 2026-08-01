import type { ReactNode } from "react";

export function ShopDashboardStat({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: number
}) {
    return (
        <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[9px] font-bold">{label}</span>
            </div>
            <p className="mt-2 text-lg font-black leading-none text-foreground">
                {value.toLocaleString()}
            </p>
        </div>
    )
}

export function ShopMiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-xl font-black">{value.toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</p>
        </div>
    )
}