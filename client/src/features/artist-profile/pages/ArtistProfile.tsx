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
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
    BadgeCheck,
    Layers,
    Link as LinkIcon,
    Move,
    Palette,
    Plus,
    Save,
    Trash2,
    Upload,
    X,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import {
    BOARD_UNIT_PX,
    EMPTY_BLOCK,
    PROFILE_CANVAS_DROP_MIME,
    PROFILE_GRADIENT_DIRECTIONS,
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
    HeaderDragKind,
    NavDragState,
    NewBlockForm,
    ProfileEditErrors,
    ProfileHeaderLockKey,
    ProfileLinkDraft,
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
    snapPercentCenter,
    snapWithin,
    toFormData,
    toPublicHref,
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
import {
    CenterGuide,
    HeaderLockButton,
} from '@/features/artist-profile/components/ProfileCanvasHandles'
import { BoardEditorPanel } from '@/features/artist-profile/components/ProfileBoardEditor'
import { ArtsMasonry, ProfileArtDialog, ProfileComments, ProfileStickers, WorksGrid } from '@/features/artist-profile/components/ProfilePublicContent'
import { ProfileBoard } from '@/features/artist-profile/components/ProfileBoard'
import { ColorField, ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import { ProfileLayoutCanvas, ProfileTabsNav } from '@/features/artist-profile/components/ProfileLayoutCanvas'
import {
    ProfileFieldMessage as FieldMessage,
    ProfileRangeField as RangeField,
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'

export default function ArtistProfile() {
    const { username = '' } = useParams()
    const { user, setUser } = useAuthStore()
    const { profile, updateHeader, createBlock, updateBlock, deleteBlock, toggleFollow } =
        useArtistProfile(username)

    const isOwner = user?.username === profile.artist.username
    const isStorytellerProfile = profile.artist.role === 'storyteller'
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
    const canvasDragRef = useRef<CanvasDragState | null>(null)
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

        const navbar = document.querySelector<HTMLElement>('body nav')
        const footers = Array.from(document.querySelectorAll<HTMLElement>('body footer'))
        const shellElements = [navbar, ...footers].filter((element): element is HTMLElement =>
            Boolean(element)
        )
        const previousStyles = shellElements.map((element) => ({
            element,
            display: element.style.getPropertyValue('display'),
            priority: element.style.getPropertyPriority('display'),
        }))

        shellElements.forEach((element) => {
            element.style.setProperty('display', 'none', 'important')
        })
        document.documentElement.dataset.profileManageMode = 'true'

        return () => {
            previousStyles.forEach(({ element, display, priority }) => {
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
    const visibleTabs = getVisibleProfileTabs(themeDraft.tabsConfig, isStorytellerProfile)
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

        canvasDragRef.current = {
            itemId: item.id,
            itemKind: item.kind,
            kind,
            startX: event.clientX,
            startY: event.clientY,
            item,
            config: themeDraft.tabsConfig,
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

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-background"
            style={profileBackground}
            onContextMenu={(event) => event.preventDefault()}
        >
            {backgroundImage && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
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
                    className="min-h-screen min-w-0"
                    style={{
                        paddingLeft: editorDockWidth,
                    }}
                >
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
                                        variant={manageProfileMode ? 'default' : 'outline'}
                                        onClick={() => setManageProfileMode((current) => !current)}
                                    >
                                        <Palette className="h-4 w-4" />
                                        Manage Profile
                                    </Button>
                                </div>
                            )}
                            <ProfileDashboardWidgets profile={profile} />
                            {useCanvasLayout ? (
                                <ProfileLayoutCanvas
                                    refEl={canvasRef}
                                    profile={profile}
                                    theme={themeDraft}
                                    editMode={desktopManageMode}
                                    activeTab={activeTab}
                                    isStorytellerProfile={isStorytellerProfile}
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

function ArtistHeader({
    profile,
    isOwner,
    editMode,
    draft,
    theme,
    onThemeChange,
    onSavePosition,
    onToggleFollow,
    followBusy,
}: {
    profile: ArtistProfileResponse
    isOwner: boolean
    editMode: boolean
    draft: HeaderDraft
    theme: ProfileThemeDraft
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
    onSavePosition: (fields: Record<string, string | number | boolean | File | null>) => void
    onToggleFollow: () => void
    followBusy: boolean
}) {
    const { artist } = profile
    const cover = artist.profile_cover ? storageUrl(artist.profile_cover) : null
    const avatar = artist.avatar ? storageUrl(artist.avatar) : null
    const avatarLetter = (artist.username ?? artist.name)[0]?.toUpperCase() ?? 'A'
    const headerDragRef = useRef<{
        kind: HeaderDragKind
        startX: number
        startY: number
        startPositionX: number
        startPositionY: number
        startWidth: number
        startHeight: number
        startBorderWidth: number
        startBorderHeight: number
        patch: Record<string, number | string>
    } | null>(null)
    const [coverPosition, setCoverPosition] = useState({
        x: artist.profile_cover_position_x ?? 50,
        y: artist.profile_cover_position_y ?? 50,
    })
    const avatarImagePosition = {
        x: theme.avatarImageX,
        y: theme.avatarImageY,
    }
    const selectedBorder =
        profile.borders.find((border) => border.id === theme.profileBorderId) ??
        artist.profile_border
    const profileDisplayScaleX = normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.x)
    const profileDisplayScaleY = normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.y)
    const profileDisplayWidth = Math.round(112 * profileDisplayScaleX)
    const profileDisplayHeight = Math.round(112 * profileDisplayScaleY)
    const borderOffset = theme.tabsConfig.border_offset ?? { x: 0, y: 0 }

    /**
     * Existing profiles only have border_scale, so use it as the fallback.
     */
    const legacyBorderScale = theme.tabsConfig.border_scale ?? 1.35

    const borderWidth = theme.tabsConfig.border_width ?? legacyBorderScale
    const borderHeight = theme.tabsConfig.border_height ?? legacyBorderScale

    const borderLayer = theme.tabsConfig.border_layer ?? 'front'
    const headerLocks = theme.tabsConfig.header_locks ?? defaultProfileTabsConfig().header_locks!
    const headerVisualHeight = theme.showCover ? theme.bannerHeight : 112
    const headerLockForDrag: Partial<Record<HeaderDragKind, ProfileHeaderLockKey>> = {
        'avatar-frame': 'avatar_frame',
        'avatar-frame-width': 'avatar_frame',
        'avatar-frame-height': 'avatar_frame',
        'avatar-frame-size': 'avatar_frame',
        'avatar-border': 'avatar_border',
        'avatar-border-width': 'avatar_border',
        'avatar-border-height': 'avatar_border',
        'avatar-border-size': 'avatar_border',
    }

    const toggleHeaderLock = (key: ProfileHeaderLockKey) => {
        const tabsConfig = {
            ...theme.tabsConfig,
            header_locks: {
                ...headerLocks,
                [key]: !headerLocks[key],
            },
        }

        onThemeChange({ tabsConfig })
        onSavePosition({ profile_tabs_config: JSON.stringify(tabsConfig) })
    }

    const customLinks = theme.links
        .filter((link) => link.is_public && link.title.trim() && link.url.trim())
        .map((link) => ({
            label: link.title,
            value: link.url,
        }))
    const socialLinks = [
        { label: 'Twitter', value: artist.twitter_url },
        { label: 'Instagram', value: artist.instagram_url },
        { label: 'TikTok', value: artist.tiktok_url },
    ].filter((link) => link.value)
    const links = [...customLinks, ...socialLinks]

    const beginHeaderDrag = (
        event: PointerEvent<HTMLElement>,
        kind: HeaderDragKind,
        position: { x: number; y: number }
    ) => {
        if (!editMode) return
        if (event.button !== 0 && event.button !== 2) return
        const lockKey = headerLockForDrag[kind]
        if (lockKey && headerLocks[lockKey]) return
        event.preventDefault()
        event.stopPropagation()

        headerDragRef.current = {
            kind,
            startX: event.clientX,
            startY: event.clientY,
            startPositionX: position.x,
            startPositionY: position.y,
            startWidth: theme.coverWidth,
            startHeight: theme.bannerHeight,
            startBorderWidth: borderWidth,
            startBorderHeight: borderHeight,
            patch: {},
        }
        window.addEventListener('pointermove', handleHeaderMove)
        window.addEventListener('pointerup', handleHeaderUp, { once: true })
    }

    const handleHeaderMove = (event: globalThis.PointerEvent) => {
        const drag = headerDragRef.current
        if (!drag) return
        const rawDx = event.clientX - drag.startX
        const rawDy = event.clientY - drag.startY

        if (drag.kind === 'cover-size') {
            const width = Math.round(
                clamp(drag.startWidth + (rawDx / window.innerWidth) * 100, 30, 100)
            )
            const height = Math.round(clamp(drag.startHeight + rawDy, 160, 560))
            onThemeChange({ coverWidth: width, bannerHeight: height })
            drag.patch = {
                profile_cover_width: width,
                profile_banner_height: height,
            }
            return
        }

        if (drag.kind === 'avatar-frame-width') {
            const x = Number(clamp(drag.startPositionX + rawDx / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: {
                    x,
                    y: normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.y),
                },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-frame-height') {
            const y = Number(clamp(drag.startPositionY + rawDy / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: {
                    x: normalizeProfileDisplayScale(theme.tabsConfig.cover_offset?.x),
                    y,
                },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-frame-size') {
            const x = Number(clamp(drag.startPositionX + rawDx / 112, 0.5, 3).toFixed(3))
            const y = Number(clamp(drag.startPositionY + rawDy / 112, 0.5, 3).toFixed(3))
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: { x, y },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'cover-frame') {
            const x = snapCenterOffset(clamp(drag.startPositionX + rawDx, -320, 320))
            const y = clamp(drag.startPositionY + rawDy, -180, 180)
            const tabsConfig = {
                ...theme.tabsConfig,
                cover_offset: { x, y },
            }
            onThemeChange({ tabsConfig })
            drag.patch = { profile_tabs_config: JSON.stringify(tabsConfig) }
            return
        }

        if (drag.kind === 'avatar-border') {
            const x = Number((drag.startPositionX + rawDx).toFixed(2))
            const y = Number((drag.startPositionY + rawDy).toFixed(2))

            const tabsConfig = {
                ...theme.tabsConfig,
                border_offset: { x, y },
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-width') {
            const width = Math.max(0.05, drag.startBorderWidth + rawDx / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_width: Number(width.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-height') {
            const height = Math.max(0.05, drag.startBorderHeight + rawDy / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_height: Number(height.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'avatar-border-size') {
            const width = Math.max(0.05, drag.startBorderWidth + rawDx / 112)

            const height = Math.max(0.05, drag.startBorderHeight + rawDy / 112)

            const tabsConfig = {
                ...theme.tabsConfig,
                border_width: Number(width.toFixed(3)),
                border_height: Number(height.toFixed(3)),
            }

            onThemeChange({ tabsConfig })

            drag.patch = {
                profile_tabs_config: JSON.stringify(tabsConfig),
            }

            return
        }

        if (drag.kind === 'cover-image') {
            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = snapPercentCenter(clamp(drag.startPositionY + rawDy / 3, 0, 100))
            setCoverPosition({ x, y })
            drag.patch = { profile_cover_position_x: x, profile_cover_position_y: y }
        } else if (drag.kind === 'avatar-image') {
            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = clamp(drag.startPositionY + rawDy / 3, 0, 100)
            onThemeChange({ avatarImageX: x, avatarImageY: y })
            drag.patch = { avatar_position_x: x, avatar_position_y: y }
        } else {
            const y = clamp(drag.startPositionY + rawDy / 3, 0, 100)
            onThemeChange({ avatarFrameX: 50, avatarFrameY: y })
            drag.patch = { profile_avatar_frame_x: 50, profile_avatar_frame_y: y }
        }
    }

    const handleHeaderUp = () => {
        const drag = headerDragRef.current
        headerDragRef.current = null
        window.removeEventListener('pointermove', handleHeaderMove)
        if (drag && Object.keys(drag.patch).length > 0) onSavePosition(drag.patch)
    }
    const globalStyles = theme.tabsConfig.global_styles ?? defaultProfileTabsConfig().global_styles!
    const profileTextStyle = {
        fontFamily: globalStyles.font_family || undefined,
        color: globalStyles.muted_text_color,
        fontSize: globalStyles.widget_font_size,
    }
    const profileButtonStyle = {
        fontFamily: globalStyles.font_family || undefined,
        fontSize: globalStyles.button_font_size,
    }

    return (
        <header className="relative z-20 border-b">
            {editMode && <CenterGuide />}
            <div className="relative bg-muted/30">
                {theme.showCover ? (
                    <div
                        className={`relative mx-auto overflow-hidden bg-muted ${
                            editMode ? 'ring-2 ring-foreground/30 ring-inset' : ''
                        }`}
                        style={{
                            height: theme.bannerHeight,
                            width: `${theme.coverWidth}%`,
                        }}
                    >
                        {cover ? (
                            <img
                                src={cover}
                                alt={`${artist.name} cover`}
                                className="h-full w-full select-none object-cover"
                                draggable={false}
                                style={{
                                    objectPosition: `${coverPosition.x}% ${coverPosition.y}%`,
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Layers className="h-8 w-8" />
                            </div>
                        )}
                        {editMode && (
                            <>
                                <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-background/90 px-3 py-1 text-xs text-foreground shadow-sm">
                                    Cover position is fixed. Use the corner handle or sidebar
                                    controls to resize.
                                </div>
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize border-b-4 border-r-4 border-foreground bg-background/70"
                                    aria-label="Resize cover"
                                    onPointerDown={(event) =>
                                        beginHeaderDrag(event, 'cover-size', { x: 0, y: 0 })
                                    }
                                />
                            </>
                        )}
                    </div>
                ) : (
                    <div
                        className="mx-auto flex items-center justify-center text-xs text-muted-foreground"
                        style={{ height: headerVisualHeight }}
                    >
                        {editMode ? 'Cover image is hidden' : null}
                    </div>
                )}
            </div>

            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1000] mx-auto max-w-[1480px]"
                style={{ height: headerVisualHeight }}
            >
                <div
                    className="pointer-events-auto absolute isolate overflow-visible -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: '50%',
                        top: `${theme.avatarFrameY}%`,
                        width: profileDisplayWidth,
                        height: profileDisplayHeight,
                    }}
                >
                    {selectedBorder && (
                        <img
                            src={storageUrl(selectedBorder.image_path)!}
                            alt=""
                            className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none object-fill"
                            style={{
                                width: `${borderWidth * 100}%`,
                                height: `${borderHeight * 100}%`,
                                transform: `translate(calc(-50% + ${borderOffset.x}px), calc(-50% + ${borderOffset.y}px))`,
                                zIndex: borderLayer === 'front' ? 20 : -10,
                            }}
                            draggable={false}
                        />
                    )}

                    {editMode && selectedBorder && !headerLocks.avatar_border && (
                        <div
                            className="pointer-events-none absolute left-1/2 top-1/2 z-[1001] border border-dashed border-sky-400"
                            style={{
                                width: `${borderWidth * 100}%`,
                                height: `${borderHeight * 100}%`,
                                transform: `translate(calc(-50% + ${borderOffset.x}px), calc(-50% + ${borderOffset.y}px))`,
                            }}
                        >
                            <button
                                type="button"
                                className="pointer-events-auto absolute -left-3 -top-3 rounded bg-background p-1 shadow-md ring-1 ring-sky-400"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border', borderOffset)
                                }
                                aria-label="Move profile border"
                                title="Move profile border"
                            >
                                <Move className="h-3.5 w-3.5 text-sky-500" />
                            </button>

                            <button
                                type="button"
                                className="pointer-events-auto absolute -right-1 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-width', borderOffset)
                                }
                                aria-label="Resize profile border width"
                                title="Resize border width"
                            />

                            <button
                                type="button"
                                className="pointer-events-auto absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-height', borderOffset)
                                }
                                aria-label="Resize profile border height"
                                title="Resize border height"
                            />

                            <button
                                type="button"
                                className="pointer-events-auto absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-border-size', borderOffset)
                                }
                                aria-label="Resize profile border width and height"
                                title="Resize width and height"
                            />
                        </div>
                    )}
                    {editMode && (
                        <HeaderLockButton
                            locked={headerLocks.avatar_frame}
                            label="Profile frame"
                            className="-left-7 -top-7 z-[1002]"
                            onToggle={() => toggleHeaderLock('avatar_frame')}
                        />
                    )}
                    {editMode && selectedBorder && (
                        <HeaderLockButton
                            locked={headerLocks.avatar_border}
                            label="Profile border"
                            className="-right-7 -top-7 z-[1002]"
                            onToggle={() => toggleHeaderLock('avatar_border')}
                        />
                    )}

                    <div
                        className={`relative z-0 flex h-full w-full items-center justify-center overflow-hidden bg-primary text-3xl font-bold text-primary-foreground ${
                            editMode ? 'cursor-ns-resize ring-2 ring-foreground/20' : ''
                        }`}
                        style={{
                            borderColor: theme.avatarBorderColor || 'var(--background)',
                            borderRadius: `${theme.avatarBorderRadius}%`,
                            borderStyle: 'solid',
                            borderWidth: theme.avatarBorderWidth,
                        }}
                        onPointerDown={(event) => {
                            if (event.button !== 0) return
                            beginHeaderDrag(event, 'avatar-frame', {
                                x: 50,
                                y: theme.avatarFrameY,
                            })
                        }}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={artist.name}
                                className="h-full w-full select-none object-cover"
                                draggable={false}
                                style={{
                                    objectPosition: `${avatarImagePosition.x}% ${avatarImagePosition.y}%`,
                                }}
                            />
                        ) : (
                            avatarLetter
                        )}
                    </div>
                    {editMode && !headerLocks.avatar_frame && (
                        <>
                            <button
                                type="button"
                                className="absolute -right-2 top-1/2 z-[1002] h-10 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-width', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display width"
                                title="Resize profile display width"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 left-1/2 z-[1002] h-3 w-10 -translate-x-1/2 cursor-ns-resize rounded bg-sky-500 shadow-md ring-2 ring-white"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-height', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display height"
                                title="Resize profile display height"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 -right-2 z-[1003] h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                                onPointerDown={(event) =>
                                    beginHeaderDrag(event, 'avatar-frame-size', {
                                        x: profileDisplayScaleX,
                                        y: profileDisplayScaleY,
                                    })
                                }
                                aria-label="Resize profile display"
                                title="Resize profile display width and height"
                            />
                        </>
                    )}
                    {editMode && (
                        <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background px-2 py-0.5 text-[10px] text-foreground shadow-sm">
                            Drag up/down · resize with handles
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1480px] mx-auto px-4 pb-6 pt-16 text-center">
                <h1 className="mt-3 inline-flex items-center justify-center gap-2 text-2xl font-bold">
                    {artist.name}
                    {artist.artist_verified && (
                        <BadgeCheck className="h-5 w-5 text-sky-500" aria-label="Verified artist" />
                    )}
                </h1>
                <p className="text-sm text-muted-foreground">@{artist.username}</p>
                {!isOwner && (
                    <div className="mt-3 flex justify-center">
                        <Button
                            size="sm"
                            variant={profile.stats?.is_following ? 'outline' : 'default'}
                            disabled={followBusy}
                            onClick={onToggleFollow}
                            style={profileButtonStyle}
                        >
                            {profile.stats?.is_following ? 'Unfollow' : 'Follow'}
                        </Button>
                    </div>
                )}
                <div
                    className="mt-2 grid justify-center gap-1 text-xs text-muted-foreground"
                    style={profileTextStyle}
                >
                    <p>
                        {(
                            profile.stats?.followers_count ??
                            artist.followers_count ??
                            0
                        ).toLocaleString()}{' '}
                        followers
                    </p>
                    <p>{(profile.stats?.total_likes ?? 0).toLocaleString()} total likes</p>
                </div>
                {!isOwner && (
                    <div className="mt-3 flex justify-center">
                        <Button asChild size="sm" variant="outline" style={profileButtonStyle}>
                            <Link to={`/messages?to=${artist.username}`}>Message</Link>
                        </Button>
                    </div>
                )}
                {draft.artistTitle && <p className="mt-1 text-sm">{draft.artistTitle}</p>}
                {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={toPublicHref(link.value)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <LinkIcon className="h-3 w-3" />
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
                {artist.bio && (
                    <p className="max-w-2xl mx-auto mt-3 text-sm text-muted-foreground">
                        {artist.bio}
                    </p>
                )}
            </div>
        </header>
    )
}

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
    onActiveTabChange,
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
    const backgroundRef = useRef<HTMLInputElement | null>(null)
    const profileDisplayScaleX = normalizeProfileDisplayScale(draft.tabsConfig.cover_offset?.x)
    const profileDisplayScaleY = normalizeProfileDisplayScale(draft.tabsConfig.cover_offset?.y)

    const updateTabsConfig = (patch: Partial<ProfileTabsConfig>) => {
        onChange({ tabsConfig: { ...draft.tabsConfig, ...patch } })
    }

    const updateTabVisibility = (tab: ProfileTabId, visible: boolean) => {
        updateTabsConfig({
            visibility: { ...draft.tabsConfig.visibility, [tab]: visible },
        })
    }

    const startCanvasPaletteDrag = (
        event: DragEvent<HTMLButtonElement>,
        kind: ProfileCanvasItem['kind'],
        type: ProfileTabId
    ) => {
        event.dataTransfer.setData(PROFILE_CANVAS_DROP_MIME, `${kind}:${type}`)
        event.dataTransfer.effectAllowed = 'copy'
    }

    const startExistingCanvasItemDrag = (
        event: DragEvent<HTMLDivElement>,
        item: ProfileCanvasItem
    ) => {
        event.dataTransfer.setData(PROFILE_CANVAS_DROP_MIME, `${item.kind}:${item.type}:${item.id}`)
        event.dataTransfer.effectAllowed = 'move'
    }

    const canvasButtons = getCanvasItems(draft.tabsConfig, PROFILE_TAB_IDS, 'tab')
    const canvasSections = getCanvasItems(draft.tabsConfig, PROFILE_TAB_IDS, 'section')
    const visiblePreviewTabs = PROFILE_TAB_IDS.filter((tab) => draft.tabsConfig.visibility[tab])

    const updateLink = (index: number, patch: Partial<ProfileLinkDraft>) => {
        onChange({
            links: draft.links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, ...patch } : link
            ),
        })
    }

    const addLink = () => {
        onChange({
            links: [
                ...draft.links,
                {
                    id: `draft-${Date.now()}`,
                    title: '',
                    url: '',
                    image_path: null,
                    imageFile: null,
                    imagePreview: null,
                    is_public: true,
                },
            ],
        })
    }

    const removeLink = (index: number) => {
        onChange({
            links: draft.links.filter((_, linkIndex) => linkIndex !== index),
        })
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-[12000] w-full overflow-y-auto border-r bg-background shadow-xl md:w-[380px] md:p-4">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background p-4 md:-mx-4 md:mb-4 md:-mt-4">
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
                <Button type="button" variant="outline" onClick={() => avatarRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Profile Image
                </Button>
                <Button type="button" variant="outline" onClick={() => coverRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Banner Image
                </Button>
            </div>

            <div className="hidden gap-5 md:grid">
                <Button type="button" variant="outline" onClick={onResetTabs}>
                    <Layers className="h-4 w-4" />
                    Default Settings
                </Button>

                <ProfileEditSection title="Global Fonts">
                    <div className="grid gap-1.5">
                        <Label htmlFor="profile-global-font">Font family</Label>
                        <Input
                            id="profile-global-font"
                            value={draft.tabsConfig.global_styles?.font_family ?? ''}
                            placeholder="Inter, Comic Relief, sans-serif"
                            onChange={(event) =>
                                updateTabsConfig({
                                    global_styles: {
                                        ...(draft.tabsConfig.global_styles ??
                                            defaultProfileTabsConfig().global_styles!),
                                        font_family: event.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                </ProfileEditSection>

                <ProfileEditSection title="Global Colors">
                    <ColorField
                        label="Text"
                        value={draft.tabsConfig.global_styles?.text_color ?? '#111827'}
                        fallback="#111827"
                        onChange={(text_color) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    text_color,
                                },
                            })
                        }
                    />
                    <ColorField
                        label="Muted text"
                        value={draft.tabsConfig.global_styles?.muted_text_color ?? '#6b7280'}
                        fallback="#6b7280"
                        onChange={(muted_text_color) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    muted_text_color,
                                },
                            })
                        }
                    />
                    <ColorField
                        label="Accent"
                        value={draft.tabsConfig.global_styles?.accent_color ?? '#111827'}
                        fallback="#111827"
                        onChange={(accent_color) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    accent_color,
                                },
                            })
                        }
                    />
                </ProfileEditSection>

                <ProfileEditSection title="Global Sizes">
                    <RangeField
                        label="Base text"
                        value={draft.tabsConfig.global_styles?.base_font_size ?? 14}
                        min={10}
                        max={28}
                        suffix="px"
                        onChange={(base_font_size) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    base_font_size,
                                },
                            })
                        }
                    />
                    <RangeField
                        label="Widget text"
                        value={draft.tabsConfig.global_styles?.widget_font_size ?? 13}
                        min={10}
                        max={28}
                        suffix="px"
                        onChange={(widget_font_size) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    widget_font_size,
                                },
                            })
                        }
                    />
                    <RangeField
                        label="Button text"
                        value={draft.tabsConfig.global_styles?.button_font_size ?? 14}
                        min={10}
                        max={24}
                        suffix="px"
                        onChange={(button_font_size) =>
                            updateTabsConfig({
                                global_styles: {
                                    ...(draft.tabsConfig.global_styles ??
                                        defaultProfileTabsConfig().global_styles!),
                                    button_font_size,
                                },
                            })
                        }
                    />
                </ProfileEditSection>

                <ProfileEditSection title="Profile">
                    <div className="grid gap-1">
                        <Label htmlFor="profile-title">Title</Label>
                        {errors.artistTitle && <FieldMessage>{errors.artistTitle}</FieldMessage>}
                        <Input
                            id="profile-title"
                            value={headerDraft.artistTitle}
                            onChange={(event) =>
                                onHeaderChange({ artistTitle: event.target.value })
                            }
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={draft.showCover}
                            onChange={(event) => onChange({ showCover: event.target.checked })}
                        />
                        Cover Image
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => coverRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" />
                            Cover
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => avatarRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" />
                            Profile
                        </Button>
                    </div>
                    <input
                        ref={coverRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                            onUploadCover(event.target.files?.[0] ?? null)
                            event.target.value = ''
                        }}
                    />
                    <input
                        ref={avatarRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => {
                            onUploadAvatar(event.target.files?.[0] ?? null)
                            event.target.value = ''
                        }}
                    />
                    <RangeField
                        label="Cover width"
                        value={draft.coverWidth}
                        min={30}
                        max={100}
                        suffix="%"
                        onChange={(coverWidth) => onChange({ coverWidth })}
                    />
                    <RangeField
                        label="Cover height"
                        value={draft.bannerHeight}
                        min={160}
                        max={560}
                        suffix="px"
                        onChange={(bannerHeight) => onChange({ bannerHeight })}
                    />
                    <RangeField
                        label="Profile display width"
                        value={Math.round(profileDisplayScaleX * 112)}
                        min={64}
                        max={320}
                        suffix="px"
                        onChange={(value) =>
                            updateTabsConfig({
                                cover_offset: {
                                    x: Number((value / 112).toFixed(3)),
                                    y: profileDisplayScaleY,
                                },
                            })
                        }
                    />
                    <RangeField
                        label="Profile display height"
                        value={Math.round(profileDisplayScaleY * 112)}
                        min={64}
                        max={320}
                        suffix="px"
                        onChange={(value) =>
                            updateTabsConfig({
                                cover_offset: {
                                    x: profileDisplayScaleX,
                                    y: Number((value / 112).toFixed(3)),
                                },
                            })
                        }
                    />
                    <RangeField
                        label="Profile vertical position"
                        value={draft.avatarFrameY}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(avatarFrameY) => onChange({ avatarFrameX: 50, avatarFrameY })}
                    />
                    <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        The cover stays fixed and can only resize. The profile display stays
                        horizontally centered, but it can resize and move up or down.
                    </p>
                </ProfileEditSection>

                <ProfileEditSection title="Public Links">
                    {errors.links && <FieldMessage>{errors.links}</FieldMessage>}
                    <div className="grid gap-3">
                        {draft.links.map((link, index) => (
                            <div key={link.id} className="grid gap-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={link.is_public}
                                            onChange={(event) =>
                                                updateLink(index, {
                                                    is_public: event.target.checked,
                                                })
                                            }
                                        />
                                        Public
                                    </label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => removeLink(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor={`profile-link-title-${index}`}>Title</Label>
                                    {errors[`links.${index}.title`] && (
                                        <FieldMessage>
                                            {errors[`links.${index}.title`]}
                                        </FieldMessage>
                                    )}
                                    <Input
                                        id={`profile-link-title-${index}`}
                                        value={link.title}
                                        onChange={(event) =>
                                            updateLink(index, { title: event.target.value })
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor={`profile-link-url-${index}`}>Link</Label>
                                    {errors[`links.${index}.url`] && (
                                        <FieldMessage>{errors[`links.${index}.url`]}</FieldMessage>
                                    )}
                                    <Input
                                        id={`profile-link-url-${index}`}
                                        value={link.url}
                                        placeholder="example.com, https://example.com, mailto:hello@example.com"
                                        onChange={(event) =>
                                            updateLink(index, { url: event.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" onClick={addLink}>
                        <Plus className="h-4 w-4" />
                        Add Link
                    </Button>
                </ProfileEditSection>

                <ProfileEditSection title="Border">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            className={`rounded-lg border px-2 py-3 text-xs ${
                                !draft.profileBorderId ? 'ring-2 ring-foreground' : ''
                            }`}
                            onClick={() => onChange({ profileBorderId: '' })}
                        >
                            None
                        </button>
                        {borders.map((border) => (
                            <button
                                key={border.id}
                                type="button"
                                className={`group relative rounded-lg border p-2 ${
                                    draft.profileBorderId === border.id
                                        ? 'ring-2 ring-foreground'
                                        : ''
                                }`}
                                onClick={() => onChange({ profileBorderId: border.id })}
                            >
                                <img
                                    src={storageUrl(border.image_path)!}
                                    alt={border.name}
                                    className="mx-auto h-16 w-16 object-contain"
                                />
                                <span className="mt-1 block truncate text-[10px]">
                                    {border.name}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Profile borders come from Noble Royalty. Create or sell border designs in
                        the admin Noble Royalty section.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <RangeField
                            label="Border"
                            value={draft.avatarBorderWidth}
                            min={0}
                            max={16}
                            suffix="px"
                            onChange={(avatarBorderWidth) => onChange({ avatarBorderWidth })}
                        />
                        <RangeField
                            label="Radius"
                            value={draft.avatarBorderRadius}
                            min={0}
                            max={100}
                            suffix="%"
                            onChange={(avatarBorderRadius) => onChange({ avatarBorderRadius })}
                        />
                    </div>
                    <SelectField
                        label="Border layer"
                        value={draft.tabsConfig.border_layer ?? 'front'}
                        options={['front', 'back']}
                        formatOption={(option) => (option === 'front' ? 'Send Front' : 'Send Back')}
                        onChange={(border_layer) =>
                            updateTabsConfig({
                                border_layer: border_layer as ProfileTabsConfig['border_layer'],
                            })
                        }
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-border-width">Border width %</Label>

                            <Input
                                id="profile-border-width"
                                type="number"
                                min="5"
                                step="10"
                                value={Math.round(
                                    (draft.tabsConfig.border_width ??
                                        draft.tabsConfig.border_scale ??
                                        1.35) * 100
                                )}
                                onChange={(event) => {
                                    const value = Number(event.target.value)

                                    if (!Number.isFinite(value)) return

                                    updateTabsConfig({
                                        border_width: Math.max(0.05, value / 100),
                                    })
                                }}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="profile-border-height">Border height %</Label>

                            <Input
                                id="profile-border-height"
                                type="number"
                                min="5"
                                step="10"
                                value={Math.round(
                                    (draft.tabsConfig.border_height ??
                                        draft.tabsConfig.border_scale ??
                                        1.35) * 100
                                )}
                                onChange={(event) => {
                                    const value = Number(event.target.value)

                                    if (!Number.isFinite(value)) return

                                    updateTabsConfig({
                                        border_height: Math.max(0.05, value / 100),
                                    })
                                }}
                            />
                        </div>
                    </div>
                    <ColorField
                        label="Border color"
                        value={draft.avatarBorderColor}
                        fallback="#ffffff"
                        error={errors.avatarBorderColor}
                        onChange={(avatarBorderColor) => onChange({ avatarBorderColor })}
                    />
                </ProfileEditSection>

                <ProfileEditSection title="Background">
                    <ColorField
                        label="Color"
                        value={draft.backgroundColor}
                        fallback="#ffffff"
                        error={errors.backgroundColor}
                        onChange={(backgroundColor) => onChange({ backgroundColor })}
                    />
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={draft.hasGradient}
                            onChange={(event) => onChange({ hasGradient: event.target.checked })}
                        />
                        Gradient
                    </label>
                    {draft.hasGradient && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <ColorField
                                    label="Gradient start"
                                    value={draft.gradientFrom}
                                    fallback="#ffffff"
                                    error={errors.gradientFrom}
                                    onChange={(gradientFrom) => onChange({ gradientFrom })}
                                />
                                <ColorField
                                    label="Gradient end"
                                    value={draft.gradientTo}
                                    fallback="#f4f4f5"
                                    error={errors.gradientTo}
                                    onChange={(gradientTo) => onChange({ gradientTo })}
                                />
                            </div>
                            <SelectField
                                label="Gradient direction"
                                value={draft.gradientDirection}
                                options={[...PROFILE_GRADIENT_DIRECTIONS]}
                                onChange={(gradientDirection) => onChange({ gradientDirection })}
                            />
                        </>
                    )}
                    <RangeField
                        label="Background blur"
                        value={draft.backgroundBlur}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(backgroundBlur) => onChange({ backgroundBlur })}
                    />
                    <input
                        ref={backgroundRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                            onUploadBackground(event.target.files?.[0] ?? null)
                            event.target.value = ''
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => backgroundRef.current?.click()}
                    >
                        <Upload className="h-4 w-4" />
                        Upload Background
                    </Button>
                </ProfileEditSection>

                <ProfileEditSection title="Tabs">
                    <div className="grid grid-cols-2 gap-2">
                        {PROFILE_TAB_IDS.map((tab) => (
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
                    <div className="grid gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Preview</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PROFILE_TAB_IDS.map((tab) => {
                                const enabled = draft.tabsConfig.visibility[tab]
                                return (
                                    <Button
                                        key={`preview-${tab}`}
                                        type="button"
                                        variant={activeTab === tab ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!enabled}
                                        onClick={() => onActiveTabChange(tab)}
                                    >
                                        {PROFILE_TAB_LABELS[tab].replace('My ', '')}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
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
                    <RangeField
                        label="Tab width"
                        value={draft.navW}
                        min={30}
                        max={100}
                        suffix="%"
                        onChange={(navW) => onChange({ navW })}
                    />
                    <RangeField
                        label="Tab height"
                        value={draft.navH}
                        min={28}
                        max={96}
                        suffix="px"
                        onChange={(navH) => onChange({ navH })}
                    />
                    <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Together keeps tab buttons grouped. Separate lets individual tab buttons
                        move on the canvas. Content widgets are added to the active preview page.
                    </p>
                    <div className="grid gap-3 rounded-lg border p-3">
                        {(canvasButtons.length > 0 || canvasSections.length > 0) && (
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Current canvas contents
                                </p>
                                <div className="grid gap-1.5">
                                    {[...canvasButtons, ...canvasSections].map((item) => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(event) =>
                                                startExistingCanvasItemDrag(event, item)
                                            }
                                            className="grid cursor-grab gap-2 rounded-md border bg-background px-2 py-1.5 text-xs active:cursor-grabbing"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.kind === 'tab' ? 'Button' : 'Content'}:{' '}
                                                    {PROFILE_TAB_LABELS[item.type]}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        onRemoveCanvasItem(item.id, item.kind)
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
                                                            onUpdateCanvasItem(item.id, item.kind, {
                                                                page: page as ProfileTabId,
                                                            })
                                                        }
                                                    />
                                                    {item.type === 'arts' && (
                                                        <>
                                                            <SelectField
                                                                label="Display"
                                                                value={item.display ?? 'masonry'}
                                                                options={[
                                                                    'standard',
                                                                    'masonry',
                                                                    'bento',
                                                                    'magazine',
                                                                    'gallery',
                                                                    'carousel',
                                                                ]}
                                                                formatOption={formatCanvasDisplay}
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
                                                                        item.pagination !== false
                                                                    }
                                                                    onChange={(event) =>
                                                                        onUpdateCanvasItem(
                                                                            item.id,
                                                                            item.kind,
                                                                            {
                                                                                pagination:
                                                                                    event.target
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
                                                                    item.display ?? 'image_title'
                                                                }
                                                                options={[
                                                                    'image',
                                                                    'image_title',
                                                                    'split_card',
                                                                    'table',
                                                                ]}
                                                                formatOption={formatCanvasDisplay}
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
                                                            <RangeField
                                                                label="Sticker size"
                                                                value={draft.stickerSize}
                                                                min={72}
                                                                max={180}
                                                                suffix="px"
                                                                onChange={(stickerSize) =>
                                                                    onChange({ stickerSize })
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
                                                    {item.type === 'comments' && (
                                                        <SelectField
                                                            label="Display"
                                                            value={item.display ?? 'table'}
                                                            options={['table', 'cards']}
                                                            formatOption={formatCanvasDisplay}
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
                                                            formatOption={formatCanvasDisplay}
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
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Add tab button
                            </p>
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
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Add content
                            </p>
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
                                            onAddCanvasItem('section', tab, undefined, activeTab)
                                        }
                                    >
                                        {PROFILE_TAB_LABELS[tab].replace('My ', '')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ProfileEditSection>

                <ProfileEditSection title="Sections">
                    <RangeField
                        label="Board height"
                        value={draft.boardMinHeight}
                        min={360}
                        max={2400}
                        suffix="px"
                        onChange={(boardMinHeight) => onChange({ boardMinHeight })}
                    />
                    <RangeField
                        label="Art tile width"
                        value={draft.artsTileWidth}
                        min={120}
                        max={420}
                        suffix="px"
                        onChange={(artsTileWidth) => onChange({ artsTileWidth })}
                    />
                    <RangeField
                        label="Sticker size"
                        value={draft.stickerSize}
                        min={72}
                        max={180}
                        suffix="px"
                        onChange={(stickerSize) => onChange({ stickerSize })}
                    />
                </ProfileEditSection>
            </div>
        </aside>
    )
}
