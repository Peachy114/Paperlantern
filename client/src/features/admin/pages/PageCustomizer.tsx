import {
    Fragment,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type DragEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { GripVertical, ImagePlus, Plus, RotateCcw, Save, Settings2, Trash2 } from 'lucide-react'
import api from '@/api/axios'
import { adminArtsApi } from '@/api/adminArts'
import { commentsApi } from '@/api/comments'
import { pageLayoutApi } from '@/api/pageLayouts'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageBoardItem, PageKey, PageWidget } from '@/types/pageLayout'
import type { WorkItem, ChapterItem } from '@/features/work/hooks/useHome'
import type { Art } from '@/types/art'
import type { ArtistSticker } from '@/types/artistProfile'
import type { CommissionService } from '@/types/commission'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    CustomPageWidgetContent,
    cssColor,
    fontFamilyFromUrl,
    widgetStyle,
} from '@/features/page-builder/PageWidgetFrame'
import AnnouncementWidget from '@/features/announcements/components/AnnouncementWidget'
import HeroSection from '@/features/work/components/HeroSection'
import WeeklyChartSection from '@/features/work/components/WeeklyChartSection'
import FreshReleasesSection from '@/features/work/components/FreshReleasesSection'
import LatestChaptersSection from '@/features/work/components/LatestChaptersSection'

const PAGES: { key: PageKey; label: string }[] = [
    { key: 'home', label: 'Homepage' },
    { key: 'arts', label: 'Arts' },
    { key: 'commissions', label: 'Commission' },
]

const WIDGET_TYPES: Record<PageKey, { value: string; label: string }[]> = {
    home: [
        { value: 'hero', label: 'Hero' },
        { value: 'announcement_hero', label: 'Announcement Hero' },
        { value: 'announcement_banner', label: 'Announcement Banner' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'today_releases', label: "Today's Releases" },
        { value: 'today_top', label: "Today's Top 10" },
        { value: 'fresh', label: 'Fresh Release' },
        { value: 'latest', label: 'Latest Chapters' },
        { value: 'popular', label: 'Popular' },
        { value: 'top_liker', label: 'Top Liker' },
        { value: 'text', label: 'Text' },
        { value: 'image', label: 'Image' },
        { value: 'sticker', label: 'Sticker' },
        { value: 'board', label: 'Board' },
        { value: 'spacer', label: 'Empty Space' },
    ],
    arts: [
        { value: 'featured_artists', label: 'Featured Artists' },
        { value: 'labels', label: 'Labels' },
        { value: 'arts_grid', label: 'Arts Grid' },
        { value: 'text', label: 'Text' },
        { value: 'image', label: 'Image' },
        { value: 'sticker', label: 'Sticker' },
        { value: 'board', label: 'Board' },
        { value: 'spacer', label: 'Empty Space' },
    ],
    commissions: [
        { value: 'commission_grid', label: 'Commission Grid' },
        { value: 'boosted_commissions', label: 'Boosted Commissions' },
        { value: 'featured_artists', label: 'Featured Artists' },
        { value: 'text', label: 'Text' },
        { value: 'image', label: 'Image' },
        { value: 'sticker', label: 'Sticker' },
        { value: 'board', label: 'Board' },
        { value: 'spacer', label: 'Empty Space' },
    ],
}

const GRID_OPTIONS = ['standard', 'masonry', 'bento', 'magazine', 'gallery', 'carousel']

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function overlayBasePosition(_widget: PageWidget, _canvasWidth: number) {
    return {
        x: 0,
        y: 0,
    }
}

function contentRailRect(containerRect: DOMRect) {
    const railWidth = Math.min(containerRect.width - 40, 1320)
    const width = Math.max(1, railWidth)
    const left = containerRect.left + Math.max(20, (containerRect.width - 1360) / 2 + 20)

    return {
        left,
        width,
    }
}

function previewFrameStyle(widget: PageWidget): CSSProperties {
    const editableOverlay = isEditableOverlay(widget)
    const style = widgetStyle(widget)

    return {
        ...style,
        position: editableOverlay ? style.position : 'relative',
        touchAction: editableOverlay ? 'none' : undefined,
    }
}

function isEditableOverlay(widget: PageWidget) {
    return (
        ['sticker', 'text', 'image', 'spacer'].includes(widget.type) &&
        Boolean(widget.settings.allow_overlap)
    )
}

interface HomePreviewData {
    weeklyChart: WorkItem[]
    todayReleases: WorkItem[]
    todayTopViews: WorkItem[]
    todayTopLikes: WorkItem[]
    freshReleases: WorkItem[]
    latestChapters: ChapterItem[]
    dailyWorks: WorkItem[]
    popularWorks: WorkItem[]
    topLikedWorks: WorkItem[]
}

interface ArtsPreviewData {
    featured_artists: {
        id: string
        name: string
        username: string
        avatar: string | null
        artist_title: string | null
    }[]
    tags: { label: string; artists_count: number }[]
    arts: { data: Art[] }
}

interface CommissionPreviewData {
    commissions: { data: CommissionService[] }
}

export default function PageCustomizer() {
    const [page, setPage] = useState<PageKey>('home')
    const [widgets, setWidgets] = useState<PageWidget[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)
    const queryClient = useQueryClient()

    const layout = useQuery({
        queryKey: ['admin-page-layout', page],
        queryFn: () => pageLayoutApi.adminShow(page).then((res) => res.data),
    })

    const homePreview = useQuery<HomePreviewData>({
        queryKey: ['page-builder-home-preview'],
        enabled: page === 'home',
        queryFn: () => api.get('/public/home').then((res) => res.data),
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
        queryFn: () => publicApi.getCommissions().then((res) => res.data),
        staleTime: 60_000,
    })

    useEffect(() => {
        setWidgets(layout.data?.widgets ?? [])
        setSelectedId(null)
    }, [layout.data?.widgets])

    const invalidatePagePreview = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-page-layout', page] })

        if (page === 'home') {
            queryClient.invalidateQueries({ queryKey: ['home'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-home-preview'] })
        }

        if (page === 'arts') {
            queryClient.invalidateQueries({ queryKey: ['public-arts'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-arts-preview'] })
        }

        if (page === 'commissions') {
            queryClient.invalidateQueries({ queryKey: ['public-commissions'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-commissions-preview'] })
        }
    }

    const widgetsForSave = () => {
        const canvas = document.querySelector<HTMLElement>('[data-page-canvas="true"]')
        const canvasRect = canvas?.getBoundingClientRect()
        if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) return widgets

        return widgets.map((widget) => {
            if (!isEditableOverlay(widget)) return widget

            const frame = document.querySelector<HTMLElement>(
                `[data-page-widget-id="${widget.id}"]`
            )
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
        const frame = Array.from(
            document.querySelectorAll<HTMLElement>('[data-page-widget-id]')
        ).find((element) => element.dataset.pageWidgetId === id)
        const canvas = frame?.closest<HTMLElement>('[data-page-canvas="true"]')
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

        const payload = JSON.parse(raw) as {
            source: 'palette' | 'canvas'
            type?: string
            id?: string
        }
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

            <div className="grid w-full gap-0 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
                <aside className="h-fit border-r bg-background p-4 xl:sticky xl:top-[73px]">
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
                                                selected={selectedId === widget.id}
                                                homeData={homePreview.data}
                                                artsData={artsPreview.data}
                                                commissionData={commissionsPreview.data}
                                                onSelect={() => setSelectedId(widget.id)}
                                                onRemove={() => removeWidget(widget.id)}
                                                onChange={(updater) => updateWidget(widget.id, updater)}
                                                onOverlayStyleChange={updateOverlayWidgetStyle}
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

                <aside className="h-fit bg-background p-4 xl:sticky xl:top-[73px]">
                    <Inspector
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
    selected,
    homeData,
    artsData,
    commissionData,
    onSelect,
    onRemove,
    onChange,
    onOverlayStyleChange,
    onDragOver,
    onDrop,
}: {
    page: PageKey
    widget: PageWidget
    selected: boolean
    homeData?: HomePreviewData
    artsData?: ArtsPreviewData
    commissionData?: CommissionPreviewData
    onSelect: () => void
    onRemove: () => void
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
    onOverlayStyleChange: (id: string, style: Partial<PageWidget['style']>) => void
    onDragOver?: (event: DragEvent<HTMLElement>) => void
    onDrop?: (event: DragEvent<HTMLElement>) => void
}) {
    const frameStyle = previewFrameStyle(widget)
    const editableOverlay = isEditableOverlay(widget)
    const resizableCustom = ['sticker', 'text', 'image', 'board', 'spacer'].includes(widget.type)

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

        const move = (moveEvent: PointerEvent) => {
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
        }

        const end = () => {
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

        const move = (moveEvent: PointerEvent) => {
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
        }

        const end = () => {
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

        const move = (moveEvent: PointerEvent) => {
            const angle =
                (Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180) /
                Math.PI
            onOverlayStyleChange(widget.id, {
                rotate: Math.round(angle + 45),
            })
        }

        const end = () => {
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
                homeData={homeData}
                artsData={artsData}
                commissionData={commissionData}
                onChange={onChange}
            />
        </section>
    )
}

function WidgetContent({
    page,
    widget,
    homeData,
    artsData,
    commissionData,
    onChange,
}: {
    page: PageKey
    widget: PageWidget
    homeData?: HomePreviewData
    artsData?: ArtsPreviewData
    commissionData?: CommissionPreviewData
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
}) {
    if (!widget.enabled) {
        return null
    }

    if (widget.type === 'board') {
        return <EditableBoardWidget widget={widget} onChange={onChange} />
    }

    if (['text', 'image', 'sticker', 'spacer'].includes(widget.type)) {
        return <CustomContentWidget widget={widget} />
    }

    if (page === 'home') {
        return <HomeWidget widget={widget} data={homeData} />
    }

    if (page === 'arts') {
        return <ArtsWidget widget={widget} data={artsData} />
    }

    return <CommissionWidget widget={widget} data={commissionData} />
}

function HomeWidget({ widget, data }: { widget: PageWidget; data?: HomePreviewData }) {
    const cover = (path: string | null, variant?: 'sm') => (path ? storageUrl(path, variant) : null)
    const filter = widget.settings.filter ?? 'all'
    const limit = widget.settings.limit ?? 12
    const byType = (works: WorkItem[] = []) =>
        filter === 'all'
            ? works
            : works.filter((work) => {
                  if (filter === 'novel') return work.type === 'wattpad'
                  if (filter === 'art') return work.type === 'art'
                  return work.type === 'webtoon'
              })

    if (widget.type === 'hero') {
        return (
            <BuilderPreviewLabel label="Hero">
                <HeroSection audience="public" />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'announcement_hero') {
        return (
            <BuilderPreviewLabel label="Announcement Hero">
                <HeroSection audience="public" />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'announcement_banner') {
        return (
            <BuilderPreviewLabel label="Announcement Banner">
                <AnnouncementWidget audience="public" />
            </BuilderPreviewLabel>
        )
    }
    if (widget.type === 'weekly')
        return (
            <WeeklyChartSection
                weeklyChart={byType(data?.weeklyChart).slice(0, limit)}
                cover={cover}
            />
        )
    if (widget.type === 'today_releases' || widget.type === 'daily') {
        const source = data?.todayReleases?.length ? data.todayReleases : data?.dailyWorks
        return (
            <WorkGrid
                title={widget.title || "Today's Releases"}
                works={byType(source).slice(0, limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'today_top') {
        const source =
            widget.settings.metric === 'likes' ? data?.todayTopLikes : data?.todayTopViews
        return (
            <WorkGrid
                title={widget.title || "Today's Top 10"}
                works={byType(source).slice(0, limit)}
                cover={cover}
                metric={widget.settings.metric ?? 'views'}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    }
    if (widget.type === 'fresh')
        return (
            <FreshReleasesSection
                freshReleases={byType(data?.freshReleases).slice(0, limit)}
                cover={cover}
            />
        )
    if (widget.type === 'latest')
        return (
            <LatestChaptersSection
                latestChapters={(data?.latestChapters ?? []).slice(0, limit)}
                cover={cover}
            />
        )
    if (widget.type === 'popular')
        return (
            <WorkGrid
                title={widget.title}
                works={byType(data?.popularWorks).slice(0, limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )
    if (widget.type === 'top_liker')
        return (
            <WorkGrid
                title={widget.title}
                works={byType(data?.topLikedWorks).slice(0, limit)}
                cover={cover}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_title_description'}
            />
        )

    return <EmptyWidget />
}

function WorkGrid({
    title,
    works,
    cover,
    compact = false,
    metric,
    columns,
    infoLayout = 'image_title',
}: {
    title: string
    works: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    compact?: boolean
    metric?: 'views' | 'likes'
    columns?: number
    infoLayout?: string
}) {
    if (works.length === 0) return <EmptyWidget />
    const hrefFor = (work: WorkItem) =>
        work.type === 'art'
            ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
            : work.content_type === 'chapter' && work.chapter_slug
              ? `/works/${work.slug}/chapters/${work.chapter_slug}`
              : `/works/${work.slug}`
    const imageFor = (work: WorkItem) => cover(work.cover, work.type === 'art' ? undefined : 'sm')
    const labelFor = (work: WorkItem) => {
        if (work.content_type === 'chapter' && metric === 'likes')
            return `Ch. ${work.chapter_order ?? ''} · ${work.period_likes ?? work.likes ?? 0} likes today`
        if (work.content_type === 'chapter' && metric === 'views')
            return `Ch. ${work.chapter_order ?? ''} · ${work.period_views ?? work.views ?? 0} views today`
        if (work.content_type === 'chapter')
            return `Ch. ${work.chapter_order ?? ''} · ${work.release_title ?? 'New chapter'}`
        if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes today`
        if (metric === 'views') return `${work.period_views ?? work.views ?? 0} views today`
        return work.type === 'art' ? 'Art' : work.type === 'webtoon' ? 'Webtoon' : 'Novel'
    }

    return (
        <section className="mx-auto mt-10 w-full max-w-[1360px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={
                    !compact && columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className={
                    compact
                        ? 'flex items-stretch gap-3 overflow-x-auto pb-2'
                        : 'grid grid-cols-3 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6'
                }
            >
                {works.map((work, index) => (
                    <Link
                        key={work.id}
                        to={hrefFor(work)}
                        className={compact ? 'block h-full w-36 shrink-0' : 'block h-full'}
                    >
                        <PreviewInfoCard
                            image={imageFor(work)}
                            title={work.title}
                            description={labelFor(work)}
                            layout={infoLayout}
                            compact={compact}
                            rank={compact ? index + 1 : undefined}
                        />
                    </Link>
                ))}
            </div>
        </section>
    )
}

function ArtsWidget({ widget, data }: { widget: PageWidget; data?: ArtsPreviewData }) {
    if (widget.type === 'featured_artists') {
        const artists = data?.featured_artists ?? []
        if (artists.length === 0) return <EmptyWidget />

        return (
            <section className="mx-auto max-w-[1360px] px-5 py-6">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest">
                    {widget.title}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {artists.map((artist) => (
                        <Link
                            key={artist.id}
                            to={`/artists/${artist.username}`}
                            className="w-44 shrink-0 rounded-lg border bg-muted/20 p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded-full bg-primary text-primary-foreground">
                                    {artist.avatar ? (
                                        <img
                                            src={storageUrl(artist.avatar)!}
                                            alt={artist.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                                            {artist.name[0] ?? 'A'}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{artist.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{artist.username}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )
    }

    if (widget.type === 'labels') {
        const tags = data?.tags ?? []
        if (tags.length === 0) return <EmptyWidget />

        return (
            <section className="mx-auto max-w-[1360px] px-5 py-5">
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag.label}
                            className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                        >
                            {tag.label} . {tag.artists_count} artists
                        </span>
                    ))}
                </div>
            </section>
        )
    }

    if (widget.type === 'arts_grid') {
        return (
            <ImageGrid
                title={widget.title}
                items={(data?.arts.data ?? []).map((art) => ({
                    id: art.id,
                    title: art.title,
                    description: art.labels?.join(', ') ?? '',
                    image: art.images?.[0]?.image_path ?? art.image_path,
                }))}
                grid={widget.settings.grid ?? 'masonry'}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_only'}
            />
        )
    }

    return <EmptyWidget />
}

function CommissionWidget({ widget, data }: { widget: PageWidget; data?: CommissionPreviewData }) {
    if (widget.type === 'commission_grid' || widget.type === 'boosted_commissions') {
        const commissions = data?.commissions.data ?? []
        const items =
            widget.type === 'boosted_commissions'
                ? commissions.filter((commission) => commission.boosted_until)
                : commissions

        return (
            <ImageGrid
                title={widget.title}
                items={items.map((commission) => ({
                    id: commission.id,
                    title: commission.title,
                    description: commission.status,
                    image: commission.image_path ?? commission.artist?.avatar ?? null,
                }))}
                grid={widget.settings.grid ?? 'masonry'}
                columns={widget.settings.columns}
                infoLayout={widget.settings.info_layout ?? 'image_only'}
            />
        )
    }

    return <EmptyWidget />
}

function ImageGrid({
    title,
    items,
    grid,
    columns,
    infoLayout = 'image_only',
}: {
    title: string
    items: { id: string; title: string; description?: string; image: string | null }[]
    grid: string
    columns?: number
    infoLayout?: string
}) {
    if (items.length === 0) return <EmptyWidget />

    const content = items.slice(0, 24).map((item) => (
        <article key={item.id} className={grid === 'masonry' ? 'mb-4 break-inside-avoid' : 'h-full'}>
            <PreviewInfoCard
                image={item.image ? storageUrl(item.image)! : null}
                title={item.title}
                description={item.description}
                layout={infoLayout}
                imageClass="h-full w-full object-cover"
            />
        </article>
    ))

    return (
        <section className="mx-auto max-w-[1360px] px-5 py-6">
            <h2 className="mb-4 text-2xl font-bold">{title}</h2>
            <div
                style={
                    columns
                        ? grid === 'masonry'
                            ? { columnCount: columns }
                            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className={
                    grid === 'masonry'
                        ? 'columns-2 gap-4 md:columns-3 lg:columns-4'
                        : grid === 'gallery'
                          ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
                          : 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5'
                }
            >
                {content}
            </div>
        </section>
    )
}

function PreviewInfoCard({
    image,
    title,
    description,
    layout,
    compact = false,
    rank,
    imageClass = 'h-full w-full object-cover',
}: {
    image: string | null
    title: string
    description?: string
    layout: string
    compact?: boolean
    rank?: number
    imageClass?: string
}) {
    const imageNode = (
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            {image ? (
                <img src={image} alt={title} className={imageClass} />
            ) : (
                <div className="aspect-square" />
            )}
            {rank && (
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{rank}
                </span>
            )}
        </div>
    )
    const titleNode = <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
    const descriptionNode = description ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
    ) : null

    if (layout === 'image_only') return imageNode

    if (layout === 'image_title_inline') {
        return (
            <div className="flex h-full items-center gap-3">
                <div className="w-20 shrink-0">{imageNode}</div>
                <div className="min-w-0">
                    {titleNode}
                    {descriptionNode}
                </div>
            </div>
        )
    }

    if (layout === 'title_image') {
        return (
            <div className="flex h-full flex-col">
                {titleNode}
                {imageNode}
                {descriptionNode}
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            {imageNode}
            {titleNode}
            {layout === 'image_title_description' && descriptionNode}
            {layout === 'image_title' && compact && descriptionNode}
        </div>
    )
}

function CustomContentWidget({ widget }: { widget: PageWidget }) {
    return <CustomPageWidgetContent widget={widget} />
}

function EditableBoardWidget({
    widget,
    onChange,
}: {
    widget: PageWidget
    onChange: (updater: (widget: PageWidget) => PageWidget) => void
}) {
    const width = widget.style.content_width ?? 960
    const height = widget.style.content_height ?? 420
    const selectedId = widget.settings.selected_board_item_id
    const items = widget.settings.board_items ?? []
    const [snapGuide, setSnapGuide] = useState<{ x: boolean; y: boolean }>({
        x: false,
        y: false,
    })

    const updateItem = (id: string, updater: (item: PageBoardItem) => PageBoardItem) => {
        onChange((current) => ({
            ...current,
            settings: {
                ...current.settings,
                selected_board_item_id: id,
                board_items: (current.settings.board_items ?? []).map((item) =>
                    item.id === id ? updater(item) : item
                ),
            },
        }))
    }

    const startDrag = (event: ReactPointerEvent<HTMLElement>, item: PageBoardItem) => {
        if ((event.target as HTMLElement).closest('[data-board-resize="true"]')) return
        event.preventDefault()
        event.stopPropagation()

        const board = event.currentTarget.parentElement
        const boardRect = board?.getBoundingClientRect()
        if (!boardRect) return

        const startX = event.clientX
        const startY = event.clientY
        const initialX = item.x
        const initialY = item.y
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const move = (moveEvent: PointerEvent) => {
            const dxPercent = ((moveEvent.clientX - startX) / boardRect.width) * 100
            const dy = moveEvent.clientY - startY
            const rawX = clamp(initialX + dxPercent, 0, 100 - item.w)
            const rawY = clamp(initialY + dy, 0, height - item.h)
            const shouldSnapX = Math.abs(rawX + item.w / 2 - 50) <= 1.25
            const shouldSnapY = Math.abs(rawY + item.h / 2 - height / 2) <= 10
            const nextX = shouldSnapX ? clamp(50 - item.w / 2, 0, 100 - item.w) : rawX
            const nextY = shouldSnapY ? clamp(height / 2 - item.h / 2, 0, height - item.h) : rawY
            setSnapGuide({ x: shouldSnapX, y: shouldSnapY })
            updateItem(item.id, (current) => ({
                ...current,
                x: Number(nextX.toFixed(3)),
                y: Math.round(nextY),
            }))
        }

        const end = () => {
            setSnapGuide({ x: false, y: false })
            document.body.style.userSelect = previousUserSelect
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    const startResize = (event: ReactPointerEvent<HTMLElement>, item: PageBoardItem) => {
        event.preventDefault()
        event.stopPropagation()

        const board = event.currentTarget.closest<HTMLElement>('[data-page-board="true"]')
        const boardRect = board?.getBoundingClientRect()
        if (!boardRect) return

        const startX = event.clientX
        const startY = event.clientY
        const initialW = item.w
        const initialH = item.h
        const previousUserSelect = document.body.style.userSelect
        document.body.style.userSelect = 'none'

        const move = (moveEvent: PointerEvent) => {
            const dwPercent = ((moveEvent.clientX - startX) / boardRect.width) * 100
            const dh = moveEvent.clientY - startY
            updateItem(item.id, (current) => ({
                ...current,
                w: Number(clamp(initialW + dwPercent, 4, 100 - current.x).toFixed(3)),
                h: Math.round(clamp(initialH + dh, 24, height - current.y)),
            }))
        }

        const end = () => {
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
        <section className="w-full py-6">
            <div
                data-page-board="true"
                className="relative mx-auto overflow-hidden bg-background/70"
                style={{
                    width: `min(${width}px, 100%)`,
                    height: `${height}px`,
                    background: widget.style.transparent
                        ? 'transparent'
                        : cssColor(widget.style.background) ?? 'transparent',
                    border: widget.style.border
                        ? `1px solid ${cssColor(widget.style.border_color) ?? 'var(--border, #d4d4d8)'}`
                        : '1px dashed rgba(14, 165, 233, 0.45)',
                    borderRadius: `${widget.style.radius ?? 0}px`,
                    backgroundImage:
                        'linear-gradient(to right, rgba(14, 165, 233, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.14) 1px, transparent 1px)',
                    backgroundSize: '5% 40px',
                }}
            >
                {items.length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Add stickers, images, or text from Board settings.
                    </div>
                )}
                {snapGuide.x && (
                    <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-[999] w-px bg-red-500" />
                )}
                {snapGuide.y && (
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-[999] h-px bg-red-500" />
                )}
                {items.map((item) => {
                    const itemStyle = item.style ?? {}
                    const imagePath =
                        item.type === 'sticker'
                            ? item.sticker_image_path || item.asset_path
                            : item.asset_path
                    const src = imagePath ? storageUrl(imagePath) : null
                    const selected = selectedId === item.id

                    return (
                        <div
                            key={item.id}
                            onPointerDown={(event) => startDrag(event, item)}
                            className={`absolute cursor-move ${
                                selected
                                    ? 'outline outline-2 outline-sky-500'
                                    : 'outline outline-1 outline-transparent hover:outline-sky-400'
                            }`}
                            style={{
                                left: `${item.x}%`,
                                top: `${item.y}px`,
                                width: `${item.w}%`,
                                height: `${item.h}px`,
                                background: itemStyle.transparent
                                    ? 'transparent'
                                    : cssColor(itemStyle.background) ?? 'transparent',
                                border: itemStyle.border
                                    ? `1px solid ${cssColor(itemStyle.border_color) ?? 'var(--border, #d4d4d8)'}`
                                    : undefined,
                                borderRadius: `${itemStyle.radius ?? 0}px`,
                                padding: `${itemStyle.padding_block ?? itemStyle.padding ?? 0}px ${itemStyle.padding_inline ?? itemStyle.padding ?? 0}px`,
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                transform: itemStyle.rotate
                                    ? `rotate(${itemStyle.rotate}deg)`
                                    : undefined,
                                zIndex: itemStyle.z_index ?? 1,
                            }}
                        >
                            {item.type === 'text' ? (
                                <div
                                    className="h-full w-full whitespace-pre-line break-words"
                                    style={{
                                        color: cssColor(itemStyle.text_color),
                                        fontFamily:
                                            itemStyle.font_family || fontFamilyFromUrl(item.font_url),
                                        fontSize: `${itemStyle.font_size ?? 16}px`,
                                        textAlign: itemStyle.text_align ?? 'start',
                                    }}
                                >
                                    {item.text}
                                </div>
                            ) : src ? (
                                <img
                                    src={src}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center rounded border bg-muted/60 text-xs text-muted-foreground">
                                    Select {item.type}
                                </div>
                            )}
                            {selected && (
                                <button
                                    type="button"
                                    data-board-resize="true"
                                    onPointerDown={(event) => startResize(event, item)}
                                    className="absolute -bottom-3 -right-3 h-7 w-7 cursor-nwse-resize rounded-full bg-white shadow ring-2 ring-sky-500"
                                    title="Resize board item"
                                    aria-label="Resize board item"
                                >
                                    <span className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-500" />
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function EmptyWidget() {
    return null
}

function BuilderPreviewLabel({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-24">
            <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground shadow ring-1 ring-border">
                {label}
            </div>
            {children}
        </div>
    )
}

function Inspector({
    page,
    widget,
    onChange,
    onRemove,
    onOverlayPlacementChange,
}: {
    page: PageKey
    widget: PageWidget | null
    onChange: (id: string, updater: (widget: PageWidget) => PageWidget) => void
    onRemove: (id: string) => void
    onOverlayPlacementChange: (id: string, enabled: boolean) => void
}) {
    const upload = useMutation({
        mutationFn: (file: File) => {
            const payload = new FormData()
            payload.append('asset', file)
            return pageLayoutApi.uploadAsset(payload).then((res) => res.data)
        },
        onSuccess: (data) => {
            if (!widget) return
            onChange(widget.id, (current) => ({
                ...current,
                settings: { ...current.settings, asset_path: data.path },
            }))
            toast.success('Asset uploaded.')
        },
        onError: () => toast.error('Could not upload asset.'),
    })
    const userStickerLibrary = useQuery<ArtistSticker[]>({
        queryKey: ['page-builder-sticker-library'],
        queryFn: () => commentsApi.stickerLibrary().then((res) => res.data.data),
        enabled: widget?.type === 'sticker' || widget?.type === 'board',
        staleTime: 60_000,
    })
    const adminStickerLibrary = useQuery<ArtistSticker[]>({
        queryKey: ['page-builder-admin-sticker-library'],
        queryFn: () => adminArtsApi.stickers().then((res) => res.data.data),
        enabled: widget?.type === 'sticker' || widget?.type === 'board',
        staleTime: 60_000,
    })
    const stickerLibrary = useMemo(() => {
        const stickers = [...(adminStickerLibrary.data ?? []), ...(userStickerLibrary.data ?? [])]
        return Array.from(new Map(stickers.map((sticker) => [sticker.id, sticker])).values())
    }, [adminStickerLibrary.data, userStickerLibrary.data])
    const stickersLoading = adminStickerLibrary.isLoading || userStickerLibrary.isLoading

    if (!widget) {
        return (
            <div>
                <h2 className="text-sm font-semibold">Widget settings</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Click the corner settings button on a preview block to edit content, box style,
                    and layout.
                </p>
            </div>
        )
    }

    const setField = <K extends keyof PageWidget>(key: K, value: PageWidget[K]) => {
        onChange(widget.id, (current) => ({ ...current, [key]: value }))
    }

    const setSetting = (key: string, value: unknown) => {
        onChange(widget.id, (current) => ({
            ...current,
            settings: { ...current.settings, [key]: value },
        }))
    }

    const setStyle = (key: string, value: string | number | boolean) => {
        onChange(widget.id, (current) => ({
            ...current,
            style: { ...current.style, [key]: value },
        }))
    }

    const assetUrl = widget.settings.asset_path ? storageUrl(widget.settings.asset_path) : null
    const selectedStickerUrl = widget.settings.sticker_image_path
        ? storageUrl(widget.settings.sticker_image_path)
        : null
    const boardItems = widget.settings.board_items ?? []
    const selectedBoardItem =
        boardItems.find((item) => item.id === widget.settings.selected_board_item_id) ??
        boardItems[0] ??
        null
    const updateBoardItems = (items: PageBoardItem[], selectedId?: string) => {
        onChange(widget.id, (current) => ({
            ...current,
            settings: {
                ...current.settings,
                board_items: items,
                selected_board_item_id: selectedId ?? current.settings.selected_board_item_id,
            },
        }))
    }
    const updateBoardItem = (itemId: string, updater: (item: PageBoardItem) => PageBoardItem) => {
        updateBoardItems(
            boardItems.map((item) => (item.id === itemId ? updater(item) : item)),
            itemId
        )
    }
    const uploadBoardItemAsset = (file: File, itemId: string) => {
        const payload = new FormData()
        payload.append('asset', file)
        pageLayoutApi
            .uploadAsset(payload)
            .then((res) => {
                updateBoardItem(itemId, (item) => ({ ...item, asset_path: res.data.path }))
                toast.success('Board image uploaded.')
            })
            .catch(() => toast.error('Could not upload board image.'))
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {WIDGET_TYPES[page].find((type) => type.value === widget.type)?.label ??
                            widget.type}
                    </p>
                    <h2 className="text-sm font-semibold">Widget settings</h2>
                </div>
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(widget.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <SettingsSection title="Content">
                <div>
                    <Label>Title</Label>
                    <Input
                        value={widget.title}
                        onChange={(event) => setField('title', event.target.value)}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={(event) => setField('enabled', event.target.checked)}
                    />
                    Enabled
                </label>

                {widget.type === 'text' && (
                    <>
                        <div>
                            <Label>Text</Label>
                            <textarea
                                value={widget.settings.text ?? ''}
                                onChange={(event) => setSetting('text', event.target.value)}
                                className="mt-1 min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                            />
                        </div>
                        <div>
                            <Label>Font name</Label>
                            <Input
                                value={widget.style.font_family ?? ''}
                                onChange={(event) => setStyle('font_family', event.target.value)}
                                placeholder={
                                    fontFamilyFromUrl(widget.settings.font_url) ??
                                    'Inter, Poppins, MyFont'
                                }
                            />
                        </div>
                        <div>
                            <Label>Font CDN / import URL</Label>
                            <Input
                                value={widget.settings.font_url ?? ''}
                                onChange={(event) => {
                                    setSetting('font_url', event.target.value)
                                    const family = fontFamilyFromUrl(event.target.value)
                                    if (family && !widget.style.font_family)
                                        setStyle('font_family', family)
                                }}
                                placeholder="https://fonts.googleapis.com/css2?family=Poppins..."
                            />
                        </div>
                    </>
                )}

                {widget.type === 'sticker' && (
                    <div>
                        <Label>Sticker</Label>
                        {selectedStickerUrl && (
                            <img
                                src={selectedStickerUrl}
                                alt={widget.title}
                                className="mt-2 h-24 w-24 object-contain"
                            />
                        )}
                        <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
                            {stickerLibrary.map((sticker) => {
                                const selected = widget.settings.sticker_id === sticker.id

                                return (
                                    <button
                                        key={sticker.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(widget.id, (current) => ({
                                                ...current,
                                                title: current.title || sticker.name,
                                                settings: {
                                                    ...current.settings,
                                                    sticker_id: sticker.id,
                                                    sticker_image_path: sticker.image_path,
                                                    asset_path: '',
                                                },
                                            }))
                                        }}
                                        className={`flex h-24 items-center justify-center rounded-md bg-background p-2 transition ${
                                            selected
                                                ? 'ring-2 ring-sky-500'
                                                : 'ring-1 ring-transparent hover:ring-border'
                                        }`}
                                        title={sticker.name}
                                    >
                                        <img
                                            src={storageUrl(sticker.image_path)!}
                                            alt={sticker.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </button>
                                )
                            })}
                            {stickersLoading && (
                                <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">
                                    Loading stickers...
                                </p>
                            )}
                            {!stickersLoading &&
                                stickerLibrary.length === 0 && (
                                    <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">
                                        No stickers in your library yet.
                                    </p>
                                )}
                        </div>
                    </div>
                )}

                {widget.type === 'image' && (
                    <div>
                        <Label>Image</Label>
                        {assetUrl && (
                            <img
                                src={assetUrl}
                                alt=""
                                className="mt-2 max-h-32 rounded-md object-contain"
                            />
                        )}
                        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60">
                            <ImagePlus className="h-4 w-4" />
                            Upload asset
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    const file = event.target.files?.[0]
                                    if (file) upload.mutate(file)
                                }}
                            />
                        </label>
                    </div>
                )}

                {widget.type === 'board' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {(['sticker', 'image', 'text'] as const).map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const item = createBoardItem(type, boardItems.length)
                                        updateBoardItems([...boardItems, item], item.id)
                                    }}
                                >
                                    Add {type}
                                </Button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {boardItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSetting('selected_board_item_id', item.id)}
                                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                                        selectedBoardItem?.id === item.id
                                            ? 'border-sky-500 bg-sky-500/10'
                                            : 'bg-background'
                                    }`}
                                >
                                    <span>{item.type}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round(item.x)}%, {item.y}px
                                    </span>
                                </button>
                            ))}
                        </div>
                        {selectedBoardItem && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                        Selected {selectedBoardItem.type}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            const next = boardItems.filter(
                                                (item) => item.id !== selectedBoardItem.id
                                            )
                                            updateBoardItems(next, next[0]?.id)
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                {selectedBoardItem.type === 'text' && (
                                    <>
                                        <div>
                                            <Label>Text</Label>
                                            <textarea
                                                value={selectedBoardItem.text ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(selectedBoardItem.id, (item) => ({
                                                        ...item,
                                                        text: event.target.value,
                                                    }))
                                                }
                                                className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label>Font name</Label>
                                            <Input
                                                value={selectedBoardItem.style?.font_family ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(selectedBoardItem.id, (item) => ({
                                                        ...item,
                                                        style: {
                                                            ...item.style,
                                                            font_family: event.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Font CDN / import URL</Label>
                                            <Input
                                                value={selectedBoardItem.font_url ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(selectedBoardItem.id, (item) => ({
                                                        ...item,
                                                        font_url: event.target.value,
                                                        style: {
                                                            ...item.style,
                                                            font_family:
                                                                item.style?.font_family ||
                                                                fontFamilyFromUrl(event.target.value) ||
                                                                item.style?.font_family,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {selectedBoardItem.type === 'image' && (
                                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60">
                                        <ImagePlus className="h-4 w-4" />
                                        Upload board image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                const file = event.target.files?.[0]
                                                if (file)
                                                    uploadBoardItemAsset(file, selectedBoardItem.id)
                                            }}
                                        />
                                    </label>
                                )}
                                {selectedBoardItem.type === 'sticker' && (
                                    <div>
                                        <Label>Sticker</Label>
                                        <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
                                            {stickerLibrary.map((sticker) => (
                                                <button
                                                    key={sticker.id}
                                                    type="button"
                                                    onClick={() =>
                                                        updateBoardItem(
                                                            selectedBoardItem.id,
                                                            (item) => ({
                                                                ...item,
                                                                sticker_id: sticker.id,
                                                                sticker_image_path:
                                                                    sticker.image_path,
                                                                asset_path: '',
                                                            })
                                                        )
                                                    }
                                                    className={`flex h-24 items-center justify-center rounded-md bg-background p-2 transition ${
                                                        selectedBoardItem.sticker_id === sticker.id
                                                            ? 'ring-2 ring-sky-500'
                                                            : 'ring-1 ring-transparent hover:ring-border'
                                                    }`}
                                                    title={sticker.name}
                                                >
                                                    <img
                                                        src={storageUrl(sticker.image_path)!}
                                                        alt={sticker.name}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3 border-t pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Box style for this board content
                                    </p>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(selectedBoardItem.style?.transparent ?? true)}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        transparent: event.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        Transparent background
                                    </label>
                                    <div>
                                        <Label>Background color</Label>
                                        <Input
                                            value={selectedBoardItem.style?.background ?? ''}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        background: event.target.value,
                                                        transparent: event.target.value.trim()
                                                            ? false
                                                            : item.style?.transparent,
                                                    },
                                                }))
                                            }
                                            placeholder="F54927 or #F54927"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(selectedBoardItem.style?.border)}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        border: event.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        Show border
                                    </label>
                                    <div>
                                        <Label>Border color</Label>
                                        <Input
                                            value={selectedBoardItem.style?.border_color ?? ''}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        border_color: event.target.value,
                                                        border: event.target.value.trim()
                                                            ? true
                                                            : item.style?.border,
                                                    },
                                                }))
                                            }
                                            placeholder="d4d4d8 or #d4d4d8"
                                        />
                                    </div>
                                    <NumberField
                                        label="Border radius"
                                        value={selectedBoardItem.style?.radius ?? 0}
                                        min={0}
                                        max={80}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, radius: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Padding block"
                                        value={
                                            selectedBoardItem.style?.padding_block ??
                                            selectedBoardItem.style?.padding ??
                                            0
                                        }
                                        min={0}
                                        max={120}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, padding_block: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Padding inline"
                                        value={
                                            selectedBoardItem.style?.padding_inline ??
                                            selectedBoardItem.style?.padding ??
                                            0
                                        }
                                        min={0}
                                        max={120}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, padding_inline: value },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-3 border-t pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Layout for this board content
                                    </p>
                                    <NumberField
                                        label="X position %"
                                        value={selectedBoardItem.x}
                                        min={0}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                x: clamp(value, 0, 100 - item.w),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Y position"
                                        value={selectedBoardItem.y}
                                        min={0}
                                        max={widget.style.content_height ?? 420}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                y: clamp(value, 0, (widget.style.content_height ?? 420) - item.h),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Width %"
                                        value={selectedBoardItem.w}
                                        min={4}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                w: clamp(value, 4, 100 - item.x),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Height"
                                        value={selectedBoardItem.h}
                                        min={24}
                                        max={1600}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                h: clamp(value, 24, (widget.style.content_height ?? 420) - item.y),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Rotate degree"
                                        value={selectedBoardItem.style?.rotate ?? 0}
                                        min={-180}
                                        max={180}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, rotate: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Front / back layer"
                                        value={selectedBoardItem.style?.z_index ?? 1}
                                        min={0}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, z_index: value },
                                            }))
                                        }
                                    />
                                </div>
                                {selectedBoardItem.type === 'text' && (
                                    <div className="space-y-3 border-t pt-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            Text style for this board content
                                        </p>
                                        <NumberField
                                            label="Text size"
                                            value={selectedBoardItem.style?.font_size ?? 16}
                                            min={8}
                                            max={160}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: { ...item.style, font_size: value },
                                                }))
                                            }
                                        />
                                        <SelectField
                                            label="Text align"
                                            value={selectedBoardItem.style?.text_align ?? 'start'}
                                            options={['start', 'center', 'end']}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        text_align: value as 'start' | 'center' | 'end',
                                                    },
                                                }))
                                            }
                                        />
                                        <div>
                                            <Label>Text color</Label>
                                            <Input
                                                value={selectedBoardItem.style?.text_color ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(selectedBoardItem.id, (item) => ({
                                                        ...item,
                                                        style: {
                                                            ...item.style,
                                                            text_color: event.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {['sticker', 'text', 'image', 'spacer'].includes(widget.type) && (
                    <>
                        <SelectField
                            label="Placement"
                            value={
                                widget.settings.allow_overlap
                                    ? 'overlay'
                                    : (widget.settings.placement ?? 'tight')
                            }
                            options={['tight', 'overlay']}
                            onChange={(value) => {
                                onOverlayPlacementChange(widget.id, value === 'overlay')
                            }}
                        />
                    </>
                )}

                {['arts_grid', 'commission_grid', 'boosted_commissions'].includes(widget.type) && (
                    <>
                        <SelectField
                            label="Grid"
                            value={widget.settings.grid ?? 'masonry'}
                            options={GRID_OPTIONS}
                            onChange={(value) => setSetting('grid', value)}
                        />
                        <NumberField
                            label="Columns"
                            value={widget.settings.columns ?? 0}
                            min={0}
                            max={6}
                            onChange={(value) => setSetting('columns', value)}
                        />
                        <SelectField
                            label="Info layout"
                            value={widget.settings.info_layout ?? 'image_only'}
                            options={[
                                'image_only',
                                'image_title',
                                'image_title_inline',
                                'title_image',
                                'image_title_description',
                            ]}
                            onChange={(value) => setSetting('info_layout', value)}
                        />
                    </>
                )}

                {[
                    'weekly',
                    'daily',
                    'today_releases',
                    'today_top',
                    'fresh',
                    'popular',
                    'top_liker',
                ].includes(widget.type) && (
                    <>
                        <SelectField
                            label="Filter"
                            value={widget.settings.filter ?? 'all'}
                            options={['all', 'webtoon', 'novel', 'art']}
                            onChange={(value) => setSetting('filter', value)}
                        />
                        <NumberField
                            label="Columns"
                            value={widget.settings.columns ?? 0}
                            min={0}
                            max={6}
                            onChange={(value) => setSetting('columns', value)}
                        />
                        <SelectField
                            label="Info layout"
                            value={widget.settings.info_layout ?? 'image_title_description'}
                            options={[
                                'image_only',
                                'image_title',
                                'image_title_inline',
                                'title_image',
                                'image_title_description',
                            ]}
                            onChange={(value) => setSetting('info_layout', value)}
                        />
                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 12}
                            min={1}
                            max={30}
                            onChange={(value) => setSetting('limit', value)}
                        />
                        {widget.type === 'today_top' && (
                            <SelectField
                                label="Rank by"
                                value={widget.settings.metric ?? 'views'}
                                options={['views', 'likes']}
                                onChange={(value) => setSetting('metric', value)}
                            />
                        )}
                    </>
                )}
            </SettingsSection>

            <SettingsSection title="Box style">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={Boolean(widget.style.transparent)}
                        onChange={(event) => setStyle('transparent', event.target.checked)}
                    />
                    Transparent background
                </label>
                <div>
                    <Label>Background color</Label>
                    <Input
                        value={widget.style.background ?? ''}
                        onChange={(event) => {
                            setStyle('background', event.target.value)
                            if (event.target.value.trim()) setStyle('transparent', false)
                        }}
                        placeholder="F54927 or #F54927"
                    />
                </div>
                {widget.type === 'text' && (
                    <div>
                        <Label>Text color</Label>
                        <Input
                            value={widget.style.text_color ?? ''}
                            onChange={(event) => setStyle('text_color', event.target.value)}
                            placeholder="111111 or #111111"
                        />
                    </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={Boolean(widget.style.border)}
                        onChange={(event) => setStyle('border', event.target.checked)}
                    />
                    Show border
                </label>
                <div>
                    <Label>Border color</Label>
                    <Input
                        value={widget.style.border_color ?? ''}
                        onChange={(event) => {
                            setStyle('border_color', event.target.value)
                            if (event.target.value.trim()) setStyle('border', true)
                        }}
                        placeholder="d4d4d8 or #d4d4d8"
                    />
                </div>
                <NumberField
                    label="Border radius"
                    value={widget.style.radius ?? 0}
                    max={80}
                    onChange={(value) => setStyle('radius', value)}
                />
                <NumberField
                    label="Padding block"
                    value={widget.style.padding_block ?? widget.style.padding ?? 0}
                    max={120}
                    onChange={(value) => setStyle('padding_block', value)}
                />
                <NumberField
                    label="Padding inline"
                    value={widget.style.padding_inline ?? widget.style.padding ?? 0}
                    max={120}
                    onChange={(value) => setStyle('padding_inline', value)}
                />
                <NumberField
                    label="Margin block"
                    value={widget.style.margin_block ?? widget.style.margin ?? 0}
                    min={-160}
                    max={160}
                    onChange={(value) => setStyle('margin_block', value)}
                />
                <NumberField
                    label="Margin inline"
                    value={widget.style.margin_inline ?? 0}
                    min={-160}
                    max={160}
                    onChange={(value) => setStyle('margin_inline', value)}
                />
                {widget.type === 'text' && (
                    <>
                        <NumberField
                            label="Text width"
                            value={widget.style.content_width ?? 720}
                            min={120}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Text size"
                            value={widget.style.font_size ?? 14}
                            min={8}
                            max={160}
                            onChange={(value) => setStyle('font_size', value)}
                        />
                        <SelectField
                            label="Text align"
                            value={widget.style.text_align ?? 'start'}
                            options={['start', 'center', 'end']}
                            onChange={(value) => setStyle('text_align', value)}
                        />
                    </>
                )}
                {widget.type === 'spacer' && (
                    <>
                        <NumberField
                            label="Space width"
                            value={widget.style.content_width ?? 720}
                            min={48}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Space height"
                            value={widget.style.content_height ?? 120}
                            min={24}
                            max={1200}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                    </>
                )}
                {widget.type === 'image' && (
                    <>
                        <NumberField
                            label="Image width"
                            value={widget.style.content_width ?? 720}
                            min={120}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Image height"
                            value={widget.style.content_height ?? 240}
                            min={24}
                            max={1200}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                    </>
                )}
                {widget.type === 'sticker' && (
                    <>
                        <NumberField
                            label="Sticker size"
                            value={widget.style.sticker_size ?? 160}
                            min={48}
                            max={900}
                            onChange={(value) => setStyle('sticker_size', value)}
                        />
                    </>
                )}
                {widget.type === 'board' && (
                    <>
                        <NumberField
                            label="Board width"
                            value={widget.style.content_width ?? 960}
                            min={240}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Board height"
                            value={widget.style.content_height ?? 420}
                            min={160}
                            max={1600}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                        {selectedBoardItem && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <p className="text-sm font-semibold">Selected board item style</p>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(selectedBoardItem.style?.transparent ?? true)}
                                        onChange={(event) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: {
                                                    ...item.style,
                                                    transparent: event.target.checked,
                                                },
                                            }))
                                        }
                                    />
                                    Transparent background
                                </label>
                                <div>
                                    <Label>Background color</Label>
                                    <Input
                                        value={selectedBoardItem.style?.background ?? ''}
                                        onChange={(event) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: {
                                                    ...item.style,
                                                    background: event.target.value,
                                                    transparent: event.target.value.trim()
                                                        ? false
                                                        : item.style?.transparent,
                                                },
                                            }))
                                        }
                                        placeholder="F54927 or #F54927"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(selectedBoardItem.style?.border)}
                                        onChange={(event) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: {
                                                    ...item.style,
                                                    border: event.target.checked,
                                                },
                                            }))
                                        }
                                    />
                                    Show border
                                </label>
                                <div>
                                    <Label>Border color</Label>
                                    <Input
                                        value={selectedBoardItem.style?.border_color ?? ''}
                                        onChange={(event) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: {
                                                    ...item.style,
                                                    border_color: event.target.value,
                                                    border: event.target.value.trim()
                                                        ? true
                                                        : item.style?.border,
                                                },
                                            }))
                                        }
                                        placeholder="d4d4d8 or #d4d4d8"
                                    />
                                </div>
                                <NumberField
                                    label="Border radius"
                                    value={selectedBoardItem.style?.radius ?? 0}
                                    min={0}
                                    max={80}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            style: { ...item.style, radius: value },
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Padding block"
                                    value={
                                        selectedBoardItem.style?.padding_block ??
                                        selectedBoardItem.style?.padding ??
                                        0
                                    }
                                    min={0}
                                    max={120}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            style: { ...item.style, padding_block: value },
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Padding inline"
                                    value={
                                        selectedBoardItem.style?.padding_inline ??
                                        selectedBoardItem.style?.padding ??
                                        0
                                    }
                                    min={0}
                                    max={120}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            style: { ...item.style, padding_inline: value },
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Width %"
                                    value={selectedBoardItem.w}
                                    min={4}
                                    max={100}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            w: clamp(value, 4, 100 - item.x),
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Height"
                                    value={selectedBoardItem.h}
                                    min={24}
                                    max={1600}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            h: clamp(value, 24, (widget.style.content_height ?? 420) - item.y),
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Rotate degree"
                                    value={selectedBoardItem.style?.rotate ?? 0}
                                    min={-180}
                                    max={180}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            style: { ...item.style, rotate: value },
                                        }))
                                    }
                                />
                                <NumberField
                                    label="Front / back layer"
                                    value={selectedBoardItem.style?.z_index ?? 1}
                                    min={0}
                                    max={100}
                                    onChange={(value) =>
                                        updateBoardItem(selectedBoardItem.id, (item) => ({
                                            ...item,
                                            style: { ...item.style, z_index: value },
                                        }))
                                    }
                                />
                                {selectedBoardItem.type === 'text' && (
                                    <>
                                        <NumberField
                                            label="Text size"
                                            value={selectedBoardItem.style?.font_size ?? 16}
                                            min={8}
                                            max={160}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: { ...item.style, font_size: value },
                                                }))
                                            }
                                        />
                                        <SelectField
                                            label="Text align"
                                            value={selectedBoardItem.style?.text_align ?? 'start'}
                                            options={['start', 'center', 'end']}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: { ...item.style, text_align: value as 'start' | 'center' | 'end' },
                                                }))
                                            }
                                        />
                                        <div>
                                            <Label>Text color</Label>
                                            <Input
                                                value={selectedBoardItem.style?.text_color ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(selectedBoardItem.id, (item) => ({
                                                        ...item,
                                                        style: {
                                                            ...item.style,
                                                            text_color: event.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
                {['sticker', 'text', 'image', 'spacer'].includes(widget.type) &&
                    widget.settings.allow_overlap && (
                        <NumberField
                            label="Rotate degree"
                            value={widget.style.rotate ?? 0}
                            min={-180}
                            max={180}
                            onChange={(value) => setStyle('rotate', value)}
                        />
                    )}
            </SettingsSection>

            <SettingsSection title="Layout">
                <SelectField
                    label="Display"
                    value={widget.settings.display ?? 'block'}
                    options={['block', 'inline']}
                    onChange={(value) => setSetting('display', value)}
                />
                <SelectField
                    label="Direction"
                    value={widget.settings.layout ?? 'horizontal'}
                    options={['horizontal', 'vertical', 'row', 'column', 'compact']}
                    onChange={(value) => setSetting('layout', value)}
                />
                <SelectField
                    label="Align"
                    value={widget.settings.align ?? 'auto'}
                    options={['auto', 'start', 'center', 'end', 'stretch', 'justify']}
                    onChange={(value) => setSetting('align', value)}
                />
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={Boolean(widget.settings.allow_overlap)}
                        onChange={(event) => {
                            onOverlayPlacementChange(widget.id, event.target.checked)
                        }}
                    />
                    {['sticker', 'text', 'image', 'spacer'].includes(widget.type)
                        ? 'Overlay other widgets'
                        : 'Allow overlap'}
                </label>
                {['sticker', 'text', 'image', 'spacer'].includes(widget.type) &&
                widget.settings.allow_overlap ? (
                    <p className="rounded-md bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
                        Drag this widget directly in the preview to place it anywhere.
                    </p>
                ) : (
                    <>
                        <NumberField
                            label="Move X"
                            value={widget.style.offset_x ?? 0}
                            min={-600}
                            max={600}
                            onChange={(value) => setStyle('offset_x', value)}
                        />
                        <NumberField
                            label="Move Y"
                            value={widget.style.offset_y ?? 0}
                            min={-600}
                            max={600}
                            onChange={(value) => setStyle('offset_y', value)}
                        />
                    </>
                )}
                <NumberField
                    label="Front / back layer"
                    value={widget.style.z_index ?? 1}
                    min={0}
                    max={100}
                    onChange={(value) => setStyle('z_index', value)}
                />
            </SettingsSection>
        </div>
    )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3 rounded-lg border p-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </section>
    )
}

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: string
    options: string[]
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

function NumberField({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
}: {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    )
}

function createBoardItem(type: PageBoardItem['type'], index: number): PageBoardItem {
    return {
        id: crypto.randomUUID(),
        type,
        x: 5 + (index % 4) * 8,
        y: 40 + index * 12,
        w: type === 'text' ? 36 : 18,
        h: type === 'text' ? 120 : 160,
        text: type === 'text' ? 'Board text' : '',
        style: {
            transparent: true,
            border: false,
            radius: 0,
            padding_block: 0,
            padding_inline: 0,
            font_size: type === 'text' ? 16 : undefined,
            text_align: type === 'text' ? 'start' : undefined,
            z_index: index + 1,
            rotate: 0,
        },
    }
}

function createWidget(type: string, title: string, index: number): PageWidget {
    return {
        id: crypto.randomUUID(),
        type,
        title,
        enabled: true,
        settings: {
            grid: 'masonry',
            filter: 'all',
            layout: 'horizontal',
            align: 'auto',
            display: 'block',
            columns: undefined,
            info_layout: ['arts_grid', 'commission_grid', 'boosted_commissions'].includes(type)
                ? 'image_only'
                : 'image_title_description',
            placement: type === 'sticker' ? 'tight' : undefined,
            metric: 'views',
            limit: type === 'weekly' || type === 'top_liker' || type === 'today_top' ? 10 : 12,
            allow_overlap: false,
            board_items: type === 'board' ? [] : undefined,
        },
        style: {
            transparent: true,
            border: false,
            radius: 0,
            padding: 0,
            padding_block: 0,
            padding_inline: 0,
            margin: 0,
            margin_block: 0,
            margin_inline: 0,
            offset_x: 0,
            offset_y: 0,
            z_index: index + 1,
            rotate: 0,
            sticker_size: type === 'sticker' ? 180 : undefined,
            content_width:
                type === 'text' ? 720 : type === 'spacer' ? 720 : type === 'board' ? 960 : undefined,
            content_height: type === 'spacer' ? 120 : type === 'board' ? 420 : undefined,
            font_size: type === 'text' ? 14 : undefined,
            text_align: type === 'text' ? 'start' : undefined,
        },
    }
}
