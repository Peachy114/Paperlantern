import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { GripVertical, Plus, RotateCcw, Save, Settings2, Trash2 } from 'lucide-react'
import { pageLayoutApi } from '@/api/pageLayouts'
import { publicApi } from '@/api/public'
import type { PageKey, PageWidget } from '@/types/pageLayout'
import { Button } from '@/components/ui/button'
import {
    createWidget,
    PAGES,
    WIDGET_TYPES,
} from '@/features/admin/page-customizer/pageCustomizerRegistry'
import {
    clamp,
    contentRailRect,
    createRafPointerMove,
    isEditableOverlay,
    overlayBasePosition,
    parseDragPayload,
    previewFrameStyle,
} from '@/features/admin/page-customizer/utils/editorInteraction'
import type {
    ArtsPreviewData,
    CommissionPreviewData,
    HomePreviewData,
} from '@/features/admin/page-customizer/types/preview'
import {
    withSampleArtsData,
    withSampleCommissionData,
    withSampleHomeData,
} from '@/features/admin/page-customizer/fixtures/previewData'
import { PageWidgetInspector } from '@/features/admin/page-customizer/components/PageWidgetInspector'
import { WidgetContent } from '@/features/admin/page-customizer/components/PagePreviewRenderers'

export default function PageCustomizer() {
    const [page, setPage] = useState<PageKey>('home')
    const [widgets, setWidgets] = useState<PageWidget[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)
    const queryClient = useQueryClient()
    const canvasRef = useRef<HTMLDivElement>(null)
    const widgetRefs = useRef<Map<string, HTMLElement>>(new Map())
    const layout = useQuery({
        queryKey: ['admin-page-layout', page],
        queryFn: () => pageLayoutApi.adminShow(page).then((res) => res.data),
    })

    const homePreview = useQuery<HomePreviewData>({
        queryKey: ['page-builder-home-preview'],
        enabled: ['home', 'comix', 'novels', 'daily', 'rankings', 'genre'].includes(page),
        queryFn: () => publicApi.getHome().then((res) => res.data),
        staleTime: 60_000,
    })

    const artsPreview = useQuery<ArtsPreviewData>({
        queryKey: ['page-builder-arts-preview'],
        enabled: page === 'arts',
        queryFn: () => publicApi.getArts().then((res) => res.data),
        staleTime: 60_000,
    })
    const commissionsPreview = useQuery<CommissionPreviewData>({
        queryKey: ['page-builder-commissions-preview'],
        enabled: page === 'commissions',
        queryFn: async () => {
            const res = await publicApi.getCommissions()
            return res.data
        },
        staleTime: 60_000,
    })
    const previewHomeData = useMemo(() => withSampleHomeData(homePreview.data), [homePreview.data])
    const previewArtsData = useMemo(() => withSampleArtsData(artsPreview.data), [artsPreview.data])
    const previewCommissionData = useMemo(
        () => withSampleCommissionData(commissionsPreview.data),
        [commissionsPreview.data]
    )
    useEffect(() => {
        setWidgets(layout.data?.widgets ?? [])
        setSelectedId(null)
    }, [layout.data?.widgets])

    const invalidatePagePreview = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-page-layout', page] })

        if (['home', 'comix', 'novels', 'daily', 'rankings', 'genre'].includes(page)) {
            queryClient.invalidateQueries({ queryKey: ['home'] })
            queryClient.invalidateQueries({
                queryKey: ['page-builder-home-preview'],
            })
        }

        if (page === 'arts') {
            queryClient.invalidateQueries({ queryKey: ['public-arts'] })
            queryClient.invalidateQueries({
                queryKey: ['page-builder-arts-preview'],
            })
        }

        if (page === 'commissions') {
            queryClient.invalidateQueries({ queryKey: ['public-commissions'] })
            queryClient.invalidateQueries({
                queryKey: ['page-builder-commissions-preview'],
            })
        }
    }

    const widgetsForSave = () => {
        const canvas = canvasRef.current
        const canvasRect = canvas?.getBoundingClientRect()
        if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) return widgets

        return widgets.map((widget) => {
            if (!isEditableOverlay(widget)) return widget

            const frame = widgetRefs.current.get(widget.id)
            if (!frame) return widget
            const frameRect = frame.getBoundingClientRect()

            const rail = contentRailRect(canvasRect)
            const base = overlayBasePosition(widget, rail.width)
            const nextX = Math.round(frameRect.left - rail.left - base.x)
            const nextY = Math.round(frameRect.top - canvasRect.top - base.y)

            return {
                ...widget,
                settings: {
                    ...widget.settings,
                    anchor_widget_id: null,
                },
                style: {
                    ...widget.style,
                    offset_x: nextX,
                    offset_x_percent: Number(((nextX / rail.width) * 100).toFixed(4)),
                    offset_y: nextY,
                    offset_y_percent: undefined,
                },
            }
        })
    }

    const save = useMutation({
        mutationFn: () => pageLayoutApi.adminSave(page, widgetsForSave()).then((res) => res.data),
        onSuccess: () => {
            toast.success('Page design saved.')
            invalidatePagePreview()
        },
        onError: () => toast.error('Could not save page design.'),
    })

    const reset = useMutation({
        mutationFn: () => pageLayoutApi.adminReset(page).then((res) => res.data),
        onSuccess: (data) => {
            setWidgets(data.widgets)
            setSelectedId(null)
            toast.success('Default design restored.')
            invalidatePagePreview()
        },
        onError: () => toast.error('Could not restore default design.'),
    })

    const selectedWidget = widgets.find((widget) => widget.id === selectedId) ?? null
    const enabledCount = useMemo(() => widgets.filter((widget) => widget.enabled).length, [widgets])

    const insertWidget = (type: string, index = widgets.length) => {
        const title = WIDGET_TYPES[page].find((item) => item.value === type)?.label ?? 'Widget'
        const widget = createWidget(type, title, widgets.length)
        setWidgets((current) => {
            const next = [...current]
            next.splice(index, 0, widget)
            return next
        })
        setSelectedId(widget.id)
    }

    const updateWidget = (id: string, updater: (widget: PageWidget) => PageWidget) => {
        setWidgets((current) =>
            current.map((widget) => (widget.id === id ? updater(widget) : widget))
        )
    }

    const removeWidget = (id: string) => {
        setWidgets((current) => current.filter((widget) => widget.id !== id))
        if (selectedId === id) setSelectedId(null)
    }

    const moveWidget = (id: string, targetIndex: number) => {
        setWidgets((current) => {
            const from = current.findIndex((widget) => widget.id === id)
            if (from === -1) return current
            const next = [...current]
            const [item] = next.splice(from, 1)
            const adjusted = from < targetIndex ? targetIndex - 1 : targetIndex
            next.splice(Math.max(0, Math.min(next.length, adjusted)), 0, item)
            return next
        })
    }

    const updateOverlayWidgetStyle = (id: string, style: Partial<PageWidget['style']>) => {
        updateWidget(id, (widget) => ({
            ...widget,
            style: {
                ...widget.style,
                ...style,
            },
        }))
    }

    const updateOverlayPlacement = (id: string, enabled: boolean) => {
        const frame = widgetRefs.current.get(id)
        const canvas = canvasRef.current
        const frameRect = frame?.getBoundingClientRect()
        const canvasRect = canvas?.getBoundingClientRect()

        updateWidget(id, (widget) => {
            const wasOverlay = Boolean(widget.settings.allow_overlap)
            const nextStyle = { ...widget.style }

            if (enabled && !wasOverlay && frame && frameRect && canvasRect) {
                const rail = contentRailRect(canvasRect)
                const base = overlayBasePosition(widget, rail.width)
                const nextX = Math.round(frameRect.left - rail.left - base.x)
                const nextY = Math.round(frameRect.top - canvasRect.top - base.y)
                nextStyle.offset_x = nextX
                nextStyle.offset_x_percent = Number(((nextX / rail.width) * 100).toFixed(4))
                nextStyle.offset_y = nextY
                nextStyle.offset_y_percent = undefined
                nextStyle.z_index = Math.max(nextStyle.z_index ?? 1, 20)
            }

            return {
                ...widget,
                settings: {
                    ...widget.settings,
                    allow_overlap: enabled,
                    placement: enabled ? 'overlay' : 'tight',
                    anchor_widget_id: null,
                },
                style: nextStyle,
            }
        })
    }

    const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
        event.preventDefault()
        event.stopPropagation()
        setHoverIndex(null)

        const raw = event.dataTransfer.getData('application/x-latern-widget')
        if (!raw) return

        const payload = parseDragPayload(raw)
        if (!payload) return
        if (payload.source === 'palette' && payload.type) {
            insertWidget(payload.type, index)
            return
        }

        if (payload.source === 'canvas' && payload.id) {
            moveWidget(payload.id, index)
        }
    }

    return (
        <div className="min-h-[calc(100dvh-4rem)] bg-muted/20">
            <div className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            Admin Customize
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight">Page Builder</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {PAGES.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setPage(item.key)}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                    page === item.key
                                        ? 'bg-foreground text-background'
                                        : 'bg-background'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <Button
                            variant="outline"
                            onClick={() => reset.mutate()}
                            disabled={reset.isPending}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Default Design
                        </Button>
                        <Button onClick={() => save.mutate()} disabled={save.isPending}>
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid w-full h-[200px]  gap-0 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
                <aside className="border-r bg-background p-4 xl:sticky xl:top-[73px] overflow-auto">
                    <h2 className="text-sm font-semibold">Blocks</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Drag blocks into the page. {enabledCount} enabled.
                    </p>
                    <div className="mt-4 grid gap-2">
                        {WIDGET_TYPES[page].map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                draggable
                                onDragStart={(event) => {
                                    event.dataTransfer.setData(
                                        'application/x-latern-widget',
                                        JSON.stringify({ source: 'palette', type: type.value })
                                    )
                                }}
                                onClick={() => insertWidget(type.value)}
                                className="flex cursor-grab items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted active:cursor-grabbing"
                            >
                                <span>{type.label}</span>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="min-w-0 border-r bg-background">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">
                                {PAGES.find((item) => item.key === page)?.label} draft preview
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Drag blocks here. Public page changes only after Save.
                            </p>
                        </div>
                    </div>

                    <div className="max-h-[calc(100dvh-12rem)] overflow-auto bg-zinc-100 dark:bg-zinc-950">
                        <div
                            ref={canvasRef}
                            data-page-canvas="true"
                            className="relative min-h-[calc(100dvh-12rem)] min-w-[60vw] bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-black dark:via-zinc-900 dark:to-black"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, rgba(14, 165, 233, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.18) 1px, transparent 1px), linear-gradient(135deg, #ffffff, #f1f5f9 55%, #e2e8f0)',
                                backgroundSize: '5% 40px, 5% 40px, auto',
                            }}
                        >
                            {layout.isLoading ? (
                                <div className="p-8 text-sm text-muted-foreground">
                                    Loading design...
                                </div>
                            ) : widgets.length === 0 ? (
                                <DropZone
                                    index={0}
                                    active={hoverIndex === 0}
                                    onHover={setHoverIndex}
                                    onDrop={handleDrop}
                                    large
                                />
                            ) : (
                                <>
                                    {widgets.map((widget, index) => (
                                        <Fragment key={widget.id}>
                                            <DropZone
                                                index={index}
                                                active={hoverIndex === index}
                                                onHover={setHoverIndex}
                                                onDrop={handleDrop}
                                            />
                                            <CanvasWidget
                                                page={page}
                                                widget={widget}
                                                widgets={widgets}
                                                selected={selectedId === widget.id}
                                                homeData={previewHomeData}
                                                artsData={previewArtsData}
                                                commissionData={previewCommissionData}
                                                onSelect={() => setSelectedId(widget.id)}
                                                onRemove={() => removeWidget(widget.id)}
                                                onChange={(updater) =>
                                                    updateWidget(widget.id, updater)
                                                }
                                                onOverlayStyleChange={updateOverlayWidgetStyle}
                                                registerFrame={(id, element) => {
                                                    if (element) widgetRefs.current.set(id, element)
                                                    else widgetRefs.current.delete(id)
                                                }}
                                                onDragOver={(event) => {
                                                    event.preventDefault()
                                                    const rect =
                                                        event.currentTarget.getBoundingClientRect()
                                                    const nextIndex =
                                                        event.clientY > rect.top + rect.height / 2
                                                            ? index + 1
                                                            : index
                                                    setHoverIndex(nextIndex)
                                                }}
                                                onDrop={(event) =>
                                                    handleDrop(event, hoverIndex ?? index)
                                                }
                                            />
                                        </Fragment>
                                    ))}
                                    <DropZone
                                        index={widgets.length}
                                        active={hoverIndex === widgets.length}
                                        onHover={setHoverIndex}
                                        onDrop={handleDrop}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="overflow-auto bg-background p-4 xl:sticky xl:top-[73px]">
                    <PageWidgetInspector
                        page={page}
                        widget={selectedWidget}
                        onChange={updateWidget}
                        onRemove={removeWidget}
                        onOverlayPlacementChange={updateOverlayPlacement}
                    />
                </aside>
            </div>
        </div>
    )
}

// ============================================================================
// SECTION 4: CANVAS DROP ZONES AND WIDGET FRAME CONTROLS ----
// ============================================================================
function DropZone({
    index,
    active,
    onHover,
    onDrop,
    large = false,
}: {
    index: number
    active: boolean
    onHover: (index: number | null) => void
    onDrop: (event: DragEvent<HTMLElement>, index: number) => void
    large?: boolean
}) {
    return (
        <div
            onDragOver={(event) => {
                event.preventDefault()
                onHover(index)
            }}
            onDragLeave={() => onHover(null)}
            onDrop={(event) => onDrop(event, index)}
            className={`${large ? 'm-6 flex h-40 items-center justify-center rounded-xl border border-dashed' : 'h-0'} ${
                active
                    ? large
                        ? 'bg-sky-500/20 ring-2 ring-sky-500'
                        : 'relative z-40 bg-sky-500/40 ring-2 ring-sky-500'
                    : large
                      ? 'bg-muted/40'
                      : ''
            }`}
        >
            {large && <span className="text-sm text-muted-foreground">Drop a block here</span>}
        </div>
    )
}

function CanvasWidget({
    page,
    widget,
    widgets,
    selected,
    homeData,
    artsData,
    commissionData,
    onSelect,
    onRemove,
    onChange,
    onOverlayStyleChange,
    registerFrame,
    onDragOver,
    onDrop,
}: {
    page: PageKey
    widget: PageWidget
    widgets: PageWidget[]
    selected: boolean
    homeData?: HomePreviewData
    artsData?: ArtsPreviewData
    commissionData?: CommissionPreviewData
    onSelect: () => void
    onRemove: () => void
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
    onOverlayStyleChange: (id: string, style: Partial<PageWidget['style']>) => void
    registerFrame: (id: string, element: HTMLElement | null) => void
    onDragOver?: (event: DragEvent<HTMLElement>) => void
    onDrop?: (event: DragEvent<HTMLElement>) => void
}) {
    const frameStyle = previewFrameStyle(widget)
    const editableOverlay = isEditableOverlay(widget)
    const resizableCustom = ['sticker', 'text', 'image', 'banner', 'board', 'spacer'].includes(
        widget.type
    )

    const startOverlayDrag = (event: ReactPointerEvent<HTMLElement>) => {
        if (!editableOverlay) return
        if ((event.target as HTMLElement).closest('[data-widget-controls="true"]')) return

        event.preventDefault()
        event.stopPropagation()
        onSelect()

        const startX = event.clientX
        const startY = event.clientY
        const initialX = Number(widget.style?.offset_x ?? 0)
        const initialY = Number(widget.style?.offset_y ?? 0)
        const frameRect = event.currentTarget.getBoundingClientRect()
        const canvas = event.currentTarget.closest<HTMLElement>('[data-page-canvas="true"]')
        const canvasRect = canvas?.getBoundingClientRect()
        const rail = canvasRect ? contentRailRect(canvasRect) : null
        const base = rail ? overlayBasePosition(widget, rail.width) : null
        const initialCanvasY = canvasRect ? frameRect.top - canvasRect.top : null
        const initialRailX = rail ? frameRect.left - rail.left : null
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const { move, cancel: cancelMove } = createRafPointerMove((moveEvent) => {
            if (base && rail && initialRailX !== null && initialCanvasY !== null) {
                const nextX = Math.round(initialRailX + moveEvent.clientX - startX - base.x)
                const nextY = Math.round(initialCanvasY + moveEvent.clientY - startY - base.y)
                onOverlayStyleChange(widget.id, {
                    offset_x: nextX,
                    offset_x_percent: Number(((nextX / rail.width) * 100).toFixed(4)),
                    offset_y: nextY,
                    offset_y_percent: undefined,
                })
                return
            }

            onOverlayStyleChange(widget.id, {
                offset_x: Math.round(initialX + moveEvent.clientX - startX),
                offset_x_percent: undefined,
                offset_y: Math.round(initialY + moveEvent.clientY - startY),
                offset_y_percent: undefined,
            })
        })

        const end = () => {
            cancelMove()
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    const startOverlayResize = (event: ReactPointerEvent<HTMLElement>) => {
        if (!resizableCustom) return

        event.preventDefault()
        event.stopPropagation()
        onSelect()

        const startX = event.clientX
        const startY = event.clientY
        const initialSize = Number(widget.style?.sticker_size ?? 160)
        const initialWidth = Number(
            widget.style?.content_width ?? (widget.type === 'board' ? 960 : 420)
        )
        const initialHeight = Number(
            widget.style?.content_height ?? (widget.type === 'board' ? 420 : 120)
        )
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const { move, cancel: cancelMove } = createRafPointerMove((moveEvent) => {
            const deltaX = moveEvent.clientX - startX
            const deltaY = moveEvent.clientY - startY
            if (widget.type === 'sticker') {
                onOverlayStyleChange(widget.id, {
                    sticker_size: Math.round(
                        clamp(initialSize + Math.max(deltaX, deltaY), 48, 900)
                    ),
                })
                return
            }

            onOverlayStyleChange(widget.id, {
                content_width: Math.round(
                    clamp(initialWidth + deltaX, widget.type === 'board' ? 240 : 48, 1360)
                ),
                content_height: Math.round(
                    clamp(initialHeight + deltaY, widget.type === 'board' ? 160 : 24, 1600)
                ),
            })
        })

        const end = () => {
            cancelMove()
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    const startOverlayRotate = (event: ReactPointerEvent<HTMLElement>) => {
        if (!editableOverlay) return

        event.preventDefault()
        event.stopPropagation()
        onSelect()

        const rect = event.currentTarget
            .closest('[data-page-widget-frame="true"]')
            ?.getBoundingClientRect()
        if (!rect) return

        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const { move, cancel: cancelMove } = createRafPointerMove((moveEvent) => {
            const angle =
                (Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180) /
                Math.PI
            onOverlayStyleChange(widget.id, {
                rotate: Math.round(angle + 45),
            })
        })

        const end = () => {
            cancelMove()
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    return (
        <section
            ref={(element) => registerFrame(widget.id, element)}
            data-page-widget-frame="true"
            data-page-widget-id={widget.id}
            data-page-overlay={editableOverlay ? 'true' : undefined}
            draggable={!editableOverlay}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={(event) => {
                if (editableOverlay) return
                event.dataTransfer.setData(
                    'application/x-latern-widget',
                    JSON.stringify({ source: 'canvas', id: widget.id })
                )
            }}
            onPointerDown={startOverlayDrag}
            style={frameStyle}
            className={`group relative ${!widget.enabled ? 'opacity-45' : ''} ${
                selected
                    ? 'outline outline-2 outline-sky-500'
                    : 'outline outline-1 outline-transparent hover:outline-sky-500/50'
            } ${editableOverlay ? 'cursor-move' : ''}`}
        >
            <div
                data-widget-controls="true"
                className="absolute right-3 top-3 z-20 flex gap-1 opacity-0 transition group-hover:opacity-100"
            >
                <button
                    type="button"
                    onClick={onSelect}
                    className="rounded-md bg-background/95 p-2 text-foreground shadow ring-1 ring-border"
                    title="Widget settings"
                >
                    <Settings2 className="h-4 w-4" />
                </button>
                {!editableOverlay && (
                    <button
                        type="button"
                        className="cursor-grab rounded-md bg-background/95 p-2 text-foreground shadow ring-1 ring-border active:cursor-grabbing"
                        title="Drag block"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-md bg-background/95 p-2 text-red-500 shadow ring-1 ring-border"
                    title="Delete block"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            {editableOverlay && (
                <>
                    <button
                        type="button"
                        data-widget-controls="true"
                        onPointerDown={startOverlayRotate}
                        className="absolute -right-3 -top-3 z-30 flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white active:cursor-grabbing"
                        title="Drag to rotate"
                        aria-label="Drag to rotate sticker"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                </>
            )}
            {resizableCustom && (
                <button
                    type="button"
                    data-widget-controls="true"
                    onPointerDown={startOverlayResize}
                    className="absolute -bottom-3 -right-3 z-30 h-7 w-7 cursor-nwse-resize rounded-full bg-white shadow ring-2 ring-sky-500 opacity-0 transition group-hover:opacity-100"
                    title="Drag to resize"
                    aria-label="Drag to resize widget"
                >
                    <span className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-500" />
                </button>
            )}
            <WidgetContent
                page={page}
                widget={widget}
                widgets={widgets}
                homeData={homeData}
                artsData={artsData}
                commissionData={commissionData}
                onChange={onChange}
            />
        </section>
    )
}

// ============================================================================
// SECTION 5: WIDGET RENDER ROUTER ----
// This decides which page-specific renderer receives the widget.
// ============================================================================
