import type { CSSProperties, DragEvent, PointerEvent } from 'react'
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
import { ArtsMasonry, ProfileComments, ProfileStickers, WorksGrid } from '@/features/artist-profile/components/ProfilePublicContent'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    const visibleTabs = getVisibleProfileTabs(theme.tabsConfig, isStorytellerProfile)
    const buttons = getCanvasItems(theme.tabsConfig, visibleTabs, 'tab')
    const sections = getCanvasItems(theme.tabsConfig, visibleTabs, 'section').filter(
        (item) => getCanvasItemPage(item) === activeTab
    )
    const sectionHeight = (item: ProfileCanvasItem) =>
        getCanvasItemRenderHeight(item, boardHeight, Boolean(boardEditorPanel))
    const canvasHeight = Math.max(
        getCanvasHeight(
            [...(theme.navLayout === 'separate' ? buttons : []), ...sections],
            sectionHeight
        ),
        theme.navLayout === 'together' ? Math.max(0, 16 + theme.navY + theme.navH + 80) : 0
    )

    const renderSection = (item: ProfileCanvasItem) => {
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
                    arts={filterSortArts(profile.arts, item)}
                    tileWidth={theme.artsTileWidth}
                    display={item.display}
                    limit={item.pagination === false ? undefined : getWidgetImageLimit(item)}
                    onOpen={onOpenArt}
                />
            )
        }

        if (item.type === 'works') {
            return <WorksGrid works={filterSortWorks(profile.works, item)} display={item.display} />
        }

        if (item.type === 'stickers') {
            return (
                <ProfileStickers
                    stickers={filterSortStickers(profile.stickers, item)}
                    stickerSize={theme.stickerSize}
                />
            )
        }

        if (item.type === 'feeds') {
            return <ProfileFeeds feeds={profile.feeds ?? []} display={item.display} />
        }

        return (
            <ProfileComments
                comments={profile.comments ?? []}
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
                    id={`profile-section-${item.id}`}
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
                                  minHeight: item.h,
                                  zIndex: editMode ? 40 : undefined,
                              }
                            : {
                                  left: `${item.x}%`,
                                  top: item.y,
                                  width: `${item.w}%`,
                                  height: sectionHeight(item),
                                  zIndex: editMode ? 40 : undefined,
                              }
                    }
                >
                    <ProfilePageHeading
                        title={PROFILE_TAB_LABELS[item.type]}
                        canEdit={canEditContent}
                        editMode={contentEditMode}
                        onToggleEdit={onToggleContentEdit}
                        onSave={onSaveProfile}
                        onCancel={onCancelContentEdit}
                        busy={busy}
                    />
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
                        className={`min-h-0 flex-1 ${
                            item.type === 'board' || item.type === 'feeds'
                                ? 'overflow-visible'
                                : 'overflow-hidden'
                        } ${editMode && !contentEditMode ? 'pointer-events-none' : ''}`}
                        style={{
                            minHeight: item.type === 'board' ? 'calc(100% - 56px)' : undefined,
                        }}
                    >
                        {renderSection(item)}
                    </div>
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
                <div className="absolute inset-x-4 top-28 rounded-lg border border-dashed bg-background/80 py-16 text-center">
                    <Layers className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
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
