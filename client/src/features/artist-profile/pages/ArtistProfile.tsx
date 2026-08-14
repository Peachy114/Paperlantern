import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type DragEvent,
    type FormEvent,
    type PointerEvent,
} from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
    ChevronDown,
    ChevronUp,
    Layers,
    Move,
    Palette,
    Save,
    Trash2,
    Upload,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useArtistProfile } from '@/features/artist-profile/hooks/useArtistProfile'
import { storageUrl } from '@/utils/storage'
import type {
    ArtistProfileBlock,
    ArtistProfileResponse,
    ArtistSticker,
    ProfileCanvasItem,
    ProfileBorder,
    ProfileTabId,
    ProfileTabsConfig,
} from '@/types/artistProfile'
import type { Art } from '@/types/art'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import {
    BOARD_UNIT_PX,
    EMPTY_BLOCK,
    PROFILE_CANVAS_DROP_MIME,
    PROFILE_TAB_IDS,
    PROFILE_TAB_LABELS,
    STICKER_BLOCK_SIZE,
} from '@/features/artist-profile/constants/profileEditor'
import type {
    BlockPatch,
    CanvasDragState,
    CanvasItemPatch,
    DragState,
    HeaderDraft,
    NavDragState,
    NewBlockForm,
    ProfileEditErrors,
    ProfileThemeDraft,
    TabDragState,
} from '@/features/artist-profile/types/profileEditor'
import {
    clamp,
    computeBlockPatch,
    createProfileThemeDraft,
    defaultCanvasDisplay,
    defaultProfileTabsConfig,
    findOpenSpot,
    formatCanvasDisplay,
    getBoardHeight,
    getCanvasItemPage,
    getCanvasItemRenderHeight,
    getCanvasItems,
    getNextCanvasItemY,
    getPrimarySectionItem,
    getProfileBackground,
    getProfileFilterOptions,
    getRenderableProfileTabs,
    getRequestErrorMessage,
    getVisibleProfileTabs,
    nextZIndex,
    normalizeProfileDisplayScale,
    parseCanvasDropPayload,
    patchCanvasItem,
    patchTabPosition,
    profileThemeToFormData,
    shouldUseCanvasLayout,
    snapCanvasX,
    snapCanvasY,
    snapCenterOffset,
    snapMin,
    snapWithin,
    toFormData,
    validateProfileEdit,
} from '@/features/artist-profile/utils/profileLayout'
import {
    filterSortArts,
    filterSortStickers,
    filterSortWorks,
    getArtImageOptions,
} from '@/features/artist-profile/utils/profileContent'
import {
    ProfileDashboardWidgets,
    ProfileFeeds,
} from '@/features/artist-profile/components/ProfileFeeds'
import {
    ProfilePageHeading,
    ProfileSection,
    ProfileSortFilterControls,
} from '@/features/artist-profile/components/ProfileCanvasControls'
import { BoardEditorPanel } from '@/features/artist-profile/components/ProfileBoardEditor'
import {
    ArtsMasonry,
    ProfileArtDialog,
    ProfileComments,
    ProfileStickers,
    WorksGrid,
} from '@/features/artist-profile/components/ProfilePublicContent'
import { ProfileBoard } from '@/features/artist-profile/components/ProfileBoard'
import { ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import {
    ProfileLayoutCanvas,
    ProfileTabsNav,
} from '@/features/artist-profile/components/ProfileLayoutCanvas'
import {
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'
import {
    ProfileImageCropDialog,
    type ProfileCropRequest,
} from '@/features/artist-profile/components/ProfileImageCropDialog'
import type { ExtendedGlobalStyles, ProfileCanvasGroup } from '@/features/artist-profile/types/profileTheme'
import { useProfileBackgroundTone } from '@/features/artist-profile/hooks/useProfileBackgroundTone'
import { PROFILE_THEME_CSS } from '@/features/artist-profile/styles/profileThemeCss'
import { ArtistHeader } from '@/features/artist-profile/components/ArtistHeader'
import { ProfileGlobalColors } from '@/features/artist-profile/components/ProfileGlobalColors'
import { ProfileGlobalSizes } from '@/features/artist-profile/components/ProfileGlobalSizes'
import { ProfileSurfaceSettings } from '@/features/artist-profile/components/ProfileSurfaceSettings'
import { ProfileBackgroundEditor } from '@/features/artist-profile/components/ProfileBackgroundEditor'
import { ProfilePublicLinksEditor } from '@/features/artist-profile/components/ProfilePublicLinksEditor'
import { ProfileGlobalFont } from '@/features/artist-profile/components/ProfileGlobalFont'
import { ProfileBorderEditor } from '@/features/artist-profile/components/ProfileBorderEditor'
import { ProfileIdentityEditor } from '@/features/artist-profile/components/ProfileIdentityEditor'

// Profile global theme helpers ----
function getExtendedGlobalStyles(config: ProfileTabsConfig): ExtendedGlobalStyles {
    return (config.global_styles ??
        defaultProfileTabsConfig().global_styles!) as ExtendedGlobalStyles
}

// Artist profile page state and orchestration ----
export default function ArtistProfile() {
    const { username = '' } = useParams()
    const { user, setUser } = useAuthStore()
    const { profile, updateHeader, createBlock, updateBlock, deleteBlock, toggleFollow } =
        useArtistProfile(username)

    const isOwner = user?.username === profile.artist.username
    const isStorytellerProfile =
        profile.artist.role === 'storyteller' || profile.artist.role === 'super_admin'
    const isAdminProfile = profile.artist.role === 'super_admin'
    const [editMode, setEditMode] = useState(false)
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [blockOverrides, setBlockOverrides] = useState<Record<string, BlockPatch>>({})
    const [newBlock, setNewBlock] = useState<NewBlockForm>(EMPTY_BLOCK)
    const [headerDraft, setHeaderDraft] = useState<HeaderDraft>({
        artistTitle: profile.artist.artist_title ?? '',
        showPublicLinks: profile.artist.show_public_links,
    })
    const [manageProfileMode, setManageProfileMode] = useState(false)
    const [isDesktopProfileEditor, setIsDesktopProfileEditor] = useState(
        () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
    )
    const [profileEditErrors, setProfileEditErrors] = useState<ProfileEditErrors>({})
    const [selectedArt, setSelectedArt] = useState<Art | null>(null)
    const [activeProfileTab, setActiveProfileTab] = useState<ProfileTabId>('board')
    const [themeDraft, setThemeDraft] = useState<ProfileThemeDraft>(() =>
        createProfileThemeDraft(profile.artist)
    )

    const boardRef = useRef<HTMLDivElement | null>(null)
    const tabsAreaRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLDivElement | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const navDragRef = useRef<NavDragState | null>(null)
    const tabDragRef = useRef<TabDragState | null>(null)
    const canvasDragRef = useRef<(CanvasDragState & { groupItems?: ProfileCanvasItem[] }) | null>(
        null
    )
    const stickerDragRef = useRef<ArtistSticker | null>(null)
    const [stickerGhost, setStickerGhost] = useState<{
        sticker: ArtistSticker
        x: number
        y: number
    } | null>(null)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)')
        const updateEditorMode = () => setIsDesktopProfileEditor(mediaQuery.matches)

        updateEditorMode()
        mediaQuery.addEventListener('change', updateEditorMode)

        return () => mediaQuery.removeEventListener('change', updateEditorMode)
    }, [])

    useEffect(() => {
        if (!manageProfileMode) return

        const hiddenElements = new Map<HTMLElement, { display: string; priority: string }>()

        const hideElement = (element: HTMLElement | null) => {
            if (!element || hiddenElements.has(element)) return

            hiddenElements.set(element, {
                display: element.style.getPropertyValue('display'),
                priority: element.style.getPropertyPriority('display'),
            })
            element.style.setProperty('display', 'none', 'important')
        }

        const normalizeText = (value: string | null | undefined) =>
            (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

        const isConcernNotice = (element: Element) => {
            const text = normalizeText(element.textContent)
            return (
                text.includes('have a concern') &&
                text.includes('spotted an issue') &&
                text.includes('let us know here')
            )
        }

        const hideManageModeShell = () => {
            hideElement(document.querySelector<HTMLElement>('body nav'))
            document
                .querySelectorAll<HTMLElement>('body footer')
                .forEach((footer) => hideElement(footer))

            // The concern / issue notice may be rendered by a layout or a late-loaded widget.
            // Hide the smallest matching node so we never hide the whole application shell.
            const concernNoticeMatches = Array.from(
                document.querySelectorAll<HTMLElement>('body *')
            ).filter(isConcernNotice)
            const deepestMatches = concernNoticeMatches.filter(
                (element) => !Array.from(element.children).some(isConcernNotice)
            )
            deepestMatches.forEach((element) => hideElement(element))
        }

        document.documentElement.dataset.profileManageMode = 'true'
        hideManageModeShell()

        const observer = new MutationObserver(hideManageModeShell)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
            hiddenElements.forEach(({ display, priority }, element) => {
                if (display) {
                    element.style.setProperty('display', display, priority)
                } else {
                    element.style.removeProperty('display')
                }
            })
            delete document.documentElement.dataset.profileManageMode
        }
    }, [manageProfileMode])

    const desktopManageMode = manageProfileMode && isDesktopProfileEditor
    const desktopBoardEditMode = editMode && isDesktopProfileEditor

    const blocks = useMemo(
        () =>
            [...profile.blocks]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((block) => ({ ...block, ...(blockOverrides[block.id] ?? {}) })),
        [blockOverrides, profile.blocks]
    )

    const artImages = useMemo(() => getArtImageOptions(profile.arts), [profile.arts])
    const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null
    const boardHeight = getBoardHeight(blocks, themeDraft.boardMinHeight)
    const enabledFeatures = profile.artist.creator_features ?? []
    const visibleTabs = getVisibleProfileTabs(themeDraft.tabsConfig, isStorytellerProfile).filter(
        (tab) => {
            if (isAdminProfile && (tab === 'arts' || tab === 'works')) return false
            if (tab === 'arts') return enabledFeatures.includes('arts')
            if (tab === 'works')
                return enabledFeatures.includes('webcomix') || enabledFeatures.includes('novels')
            return true
        }
    )
    const renderableTabs = getRenderableProfileTabs(visibleTabs, themeDraft.tabsConfig)
    const defaultTab = renderableTabs[0] ?? 'board'
    const activeTab = visibleTabs.includes(activeProfileTab) ? activeProfileTab : defaultTab
    const showArtsWithBoard =
        isStorytellerProfile &&
        visibleTabs.includes('arts') &&
        ['board_arts', 'board_arts_stickers'].includes(themeDraft.tabsConfig.section_mode)
    const showStickersWithBoard =
        visibleTabs.includes('stickers') &&
        ['board_stickers', 'board_arts_stickers'].includes(themeDraft.tabsConfig.section_mode)
    const useCanvasLayout = shouldUseCanvasLayout(
        themeDraft.tabsConfig,
        themeDraft.navLayout,
        desktopManageMode
    )
    const artsSectionConfig = getPrimarySectionItem(themeDraft.tabsConfig, 'arts')
    const worksSectionConfig = getPrimarySectionItem(themeDraft.tabsConfig, 'works')
    const stickersSectionConfig = getPrimarySectionItem(themeDraft.tabsConfig, 'stickers')

    const saveHeader = async (
        fields: Record<string, string | number | boolean | File | null>,
        showToast = true
    ) => {
        const payload = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
            if (value === null) return
            if (value instanceof File) {
                payload.append(key, value)
                return
            }
            payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
        })

        try {
            await updateHeader.mutateAsync(payload)
            if (showToast) toast.success('Profile updated.')
        } catch {
            toast.error('Could not update profile header.')
        }
    }

    const saveHeaderFile = async (
        key: 'cover' | 'avatar' | 'background_image',
        file: File | null
    ) => {
        if (!file) return
        const payload = new FormData()
        payload.append(key, file)

        const toastId = toast.loading('Uploading image…')
        try {
            const data = await updateHeader.mutateAsync(payload)
            if (user && key === 'avatar') {
                setUser({
                    ...user,
                    avatar: data.artist.avatar ? storageUrl(data.artist.avatar) : null,
                })
            }
            toast.success(key === 'background_image' ? 'Background updated.' : 'Image updated.', {
                id: toastId,
            })
        } catch (error) {
            toast.error(getRequestErrorMessage(error) ?? 'Could not update image.', {
                id: toastId,
            })
        }
    }

    const patchThemeDraft = (patch: Partial<ProfileThemeDraft>) => {
        setThemeDraft((current) => ({ ...current, ...patch }))
    }
    const patchHeaderDraft = (patch: Partial<HeaderDraft>) => {
        setHeaderDraft((current) => ({ ...current, ...patch }))
    }

    const saveProfileTheme = async () => {
        const errors = validateProfileEdit(headerDraft, themeDraft)
        setProfileEditErrors(errors)

        if (Object.keys(errors).length > 0) {
            toast.error('Please fix the fields marked in red.')
            return false
        }

        try {
            await updateHeader.mutateAsync(profileThemeToFormData(themeDraft, headerDraft))
            toast.success('Profile updated.')
            return true
        } catch {
            toast.error('Could not update profile.')
            return false
        }
    }

    const resetProfileDraft = () => {
        setThemeDraft(createProfileThemeDraft(profile.artist))
        setHeaderDraft({
            artistTitle: profile.artist.artist_title ?? '',
            showPublicLinks: profile.artist.show_public_links,
        })
        setProfileEditErrors({})
    }

    const cancelProfileEdit = () => {
        resetProfileDraft()
        setEditMode(false)
        setManageProfileMode(false)
    }

    const saveProfileAndClose = async () => {
        const saved = await saveProfileTheme()
        if (saved) {
            setEditMode(false)
            setManageProfileMode(false)
        }
    }

    const saveContentEdit = async () => {
        const saved = await saveProfileTheme()
        if (saved) setEditMode(false)
    }

    const persistBlock = async (block: ArtistProfileBlock, patch: BlockPatch | FormData) => {
        const payload = patch instanceof FormData ? patch : toFormData(patch)
        try {
            await updateBlock.mutateAsync({ id: block.id, payload })
        } catch {
            toast.error('Could not update block.')
        }
    }

    const patchLocalBlock = (id: string, patch: BlockPatch) => {
        setBlockOverrides((current) => ({
            ...current,
            [id]: { ...(current[id] ?? {}), ...patch },
        }))
    }

    const beginBlockDrag = (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => {
        if (!editMode) return
        if (block.locked) return
        event.preventDefault()
        event.stopPropagation()
        setSelectedBlockId(block.id)

        dragRef.current = {
            kind,
            blockId: block.id,
            startX: event.clientX,
            startY: event.clientY,
            block,
            patch: {},
            edge,
        }

        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp, { once: true })
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
        const drag = dragRef.current
        const board = boardRef.current
        if (!drag || !board) return

        const rect = board.getBoundingClientRect()
        const dx = ((event.clientX - drag.startX) / rect.width) * 100
        const dy = (event.clientY - drag.startY) / BOARD_UNIT_PX
        const patch = computeBlockPatch(drag, dx, dy, blocks)
        if (!patch) return
        drag.patch = patch
        patchLocalBlock(drag.blockId, patch)
    }

    const handlePointerUp = () => {
        const drag = dragRef.current
        dragRef.current = null
        window.removeEventListener('pointermove', handlePointerMove)

        if (!drag || Object.keys(drag.patch).length === 0) return
        persistBlock({ ...drag.block, ...drag.patch }, drag.patch)
    }

    const beginNavDrag = (
        event: PointerEvent<HTMLElement>,
        kind: NavDragState['kind'] = 'move'
    ) => {
        if (!manageProfileMode) return
        if (themeDraft.tabsConfig.nav_locked) return
        event.preventDefault()
        event.stopPropagation()

        navDragRef.current = {
            kind,
            startX: event.clientX,
            startY: event.clientY,
            navX: themeDraft.navX,
            navY: themeDraft.navY,
            navW: themeDraft.navW,
            navH: themeDraft.navH,
            patch: {},
        }

        window.addEventListener('pointermove', handleNavMove)
        window.addEventListener('pointerup', handleNavUp, { once: true })
    }

    const handleNavMove = (event: globalThis.PointerEvent) => {
        const drag = navDragRef.current
        if (!drag) return

        const canvasWidth = canvasRef.current?.getBoundingClientRect().width ?? window.innerWidth
        const dxPercent = ((event.clientX - drag.startX) / Math.max(canvasWidth, 1)) * 100

        if (drag.kind === 'resize') {
            const next = {
                profile_nav_w: Number(clamp(drag.navW + dxPercent, 18, 100).toFixed(2)),
                profile_nav_h: Number(
                    clamp(drag.navH + event.clientY - drag.startY, 28, 120).toFixed(2)
                ),
            }
            drag.patch = next
            patchThemeDraft({ navW: next.profile_nav_w, navH: next.profile_nav_h })
            return
        }

        const nextX = snapCenterOffset(clamp(drag.navX + dxPercent, -50, 50))
        const next = {
            profile_nav_x: Number(nextX.toFixed(2)),
            profile_nav_y: Number(
                clamp(drag.navY + event.clientY - drag.startY, -80, 320).toFixed(2)
            ),
        }
        drag.patch = next
        patchThemeDraft({ navX: next.profile_nav_x, navY: next.profile_nav_y })
    }

    const handleNavUp = () => {
        navDragRef.current = null
        window.removeEventListener('pointermove', handleNavMove)
    }

    const beginTabDrag = (
        event: PointerEvent<HTMLElement>,
        tab: ProfileTabId,
        kind: TabDragState['kind']
    ) => {
        if (!manageProfileMode || themeDraft.navLayout !== 'separate') return
        event.preventDefault()
        event.stopPropagation()

        tabDragRef.current = {
            tab,
            kind,
            startX: event.clientX,
            startY: event.clientY,
            position: themeDraft.tabsConfig.positions[tab],
            config: themeDraft.tabsConfig,
        }

        window.addEventListener('pointermove', handleTabMove)
        window.addEventListener('pointerup', handleTabUp, { once: true })
    }

    const handleTabMove = (event: globalThis.PointerEvent) => {
        const drag = tabDragRef.current
        const tabsArea = tabsAreaRef.current
        if (!drag || !tabsArea) return

        const rect = tabsArea.getBoundingClientRect()
        const dx = ((event.clientX - drag.startX) / Math.max(rect.width, 1)) * 100
        const dy = event.clientY - drag.startY
        const current = drag.position
        const nextPosition =
            drag.kind === 'move'
                ? {
                      ...current,
                      x: snapCanvasX(clamp(current.x + dx, 0, 100 - current.w), current.w),
                      y: clamp(current.y + dy, 0, 220),
                  }
                : {
                      ...current,
                      w: clamp(current.w + dx, 10, 100 - current.x),
                      h: clamp(current.h + dy, 28, 96),
                  }

        const nextConfig = patchTabPosition(themeDraft.tabsConfig, drag.tab, nextPosition)
        drag.config = nextConfig
        patchThemeDraft({ tabsConfig: nextConfig })
    }

    const handleTabUp = () => {
        tabDragRef.current = null
        window.removeEventListener('pointermove', handleTabMove)
    }

    const beginCanvasDrag = (
        event: PointerEvent<HTMLElement>,
        item: ProfileCanvasItem,
        kind: CanvasDragState['kind']
    ) => {
        if (!manageProfileMode || event.button !== 0) return
        if (item.locked) return
        event.preventDefault()
        event.stopPropagation()

        const allCanvasItems = [
            ...getCanvasItems(themeDraft.tabsConfig, PROFILE_TAB_IDS, 'tab'),
            ...getCanvasItems(themeDraft.tabsConfig, PROFILE_TAB_IDS, 'section'),
        ]
        const canvasGroups = getExtendedGlobalStyles(themeDraft.tabsConfig).canvas_groups ?? []
        const activeGroup = canvasGroups.find((group) => group.item_ids.includes(item.id))
        const groupItems = activeGroup
            ? allCanvasItems.filter((candidate) => activeGroup.item_ids.includes(candidate.id))
            : [item]

        canvasDragRef.current = {
            itemId: item.id,
            itemKind: item.kind,
            kind,
            startX: event.clientX,
            startY: event.clientY,
            item,
            config: themeDraft.tabsConfig,
            groupItems,
        }

        window.addEventListener('pointermove', handleCanvasMove)
        window.addEventListener('pointerup', handleCanvasUp, { once: true })
    }

    const handleCanvasMove = (event: globalThis.PointerEvent) => {
        const drag = canvasDragRef.current
        const canvas = canvasRef.current
        if (!drag || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const dx = ((event.clientX - drag.startX) / Math.max(rect.width, 1)) * 100
        const dy = event.clientY - drag.startY
        if (drag.kind === 'move' && (drag.groupItems?.length ?? 0) > 1) {
            let nextConfig = themeDraft.tabsConfig

            for (const groupedItem of drag.groupItems ?? []) {
                const movedItem = {
                    ...groupedItem,
                    x: snapCanvasX(
                        clamp(groupedItem.x + dx, 0, 100 - groupedItem.w),
                        groupedItem.w
                    ),
                    y: snapCanvasY(clamp(groupedItem.y + dy, 0, 2400)),
                }

                nextConfig = patchCanvasItem(nextConfig, movedItem)
            }

            drag.config = nextConfig
            patchThemeDraft({ tabsConfig: nextConfig })
            return
        }

        if (drag.kind === 'resize' && (drag.groupItems?.length ?? 0) > 1) {
            const anchor = drag.item
            const nextWidth = clamp(anchor.w + dx, anchor.kind === 'tab' ? 12 : 5, 100 - anchor.x)
            const nextHeight = clamp(anchor.h + dy, anchor.kind === 'tab' ? 28 : 80, 1400)
            const widthRatio = nextWidth / Math.max(anchor.w, 1)
            const heightRatio = nextHeight / Math.max(anchor.h, 1)
            let nextConfig = themeDraft.tabsConfig

            for (const groupedItem of drag.groupItems ?? []) {
                nextConfig = patchCanvasItem(nextConfig, {
                    ...groupedItem,
                    x: clamp(anchor.x + (groupedItem.x - anchor.x) * widthRatio, 0, 100),
                    y: Math.max(0, anchor.y + (groupedItem.y - anchor.y) * heightRatio),
                    w: clamp(groupedItem.w * widthRatio, groupedItem.kind === 'tab' ? 12 : 5, 100),
                    h: clamp(groupedItem.h * heightRatio, groupedItem.kind === 'tab' ? 28 : 80, 1400),
                })
            }

            drag.config = nextConfig
            patchThemeDraft({ tabsConfig: nextConfig })
            return
        }

        const item =
            drag.kind === 'move'
                ? {
                      ...drag.item,
                      x: snapCanvasX(clamp(drag.item.x + dx, 0, 100 - drag.item.w), drag.item.w),
                      y: snapCanvasY(clamp(drag.item.y + dy, 0, 2400)),
                  }
                : {
                      ...drag.item,
                      w: clamp(
                          drag.item.w + dx,
                          drag.item.kind === 'tab' ? 12 : 5,
                          100 - drag.item.x
                      ),
                      h: clamp(drag.item.h + dy, drag.item.kind === 'tab' ? 28 : 80, 1400),
                  }

        const nextConfig = patchCanvasItem(themeDraft.tabsConfig, item)
        drag.config = nextConfig
        patchThemeDraft({ tabsConfig: nextConfig })
    }

    const handleCanvasUp = () => {
        canvasDragRef.current = null
        window.removeEventListener('pointermove', handleCanvasMove)
    }

    const addCanvasItemToDraft = (
        kind: ProfileCanvasItem['kind'],
        type: ProfileTabId,
        position?: { x: number; y: number },
        page: ProfileTabId = activeTab
    ) => {
        setThemeDraft((current) => {
            const key = kind === 'tab' ? 'buttons' : 'sections'
            const currentItems = getCanvasItems(current.tabsConfig, PROFILE_TAB_IDS, kind)
            const currentPageItems =
                kind === 'section'
                    ? currentItems.filter((item) => getCanvasItemPage(item) === page)
                    : currentItems
            const width = kind === 'tab' ? 24 : 90
            const height = kind === 'tab' ? 40 : type === 'board' ? 520 : 420
            const nextItem: ProfileCanvasItem = {
                id: `${kind}-${type}-${Date.now()}`,
                kind,
                type,
                page: kind === 'section' ? page : type,
                display: defaultCanvasDisplay(type),
                pagination: true,
                locked: false,
                x: snapCanvasX(
                    clamp(position?.x ?? (kind === 'tab' ? 0 : 5), 0, 100 - width),
                    width
                ),
                y: snapCanvasY(
                    clamp(
                        position?.y ??
                            getNextCanvasItemY(currentPageItems, kind, page, (item) =>
                                getCanvasItemRenderHeight(item, boardHeight, desktopBoardEditMode)
                            ),
                        0,
                        2400
                    )
                ),
                w: width,
                h: height,
            }

            return {
                ...current,
                tabsConfig: {
                    ...current.tabsConfig,
                    [key]: [...currentItems, nextItem],
                },
            }
        })
    }

    const removeCanvasItemFromDraft = (itemId: string, kind: ProfileCanvasItem['kind']) => {
        setThemeDraft((current) => {
            const key = kind === 'tab' ? 'buttons' : 'sections'
            const currentItems = getCanvasItems(current.tabsConfig, PROFILE_TAB_IDS, kind)
            const tabsConfig = {
                ...current.tabsConfig,
                [key]: currentItems.filter((item) => item.id !== itemId),
            }

            return { ...current, tabsConfig }
        })
    }

    const updateCanvasItemInDraft = (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => {
        const key = kind === 'tab' ? 'buttons' : 'sections'
        const currentItems = getCanvasItems(themeDraft.tabsConfig, PROFILE_TAB_IDS, kind)
        const tabsConfig = {
            ...themeDraft.tabsConfig,
            [key]: currentItems.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        }

        patchThemeDraft({ tabsConfig })

        if ('locked' in patch) {
            saveHeader({ profile_tabs_config: JSON.stringify(tabsConfig) }, false)
        }
    }

    const resetProfileTabsDraft = () => {
        setThemeDraft((current) => ({
            ...current,
            navLayout: 'together',
            navX: 0,
            navY: 0,
            navW: 100,
            navH: 32,
            tabsConfig: defaultProfileTabsConfig(),
        }))
        setActiveProfileTab('board')
    }

    const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
        if (!manageProfileMode) return
        const payload = parseCanvasDropPayload(event.dataTransfer.getData(PROFILE_CANVAS_DROP_MIME))
        const canvas = canvasRef.current
        if (!payload || !canvas) return
        if (payload.kind === 'tab' && themeDraft.navLayout !== 'separate') return

        event.preventDefault()
        event.stopPropagation()

        const rect = canvas.getBoundingClientRect()
        const existingItems = getCanvasItems(themeDraft.tabsConfig, PROFILE_TAB_IDS, payload.kind)
        const existingItem = payload.itemId
            ? existingItems.find((item) => item.id === payload.itemId)
            : null
        if (existingItem?.locked) return
        const width = existingItem?.w ?? (payload.kind === 'tab' ? 24 : 90)
        const height =
            existingItem?.h ?? (payload.kind === 'tab' ? 40 : payload.type === 'board' ? 520 : 420)
        const x = snapCanvasX(
            clamp(
                ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100 - width / 2,
                0,
                100 - width
            ),
            width
        )
        const y = snapCanvasY(clamp(event.clientY - rect.top - height / 2, 0, 2400))

        if (existingItem) {
            const movedItem = { ...existingItem, x, y }
            const tabsConfig = patchCanvasItem(themeDraft.tabsConfig, movedItem)
            patchThemeDraft({ tabsConfig })
            return
        }

        addCanvasItemToDraft(payload.kind, payload.type, { x, y }, activeTab)
    }

    const createStickerBoardBlock = async (
        sticker: ArtistSticker,
        clientX: number,
        clientY: number
    ) => {
        const board = boardRef.current
        if (!board) return

        const rect = board.getBoundingClientRect()
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            return
        }

        const x = snapWithin(
            ((clientX - rect.left) / rect.width) * 100 - STICKER_BLOCK_SIZE.w / 2,
            0,
            100 - STICKER_BLOCK_SIZE.w
        )
        const y = snapMin((clientY - rect.top) / BOARD_UNIT_PX - STICKER_BLOCK_SIZE.h / 2, 0)
        const payload = new FormData()
        payload.append('type', 'image')
        payload.append('is_sticker', '1')
        payload.append('source_sticker_id', sticker.id)
        payload.append('x', String(x))
        payload.append('y', String(y))
        payload.append('w', String(STICKER_BLOCK_SIZE.w))
        payload.append('h', String(STICKER_BLOCK_SIZE.h))
        payload.append('fit_mode', 'contain')
        payload.append('font_size', '18')
        payload.append('padding_x', '0')
        payload.append('padding_y', '0')
        payload.append('rotation', '0')
        payload.append('z_index', String(nextZIndex(blocks)))
        payload.append('transparent_background', '1')
        payload.append('overlay', '1')
        payload.append('show_border', '0')
        payload.append('border_radius', '0')
        payload.append('image_position_x', '50')
        payload.append('image_position_y', '50')

        try {
            const block = await createBlock.mutateAsync(payload)
            setSelectedBlockId(block.id)
            toast.success('Sticker added.')
        } catch {
            toast.error('Could not add sticker.')
        }
    }

    const handleStickerDragMove = (event: globalThis.PointerEvent) => {
        const sticker = stickerDragRef.current
        if (!sticker) return
        setStickerGhost({ sticker, x: event.clientX, y: event.clientY })
    }

    const handleStickerDragUp = (event: globalThis.PointerEvent) => {
        const sticker = stickerDragRef.current
        stickerDragRef.current = null
        setStickerGhost(null)
        window.removeEventListener('pointermove', handleStickerDragMove)

        if (sticker) void createStickerBoardBlock(sticker, event.clientX, event.clientY)
    }

    const beginStickerDrag = (event: PointerEvent<HTMLElement>, sticker: ArtistSticker) => {
        if (!editMode) return
        event.preventDefault()
        event.stopPropagation()

        stickerDragRef.current = sticker
        setStickerGhost({ sticker, x: event.clientX, y: event.clientY })
        window.addEventListener('pointermove', handleStickerDragMove)
        window.addEventListener('pointerup', handleStickerDragUp, { once: true })
    }

    const createBoardBlock = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (newBlock.type === 'text' && !newBlock.text.trim()) {
            toast.error('Text is required.')
            return
        }

        if (
            newBlock.type === 'image' &&
            !newBlock.isSticker &&
            !newBlock.image &&
            !newBlock.sourceArtImageId
        ) {
            toast.error('Choose an image source.')
            return
        }

        const payload = new FormData()
        const width = newBlock.isSticker ? STICKER_BLOCK_SIZE.w : 35
        const height = newBlock.isSticker ? STICKER_BLOCK_SIZE.h : 30
        const spot = findOpenSpot(blocks, width, height)

        if (!spot) {
            toast.error('No empty space on the board.')
            return
        }

        payload.append('type', newBlock.type)
        payload.append('text_content', newBlock.text)
        payload.append('is_sticker', newBlock.isSticker ? '1' : '0')
        payload.append('x', String(spot.x))
        payload.append('y', String(spot.y))
        payload.append('w', String(width))
        payload.append('h', String(height))
        payload.append('fit_mode', newBlock.isSticker ? 'contain' : 'cover')
        payload.append('font_size', '18')
        payload.append('padding_x', '0')
        payload.append('padding_y', '0')
        payload.append('rotation', '0')
        payload.append('z_index', String(nextZIndex(blocks)))
        payload.append('transparent_background', newBlock.isSticker ? '1' : '0')
        payload.append('overlay', newBlock.isSticker ? '1' : '0')
        payload.append('show_border', newBlock.isSticker ? '0' : '1')
        payload.append('border_radius', '0')
        payload.append('image_position_x', '50')
        payload.append('image_position_y', '50')
        if (newBlock.isSticker) {
            payload.append('source_sticker_id', newBlock.stickerId)
        } else {
            if (newBlock.image) payload.append('image', newBlock.image)
            if (newBlock.sourceArtImageId)
                payload.append('source_art_image_id', newBlock.sourceArtImageId)
        }

        try {
            await createBlock.mutateAsync(payload)
            setNewBlock(EMPTY_BLOCK)
            toast.success('Block added.')
        } catch {
            toast.error('Could not add block.')
        }
    }

    const busy =
        updateHeader.isPending ||
        createBlock.isPending ||
        updateBlock.isPending ||
        deleteBlock.isPending
    const profileBackground = getProfileBackground(themeDraft)
    const backgroundImage = profile.artist.profile_background_image
        ? storageUrl(profile.artist.profile_background_image)
        : null
    const backgroundTone = useProfileBackgroundTone(backgroundImage)
    const navStyle: CSSProperties = {
        transform: `translate(${themeDraft.navX}%, ${themeDraft.navY}px)`,
        width: `${themeDraft.navW}%`,
        minHeight: themeDraft.navH,
    }
    const boardEditorPanel =
        isOwner && desktopBoardEditMode ? (
            <BoardEditorPanel
                form={newBlock}
                artImages={artImages}
                stickers={profile.stickers}
                allowText={isStorytellerProfile}
                selectedBlock={selectedBlock}
                busy={busy}
                onFormChange={setNewBlock}
                onCreate={createBoardBlock}
                onPatchLocal={patchLocalBlock}
                onPersist={persistBlock}
                onDelete={(block) => deleteBlock.mutate(block.id)}
                onStickerDragStart={beginStickerDrag}
            />
        ) : null
    const editorDockWidth = desktopManageMode ? '380px' : '0px'
    const globalStyles = getExtendedGlobalStyles(themeDraft.tabsConfig)
    const legacyDefaultColor = (value: string | undefined, kind: 'text' | 'muted' | 'accent') => {
        const normalized = value?.toLowerCase()
        if (!normalized) return undefined
        if (kind === 'muted' && normalized === '#6b7280') return undefined
        if (kind !== 'muted' && normalized === '#111827') return undefined
        return value
    }
    const profileTextColor = legacyDefaultColor(globalStyles.text_color, 'text')
    // Legacy muted/accent values must never recolor component surfaces or decoration.
    const profileMutedColor = undefined
    const profileAccentColor = undefined
    const profileHeadingColor = legacyDefaultColor(globalStyles.heading_text_color, 'text')
    const profileLabelColor = legacyDefaultColor(globalStyles.label_text_color, 'text')
    const profileButtonColor = legacyDefaultColor(globalStyles.button_text_color, 'text')
    const profileLinkColor = legacyDefaultColor(globalStyles.link_text_color, 'text')
    const surfaceBackground = (surface: ExtendedGlobalStyles['cards_surface']) => {
        if (surface?.enabled === false) return 'transparent'
        const opacity = Math.max(0, Math.min(100, surface?.opacity ?? 100))
        const mix = (color: string) => `color-mix(in srgb, ${color} ${opacity}%, transparent)`
        switch (surface?.preset ?? 'default') {
            case 'transparent': return 'transparent'
            case 'white': return mix('#ffffff')
            case 'surface': return mix('var(--surface)')
            case 'muted': return mix('var(--surface-muted)')
            case 'dark': return mix('var(--surface-inverse)')
            case 'custom': return mix(surface?.custom_color || 'var(--surface)')
            case 'brand_gradient': return `linear-gradient(135deg, ${mix('var(--blue-soft)')}, ${mix('var(--surface)')} 50%, ${mix('var(--category)')})`
            case 'brand_gradient_soft': return `linear-gradient(135deg, ${mix('var(--blue-soft)')}, ${mix('var(--surface)')} 70%, ${mix('var(--selected-soft)')})`
            case 'blue_gradient': return `linear-gradient(135deg, ${mix('var(--blue-soft)')}, ${mix('var(--surface)')} 68%, ${mix('var(--blue)')})`
            case 'yellow_gradient': return `linear-gradient(135deg, ${mix('var(--category)')}, ${mix('var(--surface)')} 72%, ${mix('var(--selected-soft)')})`
            default: return undefined
        }
    }
    const surfaceBorder = (surface: ExtendedGlobalStyles['cards_surface']) => surface?.border
        ? `${surface.border_width ?? 1}px solid color-mix(in srgb, ${surface.border_color || 'var(--border)'} ${surface.border_opacity ?? 100}%, transparent)`
        : undefined
    const publicProfileStyle = {
        '--profile-font-family': globalStyles.font_family || 'inherit',
        '--profile-text-color': profileTextColor || 'var(--foreground)',
        '--profile-muted-text-color': profileMutedColor || 'var(--muted-foreground)',
        '--profile-heading-text-color':
            profileHeadingColor || profileTextColor || 'var(--foreground)',
        '--profile-label-text-color': profileLabelColor || profileTextColor || 'var(--foreground)',
        '--profile-button-text-color':
            profileButtonColor || profileTextColor || 'var(--foreground)',
        '--profile-link-text-color': profileLinkColor || profileAccentColor || 'var(--primary)',
        '--profile-accent-color': profileAccentColor || 'var(--primary)',
        '--profile-dark-text-color': globalStyles.dark_text_color || '#e4e4e7',
        '--profile-dark-muted-text-color': globalStyles.dark_muted_text_color || '#a1a1aa',
        '--profile-dark-heading-text-color':
            globalStyles.dark_heading_text_color || globalStyles.dark_text_color || '#f4f4f5',
        '--profile-dark-label-text-color':
            globalStyles.dark_label_text_color || globalStyles.dark_text_color || '#e4e4e7',
        '--profile-dark-button-text-color':
            globalStyles.dark_button_text_color || globalStyles.dark_text_color || '#e4e4e7',
        '--profile-dark-link-text-color': globalStyles.dark_link_text_color || '#fb923c',
        '--profile-dark-accent-color': globalStyles.dark_accent_color || '#f97316',
        '--profile-dark-cards-color': globalStyles.dark_cards_color || globalStyles.dark_text_color || '#e4e4e7',
        '--profile-base-font-size': `${globalStyles.base_font_size ?? 14}px`,
        '--profile-widget-font-size': `${globalStyles.widget_font_size ?? 13}px`,
        '--profile-button-font-size': `${globalStyles.button_font_size ?? 14}px`,
        '--profile-heading-font-size': `${globalStyles.base_font_size ?? 14}px`,
        '--profile-label-font-size': `${globalStyles.labels_size ?? 13}px`,
        '--profile-link-font-size': `${globalStyles.button_font_size ?? 14}px`,
        '--profile-name-color': globalStyles.profile_name_color || profileHeadingColor || 'var(--foreground)',
        '--profile-details-color': globalStyles.profile_details_color || profileMutedColor || 'var(--muted-foreground)',
        '--profile-links-color': globalStyles.profile_links_color || profileLinkColor || 'var(--primary)',
        '--profile-cards-color': globalStyles.cards_color || profileTextColor || 'var(--foreground)',
        '--profile-name-size': `${globalStyles.profile_name_size ?? 24}px`,
        '--profile-details-size': `${globalStyles.profile_details_size ?? 14}px`,
        '--profile-links-size': `${globalStyles.profile_links_size ?? 12}px`,
        '--profile-cards-size': `${globalStyles.cards_size ?? 14}px`,
        '--profile-cards-background': surfaceBackground(globalStyles.cards_surface),
        '--profile-cards-border': surfaceBorder(globalStyles.cards_surface),
        '--profile-cards-radius': `${globalStyles.cards_surface?.border_radius ?? 8}px`,
        '--profile-buttons-background': surfaceBackground(globalStyles.buttons_surface),
        '--profile-buttons-border': surfaceBorder(globalStyles.buttons_surface),
        '--profile-buttons-radius': `${globalStyles.buttons_surface?.border_radius ?? 6}px`,
        '--profile-content-background': surfaceBackground(globalStyles.content_surface),
        '--profile-content-border': surfaceBorder(globalStyles.content_surface),
        '--profile-content-radius': `${globalStyles.content_surface?.border_radius ?? 8}px`,
        fontFamily: globalStyles.font_family || undefined,
        color: profileTextColor || 'var(--foreground)',
        fontSize: `${globalStyles.base_font_size ?? 14}px`,
    } as CSSProperties
    return (
        <div
            className="relative min-h-screen overflow-hidden bg-background"
            style={profileBackground}
            onContextMenu={(event) => event.preventDefault()}
        >
            {backgroundImage && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundPosition: `${globalStyles.background_image_position_x ?? 50}% ${globalStyles.background_image_position_y ?? 50}%`,
                        backgroundSize:
                            globalStyles.background_image_zoom &&
                            globalStyles.background_image_zoom > 1
                                ? `${globalStyles.background_image_zoom * 100}% auto`
                                : 'cover',
                        backgroundRepeat: 'no-repeat',
                        opacity:
                            themeDraft.backgroundColorEnabled || themeDraft.hasGradient ? 0.4 : 1,
                        filter: `blur(${themeDraft.backgroundBlur / 3}px)`,
                        transform: 'scale(1.04)',
                    }}
                />
            )}
            <div className="relative z-10 min-h-screen">
                {isOwner && manageProfileMode && (
                    <ManageProfileSidebar
                        draft={themeDraft}
                        headerDraft={headerDraft}
                        errors={profileEditErrors}
                        borders={profile.borders}
                        profile={profile}
                        busy={busy}
                        desktopMode={isDesktopProfileEditor}
                        activeTab={activeTab}
                        onChange={patchThemeDraft}
                        onHeaderChange={patchHeaderDraft}
                        onActiveTabChange={setActiveProfileTab}
                        onSave={saveProfileAndClose}
                        onCancel={cancelProfileEdit}
                        onUploadCover={(file) => saveHeaderFile('cover', file)}
                        onUploadAvatar={(file) => saveHeaderFile('avatar', file)}
                        onUploadBackground={(file) => saveHeaderFile('background_image', file)}
                        onAddCanvasItem={addCanvasItemToDraft}
                        onRemoveCanvasItem={removeCanvasItemFromDraft}
                        onUpdateCanvasItem={updateCanvasItemInDraft}
                        onResetTabs={resetProfileTabsDraft}
                    />
                )}

                <div
                    data-artist-profile-theme
                    data-profile-background-tone={backgroundTone}
                    data-profile-cards-background={globalStyles.cards_background_enabled === false ? 'off' : 'on'}
                    data-profile-buttons-background={globalStyles.buttons_background_enabled === false ? 'off' : 'on'}
                    className="min-h-screen min-w-0"
                    style={{
                        ...publicProfileStyle,
                        paddingLeft: editorDockWidth,
                    }}
                >
                    <style>{PROFILE_THEME_CSS}</style>
                    <ArtistHeader
                        profile={profile}
                        isOwner={isOwner}
                        editMode={desktopManageMode}
                        draft={headerDraft}
                        theme={themeDraft}
                        onThemeChange={patchThemeDraft}
                        onSavePosition={saveHeader}
                        onToggleFollow={() => toggleFollow.mutate()}
                        followBusy={toggleFollow.isPending}
                    />

                    <main
                        className={
                            desktopManageMode
                                ? 'w-full px-4 py-8 md:px-6'
                                : 'max-w-[1480px] mx-auto px-4 py-8'
                        }
                    >
                        <div>
                            {isOwner && (
                                <div className="mb-4 flex flex-wrap gap-2 sm:justify-end">
                                    <Button
                                        data-profile-system-control
                                        variant={manageProfileMode ? 'default' : 'outline'}
                                        onClick={() => setManageProfileMode((current) => !current)}
                                    >
                                        <Palette className="h-4 w-4" />
                                        Manage Profile
                                    </Button>
                                </div>
                            )}
                            <ProfileDashboardWidgets profile={profile} visibility={globalStyles.dashboard_cards_visible} />
                            {useCanvasLayout ? (
                                <ProfileLayoutCanvas
                                    refEl={canvasRef}
                                    profile={profile}
                                    theme={themeDraft}
                                    editMode={desktopManageMode}
                                    activeTab={activeTab}
                                    isStorytellerProfile={isStorytellerProfile}
                                    isAdminProfile={isAdminProfile}
                                    boardRef={boardRef}
                                    boardBlocks={blocks}
                                    boardHeight={boardHeight}
                                    boardEditMode={isOwner && desktopBoardEditMode}
                                    boardEditorPanel={boardEditorPanel}
                                    canEditContent={isOwner && isDesktopProfileEditor}
                                    contentEditMode={editMode}
                                    busy={busy}
                                    selectedBlockId={selectedBlockId}
                                    onSelectBlock={setSelectedBlockId}
                                    onActiveTabChange={setActiveProfileTab}
                                    onToggleContentEdit={() => setEditMode((current) => !current)}
                                    onCancelContentEdit={cancelProfileEdit}
                                    onBeginNavDrag={beginNavDrag}
                                    onBeginBlockDrag={beginBlockDrag}
                                    onBeginCanvasDrag={beginCanvasDrag}
                                    onRemoveCanvasItem={removeCanvasItemFromDraft}
                                    onUpdateCanvasItem={updateCanvasItemInDraft}
                                    onThemeChange={patchThemeDraft}
                                    onSaveTabsConfig={(tabsConfig) =>
                                        saveHeader(
                                            { profile_tabs_config: JSON.stringify(tabsConfig) },
                                            false
                                        )
                                    }
                                    onSaveProfile={saveContentEdit}
                                    onDropCanvasItem={handleCanvasDrop}
                                    onOpenArt={setSelectedArt}
                                />
                            ) : (
                                <Tabs
                                    value={activeTab}
                                    onValueChange={(value) =>
                                        setActiveProfileTab(value as ProfileTabId)
                                    }
                                >
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <ProfileTabsNav
                                            tabsAreaRef={tabsAreaRef}
                                            tabIds={renderableTabs}
                                            theme={themeDraft}
                                            manageProfileMode={desktopManageMode}
                                            navStyle={desktopManageMode ? navStyle : undefined}
                                            onBeginNavDrag={beginNavDrag}
                                            onBeginTabDrag={beginTabDrag}
                                        />
                                    </div>

                                    <TabsContent value="board">
                                        <ProfilePageHeading
                                            title="My Board"
                                            canEdit={isOwner && isDesktopProfileEditor}
                                            editMode={editMode}
                                            onToggleEdit={() => setEditMode((current) => !current)}
                                            onSave={saveContentEdit}
                                            onCancel={cancelProfileEdit}
                                            busy={busy}
                                        />
                                        {boardEditorPanel}

                                        <ProfileBoard
                                            refEl={boardRef}
                                            blocks={blocks}
                                            boardHeight={boardHeight}
                                            editMode={isOwner && desktopBoardEditMode}
                                            selectedBlockId={selectedBlockId}
                                            onSelect={setSelectedBlockId}
                                            onBeginDrag={beginBlockDrag}
                                        />

                                        {showArtsWithBoard && (
                                            <ProfileSection title="My Arts">
                                                <ArtsMasonry
                                                    arts={filterSortArts(
                                                        profile.arts,
                                                        artsSectionConfig
                                                    )}
                                                    tileWidth={themeDraft.artsTileWidth}
                                                    display={artsSectionConfig.display}
                                                    onOpen={setSelectedArt}
                                                />
                                            </ProfileSection>
                                        )}

                                        {showStickersWithBoard && (
                                            <ProfileSection title="My Stickers">
                                                <ProfileStickers
                                                    stickers={filterSortStickers(
                                                        profile.stickers,
                                                        stickersSectionConfig
                                                    )}
                                                    stickerSize={themeDraft.stickerSize}
                                                />
                                            </ProfileSection>
                                        )}
                                    </TabsContent>

                                    {isStorytellerProfile && (
                                        <TabsContent value="arts">
                                            <ProfilePageHeading
                                                title="My Arts"
                                                canEdit={isOwner && isDesktopProfileEditor}
                                                editMode={editMode}
                                                onToggleEdit={() =>
                                                    setEditMode((current) => !current)
                                                }
                                                onSave={saveContentEdit}
                                                onCancel={cancelProfileEdit}
                                                busy={busy}
                                            />
                                            <ArtsMasonry
                                                arts={filterSortArts(
                                                    profile.arts,
                                                    artsSectionConfig
                                                )}
                                                tileWidth={themeDraft.artsTileWidth}
                                                display={artsSectionConfig.display}
                                                onOpen={setSelectedArt}
                                            />
                                        </TabsContent>
                                    )}

                                    {isStorytellerProfile && (
                                        <TabsContent value="works">
                                            <ProfilePageHeading
                                                title="My Works"
                                                canEdit={isOwner && isDesktopProfileEditor}
                                                editMode={editMode}
                                                onToggleEdit={() =>
                                                    setEditMode((current) => !current)
                                                }
                                                onSave={saveContentEdit}
                                                onCancel={cancelProfileEdit}
                                                busy={busy}
                                            />
                                            <WorksGrid
                                                works={filterSortWorks(
                                                    profile.works,
                                                    worksSectionConfig
                                                )}
                                                display={worksSectionConfig.display}
                                            />
                                        </TabsContent>
                                    )}

                                    <TabsContent value="stickers">
                                        <ProfilePageHeading
                                            title="My Stickers"
                                            canEdit={isOwner && isDesktopProfileEditor}
                                            editMode={editMode}
                                            onToggleEdit={() => setEditMode((current) => !current)}
                                            onSave={saveContentEdit}
                                            onCancel={cancelProfileEdit}
                                            busy={busy}
                                        />
                                        <ProfileStickers
                                            stickers={filterSortStickers(
                                                profile.stickers,
                                                stickersSectionConfig
                                            )}
                                            stickerSize={themeDraft.stickerSize}
                                        />
                                    </TabsContent>

                                    <TabsContent value="comments">
                                        <ProfilePageHeading
                                            title="My Comments"
                                            canEdit={isOwner && isDesktopProfileEditor}
                                            editMode={editMode}
                                            onToggleEdit={() => setEditMode((current) => !current)}
                                            onSave={saveContentEdit}
                                            onCancel={cancelProfileEdit}
                                            busy={busy}
                                        />
                                        <ProfileComments comments={profile.comments ?? []} />
                                    </TabsContent>

                                    <TabsContent value="feeds">
                                        <ProfilePageHeading
                                            title="My Feeds"
                                            canEdit={false}
                                            editMode={false}
                                            onToggleEdit={() => undefined}
                                        />
                                        <ProfileFeeds
                                            feeds={profile.feeds ?? []}
                                            canCreate={isOwner}
                                            display={
                                                getPrimarySectionItem(
                                                    themeDraft.tabsConfig,
                                                    'feeds'
                                                ).display
                                            }
                                        />
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <ProfileArtDialog
                art={selectedArt}
                artist={profile.artist}
                open={Boolean(selectedArt)}
                onOpenChange={(open) => {
                    if (!open) setSelectedArt(null)
                }}
            />
            {stickerGhost && (
                <img
                    src={storageUrl(stickerGhost.sticker.image_path)!}
                    alt=""
                    className="pointer-events-none fixed z-[100] h-20 w-20 -translate-x-1/2 -translate-y-1/2 object-contain opacity-80"
                    style={{ left: stickerGhost.x, top: stickerGhost.y }}
                />
            )}
        </div>
    )
}


// Manage Profile editor sidebar components ----
function ManageProfileSidebar({
    draft,
    headerDraft,
    errors,
    borders,
    profile,
    busy,
    desktopMode,
    activeTab,
    onChange,
    onHeaderChange,
    onActiveTabChange: _onActiveTabChange,
    onSave,
    onCancel,
    onUploadCover,
    onUploadAvatar,
    onUploadBackground,
    onAddCanvasItem,
    onRemoveCanvasItem,
    onUpdateCanvasItem,
    onResetTabs,
}: {
    draft: ProfileThemeDraft
    headerDraft: HeaderDraft
    errors: ProfileEditErrors
    borders: ProfileBorder[]
    profile: ArtistProfileResponse
    busy: boolean
    desktopMode: boolean
    activeTab: ProfileTabId
    onChange: (patch: Partial<ProfileThemeDraft>) => void
    onHeaderChange: (patch: Partial<HeaderDraft>) => void
    onActiveTabChange: (tab: ProfileTabId) => void
    onSave: () => void
    onCancel: () => void
    onUploadCover: (file: File | null) => void
    onUploadAvatar: (file: File | null) => void
    onUploadBackground: (file: File | null) => void
    onAddCanvasItem: (
        kind: ProfileCanvasItem['kind'],
        type: ProfileTabId,
        position?: { x: number; y: number },
        page?: ProfileTabId
    ) => void
    onRemoveCanvasItem: (itemId: string, kind: ProfileCanvasItem['kind']) => void
    onUpdateCanvasItem: (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => void
    onResetTabs: () => void
}) {
    const coverRef = useRef<HTMLInputElement | null>(null)
    const avatarRef = useRef<HTMLInputElement | null>(null)
    const profileDisplayScaleX = normalizeProfileDisplayScale(draft.tabsConfig.cover_offset?.x)
    const profileDisplayScaleY = normalizeProfileDisplayScale(draft.tabsConfig.cover_offset?.y)
    const [cropRequest, setCropRequest] = useState<ProfileCropRequest | null>(null)

    const updateTabsConfig = (patch: Partial<ProfileTabsConfig>) => {
        onChange({ tabsConfig: { ...draft.tabsConfig, ...patch } })
    }

    const requestProfileCrop = (
        field: 'cover' | 'avatar' | 'background_image',
        file: File | null
    ) => {
        if (!file) return
        const width =
            field === 'cover'
                ? Math.max(
                      320,
                      Math.round((Math.min(window.innerWidth, 1480) * draft.coverWidth) / 100)
                  )
                : field === 'background_image'
                  ? Math.max(320, window.innerWidth)
                  : Math.round(112 * profileDisplayScaleX)
        const height =
            field === 'cover'
                ? draft.bannerHeight
                : field === 'background_image'
                  ? Math.max(320, window.innerHeight)
                  : Math.round(112 * profileDisplayScaleY)
        setCropRequest({ field, file, width, height })
    }

    const completeProfileCrop = (
        file: File,
        fit: 'cover' | 'contain',
        placement?: { x: number; y: number; zoom: number }
    ) => {
        if (!cropRequest) return
        updateTabsConfig({
            global_styles: {
                ...getExtendedGlobalStyles(draft.tabsConfig),
                [cropRequest.field === 'cover'
                    ? 'cover_image_fit'
                    : cropRequest.field === 'avatar'
                      ? 'avatar_image_fit'
                      : 'background_image_fit']: fit,
                ...(cropRequest.field === 'cover' && placement
                    ? { cover_image_zoom: placement.zoom }
                    : {}),
                ...(cropRequest.field === 'background_image' && placement
                    ? {
                          background_image_position_x: placement.x,
                          background_image_position_y: placement.y,
                          background_image_zoom: placement.zoom,
                      }
                    : {}),
            } as ProfileTabsConfig['global_styles'],
        })
        if (cropRequest.field === 'cover') onUploadCover(file)
        else if (cropRequest.field === 'avatar') onUploadAvatar(file)
        else onUploadBackground(file)
    }

    const updateTabVisibility = (tab: ProfileTabId, visible: boolean) => {
        updateTabsConfig({
            visibility: { ...draft.tabsConfig.visibility, [tab]: visible },
        })
    }

    const profileTabOrder = (draft.tabsConfig.tab_order ?? PROFILE_TAB_IDS).filter(
        (tab) => profile.artist.role !== 'super_admin' || (tab !== 'arts' && tab !== 'works')
    )

    const moveTogetherTab = (tab: ProfileTabId, direction: -1 | 1) => {
        const fullOrder = [...(draft.tabsConfig.tab_order ?? PROFILE_TAB_IDS)]
        const currentIndex = fullOrder.indexOf(tab)
        if (currentIndex < 0) return
        let targetIndex = currentIndex + direction
        while (targetIndex >= 0 && targetIndex < fullOrder.length) {
            const target = fullOrder[targetIndex]
            if (profile.artist.role !== 'super_admin' || (target !== 'arts' && target !== 'works'))
                break
            targetIndex += direction
        }
        if (targetIndex < 0 || targetIndex >= fullOrder.length) return
        ;[fullOrder[currentIndex], fullOrder[targetIndex]] = [
            fullOrder[targetIndex],
            fullOrder[currentIndex],
        ]
        updateTabsConfig({ tab_order: fullOrder })
    }

    const startCanvasPaletteDrag = (
        event: DragEvent<HTMLButtonElement>,
        kind: ProfileCanvasItem['kind'],
        type: ProfileTabId
    ) => {
        event.dataTransfer.setData(PROFILE_CANVAS_DROP_MIME, `${kind}:${type}`)
        event.dataTransfer.effectAllowed = 'copy'
    }

    const canvasButtons = getCanvasItems(draft.tabsConfig, PROFILE_TAB_IDS, 'tab')
    const canvasSections = getCanvasItems(draft.tabsConfig, PROFILE_TAB_IDS, 'section')
    const visiblePreviewTabs = PROFILE_TAB_IDS.filter((tab) => draft.tabsConfig.visibility[tab])
    const extendedGlobalStyles = getExtendedGlobalStyles(draft.tabsConfig)
    const canvasGroups = extendedGlobalStyles.canvas_groups ?? []
    const [layerSelection, setLayerSelection] = useState<string[]>([])
    const [layerDrag, setLayerDrag] = useState<{
        id: string
        kind: ProfileCanvasItem['kind']
    } | null>(null)
    const [selectedCanvasLayerId, setSelectedCanvasLayerId] = useState<string | null>(null)
    const allCanvasItems = [...canvasButtons, ...canvasSections]
    const selectedCanvasItem =
        allCanvasItems.find((item) => item.id === selectedCanvasLayerId) ??
        allCanvasItems[0] ??
        null

    const setCanvasGroups = (canvas_groups: ProfileCanvasGroup[]) => {
        updateTabsConfig({
            global_styles: {
                ...getExtendedGlobalStyles(draft.tabsConfig),
                canvas_groups,
            } as ProfileTabsConfig['global_styles'],
        })
    }

    const toggleLayerSelection = (id: string) => {
        setLayerSelection((current) =>
            current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
        )
    }

    const groupSelectedLayers = () => {
        if (layerSelection.length < 2) return

        const cleanedGroups = canvasGroups
            .map((group) => ({
                ...group,
                item_ids: group.item_ids.filter((id) => !layerSelection.includes(id)),
            }))
            .filter((group) => group.item_ids.length > 1)

        const nextGroup: ProfileCanvasGroup = {
            id: `canvas-group-${Date.now()}`,
            name: `Group ${cleanedGroups.length + 1}`,
            item_ids: [...layerSelection],
        }

        setCanvasGroups([...cleanedGroups, nextGroup])
        setLayerSelection([])
    }

    const ungroupCanvasGroup = (groupId: string) => {
        setCanvasGroups(canvasGroups.filter((group) => group.id !== groupId))
    }

    const reorderCanvasLayer = (
        kind: ProfileCanvasItem['kind'],
        sourceId: string,
        targetId: string
    ) => {
        if (sourceId === targetId) return

        const key = kind === 'tab' ? 'buttons' : 'sections'
        const currentItems = [...(draft.tabsConfig[key] ?? [])]
        const displayOrder = [...currentItems].reverse()
        const sourceIndex = displayOrder.findIndex((item) => item.id === sourceId)
        const targetIndex = displayOrder.findIndex((item) => item.id === targetId)

        if (sourceIndex < 0 || targetIndex < 0) return

        const [moved] = displayOrder.splice(sourceIndex, 1)
        displayOrder.splice(targetIndex, 0, moved)

        updateTabsConfig({
            [key]: displayOrder.reverse(),
        } as Partial<ProfileTabsConfig>)
    }

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-[12000] w-full overflow-y-auto border-r bg-background shadow-xl md:w-[380px] md:p-4">
                <div className="sticky top-[-20px] z-10 flex items-center justify-between gap-3 border-b bg-background p-4 md:-mx-4 md:mb-4 md:-mt-4">
                    <div>
                        <h2 className="text-sm font-semibold">Profile Edit</h2>
                        <p className="text-xs text-muted-foreground">
                            {desktopMode
                                ? 'Desktop editor is docked beside the live preview.'
                                : 'Mobile editing is limited to profile and banner images.'}
                        </p>
                    </div>
                    <div className="hidden items-center gap-2 md:flex">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        <Button type="button" size="sm" onClick={onSave} disabled={busy}>
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 px-4 pb-4 md:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        Profile Image
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        Banner Image
                    </Button>
                </div>

                <div className="hidden gap-5 md:grid">
                    <Button type="button" variant="outline" onClick={onResetTabs}>
                        <Layers className="h-4 w-4" />
                        Default Settings
                    </Button>

                    <ProfileEditSection title="Text">
                        <ProfileGlobalFont draft={draft} updateTabsConfig={updateTabsConfig} />

                        <ProfileGlobalColors draft={draft} updateTabsConfig={updateTabsConfig} />

                        <ProfileGlobalSizes draft={draft} updateTabsConfig={updateTabsConfig} />

                        <ProfileEditSection title="Settings" defaultOpen={false}>
                            <ProfileSurfaceSettings label="Cards" value={extendedGlobalStyles.cards_surface} onChange={(cards_surface) => updateTabsConfig({ global_styles: { ...extendedGlobalStyles, cards_surface } as ProfileTabsConfig['global_styles'] })} />
                            <ProfileSurfaceSettings label="Buttons" value={extendedGlobalStyles.buttons_surface} onChange={(buttons_surface) => updateTabsConfig({ global_styles: { ...extendedGlobalStyles, buttons_surface } as ProfileTabsConfig['global_styles'] })} />
                            <ProfileSurfaceSettings label="Content" value={extendedGlobalStyles.content_surface} onChange={(content_surface) => updateTabsConfig({ global_styles: { ...extendedGlobalStyles, content_surface } as ProfileTabsConfig['global_styles'] })} />
                            <div className="grid gap-2 border-t pt-3">
                                <p className="text-xs font-medium text-muted-foreground">Statistic card widgets</p>
                                {(['works', 'arts', 'followers', 'feeds'] as const).map((card) => (
                                    <label key={card} className="flex items-center justify-between gap-3 text-sm capitalize">
                                        <span>{card}</span>
                                        <input type="checkbox" checked={extendedGlobalStyles.dashboard_cards_visible?.[card] !== false} onChange={(event) => updateTabsConfig({ global_styles: { ...extendedGlobalStyles, dashboard_cards_visible: { ...extendedGlobalStyles.dashboard_cards_visible, [card]: event.target.checked } } as ProfileTabsConfig['global_styles'] })} />
                                    </label>
                                ))}
                            </div>
                        </ProfileEditSection>
                    </ProfileEditSection>

                    <ProfileIdentityEditor
                        draft={draft}
                        headerDraft={headerDraft}
                        errors={errors}
                        profileDisplayScaleY={profileDisplayScaleY}
                        coverRef={coverRef}
                        avatarRef={avatarRef}
                        onChange={onChange}
                        onHeaderChange={onHeaderChange}
                        updateTabsConfig={updateTabsConfig}
                        requestProfileCrop={requestProfileCrop}
                        publicLinks={
                            <ProfilePublicLinksEditor draft={draft} errors={errors} onChange={onChange} />
                        }
                    />

                    <ProfileBorderEditor
                        draft={draft}
                        errors={errors}
                        borders={borders}
                        onChange={onChange}
                        updateTabsConfig={updateTabsConfig}
                    />

                    <ProfileBackgroundEditor
                        draft={draft}
                        errors={errors}
                        onChange={onChange}
                        updateTabsConfig={updateTabsConfig}
                        onSelectBackground={(file) => requestProfileCrop('background_image', file)}
                    />

                    <ProfileEditSection title="Tabs">
                        <ProfileEditSection title="Shows">
                        <div className="grid grid-cols-2 gap-2">
                            {profileTabOrder.map((tab) => (
                                <label key={tab} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={draft.tabsConfig.visibility[tab]}
                                        onChange={(event) =>
                                            updateTabVisibility(tab, event.target.checked)
                                        }
                                    />
                                    {PROFILE_TAB_LABELS[tab]}
                                </label>
                            ))}
                        </div>
                        </ProfileEditSection>
                        <ProfileEditSection title="Tabs Settings">
                        {draft.navLayout === 'together' && (
                            <div className="grid gap-2 rounded-lg border p-3">
                                <p className="text-xs font-medium">Together tab order</p>
                                {profileTabOrder
                                    .filter((tab) => draft.tabsConfig.visibility[tab])
                                    .map((tab, index, tabs) => (
                                        <div
                                            key={`order-${tab}`}
                                            className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-sm"
                                        >
                                            <span>{PROFILE_TAB_LABELS[tab]}</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={index === 0}
                                                    onClick={() => moveTogetherTab(tab, -1)}
                                                    aria-label={`Move ${PROFILE_TAB_LABELS[tab]} left`}
                                                >
                                                    <ChevronUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={index === tabs.length - 1}
                                                    onClick={() => moveTogetherTab(tab, 1)}
                                                    aria-label={`Move ${PROFILE_TAB_LABELS[tab]} right`}
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                        <SelectField
                            label="Tabs"
                            value={draft.navLayout}
                            options={['together', 'separate']}
                            onChange={(navLayout) =>
                                onChange({
                                    navLayout: navLayout as ProfileThemeDraft['navLayout'],
                                })
                            }
                        />
                        <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                            Together keeps tab buttons grouped. Separate lets individual tab buttons
                            move on the canvas. Content widgets are added to the active preview
                            page.
                        </p>
                        </ProfileEditSection>
                        <ProfileEditSection title="Layers Content">
                        <div className="grid gap-3 rounded-lg border p-3">
                            {(canvasButtons.length > 0 || canvasSections.length > 0) && (
                                <div className="grid gap-3 rounded-lg border bg-muted/10 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-semibold">Layers & Groups</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Top rows are in front. Drag rows to reorder. Select
                                                two or more items to group them; dragging one
                                                grouped item moves the whole group on the canvas.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={layerSelection.length < 2}
                                            onClick={groupSelectedLayers}
                                        >
                                            <Layers className="h-3.5 w-3.5" />
                                            Group ({layerSelection.length})
                                        </Button>
                                    </div>

                                    {canvasGroups.length > 0 && (
                                        <div className="grid gap-1.5">
                                            {canvasGroups.map((group) => (
                                                <div
                                                    key={group.id}
                                                    className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
                                                >
                                                    <span className="min-w-0 truncate">
                                                        {group.name} · {group.item_ids.length}{' '}
                                                        layers
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => ungroupCanvasGroup(group.id)}
                                                    >
                                                        Ungroup
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {draft.navLayout === 'together' && (
                                        <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs">
                                            <Move className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Together Tabs · one grouped layer</span>
                                        </div>
                                    )}

                                    {[
                                        {
                                            label: 'Content layers',
                                            kind: 'section' as const,
                                            items: [...canvasSections].reverse(),
                                        },
                                        {
                                            label: 'Button layers',
                                            kind: 'tab' as const,
                                            items:
                                                draft.navLayout === 'separate'
                                                    ? [...canvasButtons].reverse()
                                                    : [],
                                        },
                                    ].map(({ label, kind, items }) =>
                                        items.length > 0 ? (
                                            <div
                                                key={kind}
                                                className="grid max-h-44 gap-1 overflow-y-auto pr-1"
                                            >
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    {label}
                                                </p>
                                                {items.map((item) => {
                                                    const group = canvasGroups.find((candidate) =>
                                                        candidate.item_ids.includes(item.id)
                                                    )

                                                    return (
                                                        <div
                                                            key={`layer-${item.id}`}
                                                            draggable
                                                            onDragStart={(event) => {
                                                                setLayerDrag({ id: item.id, kind })
                                                                event.dataTransfer.effectAllowed =
                                                                    'move'
                                                                event.dataTransfer.setData(
                                                                    'text/plain',
                                                                    item.id
                                                                )
                                                            }}
                                                            onDragOver={(event) => {
                                                                if (layerDrag?.kind !== kind) return
                                                                event.preventDefault()
                                                                event.dataTransfer.dropEffect =
                                                                    'move'
                                                            }}
                                                            onDrop={(event) => {
                                                                event.preventDefault()
                                                                if (layerDrag?.kind === kind) {
                                                                    reorderCanvasLayer(
                                                                        kind,
                                                                        layerDrag.id,
                                                                        item.id
                                                                    )
                                                                }
                                                                setLayerDrag(null)
                                                            }}
                                                            onDragEnd={() => setLayerDrag(null)}
                                                            onClick={() =>
                                                                setSelectedCanvasLayerId(item.id)
                                                            }
                                                            className={`flex cursor-grab items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition active:cursor-grabbing ${
                                                                selectedCanvasItem?.id === item.id
                                                                    ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200 dark:bg-sky-950/20'
                                                                    : 'bg-background hover:bg-muted/40'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={layerSelection.includes(
                                                                    item.id
                                                                )}
                                                                onChange={() =>
                                                                    toggleLayerSelection(item.id)
                                                                }
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                                aria-label={`Select ${PROFILE_TAB_LABELS[item.type]} layer`}
                                                            />
                                                            <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                            <span className="min-w-0 flex-1 truncate">
                                                                {item.kind === 'tab'
                                                                    ? 'Button'
                                                                    : 'Content'}
                                                                : {PROFILE_TAB_LABELS[item.type]}
                                                            </span>
                                                            {group && (
                                                                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                                                    {group.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : null
                                    )}
                                </div>
                            )}

                            {(canvasButtons.length > 0 || canvasSections.length > 0) && (
                                <div>
                                    <div className="mb-2">
                                        <p className="text-xs font-medium">
                                            Selected layer settings
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Pick a layer above. Only that layer’s settings open
                                            here.
                                        </p>
                                    </div>
                                    <div className="grid gap-1.5">
                                        {(selectedCanvasItem ? [selectedCanvasItem] : []).map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="grid gap-2 rounded-lg border bg-background p-3 text-xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                        <span className="min-w-0 flex-1 truncate">
                                                            {item.kind === 'tab'
                                                                ? 'Button'
                                                                : 'Content'}
                                                            : {PROFILE_TAB_LABELS[item.type]}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                onRemoveCanvasItem(
                                                                    item.id,
                                                                    item.kind
                                                                )
                                                            }
                                                            aria-label={`Delete ${PROFILE_TAB_LABELS[item.type]}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                    {item.kind === 'section' && (
                                                        <div className="grid gap-2 border-t pt-2">
                                                            <SelectField
                                                                label="Page"
                                                                value={getCanvasItemPage(item)}
                                                                options={visiblePreviewTabs}
                                                                formatOption={(option) =>
                                                                    PROFILE_TAB_LABELS[
                                                                        option as ProfileTabId
                                                                    ]
                                                                }
                                                                onChange={(page) =>
                                                                    onUpdateCanvasItem(
                                                                        item.id,
                                                                        item.kind,
                                                                        {
                                                                            page: page as ProfileTabId,
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                            {item.type === 'arts' && (
                                                                <>
                                                                    <SelectField
                                                                        label="Display"
                                                                        value={
                                                                            item.display ??
                                                                            'masonry'
                                                                        }
                                                                        options={[
                                                                            'standard',
                                                                            'masonry',
                                                                            'bento',
                                                                            'magazine',
                                                                            'gallery',
                                                                            'carousel',
                                                                        ]}
                                                                        formatOption={
                                                                            formatCanvasDisplay
                                                                        }
                                                                        onChange={(display) =>
                                                                            onUpdateCanvasItem(
                                                                                item.id,
                                                                                item.kind,
                                                                                {
                                                                                    display:
                                                                                        display as ProfileCanvasItem['display'],
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                    <label className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                item.pagination !==
                                                                                false
                                                                            }
                                                                            onChange={(event) =>
                                                                                onUpdateCanvasItem(
                                                                                    item.id,
                                                                                    item.kind,
                                                                                    {
                                                                                        pagination:
                                                                                            event
                                                                                                .target
                                                                                                .checked,
                                                                                    }
                                                                                )
                                                                            }
                                                                        />
                                                                        Pagination
                                                                    </label>
                                                                    <ProfileSortFilterControls
                                                                        item={item}
                                                                        options={getProfileFilterOptions(
                                                                            profile,
                                                                            item.type
                                                                        )}
                                                                        onUpdateCanvasItem={
                                                                            onUpdateCanvasItem
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                            {item.type === 'works' && (
                                                                <>
                                                                    <SelectField
                                                                        label="Display"
                                                                        value={
                                                                            item.display ??
                                                                            'image_title'
                                                                        }
                                                                        options={[
                                                                            'image',
                                                                            'image_title',
                                                                            'split_card',
                                                                            'table',
                                                                        ]}
                                                                        formatOption={
                                                                            formatCanvasDisplay
                                                                        }
                                                                        onChange={(display) =>
                                                                            onUpdateCanvasItem(
                                                                                item.id,
                                                                                item.kind,
                                                                                {
                                                                                    display:
                                                                                        display as ProfileCanvasItem['display'],
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                    <ProfileSortFilterControls
                                                                        item={item}
                                                                        options={getProfileFilterOptions(
                                                                            profile,
                                                                            item.type
                                                                        )}
                                                                        onUpdateCanvasItem={
                                                                            onUpdateCanvasItem
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                            {item.type === 'stickers' && (
                                                                <>
                                                                    <ProfileSortFilterControls
                                                                        item={item}
                                                                        options={getProfileFilterOptions(
                                                                            profile,
                                                                            item.type
                                                                        )}
                                                                        onUpdateCanvasItem={
                                                                            onUpdateCanvasItem
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                            {item.type === 'comments' && (
                                                                <SelectField
                                                                    label="Display"
                                                                    value={item.display ?? 'table'}
                                                                    options={['table', 'cards']}
                                                                    formatOption={
                                                                        formatCanvasDisplay
                                                                    }
                                                                    onChange={(display) =>
                                                                        onUpdateCanvasItem(
                                                                            item.id,
                                                                            item.kind,
                                                                            {
                                                                                display:
                                                                                    display as ProfileCanvasItem['display'],
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                            {item.type === 'feeds' && (
                                                                <SelectField
                                                                    label="Display"
                                                                    value={item.display ?? 'cards'}
                                                                    options={['cards', 'compact']}
                                                                    formatOption={
                                                                        formatCanvasDisplay
                                                                    }
                                                                    onChange={(display) =>
                                                                        onUpdateCanvasItem(
                                                                            item.id,
                                                                            item.kind,
                                                                            {
                                                                                display:
                                                                                    display as ProfileCanvasItem['display'],
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            <details className="group rounded-lg border bg-background/70 p-3">
                                <summary className="cursor-pointer list-none text-xs font-semibold">Add Button <span className="float-right group-open:hidden">+</span><span className="float-right hidden group-open:inline">−</span></summary>
                                <div className="flex flex-wrap gap-1.5">
                                    {PROFILE_TAB_IDS.map((tab) => (
                                        <Button
                                            key={`tab-${tab}`}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                !draft.tabsConfig.visibility[tab] ||
                                                draft.navLayout !== 'separate'
                                            }
                                            draggable={draft.navLayout === 'separate'}
                                            onDragStart={(event) =>
                                                startCanvasPaletteDrag(event, 'tab', tab)
                                            }
                                            onClick={() => onAddCanvasItem('tab', tab)}
                                        >
                                            {PROFILE_TAB_LABELS[tab].replace('My ', '')}
                                        </Button>
                                    ))}
                                </div>
                            </details>
                            <details className="group rounded-lg border bg-background/70 p-3">
                                <summary className="cursor-pointer list-none text-xs font-semibold">Add Content Button <span className="float-right group-open:hidden">+</span><span className="float-right hidden group-open:inline">−</span></summary>
                                <div className="flex flex-wrap gap-1.5">
                                    {PROFILE_TAB_IDS.map((tab) => (
                                        <Button
                                            key={`section-${tab}`}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!draft.tabsConfig.visibility[tab]}
                                            draggable
                                            onDragStart={(event) =>
                                                startCanvasPaletteDrag(event, 'section', tab)
                                            }
                                            onClick={() =>
                                                onAddCanvasItem(
                                                    'section',
                                                    tab,
                                                    undefined,
                                                    activeTab
                                                )
                                            }
                                        >
                                            {PROFILE_TAB_LABELS[tab].replace('My ', '')}
                                        </Button>
                                    ))}
                                </div>
                            </details>
                        </div>
                        </ProfileEditSection>
                    </ProfileEditSection>

                </div>
            </aside>
            <ProfileImageCropDialog
                key={
                    cropRequest
                        ? `${cropRequest.field}-${cropRequest.file.name}-${cropRequest.file.lastModified}`
                        : 'profile-crop-empty'
                }
                request={cropRequest}
                onClose={() => setCropRequest(null)}
                onComplete={completeProfileCrop}
            />
        </>
    )
}
