import { useEffect, useState } from 'react'
import { studioApi } from '@/api/studio'

interface ViewDataPoint {
    date: string
    views: number
}

interface WorkChartPoint {
    label: string
    fullLabel: string
    views: number
}

export default function Charts() {
    const [data, setData] = useState<ViewDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        studioApi
            .getViewsChart()
            .then((response) => setData(response.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    const points = buildWorkChartPoints(data)
    const totalViews = points.reduce((sum, point) => sum + point.views, 0)

    if (loading) {
        return (
            <div className="h-[284px] animate-pulse rounded-2xl bg-gradient-to-b from-muted/50 to-sky-50/50" />
        )
    }

    if (error) {
        return (
            <div className="flex h-[284px] items-center justify-center rounded-2xl bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground">
                    Could not load work analytics.
                </p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                        Activity
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Last seven days · views across all your works
                    </p>
                </div>

                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {totalViews.toLocaleString()} total views
                </span>
            </div>

            <WorkViewsAreaChart points={points} />
        </div>
    )
}

function WorkViewsAreaChart({ points }: { points: WorkChartPoint[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.map((point) => point.views), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)

    const viewCoords = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.views / max) * (baseline - chartTop),
    }))

    const viewLinePath = createSmoothChartPath(viewCoords)
    const first = viewCoords[0]
    const last = viewCoords[viewCoords.length - 1]
    const viewAreaPath =
        first && last ? `${viewLinePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : points[activeIndex]
    const activeCoord = activeIndex === null ? null : viewCoords[activeIndex]
    const hasViews = points.some((point) => point.views > 0)

    return (
        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65 dark:to-sky-500/10">
            <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Views
            </div>

            {activePoint && activeCoord ? (
                <div
                    className={`pointer-events-none absolute top-8 z-20 min-w-32 rounded-xl border border-border bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                        activeIndex === 0
                            ? 'translate-x-0'
                            : activeIndex === points.length - 1
                              ? '-translate-x-full'
                              : '-translate-x-1/2'
                    }`}
                    style={{ left: `${(activeCoord.x / width) * 100}%` }}
                >
                    <p className="font-black text-foreground">{activePoint.fullLabel}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-5 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-sky-400" />
                            Views
                        </span>
                        <strong className="text-foreground">
                            {activePoint.views.toLocaleString()}
                        </strong>
                    </div>
                </div>
            ) : null}

            {!hasViews ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-5 text-xs font-semibold text-muted-foreground">
                    No work views during the last seven days.
                </div>
            ) : null}

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full"
                role="img"
                aria-label="Views across all works during the last seven days"
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
                            className="text-slate-200/90"
                        />
                    )
                })}

                <defs>
                    <linearGradient id="work-views-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                <path d={viewAreaPath} fill="url(#work-views-fill)" />
                <path
                    d={viewLinePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {activeCoord ? (
                    <line
                        x1={activeCoord.x}
                        x2={activeCoord.x}
                        y1={chartTop}
                        y2={baseline}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                    />
                ) : null}

                {points.map((point, index) => {
                    const coord = viewCoords[index]
                    const hitLeft =
                        index === 0 ? left : coord.x - (points.length > 1 ? step / 2 : 0)
                    const hitRight =
                        index === points.length - 1
                            ? right
                            : coord.x + (points.length > 1 ? step / 2 : right - left)
                    const isActive = activeIndex === index

                    return (
                        <g key={`${point.fullLabel}-${index}`}>
                            <circle
                                cx={coord.x}
                                cy={coord.y}
                                r={isActive ? 5 : 3.5}
                                fill="#ffffff"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                className="pointer-events-none transition-all"
                            />
                            <text
                                x={coord.x}
                                y={176}
                                textAnchor="middle"
                                className="pointer-events-none fill-slate-400 text-[8px]"
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
                                aria-label={`${point.fullLabel}: ${point.views.toLocaleString()} views`}
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

function createSmoothChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}

function buildWorkChartPoints(data: ViewDataPoint[]): WorkChartPoint[] {
    return data.map((item) => {
        const date = parseChartDate(item.date)

        return {
            label: Number.isNaN(date.getTime())
                ? item.date
                : date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                  }),
            fullLabel: Number.isNaN(date.getTime())
                ? item.date
                : date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  }),
            views: Number(item.views) || 0,
        }
    })
}

function parseChartDate(value: string) {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
    return new Date(dateOnlyPattern.test(value) ? `${value}T00:00:00` : value)
}
