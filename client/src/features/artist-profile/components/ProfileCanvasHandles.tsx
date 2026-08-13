import type { PointerEvent } from 'react'
import { Lock, Move, Trash2, Unlock } from 'lucide-react'
import type { ProfileCanvasItem } from '@/types/artistProfile'
import { PROFILE_TAB_LABELS } from '@/features/artist-profile/constants/profileEditor'
import type { CanvasDragState, CanvasItemPatch } from '@/features/artist-profile/types/profileEditor'

// Canvas interaction affordances ----
export function CenterGuide() {
    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-red-500/80"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-px -translate-y-1/2 bg-red-500/80"
            />
        </>
    )
}

export function HeaderLockButton({
    locked,
    label,
    className,
    onToggle,
}: {
    locked: boolean
    label: string
    className: string
    onToggle: () => void
}) {
    return (
        <button
            type="button"
            className={`absolute z-[1001] rounded bg-background p-1 shadow-md ring-1 ${
                locked ? 'ring-amber-400' : 'ring-sky-400'
            } ${className}`}
            onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
            }}
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onToggle()
            }}
            aria-label={`${locked ? 'Unlock' : 'Lock'} ${label}`}
            title={`${locked ? 'Unlock' : 'Lock'} ${label}`}
        >
            {locked ? (
                <Lock className="h-3 w-3 text-amber-500" />
            ) : (
                <Unlock className="h-3 w-3 text-sky-500" />
            )}
        </button>
    )
}

export function profileTabButtonClass(active: boolean) {
    return `inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
        active
            ? 'bg-[var(--comix-badge-type)] text-white shadow-sm'
            : 'hover:bg-background/60 hover:text-foreground'
    }`
}

export function CanvasHandles({
    item,
    onMove,
    onResize,
    onDelete,
    onToggleLock,
}: {
    item: ProfileCanvasItem
    onMove: (
        event: PointerEvent<HTMLElement>,
        item: ProfileCanvasItem,
        kind: CanvasDragState['kind']
    ) => void
    onResize: (
        event: PointerEvent<HTMLElement>,
        item: ProfileCanvasItem,
        kind: CanvasDragState['kind']
    ) => void
    onDelete: (itemId: string, kind: ProfileCanvasItem['kind']) => void
    onToggleLock: (itemId: string, kind: ProfileCanvasItem['kind'], patch: CanvasItemPatch) => void
}) {
    const locked = item.locked ?? false

    return (
        <>
            {!locked && (
                <span
                    data-canvas-control
                    className="absolute -left-2 -top-2 z-[9999] rounded bg-background p-1 shadow-md ring-1 ring-sky-400"
                    onPointerDown={(event) => onMove(event, item, 'move')}
                    title="Move"
                >
                    <Move className="h-3 w-3 text-sky-500" />
                </span>
            )}
            <button
                type="button"
                data-canvas-control
                className={`absolute z-[9999] rounded bg-background p-1 shadow-md ring-1 ${
                    locked ? '-left-2 -top-2 ring-amber-400' : 'left-5 -top-2 ring-border'
                }`}
                onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                }}
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onToggleLock(item.id, item.kind, { locked: !locked })
                }}
                aria-label={`${locked ? 'Unlock' : 'Lock'} ${PROFILE_TAB_LABELS[item.type]}`}
                title={locked ? 'Unlock position' : 'Lock position'}
            >
                {locked ? (
                    <Lock className="h-3 w-3 text-amber-500" />
                ) : (
                    <Unlock className="h-3 w-3 text-muted-foreground" />
                )}
            </button>
            <button
                type="button"
                data-canvas-control
                className="absolute -right-2 -top-2 z-[9999] rounded bg-destructive p-1 text-destructive-foreground shadow-md ring-1 ring-background"
                onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                }}
                onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onDelete(item.id, item.kind)
                }}
                aria-label={`Delete ${PROFILE_TAB_LABELS[item.type]}`}
            >
                <Trash2 className="h-3 w-3" />
            </button>
            {!locked && (
                <>
                    <span
                        data-canvas-control
                        className="absolute -right-1 top-1/2 z-[9999] h-10 w-2 -translate-y-1/2 cursor-ew-resize rounded bg-sky-400 shadow-md"
                        onPointerDown={(event) => onResize(event, item, 'resize')}
                    />
                    <span
                        data-canvas-control
                        className="absolute bottom-0 right-0 z-[9999] h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                        onPointerDown={(event) => onResize(event, item, 'resize')}
                    />
                </>
            )}
        </>
    )
}

