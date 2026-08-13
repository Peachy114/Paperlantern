import { useState, type ReactNode } from 'react'
import {
    BriefcaseBusiness,
    Eye,
    Heart,
    MessageSquareText,
    Star,
    Trash2,
    Users,
} from 'lucide-react'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import ThemedLogo from '@/components/layout/ThemedLogo'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { CommissionProfile } from '@/types/art'
import type {
    CommissionOrder,
    CommissionService,
    CommissionWidgetsData,
    ConfirmAction,
} from '@/features/commissions/types/studioCommission'
import {
    buildCommissionChartPoints,
    createSmoothChartPath,
    formatCompactMetric,
    type CommissionChartPoint,
} from '@/features/commissions/utils/commissionAnalytics'
import { storageUrl } from '@/utils/storage'

// Commission dashboard ----
export function ConfirmActionDialog({
    action,
    busy,
    onOpenChange,
}: {
    action: ConfirmAction | null
    busy: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{action?.title}</DialogTitle>
                    <DialogDescription>{action?.description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant={action?.destructive ? 'destructive' : 'default'}
                        disabled={busy}
                        onClick={() => {
                            action?.onConfirm()
                            onOpenChange(false)
                        }}
                    >
                        {busy ? 'Working...' : action?.confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function CommissionDashboardHero({
    profile,
    services,
    orders,
    widgets,
    statusBusy,
    onToggleStatus,
}: {
    profile: CommissionProfile
    services: CommissionService[]
    orders: CommissionOrder[]
    widgets?: CommissionWidgetsData
    statusBusy: boolean
    onToggleStatus: () => void
}) {
    const activeServices = services.filter(
        (service) => service.status === 'open' && service.is_published
    ).length
    const totalOrders = widgets?.total_orders ?? orders.length
    const completedOrders =
        widgets?.completed_orders ?? orders.filter((order) => order.status === 'completed').length
    const activeOrders =
        widgets?.active_orders ??
        orders.filter((order) =>
            ['awaiting_payment', 'in_progress', 'delivered'].includes(order.status)
        ).length
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled').length
    const chartPoints = buildCommissionChartPoints(orders)
    const featuredService = services.find((service) => service.image_path) ?? services[0] ?? null
    const featuredImage = featuredService?.image_path ?? null
    const fallbackBannerImage = storageUrl(featuredImage)
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)
    const activeBannerImage = workspaceBannerImage ?? fallbackBannerImage
    const averageRating = profile.ratings_count ? profile.average_rating.toFixed(1) : 'New'

    return (
        <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
                <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="relative min-h-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="absolute right-3 top-3 z-20">
                                <WorkspaceBannerPicker
                                    audience="studio"
                                    storageKey="workspace-banner-my-commission"
                                    pageTarget="my_commission"
                                    fallbackImage={fallbackBannerImage}
                                    onImageChange={setWorkspaceBannerImage}
                                />
                            </div>
                            {activeBannerImage ? (
                                <img
                                    src={activeBannerImage}
                                    alt={featuredService?.title ?? 'Featured commission service'}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 text-center">
                                    <ThemedLogo width={96} height={96} className="object-contain" />
                                    <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                        Events
                                    </p>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3 pt-12 text-white">
                                <p className="line-clamp-1 text-sm font-bold">
                                    {featuredService?.title ?? 'Open for commissions'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-white/80">
                                    {activeServices} active service
                                    {activeServices === 1 ? '' : 's'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={statusBusy || profile.application_status !== 'approved'}
                            onClick={onToggleStatus}
                            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-left shadow-sm transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                        Commission status
                                    </p>
                                    <p className="mt-1 text-sm font-bold capitalize">
                                        {profile.commission_status ?? 'closed'}
                                    </p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        Click to {profile.commission_status === 'open' ? 'close' : 'open'}
                                    </p>
                                </div>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        profile.commission_status === 'open'
                                            ? 'bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]'
                                            : 'bg-slate-300 shadow-[0_0_0_5px_rgba(148,163,184,0.12)]'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                                    Activity
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Last seven days · total and cancelled orders
                                </p>
                            </div>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                {totalOrders} total · {cancelledOrders} cancelled
                            </span>
                        </div>

                        <MiniAreaChart points={chartPoints} />

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                            <DashboardStat
                                icon={<BriefcaseBusiness className="h-4 w-4" />}
                                label="Services"
                                value={services.length}
                            />
                            <DashboardStat
                                icon={<Eye className="h-4 w-4" />}
                                label="Orders"
                                value={totalOrders}
                            />
                            <DashboardStat
                                icon={<Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                                label="Active"
                                value={activeOrders}
                            />
                            <DashboardStat
                                icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                                label="Rate"
                                value={averageRating}
                            />
                            <DashboardStat
                                icon={<MessageSquareText className="h-4 w-4 text-orange-500" />}
                                label="Completed"
                                value={completedOrders}
                            />
                            <DashboardStat
                                icon={<Trash2 className="h-4 w-4 text-rose-500" />}
                                label="Cancelled"
                                value={cancelledOrders}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <section className="rounded-[24px] border border-border bg-muted/35 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Customers & orders
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                        <MiniMetric label="Total orders" value={totalOrders} />
                        <MiniMetric label="Average rating" value={averageRating} />
                        <MiniMetric label="Completed orders" value={completedOrders} />
                        <MiniMetric label="Active orders" value={activeOrders} />
                        <MiniMetric label="Cancelled orders" value={cancelledOrders} />
                    </div>
                </section>

                <section className="relative min-h-44 overflow-hidden rounded-[24px] border border-border bg-gradient-to-r from-rose-100 via-orange-50 to-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:from-rose-500/15 dark:via-orange-500/10 dark:to-sky-500/15">
                    {activeBannerImage ? (
                        <img
                            src={activeBannerImage}
                            alt="Commission banner"
                            className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ThemedLogo width={126} height={126} className="object-contain" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
                </section>
            </div>
        </div>
    )
}

function MiniAreaChart({ points }: { points: CommissionChartPoint[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.flatMap((point) => [point.total, point.cancelled]), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)

    const totalCoords = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.total / max) * (baseline - chartTop),
    }))
    const cancelledCoords = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.cancelled / max) * (baseline - chartTop),
    }))

    const totalLinePath = createSmoothChartPath(totalCoords)
    const cancelledLinePath = createSmoothChartPath(cancelledCoords)
    const first = totalCoords[0]
    const last = totalCoords[totalCoords.length - 1]
    const totalAreaPath =
        first && last ? `${totalLinePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : points[activeIndex]
    const activeTotalCoord = activeIndex === null ? null : totalCoords[activeIndex]
    const activeCancelledCoord = activeIndex === null ? null : cancelledCoords[activeIndex]
    const hasOrders = points.some((point) => point.total > 0)

    return (
        <div className="relative h-56 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-sky-50/65 dark:to-sky-500/10">
            <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-3 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Orders
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Cancelled
                </span>
            </div>

            {activePoint && activeTotalCoord && activeCancelledCoord && (
                <div
                    className={`pointer-events-none absolute top-8 z-20 min-w-32 rounded-xl border border-border bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                        activeIndex === 0
                            ? 'translate-x-0'
                            : activeIndex === points.length - 1
                              ? '-translate-x-full'
                              : '-translate-x-1/2'
                    }`}
                    style={{ left: `${(activeTotalCoord.x / width) * 100}%` }}
                >
                    <p className="font-black text-foreground">{activePoint.fullLabel}</p>
                    <div className="mt-1.5 space-y-1 text-muted-foreground">
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Orders
                            </span>
                            <strong className="text-foreground">{activePoint.total}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                Cancelled
                            </span>
                            <strong className="text-rose-600">{activePoint.cancelled}</strong>
                        </div>
                    </div>
                </div>
            )}

            {!hasOrders && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-5 text-xs font-semibold text-muted-foreground">
                    No orders during the last seven days.
                </div>
            )}

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full"
                role="img"
                aria-label="Total and cancelled commission orders during the last seven days"
                onMouseLeave={() => setActiveIndex(null)}
            >
                {[0, 1, 2, 3].map((lineIndex) => {
                    const y = chartTop + lineIndex * ((baseline - chartTop) / 3)
                    return (
                        <line
                            key={lineIndex}
                            x1={left}
                            x2={right}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            strokeDasharray="3 5"
                            className="text-slate-200/90 dark:text-slate-600/80"
                        />
                    )
                })}

                <defs>
                    <linearGradient id="commission-orders-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                <path d={totalAreaPath} fill="url(#commission-orders-fill)" />
                <path
                    d={totalLinePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={cancelledLinePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {activeTotalCoord && (
                    <line
                        x1={activeTotalCoord.x}
                        x2={activeTotalCoord.x}
                        y1={chartTop}
                        y2={baseline}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                    />
                )}

                {points.map((point, index) => {
                    const totalCoord = totalCoords[index]
                    const cancelledCoord = cancelledCoords[index]
                    const hitLeft =
                        index === 0 ? left : totalCoord.x - (points.length > 1 ? step / 2 : 0)
                    const hitRight =
                        index === points.length - 1
                            ? right
                            : totalCoord.x + (points.length > 1 ? step / 2 : right - left)
                    const isActive = activeIndex === index

                    return (
                        <g key={`${point.fullLabel}-${index}`}>
                            <circle
                                cx={totalCoord.x}
                                cy={totalCoord.y}
                                r={isActive ? 5 : 3.5}
                                fill="#ffffff"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                className="pointer-events-none transition-all"
                            />
                            <circle
                                cx={cancelledCoord.x}
                                cy={cancelledCoord.y}
                                r={isActive ? 4.5 : 3}
                                fill="#ffffff"
                                stroke="#f43f5e"
                                strokeWidth="2"
                                className="pointer-events-none transition-all"
                            />
                            <text
                                x={totalCoord.x}
                                y={176}
                                textAnchor="middle"
                                className="pointer-events-none fill-slate-500 text-[8px] dark:fill-slate-400"
                            >
                                {point.label}
                            </text>
                            <rect
                                x={hitLeft}
                                y={chartTop}
                                width={hitRight - hitLeft}
                                height={baseline - chartTop + 12}
                                fill="transparent"
                                tabIndex={0}
                                role="button"
                                aria-label={`${point.fullLabel}: ${point.total} orders, ${point.cancelled} cancelled`}
                                className="cursor-crosshair outline-none"
                                onMouseEnter={() => setActiveIndex(index)}
                                onFocus={() => setActiveIndex(index)}
                                onBlur={() => setActiveIndex(null)}
                            />
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

function DashboardStat({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: number | string
}) {
    return (
        <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-[0_5px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                <span className="text-foreground">{icon}</span>
                <span>{label}</span>
            </div>
            <div className="mt-1 text-center text-lg font-black tracking-tight">
                {typeof value === 'number' ? formatCompactMetric(value) : value}
            </div>
        </div>
    )
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
    return (
        <div>
            <div className="text-lg font-black tracking-tight sm:text-xl">
                {typeof value === 'number' ? formatCompactMetric(value) : value}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</div>
        </div>
    )
}


