import type { CSSProperties } from 'react'
import type { PageWidget } from '@/types/pageLayout'
import { widgetStyle } from '@/features/page-builder/PageWidgetFrame'

// Drag payloads ----
export type DragPayload =
    | { source: 'palette'; type: string }
    | { source: 'canvas'; id: string }

export function parseDragPayload(raw: string): DragPayload | null {
    try {
        const value = JSON.parse(raw) as Partial<DragPayload>

        if (value.source === 'palette' && typeof value.type === 'string') {
            return { source: 'palette', type: value.type }
        }

        if (value.source === 'canvas' && typeof value.id === 'string') {
            return { source: 'canvas', id: value.id }
        }

        return null
    } catch {
        return null
    }
}

// Pointer events ----
export function createRafPointerMove(handler: (event: PointerEvent) => void) {
    let frameId: number | null = null
    let latestEvent: PointerEvent | null = null

    const move = (event: PointerEvent) => {
        latestEvent = event
        if (frameId !== null) return

        frameId = window.requestAnimationFrame(() => {
            frameId = null
            if (!latestEvent) return
            handler(latestEvent)
        })
    }

    const cancel = () => {
        if (frameId !== null) window.cancelAnimationFrame(frameId)
        frameId = null
        latestEvent = null
    }

    return { move, cancel }
}

// Canvas geometry ----
export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

export function overlayBasePosition(_widget: PageWidget, _canvasWidth: number) {
    return { x: 0, y: 0 }
}

export function contentRailRect(containerRect: DOMRect) {
    const railWidth = Math.min(containerRect.width - 40, 1320)
    const width = Math.max(1, railWidth)
    const left = containerRect.left + Math.max(20, (containerRect.width - 1360) / 2 + 20)

    return { left, width }
}

// Widget presentation ----
export function previewFrameStyle(widget: PageWidget): CSSProperties {
    const editableOverlay = isEditableOverlay(widget)
    const style = widgetStyle(widget)

    return {
        ...style,
        position: editableOverlay ? style.position : 'relative',
        touchAction: editableOverlay ? 'none' : undefined,
    }
}

export function isEditableOverlay(widget: PageWidget) {
    return (
        ['sticker', 'text', 'image', 'banner', 'spacer'].includes(widget.type) &&
        Boolean(widget.settings.allow_overlap)
    )
}
