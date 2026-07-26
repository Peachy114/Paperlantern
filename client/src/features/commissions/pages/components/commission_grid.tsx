import { BriefcaseBusiness, ImageOff } from 'lucide-react'
import type { CommissionService } from '@/types/commission'
import { storageUrl } from '@/utils/storage'

export type CommissionGridLayout =
    | 'standard'
    | 'masonry'
    | 'bento'
    | 'magazine'
    | 'gallery'
    | 'carousel'

export type CommissionInfoLayout =
    | 'image_only'
    | 'image_title'
    | 'image_title_inline'
    | 'title_image'
    | 'image_title_description'

export interface CommissionGridProps {
    commissions: CommissionService[]
    isLoading?: boolean
    grid?: CommissionGridLayout
    columns?: number
    infoLayout?: CommissionInfoLayout
    onOpen?: (commission: CommissionService) => void
}

export default function CommissionGrid({
    commissions,
    isLoading = false,
    grid = 'masonry',
    columns,
    infoLayout = 'image_only',
    onOpen,
}: CommissionGridProps) {
    if (isLoading) {
        return <CommissionGridSkeleton grid={grid} columns={columns} />
    }

    if (commissions.length === 0) {
        return (
            <div className="rounded-lg border py-16 text-center">
                <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No commissions are open yet</p>
            </div>
        )
    }

    if (grid === 'carousel') {
        return (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
                {commissions.map((commission) => (
                    <div key={commission.id} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
                        <CommissionCard
                            commission={commission}
                            onOpen={onOpen}
                            infoLayout={infoLayout}
                        />
                    </div>
                ))}
            </div>
        )
    }

    if (grid === 'standard') {
        return (
            <div
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
                className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {commissions.map((commission) => (
                    <CommissionCard
                        key={commission.id}
                        commission={commission}
                        onOpen={onOpen}
                        square
                        infoLayout={infoLayout}
                    />
                ))}
            </div>
        )
    }

    if (grid === 'gallery') {
        return (
            <div
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
                {commissions.map((commission) => (
                    <CommissionCard
                        key={commission.id}
                        commission={commission}
                        onOpen={onOpen}
                        gallery
                        infoLayout={infoLayout}
                    />
                ))}
            </div>
        )
    }

    if (grid === 'bento') {
        return (
            <div
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
                className="grid auto-rows-[220px] grid-cols-2 gap-4 lg:grid-cols-4"
            >
                {commissions.map((commission, index) => (
                    <div
                        key={commission.id}
                        className={
                            index === 0
                                ? 'col-span-2 row-span-2'
                                : index % 5 === 0
                                  ? 'col-span-2'
                                  : ''
                        }
                    >
                        <CommissionCard
                            commission={commission}
                            onOpen={onOpen}
                            fill
                            infoLayout={infoLayout}
                        />
                    </div>
                ))}
            </div>
        )
    }

    if (grid === 'magazine') {
        return (
            <div
                style={
                    columns
                        ? {
                              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          }
                        : undefined
                }
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
                {commissions.map((commission, index) => (
                    <CommissionCard
                        key={commission.id}
                        commission={commission}
                        onOpen={onOpen}
                        gallery={index === 0}
                        infoLayout={infoLayout}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            style={columns ? { columnCount: columns } : undefined}
            className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5"
        >
            {commissions.map((commission) => (
                <CommissionCard
                    key={commission.id}
                    commission={commission}
                    onOpen={onOpen}
                    infoLayout={infoLayout}
                />
            ))}
        </div>
    )
}

function CommissionGridSkeleton({
    grid,
    columns,
}: {
    grid: CommissionGridLayout
    columns?: number
}) {
    if (grid === 'carousel') {
        return (
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-80 w-[260px] shrink-0 animate-pulse rounded-lg bg-muted"
                    />
                ))}
            </div>
        )
    }

    if (grid === 'masonry') {
        return (
            <div
                style={columns ? { columnCount: columns } : undefined}
                className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5"
            >
                {Array.from({ length: 14 }).map((_, index) => (
                    <div
                        key={index}
                        className={`mb-4 break-inside-avoid animate-pulse rounded-lg bg-muted ${
                            index % 3 === 0 ? 'h-80' : 'h-64'
                        }`}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            style={
                columns
                    ? {
                          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      }
                    : undefined
            }
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
            {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
            ))}
        </div>
    )
}

function CommissionCard({
    commission,
    onOpen,
    square = false,
    gallery = false,
    fill = false,
    infoLayout = 'image_only',
}: {
    commission: CommissionService
    onOpen?: (commission: CommissionService) => void
    square?: boolean
    gallery?: boolean
    fill?: boolean
    infoLayout?: CommissionInfoLayout
}) {
    const image = commission.image_path ?? commission.artist?.avatar ?? null

    const imageClass = fill
        ? 'h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]'
        : square
          ? 'aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]'
          : gallery
            ? 'aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]'
            : 'aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.02]'

    const imageButton = (
        <button
            type="button"
            onClick={() => onOpen?.(commission)}
            onContextMenu={(event) => event.preventDefault()}
            className={`group relative block w-full overflow-hidden rounded-lg bg-muted text-left shadow-sm outline-none ring-offset-background transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                fill ? 'h-full' : ''
            }`}
        >
            {image ? (
                <img
                    src={storageUrl(image)!}
                    alt={commission.title}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onContextMenu={(event) => event.preventDefault()}
                    className={imageClass}
                />
            ) : (
                <DefaultCommissionImage
                    className={
                        fill
                            ? 'h-full'
                            : square
                              ? 'aspect-square'
                              : gallery
                                ? 'aspect-video'
                                : 'aspect-[3/4]'
                    }
                />
            )}
        </button>
    )

    const titleNode = (
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">
            {commission.title}
        </h3>
    )

    const descriptionNode = (
        <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
            {commission.status} · {commission.delivery_days ?? 'Flexible'} days
        </p>
    )

    if (fill) {
        return (
            <article className="relative h-full overflow-hidden rounded-lg">
                {imageButton}

                {infoLayout !== 'image_only' && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                        {infoLayout === 'title_image' ? null : titleNode}

                        {infoLayout === 'image_title_description' && (
                            <p className="mt-1 text-xs text-white/75">
                                {commission.status} · {commission.delivery_days ?? 'Flexible'} days
                            </p>
                        )}
                    </div>
                )}
            </article>
        )
    }

    return (
        <article className={square || gallery ? '' : 'mb-4 break-inside-avoid'}>
            {infoLayout === 'image_only' && imageButton}

            {infoLayout === 'image_title' && (
                <div className="flex h-full flex-col gap-2">
                    {imageButton}
                    {titleNode}
                </div>
            )}

            {infoLayout === 'image_title_inline' && (
                <div className="flex h-full items-center gap-3">
                    <div className="w-20 shrink-0">{imageButton}</div>
                    <div className="min-w-0">{titleNode}</div>
                </div>
            )}

            {infoLayout === 'title_image' && (
                <div className="flex h-full flex-col gap-2">
                    {titleNode}
                    {imageButton}
                </div>
            )}

            {infoLayout === 'image_title_description' && (
                <div className="flex h-full flex-col gap-2">
                    {imageButton}
                    {titleNode}
                    {descriptionNode}
                </div>
            )}
        </article>
    )
}

function DefaultCommissionImage({ className = '' }: { className?: string }) {
    return (
        <div
            className={`flex w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))] ${className}`}
        >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <BriefcaseBusiness className="h-8 w-8" />
                <span className="sr-only">Commission preview</span>
            </div>
        </div>
    )
}
