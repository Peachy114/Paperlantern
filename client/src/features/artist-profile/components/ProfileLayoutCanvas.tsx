import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent } from 'react'
import { Layers, Lock, Move, Unlock } from 'lucide-react'
import type { Art } from '@/types/art'
import type { ArtistProfileBlock, ArtistProfileResponse, ProfileCanvasItem, ProfileTabId, ProfileTabsConfig } from '@/types/artistProfile'
import type { CanvasDragState, CanvasItemPatch, DragState, NavDragState, ProfileThemeDraft, TabDragState } from '@/features/artist-profile/types/profileEditor'
import { PROFILE_CANVAS_DROP_MIME, PROFILE_TAB_LABELS } from '@/features/artist-profile/constants/profileEditor'
import { clamp, getCanvasHeight, getCanvasItemPage, getCanvasItemRenderHeight, getCanvasItems, getTabsCanvasHeight, getVisibleProfileTabs, getWidgetImageLimit } from '@/features/artist-profile/utils/profileLayout'
import { filterSortArts, filterSortStickers, filterSortWorks } from '@/features/artist-profile/utils/profileContent'
import { CanvasHandles, CenterGuide, profileTabButtonClass } from '@/features/artist-profile/components/ProfileCanvasHandles'
import { ProfilePageHeading, ProfileWidgetEditControls } from '@/features/artist-profile/components/ProfileCanvasControls'
import { ProfileFeeds } from '@/features/artist-profile/components/ProfileFeeds'
import { ProfileBoard } from '@/features/artist-profile/components/ProfileBoard'
import { ArtsMasonry, ProfileComments, ProfileShopCards, ProfileStickers, WorksGrid } from '@/features/artist-profile/components/ProfilePublicContent'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

function pageSizeForItem(item: ProfileCanvasItem, multipleWidgets: boolean) {
    if (multipleWidgets) return getWidgetImageLimit(item)
    return item.limit && item.limit > 0 ? item.limit : Number.POSITIVE_INFINITY
}

const contentSizePixels = (item: ProfileCanvasItem) => ({
    small: 220,
    medium: 320,
    large: 440,
})[item.content_size ?? 'medium']

// Profile layout canvas ----
export function ProfileTabsNav({
    tabsAreaRef,
    tabIds,
    theme,
    manageProfileMode,
    navStyle,
    onBeginNavDrag,
    onBeginTabDrag,
}: {
    tabsAreaRef: React.RefObject<HTMLDivElement | null>
    tabIds: ProfileTabId[]
    theme: ProfileThemeDraft
    manageProfileMode: boolean
    navStyle?: CSSProperties
    onBeginNavDrag: (event: PointerEvent<HTMLElement>, kind?: NavDragState['kind']) => void
    onBeginTabDrag: (
        event: PointerEvent<HTMLElement>,
        tab: ProfileTabId,
        kind: TabDragState['kind']
    ) => void
}) {
    const isSeparate = theme.navLayout === 'separate'
    const height = isSeparate ? getTabsCanvasHeight(theme.tabsConfig, tabIds) : theme.navH

    return (
        <div
            ref={tabsAreaRef}
            className={`relative max-w-full ${manageProfileMode ? 'touch-none' : ''}`}
            style={navStyle}
        >
            {manageProfileMode && (
                <button
                    type="button"
                    className="absolute -right-3 -top-3 z-20 rounded bg-background p-1 shadow-sm ring-1 ring-border"
                    onPointerDown={onBeginNavDrag}
                    aria-label="Move tabs"
                >
                    <Move className="h-3.5 w-3.5" />
                </button>
            )}
            <TabsList
                className={
                    isSeparate ? 'relative block w-full bg-transparent p-0' : 'max-w-full flex-wrap'
                }
                style={{ minHeight: height, height: isSeparate ? height : undefined }}
            >
                {tabIds.map((tab) => {
                    const position = theme.tabsConfig.positions[tab]
                    const separateStyle: CSSProperties | undefined = isSeparate
                        ? {
                              left: `${position.x}%`,
                              top: position.y,
                              width: `${position.w}%`,
                              height: position.h,
                          }
                        : undefined

                    return (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className={
                                isSeparate
                                    ? 'absolute justify-center border bg-background data-[state=active]:bg-foreground data-[state=active]:text-background'
                                    : ''
                            }
                            style={separateStyle}
                        >
                            <span className="truncate">{PROFILE_TAB_LABELS[tab]}</span>
                            {manageProfileMode && isSeparate && (
                                <>
                                    <span
                                        className="absolute -left-2 -top-2 rounded bg-background p-1 shadow-sm ring-1 ring-border"
                                        onPointerDown={(event) =>
                                            onBeginTabDrag(event, tab, 'move')
                                        }
                                        aria-label={`Move ${PROFILE_TAB_LABELS[tab]}`}
                                    >
                                        <Move className="h-3 w-3" />
                                    </span>
                                    <span
                                        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize border-b-4 border-r-4 border-current"
                                        onPointerDown={(event) =>
                                            onBeginTabDrag(event, tab, 'resize')
                                        }
                                        aria-label={`Resize ${PROFILE_TAB_LABELS[tab]}`}
                                    />
                                </>
                            )}
                        </TabsTrigger>
                    )
                })}
            </TabsList>
        </div>
    )
}

export function ProfileLayoutCanvas({
    refEl,
    profile,
    theme,
    editMode,
    activeTab,
    isStorytellerProfile,
    isAdminProfile,
    boardRef,
    boardBlocks,
    boardHeight,
    boardEditMode,
    boardEditorPanel,
    canEditContent,
    contentEditMode,
    busy,
    selectedBlockId,
    onSelectBlock,
    onActiveTabChange,
    onToggleContentEdit,
    onCancelContentEdit,
    onBeginNavDrag,
    onBeginBlockDrag,
    onBeginCanvasDrag,
    onRemoveCanvasItem,
    onUpdateCanvasItem,
    onThemeChange,
    onSaveTabsConfig,
    onSaveProfile,
    onDropCanvasItem,
    onOpenArt,
}: {
    refEl: React.RefObject<HTMLDivElement | null>
    profile: ArtistProfileResponse
    theme: ProfileThemeDraft
    editMode: boolean
    activeTab: ProfileTabId
    isStorytellerProfile: boolean
    isAdminProfile: boolean
    boardRef: React.RefObject<HTMLDivElement | null>
    boardBlocks: ArtistProfileBlock[]
    boardHeight: number
    boardEditMode: boolean
    boardEditorPanel: React.ReactNode
    canEditContent: boolean
    contentEditMode: boolean
    busy: boolean
    selectedBlockId: string | null
    onSelectBlock: (id: string) => void
    onActiveTabChange: (tab: ProfileTabId) => void
    onToggleContentEdit: () => void
    onCancelContentEdit: () => void
    onBeginNavDrag: (event: PointerEvent<HTMLElement>, kind?: NavDragState['kind']) => void
    onBeginBlockDrag: (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => void
    onBeginCanvasDrag: (
        event: PointerEvent<HTMLElement>,
        item: ProfileCanvasItem,
        kind: CanvasDragState['kind']
    ) => void
    onRemoveCanvasItem: (itemId: string, kind: ProfileCanvasItem['kind']) => void
    onUpdateCanvasItem: (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => void
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
    onSaveTabsConfig: (tabsConfig: ProfileTabsConfig) => void
    onSaveProfile: () => void
    onDropCanvasItem: (event: DragEvent<HTMLDivElement>) => void
    onOpenArt: (art: Art) => void
}) {
    const [widgetPages, setWidgetPages] = useState<Record<string, number>>({})
    const [measuredSectionHeights, setMeasuredSectionHeights] = useState<Record<string, number>>({})
    const sectionNodes = useRef(new Map<string, HTMLElement>())
    const sectionObserver = useRef<ResizeObserver | null>(null)

    useEffect(() => {
        sectionObserver.current = new ResizeObserver((entries) => {
            setMeasuredSectionHeights((current) => {
                let changed = false
                const next = { ...current }
                for (const entry of entries) {
                    const id = (entry.target as HTMLElement).dataset.profileSectionId
                    if (!id) continue
                    const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
                    if (next[id] !== height) {
                        next[id] = height
                        changed = true
                    }
                }
                return changed ? next : current
            })
        })
        sectionNodes.current.forEach((node) => sectionObserver.current?.observe(node))
        return () => sectionObserver.current?.disconnect()
    }, [])

    const registerSection = useCallback((id: string, node: HTMLElement | null) => {
        const previous = sectionNodes.current.get(id)
        if (previous) sectionObserver.current?.unobserve(previous)
        if (node) {
            sectionNodes.current.set(id, node)
            sectionObserver.current?.observe(node)
        } else {
            sectionNodes.current.delete(id)
        }
    }, [])
    const visibleTabs = getVisibleProfileTabs(theme.tabsConfig, isStorytellerProfile)
        .filter((tab) => !isAdminProfile || (tab !== 'arts' && tab !== 'works'))
    const buttons = getCanvasItems(theme.tabsConfig, visibleTabs, 'tab')
    const sections = getCanvasItems(theme.tabsConfig, visibleTabs, 'section').filter(
        (item) => getCanvasItemPage(item) === activeTab
    )
    const hasMultipleContentWidgets = sections.filter((item) => item.type !== 'board').length > 1
    const imageWidgetTypes: ProfileTabId[] = ['arts', 'works', 'stickers', 'shop']
    const itemTotal = (item: ProfileCanvasItem) => {
        if (item.type === 'board') return boardBlocks.length
        if (item.type === 'arts') return filterSortArts(profile.arts, item).length
        if (item.type === 'works') return filterSortWorks(profile.works, item).length
        if (item.type === 'stickers') return filterSortStickers(profile.stickers, item).length
        if (item.type === 'shop') return (profile.shop ?? []).length
        if (item.type === 'feeds') return (profile.feeds ?? []).length
        return (profile.comments ?? []).length
    }
    const sectionHeight = (item: ProfileCanvasItem) => {
        const savedHeight = getCanvasItemRenderHeight(item, boardHeight, Boolean(boardEditorPanel))
        const measuredHeight = measuredSectionHeights[item.id] ?? 0
        if (measuredHeight > 0) return Math.max(item.type === 'board' ? savedHeight : 0, measuredHeight)
        if (!imageWidgetTypes.includes(item.type)) return savedHeight
        const totalItems = item.type === 'arts'
            ? filterSortArts(profile.arts, item).length
            : item.type === 'works'
                ? filterSortWorks(profile.works, item).length
                : item.type === 'shop'
                    ? (profile.shop ?? []).length
                    : filterSortStickers(profile.stickers, item).length
        const pageSize = pageSizeForItem(item, hasMultipleContentWidgets)
        const visibleItems = Number.isFinite(pageSize) ? Math.min(totalItems, pageSize) : totalItems
        const columns = Math.max(1, Math.round(item.w / 18))
        const rows = Math.max(1, Math.ceil(visibleItems / columns))
        const visualSize = contentSizePixels(item)
        const rowHeight = item.type === 'stickers' || item.type === 'shop'
            ? visualSize + 72
            : item.type === 'arts'
                ? Math.round(visualSize * 1.35)
                : Math.round(visualSize * 0.8)
        const controlsHeight = contentEditMode ? 150 : 56
        return Math.max(savedHeight, measuredHeight, rows * rowHeight + controlsHeight + 48)
    }
    const canvasHeight = Math.max(
        getCanvasHeight(
            [...(theme.navLayout === 'separate' ? buttons : []), ...sections],
            sectionHeight
        ),
        theme.navLayout === 'together' ? Math.max(0, 16 + theme.navY + theme.navH + 80) : 0
    )

    const renderSection = (item: ProfileCanvasItem) => {
        const automaticTwoRowLimit = getWidgetImageLimit(item)
        const pageSize = hasMultipleContentWidgets
            ? automaticTwoRowLimit
            : item.limit && item.limit > 0
                ? item.limit
                : Number.POSITIVE_INFINITY
        const page = widgetPages[item.id] ?? 0
        const paginate = <T,>(items: T[]) => (!hasMultipleContentWidgets && item.pagination === false) || !Number.isFinite(pageSize)
            ? items
            : items.slice(page * pageSize, page * pageSize + pageSize)
        if (item.type === 'board') {
            return (
                <>
                    {boardEditorPanel}
                    <ProfileBoard
                        refEl={boardRef}
                        blocks={boardBlocks}
                        boardHeight={boardHeight}
                        editMode={boardEditMode}
                        selectedBlockId={selectedBlockId}
                        onSelect={onSelectBlock}
                        onBeginDrag={onBeginBlockDrag}
                        embedded
                    />
                </>
            )
        }

        if (item.type === 'arts') {
            return (
                <ArtsMasonry
                    arts={paginate(filterSortArts(profile.arts, item))}
                    tileWidth={contentSizePixels(item)}
                    display={item.display}
                    limit={undefined}
                    onOpen={onOpenArt}
                />
            )
        }

        if (item.type === 'works') {
            return <WorksGrid works={paginate(filterSortWorks(profile.works, item))} display={item.display} size={item.content_size ?? 'medium'} />
        }

        if (item.type === 'stickers') {
            return (
                <ProfileStickers
                    stickers={paginate(filterSortStickers(profile.stickers, item))}
                    stickerSize={contentSizePixels(item)}
                />
            )
        }

        if (item.type === 'feeds') {
            return <ProfileFeeds feeds={paginate(profile.feeds ?? [])} display={item.display} />
        }

        if (item.type === 'shop') {
            return <ProfileShopCards items={paginate(profile.shop ?? [])} size={item.content_size ?? 'medium'} />
        }

        return (
            <ProfileComments
                comments={paginate(profile.comments ?? [])}
                variant={item.display === 'cards' ? 'cards' : 'table'}
            />
        )
    }

    return (
        <div
            ref={refEl}
            className={`relative flow-root ${
                editMode
                    ? 'rounded-lg border bg-background/80 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]'
                    : ''
            }`}
            style={{
                minHeight: canvasHeight,
                backgroundSize: editMode ? '5% 40px' : undefined,
            }}
            onDragOver={(event) => {
                if (!editMode) return
                if (!event.dataTransfer.types.includes(PROFILE_CANVAS_DROP_MIME)) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={onDropCanvasItem}
            onContextMenu={(event) => event.preventDefault()}
        >
            {editMode && <CenterGuide />}
            {theme.navLayout === 'together' ? (
                <ProfileCanvasTabPreview
                    tabs={visibleTabs}
                    theme={theme}
                    editMode={editMode}
                    activeTab={activeTab}
                    onActiveTabChange={onActiveTabChange}
                    onBeginNavDrag={onBeginNavDrag}
                    onToggleNavLock={() => {
                        const tabsConfig = {
                            ...theme.tabsConfig,
                            nav_locked: !(theme.tabsConfig.nav_locked ?? false),
                        }
                        onThemeChange({ tabsConfig })
                        onSaveTabsConfig(tabsConfig)
                    }}
                />
            ) : (
                buttons.map((item) => (
                    <div
                        key={item.id}
                        className={`absolute touch-none rounded-md bg-muted p-1 text-muted-foreground ${
                            editMode ? 'ring-1 ring-sky-400' : ''
                        }`}
                        style={{
                            left: `${item.x}%`,
                            top: item.y,
                            width: `${item.w}%`,
                            height: item.h,
                        }}
                    >
                        <button
                            type="button"
                            className={`${profileTabButtonClass(activeTab === item.type)} relative z-[60] h-full w-full`}
                            onClick={() => onActiveTabChange(item.type)}
                        >
                            {PROFILE_TAB_LABELS[item.type]}
                        </button>
                        {editMode && (
                            <CanvasHandles
                                item={item}
                                onMove={onBeginCanvasDrag}
                                onResize={onBeginCanvasDrag}
                                onDelete={onRemoveCanvasItem}
                                onToggleLock={onUpdateCanvasItem}
                            />
                        )}
                    </div>
                ))
            )}

            {sections.map((item) => (
                <section
                    ref={(node) => registerSection(item.id, node)}
                    id={`profile-section-${item.id}`}
                    data-profile-section-id={item.id}
                    data-profile-section-type={item.type}
                    key={item.id}
                    className={`absolute flex flex-col overflow-visible bg-transparent p-0 ${
                        editMode ? 'ring-2 ring-sky-400' : ''
                    }`}
                    style={
                        item.type === 'feeds'
                            ? {
                                  position: 'relative',
                                  left: `${item.x}%`,
                                  marginTop: item.y,
                                  width: `${item.w}%`,
                                  height: 'auto',
                                  minHeight: undefined,
                                  zIndex: editMode ? 40 : undefined,
                              }
                            : {
                                  left: `${item.x}%`,
                                  top: item.y,
                                  width: `${item.w}%`,
                                  height: 'auto',
                                  minHeight: item.type === 'board' ? item.h : undefined,
                                  zIndex: editMode ? 40 : undefined,
                              }
                    }
                >
                    <div className={editMode ? 'absolute bottom-full left-0 z-[70] w-full pb-2' : ''}>
                    <ProfilePageHeading
                        title={PROFILE_TAB_LABELS[item.type]}
                        canEdit={canEditContent}
                        editMode={contentEditMode}
                        onToggleEdit={onToggleContentEdit}
                        onSave={onSaveProfile}
                        onCancel={onCancelContentEdit}
                        busy={busy}
                    />
                    </div>
                    <ProfileWidgetEditControls
                        item={item}
                        theme={theme}
                        visible={canEditContent && contentEditMode}
                        busy={busy}
                        onUpdateCanvasItem={onUpdateCanvasItem}
                        profile={profile}
                        onThemeChange={onThemeChange}
                    />
                    <div
                        data-profile-content
                        data-profile-empty={itemTotal(item) === 0 ? 'true' : undefined}
                        className={`min-h-0 flex-1 overflow-visible p-4 ${
                            editMode ? 'pointer-events-none select-none' : ''
                        }`}
                        style={{
                            minHeight: item.type === 'board' ? 'calc(100% - 56px)' : undefined,
                        }}
                    >
                        {renderSection(item)}
                    </div>
                    {(hasMultipleContentWidgets || item.pagination !== false) && Number.isFinite(pageSizeForItem(item, hasMultipleContentWidgets)) && (() => {
                        const totals: Record<ProfileTabId, number> = {
                            board: 0,
                            arts: filterSortArts(profile.arts, item).length,
                            works: filterSortWorks(profile.works, item).length,
                            stickers: filterSortStickers(profile.stickers, item).length,
                            shop: (profile.shop ?? []).length,
                            comments: (profile.comments ?? []).length,
                            feeds: (profile.feeds ?? []).length,
                        }
                        const effectivePageSize = pageSizeForItem(item, hasMultipleContentWidgets)
                        const pageCount = Math.ceil(totals[item.type] / effectivePageSize)
                        if (pageCount <= 1) return null
                        const page = Math.min(widgetPages[item.id] ?? 0, pageCount - 1)
                        return (
                            <div className={`mt-3 flex items-center justify-center gap-2 ${editMode ? 'pointer-events-none' : ''}`}>
                                <button type="button" className="rounded-md border bg-background px-3 py-1 text-xs disabled:opacity-40" disabled={page === 0} onClick={() => setWidgetPages((current) => ({ ...current, [item.id]: page - 1 }))}>Previous</button>
                                <span className="text-xs text-muted-foreground">{page + 1} / {pageCount}</span>
                                <button type="button" className="rounded-md border bg-background px-3 py-1 text-xs disabled:opacity-40" disabled={page >= pageCount - 1} onClick={() => setWidgetPages((current) => ({ ...current, [item.id]: page + 1 }))}>Next</button>
                            </div>
                        )
                    })()}
                    {editMode && (
                        <CanvasHandles
                            item={item}
                            onMove={onBeginCanvasDrag}
                            onResize={onBeginCanvasDrag}
                            onDelete={onRemoveCanvasItem}
                            onToggleLock={onUpdateCanvasItem}
                        />
                    )}
                </section>
            ))}
            {sections.length === 0 && (
                <div data-profile-empty-state className="absolute inset-x-4 top-28 bg-transparent py-16 text-center">
                    <Layers className="mx-auto mb-3 h-6 w-6" />
                    <p className="text-sm">
                        No content widgets on {PROFILE_TAB_LABELS[activeTab]}.
                    </p>
                </div>
            )}
        </div>
    )
}

function ProfileCanvasTabPreview({
    tabs,
    theme,
    editMode,
    activeTab,
    onActiveTabChange,
    onBeginNavDrag,
    onToggleNavLock,
}: {
    tabs: ProfileTabId[]
    theme: ProfileThemeDraft
    editMode: boolean
    activeTab: ProfileTabId
    onActiveTabChange: (tab: ProfileTabId) => void
    onBeginNavDrag: (event: PointerEvent<HTMLElement>, kind?: NavDragState['kind']) => void
    onToggleNavLock: () => void
}) {
    const width = clamp(theme.navW, 18, 100)
    const left = clamp(50 + theme.navX, width / 2, 100 - width / 2)
    const locked = theme.tabsConfig.nav_locked ?? false

    return (
        <div
            className={`absolute z-30 touch-none ${editMode ? 'ring-1 ring-sky-400' : ''}`}
            style={{
                left: `${left}%`,
                top: 16 + theme.navY,
                width: `${width}%`,
                minHeight: theme.navH,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="inline-flex min-h-full w-full max-w-full flex-wrap items-center justify-center gap-1 rounded-md bg-transparent p-0 text-muted-foreground">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        className={profileTabButtonClass(activeTab === tab)}
                        onClick={() => onActiveTabChange(tab)}
                    >
                        {PROFILE_TAB_LABELS[tab]}
                    </button>
                ))}
            </div>
            {editMode && (
                <>
                    <button
                        type="button"
                        data-canvas-control
                        className={`absolute -top-2 z-[9999] rounded bg-background p-1 shadow-md ring-1 ${
                            locked ? 'left-5 ring-amber-400' : 'left-5 ring-border'
                        }`}
                        onPointerDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                        }}
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onToggleNavLock()
                        }}
                        aria-label={`${locked ? 'Unlock' : 'Lock'} grouped tabs`}
                        title={locked ? 'Unlock grouped tabs' : 'Lock grouped tabs'}
                    >
                        {locked ? (
                            <Lock className="h-3 w-3 text-amber-500" />
                        ) : (
                            <Unlock className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                    {!locked && (
                        <>
                            <span
                                data-canvas-control
                                className="absolute -left-2 -top-2 z-[9999] rounded bg-background p-1 shadow-md ring-1 ring-sky-400"
                                onPointerDown={(event) => onBeginNavDrag(event, 'move')}
                            >
                                <Move className="h-3 w-3 text-sky-500" />
                            </span>
                            <span
                                data-canvas-control
                                className="absolute bottom-0 right-0 z-[9999] h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                                onPointerDown={(event) => onBeginNavDrag(event, 'resize')}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )
}
