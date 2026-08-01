import { useState } from "react"
import { createShopChartPath } from "../utils/chartPath"

export type ShopPerformancePoint = {
    label: string
    fullLabel: string
    downloads: number
    likes: number
}


export function ShopPerformanceChart({ points }: { points: ShopPerformancePoint[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.flatMap((point) => [point.downloads, point.likes]), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)
    const downloadCoordinates = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.downloads / max) * (baseline - chartTop),
    }))
    const likeCoordinates = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.likes / max) * (baseline - chartTop),
    }))
    const downloadPath = createShopChartPath(downloadCoordinates)
    const likePath = createShopChartPath(likeCoordinates)
    const first = downloadCoordinates[0]
    const last = downloadCoordinates[downloadCoordinates.length - 1]
    const areaPath =
        first && last ? `${downloadPath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : points[activeIndex]
    const activeDownload = activeIndex === null ? null : downloadCoordinates[activeIndex]
    const activeLike = activeIndex === null ? null : likeCoordinates[activeIndex]
    const hasActivity = points.some((point) => point.downloads > 0 || point.likes > 0)

    return (
        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65">
            <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-3 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Downloads
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Likes
                </span>
            </div>

            {activePoint && activeDownload && activeLike ? (
                <div
                    className={`pointer-events-none absolute top-8 z-20 min-w-36 rounded-xl border border-border bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                        activeIndex === 0
                            ? 'translate-x-0'
                            : activeIndex === points.length - 1
                              ? '-translate-x-full'
                              : '-translate-x-1/2'
                    }`}
                    style={{ left: `${(activeDownload.x / width) * 100}%` }}
                >
                    <p className="font-black text-foreground">{activePoint.fullLabel}</p>
                    <div className="mt-1.5 space-y-1 text-muted-foreground">
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Downloads
                            </span>
                            <strong className="text-foreground">{activePoint.downloads}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                Likes
                            </span>
                            <strong className="text-rose-600">{activePoint.likes}</strong>
                        </div>
                    </div>
                </div>
            ) : null}

            {!hasActivity ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-5 text-xs font-semibold text-muted-foreground">
                    Product activity will appear here.
                </div>
            ) : null}

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full"
                role="img"
                aria-label="Downloads and likes across shop products"
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
                    <linearGradient id="shop-downloads-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#shop-downloads-fill)" />
                <path
                    d={downloadPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={likePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {activeDownload ? (
                    <line
                        x1={activeDownload.x}
                        x2={activeDownload.x}
                        y1={chartTop}
                        y2={baseline}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                    />
                ) : null}

                {points.map((point, index) => {
                    const downloadCoordinate = downloadCoordinates[index]
                    const likeCoordinate = likeCoordinates[index]
                    const hitLeft =
                        index === 0
                            ? left
                            : downloadCoordinate.x - (points.length > 1 ? step / 2 : 0)
                    const hitRight =
                        index === points.length - 1
                            ? right
                            : downloadCoordinate.x + (points.length > 1 ? step / 2 : right - left)
                    const active = activeIndex === index

                    return (
                        <g key={`${point.fullLabel}-${index}`}>
                            <circle
                                cx={downloadCoordinate.x}
                                cy={downloadCoordinate.y}
                                r={active ? 5 : 3.5}
                                fill="#ffffff"
                                stroke="#38bdf8"
                                strokeWidth="2"
                            />
                            <circle
                                cx={likeCoordinate.x}
                                cy={likeCoordinate.y}
                                r={active ? 4.5 : 3}
                                fill="#ffffff"
                                stroke="#f43f5e"
                                strokeWidth="2"
                            />
                            <text
                                x={downloadCoordinate.x}
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
                                aria-label={`${point.fullLabel}: ${point.downloads} downloads, ${point.likes} likes`}
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