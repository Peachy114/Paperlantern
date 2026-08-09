import { useState } from 'react'

// Arts activity chart ----
export function ArtsActivityChart({ points }: { points: Array<{ date: string; views: number }> }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.map((point) => Number(point.views)), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)

    const normalizedPoints = points.map((point) => {
        const date = new Date(`${point.date}T00:00:00`)

        return {
            ...point,
            views: Number(point.views) || 0,
            label: Number.isNaN(date.getTime())
                ? point.date
                : date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                  }),
            fullLabel: Number.isNaN(date.getTime())
                ? point.date
                : date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  }),
        }
    })
    const coordinates = normalizedPoints.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.views / max) * (baseline - chartTop),
    }))
    const linePath = createArtsChartPath(coordinates)
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    const areaPath =
        first && last ? `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : normalizedPoints[activeIndex]
    const activeCoordinate = activeIndex === null ? null : coordinates[activeIndex]
    const totalViews = normalizedPoints.reduce((sum, point) => sum + point.views, 0)
    const hasViews = normalizedPoints.some((point) => point.views > 0)

    return (
        <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                        Views
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Last seven days · views across all your artwork
                    </p>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {totalViews.toLocaleString()} total views
                </span>
            </div>

            <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65">
                <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Views
                </div>

                {activePoint && activeCoordinate ? (
                    <div
                        className={`pointer-events-none absolute top-8 z-20 min-w-32 rounded-xl border border-border bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                            activeIndex === 0
                                ? 'translate-x-0'
                                : activeIndex === normalizedPoints.length - 1
                                  ? '-translate-x-full'
                                  : '-translate-x-1/2'
                        }`}
                        style={{ left: `${(activeCoordinate.x / width) * 100}%` }}
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
                        No art views during the last seven days.
                    </div>
                ) : null}

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-full w-full"
                    role="img"
                    aria-label="Art views during the last seven days"
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
                        <linearGradient id="arts-views-fill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                        </linearGradient>
                    </defs>

                    <path d={areaPath} fill="url(#arts-views-fill)" />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {activeCoordinate ? (
                        <line
                            x1={activeCoordinate.x}
                            x2={activeCoordinate.x}
                            y1={chartTop}
                            y2={baseline}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 4"
                        />
                    ) : null}

                    {normalizedPoints.map((point, index) => {
                        const coordinate = coordinates[index]
                        const hitLeft =
                            index === 0
                                ? left
                                : coordinate.x - (normalizedPoints.length > 1 ? step / 2 : 0)
                        const hitRight =
                            index === normalizedPoints.length - 1
                                ? right
                                : coordinate.x +
                                  (normalizedPoints.length > 1 ? step / 2 : right - left)
                        const active = activeIndex === index

                        return (
                            <g key={`${point.date}-${index}`}>
                                <circle
                                    cx={coordinate.x}
                                    cy={coordinate.y}
                                    r={active ? 5 : 3.5}
                                    fill="#ffffff"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                    className="pointer-events-none transition-all"
                                />
                                <text
                                    x={coordinate.x}
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
        </div>
    )
}

function createArtsChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}
