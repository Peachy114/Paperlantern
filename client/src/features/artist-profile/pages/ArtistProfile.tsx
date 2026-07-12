import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ChangeEvent,
    type DragEvent,
    type FormEvent,
    type PointerEvent,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
    CalendarDays,
    BadgeCheck,
    Edit3,
    Eye,
    Gift,
    Heart,
    Image as ImageIcon,
    ImageOff,
    Images as ImagesIcon,
    Layers,
    Link as LinkIcon,
    Lock,
    MessageCircle,
    Minus,
    Move,
    Palette,
    Plus,
    Save,
    Trash2,
    Type,
    Unlock,
    Upload,
    X,
    type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useArtistProfile } from '@/features/artist-profile/hooks/useArtistProfile'
import CommentSection from '@/features/comments/components/CommentSection'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { storageUrl } from '@/utils/storage'
import type {
    ArtistProfileBlock,
    ArtistProfileResponse,
    ArtistSticker,
    ProfileCanvasItem,
    ProfileBlockType,
    ProfileBorder,
    ProfileLink,
    ProfileTabId,
    ProfileTabPosition,
    ProfileTabsConfig,
} from '@/types/artistProfile'
import type { Art, ArtImage } from '@/types/art'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type HeaderDraft = {
    artistTitle: string
    showPublicLinks: boolean
}

type ProfileLinkDraft = ProfileLink & {
    imageFile?: File | null
    imagePreview?: string | null
}

type ProfileThemeDraft = {
    backgroundColor: string
    gradientFrom: string
    gradientTo: string
    gradientDirection: string
    hasGradient: boolean
    backgroundBlur: number
    showCover: boolean
    coverWidth: number
    bannerHeight: number
    avatarFrameX: number
    avatarFrameY: number
    avatarImageX: number
    avatarImageY: number
    avatarBorderWidth: number
    avatarBorderColor: string
    avatarBorderRadius: number
    profileBorderId: string
    navLayout: 'together' | 'separate'
    navX: number
    navY: number
    navW: number
    navH: number
    tabsConfig: ProfileTabsConfig
    links: ProfileLinkDraft[]
    boardMinHeight: number
    artsTileWidth: number
    stickerSize: number
}

type ProfileEditErrors = Record<string, string>

type NewBlockForm = {
    type: ProfileBlockType
    text: string
    image: File | null
    sourceArtImageId: string
    stickerId: string
    isSticker: boolean
}

type BlockPatch = Partial<
    Pick<
        ArtistProfileBlock,
        | 'x'
        | 'y'
        | 'w'
        | 'h'
        | 'padding_x'
        | 'padding_y'
        | 'fit_mode'
        | 'font_size'
        | 'is_sticker'
        | 'rotation'
        | 'text_content'
        | 'z_index'
    >
>

type DragState = {
    kind: 'move' | 'resize' | 'padding-x' | 'padding-y'
    blockId: string
    startX: number
    startY: number
    block: ArtistProfileBlock
    patch: BlockPatch
    edge?: 'left' | 'right' | 'top' | 'bottom'
}

type NavDragState = {
    kind: 'move' | 'resize'
    startX: number
    startY: number
    navX: number
    navY: number
    navW: number
    navH: number
    patch: Record<string, number>
}

type TabDragState = {
    tab: ProfileTabId
    kind: 'move' | 'resize'
    startX: number
    startY: number
    position: ProfileTabPosition
    config: ProfileTabsConfig
}

type CanvasDragState = {
    itemId: string
    itemKind: 'tab' | 'section'
    kind: 'move' | 'resize'
    startX: number
    startY: number
    item: ProfileCanvasItem
    config: ProfileTabsConfig
}

type CanvasItemPatch = Partial<
    Pick<ProfileCanvasItem, 'display' | 'pagination' | 'page' | 'locked'>
>

type ProfileCanvasDisplay = NonNullable<ProfileCanvasItem['display']>
type ProfileHeaderLocks = NonNullable<ProfileTabsConfig['header_locks']>
type ProfileHeaderLockKey = keyof ProfileHeaderLocks
type HeaderDragKind =
    | 'cover-frame'
    | 'cover-image'
    | 'cover-size'
    | 'avatar-frame'
    | 'avatar-image'
    | 'avatar-border'
    | 'avatar-border-width'
    | 'avatar-border-height'
    | 'avatar-border-size'

type ArtImageOption = {
    id: string
    title: string
    image: ArtImage
}

type BlockRect = Pick<ArtistProfileBlock, 'x' | 'y' | 'w' | 'h'>

const GRID_STEP = 5
const BOARD_MIN_HEIGHT = 760
const BOARD_UNIT_PX = 8
const STICKER_BLOCK_SIZE = { w: 18, h: 18 }
const PROFILE_GRADIENT_DIRECTIONS = [
    'to bottom',
    'to top',
    'to right',
    'to left',
    'to bottom right',
    'to bottom left',
] as const
const PROFILE_TAB_IDS: ProfileTabId[] = ['board', 'arts', 'works', 'stickers', 'comments']
const PROFILE_TAB_LABELS: Record<ProfileTabId, string> = {
    board: 'My Board',
    arts: 'My Arts',
    works: 'My Works',
    stickers: 'My Stickers',
    comments: 'My Comments',
}
const PROFILE_CANVAS_DROP_MIME = 'application/x-latern-profile-canvas-item'

const EMPTY_BLOCK: NewBlockForm = {
    type: 'image',
    text: '',
    image: null,
    sourceArtImageId: '',
    stickerId: '',
    isSticker: false,
}

export default function ArtistProfile() {
    const { username = '' } = useParams()
    const { user, setUser } = useAuthStore()
    const {
        profile,
        updateHeader,
        createBlock,
        updateBlock,
        deleteBlock,
        createBorder,
        deleteBorder,
    } = useArtistProfile(username)

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
            return
        }

        try {
            await updateHeader.mutateAsync(profileThemeToFormData(themeDraft, headerDraft))
            toast.success('Profile updated.')
        } catch {
            toast.error('Could not update profile.')
        }
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
        deleteBlock.isPending ||
        createBorder.isPending ||
        deleteBorder.isPending
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
                        busy={busy}
                        desktopMode={isDesktopProfileEditor}
                        activeTab={activeTab}
                        onChange={patchThemeDraft}
                        onHeaderChange={patchHeaderDraft}
                        onActiveTabChange={setActiveProfileTab}
                        onSave={saveProfileTheme}
                        onUploadCover={(file) => saveHeaderFile('cover', file)}
                        onUploadAvatar={(file) => saveHeaderFile('avatar', file)}
                        onUploadBackground={(file) => saveHeaderFile('background_image', file)}
                        onAddCanvasItem={addCanvasItemToDraft}
                        onRemoveCanvasItem={removeCanvasItemFromDraft}
                        onUpdateCanvasItem={updateCanvasItemInDraft}
                        onResetTabs={resetProfileTabsDraft}
                        onCreateBorder={async (payload) => {
                            try {
                                await createBorder.mutateAsync(payload)
                                toast.success('Profile border added.')
                            } catch {
                                toast.error('Could not add profile border.')
                            }
                        }}
                        onDeleteBorder={(id) =>
                            deleteBorder.mutate(id, {
                                onSuccess: () => toast.success('Profile border deleted.'),
                                onError: () => toast.error('Could not delete profile border.'),
                            })
                        }
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
                    />

                    <main
                        className={
                            desktopManageMode
                                ? 'w-full px-4 py-8 md:px-6'
                                : 'max-w-[1360px] mx-auto px-4 py-8'
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
                                    onSaveProfile={saveProfileTheme}
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
                                                    arts={profile.arts}
                                                    tileWidth={themeDraft.artsTileWidth}
                                                    onOpen={setSelectedArt}
                                                />
                                            </ProfileSection>
                                        )}

                                        {showStickersWithBoard && (
                                            <ProfileSection title="My Stickers">
                                                <ProfileStickers
                                                    stickers={profile.stickers}
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
                                            />
                                            <ArtsMasonry
                                                arts={profile.arts}
                                                tileWidth={themeDraft.artsTileWidth}
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
                                            />
                                            <WorksGrid works={profile.works} />
                                        </TabsContent>
                                    )}

                                    <TabsContent value="stickers">
                                        <ProfilePageHeading
                                            title="My Stickers"
                                            canEdit={isOwner && isDesktopProfileEditor}
                                            editMode={editMode}
                                            onToggleEdit={() => setEditMode((current) => !current)}
                                        />
                                        <ProfileStickers
                                            stickers={profile.stickers}
                                            stickerSize={themeDraft.stickerSize}
                                        />
                                    </TabsContent>

                                    <TabsContent value="comments">
                                        <ProfilePageHeading
                                            title="My Comments"
                                            canEdit={isOwner && isDesktopProfileEditor}
                                            editMode={editMode}
                                            onToggleEdit={() => setEditMode((current) => !current)}
                                        />
                                        <ProfileComments comments={profile.comments ?? []} />
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

function ProfileTabsNav({
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

function ProfilePageHeading({
    title,
    canEdit,
    editMode,
    onToggleEdit,
}: {
    title: string
    canEdit: boolean
    editMode: boolean
    onToggleEdit: () => void
}) {
    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
            </h2>
            {canEdit && (
                <Button variant={editMode ? 'default' : 'outline'} onClick={onToggleEdit}>
                    <Edit3 className="h-4 w-4" />
                    {editMode ? 'Done' : 'Edit Mode'}
                </Button>
            )}
        </div>
    )
}

function ProfileWidgetEditControls({
    item,
    theme,
    visible,
    busy,
    onUpdateCanvasItem,
    onThemeChange,
    onSave,
}: {
    item: ProfileCanvasItem
    theme: ProfileThemeDraft
    visible: boolean
    busy: boolean
    onUpdateCanvasItem: (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => void
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
    onSave: () => void
}) {
    if (!visible || item.type === 'board') return null

    return (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-background/95 p-3 shadow-sm">
            {item.type === 'arts' && (
                <>
                    <SelectField
                        label="Arts grid"
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
                            onUpdateCanvasItem(item.id, item.kind, {
                                display: display as ProfileCanvasItem['display'],
                            })
                        }
                    />
                    <label className="flex min-h-8 items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={item.pagination !== false}
                            onChange={(event) =>
                                onUpdateCanvasItem(item.id, item.kind, {
                                    pagination: event.target.checked,
                                })
                            }
                        />
                        Pagination
                    </label>
                </>
            )}

            {item.type === 'works' && (
                <SelectField
                    label="Works display"
                    value={item.display ?? 'image_title'}
                    options={['image', 'image_title', 'split_card', 'table']}
                    formatOption={formatCanvasDisplay}
                    onChange={(display) =>
                        onUpdateCanvasItem(item.id, item.kind, {
                            display: display as ProfileCanvasItem['display'],
                        })
                    }
                />
            )}

            {item.type === 'stickers' && (
                <div className="min-w-56">
                    <RangeField
                        label="Sticker size"
                        value={theme.stickerSize}
                        min={72}
                        max={180}
                        suffix="px"
                        onChange={(stickerSize) => onThemeChange({ stickerSize })}
                    />
                </div>
            )}

            {item.type === 'comments' && (
                <SelectField
                    label="Comments display"
                    value={item.display ?? 'table'}
                    options={['table', 'cards']}
                    formatOption={formatCanvasDisplay}
                    onChange={(display) =>
                        onUpdateCanvasItem(item.id, item.kind, {
                            display: display as ProfileCanvasItem['display'],
                        })
                    }
                />
            )}

            <Button type="button" size="sm" onClick={onSave} disabled={busy}>
                <Save className="h-4 w-4" />
                Save
            </Button>
        </div>
    )
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
            </h2>
            {children}
        </section>
    )
}

function ProfileLayoutCanvas({
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
                    arts={profile.arts}
                    tileWidth={theme.artsTileWidth}
                    display={item.display}
                    limit={item.pagination === false ? undefined : getWidgetImageLimit(item)}
                    onOpen={onOpenArt}
                />
            )
        }

        if (item.type === 'works') {
            return <WorksGrid works={profile.works} display={item.display} />
        }

        if (item.type === 'stickers') {
            return <ProfileStickers stickers={profile.stickers} stickerSize={theme.stickerSize} />
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
            className={`relative ${
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
                    style={{
                        left: `${item.x}%`,
                        top: item.y,
                        width: `${item.w}%`,
                        height: sectionHeight(item),
                        zIndex: editMode ? 40 : undefined,
                    }}
                >
                    <ProfilePageHeading
                        title={PROFILE_TAB_LABELS[item.type]}
                        canEdit={canEditContent}
                        editMode={contentEditMode}
                        onToggleEdit={onToggleContentEdit}
                    />
                    <ProfileWidgetEditControls
                        item={item}
                        theme={theme}
                        visible={canEditContent && contentEditMode}
                        busy={busy}
                        onUpdateCanvasItem={onUpdateCanvasItem}
                        onThemeChange={onThemeChange}
                        onSave={onSaveProfile}
                    />
                    <div
                        className={`min-h-0 flex-1 ${
                            item.type === 'board' ? '' : 'overflow-hidden'
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

function CenterGuide() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-red-500/80"
        />
    )
}

function HeaderLockButton({
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

function profileTabButtonClass(active: boolean) {
    return `inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
        active
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:bg-background/60 hover:text-foreground'
    }`
}

function CanvasHandles({
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

function ArtistHeader({
    profile,
    editMode,
    draft,
    theme,
    onThemeChange,
    onSavePosition,
}: {
    profile: ArtistProfileResponse
    isOwner: boolean
    editMode: boolean
    draft: HeaderDraft
    theme: ProfileThemeDraft
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
    onSavePosition: (fields: Record<string, string | number | boolean | File | null>) => void
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
    const coverOffset = theme.tabsConfig.cover_offset ?? { x: 0, y: 0 }
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
        'cover-frame': 'cover_frame',
        'cover-size': 'cover_frame',
        'avatar-frame': 'avatar_frame',
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
            image: link.imagePreview ?? (link.image_path ? storageUrl(link.image_path) : null),
        }))
    const socialLinks = [
        { label: 'Twitter', value: artist.twitter_url, image: null },
        { label: 'Instagram', value: artist.instagram_url, image: null },
        { label: 'TikTok', value: artist.tiktok_url, image: null },
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
            const x = snapPercentCenter(clamp(drag.startPositionX + rawDx / 3, 0, 100))
            const y = clamp(drag.startPositionY + rawDy / 3, 0, 100)
            onThemeChange({ avatarFrameX: x, avatarFrameY: y })
            drag.patch = { profile_avatar_frame_x: x, profile_avatar_frame_y: y }
        }
    }

    const handleHeaderUp = () => {
        const drag = headerDragRef.current
        headerDragRef.current = null
        window.removeEventListener('pointermove', handleHeaderMove)
        if (drag && Object.keys(drag.patch).length > 0) onSavePosition(drag.patch)
    }

    return (
        <header className="relative z-[60] border-b">
            {editMode && <CenterGuide />}
            <div className="relative bg-muted/30">
                {theme.showCover ? (
                    <div
                        className={`relative mx-auto overflow-hidden bg-muted ${
                            editMode ? 'cursor-move ring-2 ring-foreground/30 ring-inset' : ''
                        }`}
                        style={{
                            height: theme.bannerHeight,
                            width: `${theme.coverWidth}%`,
                            transform: `translate(${coverOffset.x}px, ${coverOffset.y}px)`,
                        }}
                        onPointerDown={(event) => {
                            if (event.button === 2) {
                                beginHeaderDrag(event, 'cover-image', coverPosition)
                                return
                            }
                            if (event.button === 0)
                                beginHeaderDrag(event, 'cover-frame', coverOffset)
                        }}
                        onContextMenu={(event) => event.preventDefault()}
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
                                <HeaderLockButton
                                    locked={headerLocks.cover_frame}
                                    label="Cover frame"
                                    className="right-2 top-2 z-[1002]"
                                    onToggle={() => toggleHeaderLock('cover_frame')}
                                />
                                <div className="absolute bottom-4 left-4 rounded-md bg-background/90 px-3 py-1 text-xs text-foreground shadow-sm">
                                    Left-drag frame. Right-drag image. Use the white/blue corner to
                                    resize.
                                </div>
                                {!headerLocks.cover_frame && (
                                    <button
                                        type="button"
                                        className="absolute bottom-0 right-0 h-7 w-7 cursor-nwse-resize border-b-4 border-r-4 border-foreground bg-background/70"
                                        aria-label="Resize cover"
                                        onPointerDown={(event) =>
                                            beginHeaderDrag(event, 'cover-size', coverPosition)
                                        }
                                    />
                                )}
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
                className="pointer-events-none absolute inset-x-0 top-0 z-[1000] mx-auto max-w-[1360px]"
                style={{ height: headerVisualHeight }}
            >
                <div
                    className="pointer-events-auto absolute isolate h-28 w-28 overflow-visible -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${theme.avatarFrameX}%`,
                        top: `${theme.avatarFrameY}%`,
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
                        className={`relative z-0 h-full w-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold ${
                            editMode ? 'cursor-move ring-2 ring-foreground/20' : ''
                        }`}
                        style={{
                            borderColor: theme.avatarBorderColor || 'var(--background)',
                            borderRadius: `${theme.avatarBorderRadius}%`,
                            borderStyle: 'solid',
                            borderWidth: theme.avatarBorderWidth,
                        }}
                        onPointerDown={(event) =>
                            beginHeaderDrag(
                                event,
                                event.button === 2 ? 'avatar-image' : 'avatar-frame',
                                event.button === 2
                                    ? avatarImagePosition
                                    : {
                                          x: theme.avatarFrameX,
                                          y: theme.avatarFrameY,
                                      }
                            )
                        }
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
                        {editMode && (
                            <span className="pointer-events-none absolute bottom-1 right-1 z-20 h-4 w-4 rounded-full border-2 border-sky-400 bg-white shadow-sm" />
                        )}
                    </div>
                    {editMode && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background px-2 py-0.5 text-[10px] text-foreground shadow-sm">
                            Profile image editable
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1360px] mx-auto px-4 pb-6 pt-16 text-center">
                <h1 className="mt-3 inline-flex items-center justify-center gap-2 text-2xl font-bold">
                    {artist.name}
                    {artist.artist_verified && (
                        <BadgeCheck className="h-5 w-5 text-sky-500" aria-label="Verified artist" />
                    )}
                </h1>
                <p className="text-sm text-muted-foreground">@{artist.username}</p>
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
                                {link.image ? (
                                    <img
                                        src={link.image}
                                        alt=""
                                        className="h-4 w-4 rounded-sm object-cover"
                                    />
                                ) : (
                                    <LinkIcon className="h-3 w-3" />
                                )}
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
    busy,
    desktopMode,
    activeTab,
    onChange,
    onHeaderChange,
    onActiveTabChange,
    onSave,
    onUploadCover,
    onUploadAvatar,
    onUploadBackground,
    onAddCanvasItem,
    onRemoveCanvasItem,
    onUpdateCanvasItem,
    onResetTabs,
    onCreateBorder,
    onDeleteBorder,
}: {
    draft: ProfileThemeDraft
    headerDraft: HeaderDraft
    errors: ProfileEditErrors
    borders: ProfileBorder[]
    busy: boolean
    desktopMode: boolean
    activeTab: ProfileTabId
    onChange: (patch: Partial<ProfileThemeDraft>) => void
    onHeaderChange: (patch: Partial<HeaderDraft>) => void
    onActiveTabChange: (tab: ProfileTabId) => void
    onSave: () => void
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
    onCreateBorder: (payload: FormData) => Promise<void>
    onDeleteBorder: (id: string) => void
}) {
    const coverRef = useRef<HTMLInputElement | null>(null)
    const avatarRef = useRef<HTMLInputElement | null>(null)
    const backgroundRef = useRef<HTMLInputElement | null>(null)
    const borderRef = useRef<HTMLInputElement | null>(null)
    const [borderName, setBorderName] = useState('')
    const [borderFile, setBorderFile] = useState<File | null>(null)

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

    const handleCreateBorder = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!borderName.trim()) {
            toast.error('Border name is required.')
            return
        }
        if (!borderFile) {
            toast.error('Border image is required.')
            return
        }

        const payload = new FormData()
        payload.append('name', borderName.trim())
        payload.append('image', borderFile)
        await onCreateBorder(payload)
        setBorderName('')
        setBorderFile(null)
        if (borderRef.current) borderRef.current.value = ''
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto border-r bg-background shadow-xl md:w-[380px] md:p-4">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background p-4 md:-mx-4 md:mb-4 md:-mt-4">
                <div>
                    <h2 className="text-sm font-semibold">Profile Edit</h2>
                    <p className="text-xs text-muted-foreground">
                        {desktopMode
                            ? 'Desktop editor is docked beside the live preview.'
                            : 'Mobile editing is limited to profile and banner images.'}
                    </p>
                </div>
                <Button
                    className="hidden md:inline-flex"
                    size="sm"
                    onClick={onSave}
                    disabled={busy}
                >
                    <Save className="h-4 w-4" />
                    Save
                </Button>
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
                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Profile
                    </p>
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
                    <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Left-drag the profile image to move the parent. Right-drag the image to
                        reposition its content. Drag near the center to snap.
                    </p>
                </div>

                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Public Links
                    </p>
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
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null
                                        updateLink(index, {
                                            imageFile: file,
                                            imagePreview: file ? URL.createObjectURL(file) : null,
                                        })
                                    }}
                                />
                                {(link.imagePreview || link.image_path) && (
                                    <img
                                        src={
                                            link.imagePreview ??
                                            (link.image_path ? storageUrl(link.image_path)! : '')
                                        }
                                        alt=""
                                        className="h-10 w-10 rounded object-cover"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" onClick={addLink}>
                        <Plus className="h-4 w-4" />
                        Add Link
                    </Button>
                </div>

                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Border
                    </p>
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
                                {!border.is_default && (
                                    <span
                                        className="absolute right-1 top-1 rounded bg-background p-0.5 opacity-0 shadow-sm ring-1 ring-border transition group-hover:opacity-100"
                                        onClick={(event) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                            onDeleteBorder(border.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleCreateBorder} className="grid gap-2">
                        <Label htmlFor="profile-border-name">Custom border name</Label>
                        <Input
                            id="profile-border-name"
                            value={borderName}
                            onChange={(event) => setBorderName(event.target.value)}
                        />
                        <Input
                            ref={borderRef}
                            type="file"
                            accept="image/png,image/webp,image/gif"
                            onChange={(event) => setBorderFile(event.target.files?.[0] ?? null)}
                        />
                        <Button type="submit" variant="outline" disabled={busy}>
                            <Plus className="h-4 w-4" />
                            Add Border
                        </Button>
                    </form>
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
                </div>

                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Background
                    </p>
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
                </div>

                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Tabs
                    </p>
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
                    <Button type="button" variant="outline" onClick={onResetTabs}>
                        <Layers className="h-4 w-4" />
                        Default Settings
                    </Button>
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
                                                        </>
                                                    )}
                                                    {item.type === 'works' && (
                                                        <SelectField
                                                            label="Display"
                                                            value={item.display ?? 'image_title'}
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
                                                    )}
                                                    {item.type === 'stickers' && (
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
                </div>

                <div className="grid gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Sections
                    </p>
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
                </div>
            </div>
        </aside>
    )
}

function ColorField({
    label,
    value,
    fallback,
    error,
    onChange,
}: {
    label: string
    value: string
    fallback: string
    error?: string
    onChange: (value: string) => void
}) {
    const color = isColorValue(value) ? value : fallback

    return (
        <label className="grid gap-1 text-sm">
            <span>{label}</span>
            {error && <FieldMessage>{error}</FieldMessage>}
            <div className="flex gap-2">
                <Input
                    type="color"
                    value={color}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-8 w-12 shrink-0 p-1"
                />
                <Input
                    value={value}
                    placeholder={fallback}
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </label>
    )
}

function RangeField({
    label,
    value,
    min,
    max,
    suffix,
    error,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    suffix: string
    error?: string
    onChange: (value: number) => void
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="flex items-center justify-between gap-2">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">
                    {Math.round(value)}
                    {suffix}
                </span>
            </span>
            {error && <FieldMessage>{error}</FieldMessage>}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full accent-foreground"
            />
        </label>
    )
}

function BoardEditorPanel({
    form,
    artImages,
    stickers,
    allowText,
    selectedBlock,
    busy,
    onFormChange,
    onCreate,
    onPatchLocal,
    onPersist,
    onDelete,
    onStickerDragStart,
}: {
    form: NewBlockForm
    artImages: ArtImageOption[]
    stickers: ArtistSticker[]
    allowText: boolean
    selectedBlock: ArtistProfileBlock | null
    busy: boolean
    onFormChange: (form: NewBlockForm) => void
    onCreate: (event: FormEvent<HTMLFormElement>) => void
    onPatchLocal: (id: string, patch: BlockPatch) => void
    onPersist: (block: ArtistProfileBlock, patch: BlockPatch | FormData) => void
    onDelete: (block: ArtistProfileBlock) => void
    onStickerDragStart: (event: PointerEvent<HTMLElement>, sticker: ArtistSticker) => void
}) {
    return (
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={onCreate} className="rounded-lg border bg-muted/20 p-3">
                <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={
                                form.type === 'image' && !form.isSticker ? 'default' : 'outline'
                            }
                            onClick={() =>
                                onFormChange({
                                    ...form,
                                    type: 'image',
                                    isSticker: false,
                                    stickerId: '',
                                })
                            }
                        >
                            <ImageIcon className="h-4 w-4" />
                            Image
                        </Button>
                        {allowText && (
                            <Button
                                type="button"
                                variant={form.type === 'text' ? 'default' : 'outline'}
                                onClick={() =>
                                    onFormChange({
                                        ...form,
                                        type: 'text',
                                        isSticker: false,
                                        stickerId: '',
                                    })
                                }
                            >
                                <Type className="h-4 w-4" />
                                Text
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={form.isSticker ? 'default' : 'outline'}
                            onClick={() =>
                                onFormChange({
                                    ...form,
                                    type: 'image',
                                    image: null,
                                    sourceArtImageId: '',
                                    isSticker: true,
                                })
                            }
                        >
                            <Layers className="h-4 w-4" />
                            Sticker
                        </Button>
                    </div>

                    {form.type === 'text' ? (
                        <div className="grid gap-1">
                            <Label htmlFor="board-text">Text</Label>
                            <Textarea
                                id="board-text"
                                rows={3}
                                value={form.text}
                                placeholder="Text"
                                onChange={(event) =>
                                    onFormChange({ ...form, text: event.target.value })
                                }
                            />
                        </div>
                    ) : form.isSticker ? (
                        <StickerPicker
                            value={form.stickerId}
                            stickers={stickers}
                            onChange={(value) => onFormChange({ ...form, stickerId: value })}
                            onDragStart={onStickerDragStart}
                        />
                    ) : (
                        <div className="grid gap-3">
                            <ImageSourceControls
                                id="board-image-source"
                                value={form.sourceArtImageId}
                                artImages={artImages}
                                onUpload={(file) =>
                                    onFormChange({ ...form, image: file, sourceArtImageId: '' })
                                }
                                onSelect={(value) =>
                                    onFormChange({
                                        ...form,
                                        image: null,
                                        sourceArtImageId: value,
                                    })
                                }
                            />
                        </div>
                    )}

                    {!form.isSticker && (
                        <Button type="submit" disabled={busy} className="justify-self-start">
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    )}
                </div>
            </form>

            <SelectedBlockPanel
                key={selectedBlock?.id ?? 'none'}
                block={selectedBlock}
                artImages={artImages}
                stickers={stickers}
                busy={busy}
                onPatchLocal={onPatchLocal}
                onPersist={onPersist}
                onDelete={onDelete}
            />
        </div>
    )
}

function SelectedBlockPanel({
    block,
    artImages,
    stickers,
    busy,
    onPatchLocal,
    onPersist,
    onDelete,
}: {
    block: ArtistProfileBlock | null
    artImages: ArtImageOption[]
    stickers: ArtistSticker[]
    busy: boolean
    onPatchLocal: (id: string, patch: BlockPatch) => void
    onPersist: (block: ArtistProfileBlock, patch: BlockPatch | FormData) => void
    onDelete: (block: ArtistProfileBlock) => void
}) {
    if (!block) {
        return (
            <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm text-muted-foreground">Select a block</p>
            </div>
        )
    }

    const patch = (changes: BlockPatch) => {
        onPatchLocal(block.id, changes)
        onPersist(block, changes)
    }

    const setSource = (fields: Record<string, string | File | null>) => {
        const payload = new FormData()
        payload.append('type', 'image')
        payload.append('is_sticker', block.is_sticker ? '1' : '0')
        Object.entries(fields).forEach(([key, value]) => {
            if (value !== null && value !== '') payload.append(key, value)
        })
        onPersist(block, payload)
    }

    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Block</p>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    onClick={() => onDelete(block)}
                    className="text-red-500 hover:text-red-500"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {block.type === 'text' ? (
                <div className="mt-3 grid gap-2">
                    <Textarea
                        rows={4}
                        defaultValue={block.text_content ?? ''}
                        onBlur={(event) => patch({ text_content: event.target.value })}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => patch({ font_size: clamp(block.font_size - 2, 10, 96) })}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-12 text-center">
                            {block.font_size}px
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => patch({ font_size: clamp(block.font_size + 2, 10, 96) })}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : block.is_sticker ? (
                <div className="mt-3 grid gap-2">
                    <StickerPicker
                        value={block.source_sticker_id ?? ''}
                        stickers={stickers}
                        onChange={(value) => setSource({ source_sticker_id: value })}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                                patch({
                                    rotation: normalizeRotation((block.rotation ?? 0) - 15),
                                })
                            }
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center text-xs text-muted-foreground">
                            {Math.round(block.rotation ?? 0)} deg
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                                patch({
                                    rotation: normalizeRotation((block.rotation ?? 0) + 15),
                                })
                            }
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mt-3 grid gap-2">
                    <ImageSourceControls
                        id="selected-image-source"
                        value={block.source_art_image_id ?? ''}
                        artImages={artImages}
                        onUpload={(file) => file && setSource({ image: file })}
                        onSelect={(value) => value && setSource({ source_art_image_id: value })}
                    />
                    <SelectField
                        label="Fit"
                        value={block.fit_mode}
                        options={['contain', 'cover', 'stretch']}
                        onChange={(value) =>
                            patch({ fit_mode: value as ArtistProfileBlock['fit_mode'] })
                        }
                    />
                </div>
            )}
        </div>
    )
}

function ProfileBoard({
    refEl,
    blocks,
    boardHeight,
    editMode,
    selectedBlockId,
    onSelect,
    onBeginDrag,
    embedded = false,
}: {
    refEl: React.RefObject<HTMLDivElement | null>
    blocks: ArtistProfileBlock[]
    boardHeight: number
    editMode: boolean
    selectedBlockId: string | null
    onSelect: (id: string) => void
    onBeginDrag: (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => void
    embedded?: boolean
}) {
    if (blocks.length === 0 && !editMode) {
        return <EmptyPanel icon={Layers} text="No board blocks yet" />
    }

    return (
        <div
            ref={refEl}
            className={`relative overflow-visible bg-background ${
                embedded ? 'min-h-full' : 'min-h-[760px]'
            } ${embedded ? '' : 'rounded-lg border'} ${
                editMode
                    ? 'bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]'
                    : ''
            }`}
            style={{
                minHeight: embedded ? '100%' : boardHeight,
                backgroundSize: editMode
                    ? `${GRID_STEP}% ${GRID_STEP * BOARD_UNIT_PX}px`
                    : undefined,
            }}
        >
            {editMode && <CenterGuide />}
            {blocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Drag stickers here or add a block
                    </p>
                </div>
            )}
            {blocks.map((block) => (
                <BoardBlock
                    key={block.id}
                    block={block}
                    editMode={editMode}
                    selected={selectedBlockId === block.id}
                    onSelect={onSelect}
                    onBeginDrag={onBeginDrag}
                />
            ))}
        </div>
    )
}

function BoardBlock({
    block,
    editMode,
    selected,
    onSelect,
    onBeginDrag,
}: {
    block: ArtistProfileBlock
    editMode: boolean
    selected: boolean
    onSelect: (id: string) => void
    onBeginDrag: (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => void
}) {
    const imageSrc = blockImageSrc(block)
    const objectFit = block.fit_mode === 'stretch' ? 'fill' : block.fit_mode

    return (
        <div
            className={`absolute ${
                block.is_sticker
                    ? 'overflow-visible bg-transparent'
                    : 'overflow-hidden bg-background'
            } ${
                editMode
                    ? selected
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                        : 'ring-1 ring-foreground/20'
                    : block.is_sticker
                      ? ''
                      : 'border'
            }`}
            style={{
                left: `${block.x}%`,
                top: `${block.y * BOARD_UNIT_PX}px`,
                width: `${block.w}%`,
                height: `${block.h * BOARD_UNIT_PX}px`,
                padding: `${block.padding_y}% ${block.padding_x}%`,
                zIndex: editMode ? (selected ? 1200 : 800 + block.z_index) : block.z_index,
                transform: `rotate(${block.rotation ?? 0}deg)`,
                touchAction: 'none',
            }}
            onPointerDown={(event) => {
                if (!editMode) return
                if (event.button !== 0) return
                if ((event.target as HTMLElement).closest('[data-board-control]')) return
                onSelect(block.id)
                onBeginDrag(event, block, 'move')
            }}
            onContextMenu={(event) => event.preventDefault()}
        >
            {block.type === 'image' && imageSrc ? (
                <img
                    src={imageSrc}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none"
                    style={{ objectFit }}
                />
            ) : (
                <div
                    className="h-full w-full overflow-hidden whitespace-pre-wrap break-words"
                    style={{ fontSize: block.font_size, lineHeight: 1.15 }}
                >
                    {block.text_content}
                </div>
            )}

            {editMode && (
                <>
                    <div
                        data-board-control
                        className="absolute left-0 top-1/2 z-[9999] h-16 w-2 -translate-y-1/2 cursor-ew-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-x', 'left')}
                    />
                    <div
                        data-board-control
                        className="absolute right-0 top-1/2 z-[9999] h-16 w-2 -translate-y-1/2 cursor-ew-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-x', 'right')}
                    />
                    <div
                        data-board-control
                        className="absolute bottom-0 left-1/2 z-[9999] h-2 w-16 -translate-x-1/2 cursor-ns-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-y', 'bottom')}
                    />
                    <button
                        data-board-control
                        type="button"
                        className="absolute left-2 top-2 z-[9999] rounded bg-background p-1 text-foreground shadow-md ring-1 ring-sky-400"
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <Move className="h-3 w-3" />
                    </button>
                    <div
                        data-board-control
                        className="absolute bottom-0 right-0 z-[9999] h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'resize')}
                    />
                </>
            )}
        </div>
    )
}

function ArtsMasonry({
    arts,
    tileWidth,
    display = 'masonry',
    limit,
    onOpen,
}: {
    arts: Art[]
    tileWidth: number
    display?: ProfileCanvasDisplay
    limit?: number
    onOpen: (art: Art) => void
}) {
    const images = arts
        .flatMap((art) => getArtImages(art).map((image) => ({ art, image })))
        .slice(0, limit)

    if (images.length === 0) {
        return <EmptyPanel icon={ImageOff} text="No public arts yet" />
    }

    if (display === 'standard' || display === 'instagram') {
        return (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="aspect-square overflow-hidden bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                ))}
            </div>
        )
    }

    if (display === 'bento') {
        return (
            <div className="grid auto-rows-[96px] grid-cols-4 gap-2 md:grid-cols-6">
                {images.map(({ art, image }, index) => {
                    const span =
                        index % 7 === 0
                            ? 'col-span-2 row-span-2'
                            : index % 7 === 3
                              ? 'col-span-2 row-span-1'
                              : 'col-span-1 row-span-1'

                    return (
                        <button
                            type="button"
                            key={`${image.image_path}-${index}`}
                            className={`${span} overflow-hidden rounded-md bg-muted`}
                            onClick={() => onOpen(art)}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            <img
                                src={storageUrl(image.image_path)!}
                                alt={art.title}
                                draggable={false}
                                className="h-full w-full select-none object-cover"
                            />
                        </button>
                    )
                })}
            </div>
        )
    }

    if (display === 'magazine') {
        const [lead, ...rest] = images

        return (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                {lead && (
                    <button
                        type="button"
                        className="min-h-[320px] overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(lead.art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(lead.image.image_path)!}
                            alt={lead.art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                    {rest.map(({ art, image }, index) => (
                        <button
                            type="button"
                            key={`${image.image_path}-${index}`}
                            className="aspect-[4/3] overflow-hidden rounded-md bg-muted"
                            onClick={() => onOpen(art)}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            <img
                                src={storageUrl(image.image_path)!}
                                alt={art.title}
                                draggable={false}
                                className="h-full w-full select-none object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (display === 'gallery') {
        return (
            <div
                className="grid gap-3"
                style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(160, tileWidth)}px, 1fr))`,
                }}
            >
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="aspect-[4/3] overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-contain"
                        />
                    </button>
                ))}
            </div>
        )
    }

    if (display === 'carousel') {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map(({ art, image }, index) => (
                    <button
                        type="button"
                        key={`${image.image_path}-${index}`}
                        className="h-64 w-48 shrink-0 overflow-hidden rounded-md bg-muted"
                        onClick={() => onOpen(art)}
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        <img
                            src={storageUrl(image.image_path)!}
                            alt={art.title}
                            draggable={false}
                            className="h-full w-full select-none object-cover"
                        />
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div
            className={display === 'pinterest' ? 'gap-3' : 'gap-4'}
            style={{
                columnWidth: display === 'pinterest' ? Math.max(160, tileWidth - 30) : tileWidth,
            }}
        >
            {images.map(({ art, image }, index) => (
                <button
                    type="button"
                    key={`${image.image_path}-${index}`}
                    className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-md bg-muted text-left transition hover:opacity-90"
                    onClick={() => onOpen(art)}
                    onContextMenu={(event) => event.preventDefault()}
                >
                    <img
                        src={storageUrl(image.image_path)!}
                        alt={art.title}
                        draggable={false}
                        className="w-full select-none object-cover"
                    />
                </button>
            ))}
        </div>
    )
}

function ProfileArtDialog({
    art,
    artist,
    open,
    onOpenChange,
}: {
    art: Art | null
    artist: ArtistProfileResponse['artist']
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!art) return null

    const images = getArtImages(art)
    const firstImage = images[0]?.image_path ?? art.image_path

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="h-[92dvh] !w-[min(96vw,1280px)] !max-w-none overflow-hidden p-0"
                onContextMenu={(event) => event.preventDefault()}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>{art.title}</DialogTitle>
                    <DialogDescription>Art details</DialogDescription>
                </DialogHeader>
                <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <div
                        className="min-h-0 overflow-auto bg-black"
                        onContextMenu={(event) => event.preventDefault()}
                    >
                        {firstImage ? (
                            <img
                                src={storageUrl(firstImage)!}
                                alt={art.title}
                                draggable={false}
                                className="mx-auto min-h-full max-w-full select-none object-contain"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-white/70">
                                <ImageOff className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <aside className="min-h-0 overflow-y-auto border-l bg-background p-5">
                        <h2 className="text-xl font-semibold">{art.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            By <span className="font-medium text-foreground">{artist.name}</span>
                        </p>

                        <div className="mt-4">
                            <SuperLikeButton
                                targetType="art"
                                targetId={art.id}
                                initialCount={art.super_likes_count ?? 0}
                                ownerUserId={artist.id}
                            />
                        </div>

                        {art.description ? (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {art.description}
                            </p>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                No description added.
                            </p>
                        )}

                        {art.labels && art.labels.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Labels
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {art.labels.map((label) => (
                                        <span
                                            key={label}
                                            className="rounded-md border px-2 py-1 text-xs text-muted-foreground"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <ProfileArtStat icon={Heart} label="Likes" value={art.likes} />
                            <ProfileArtStat icon={Eye} label="Views" value={art.views} />
                            <ProfileArtStat
                                icon={MessageCircle}
                                label="Comments"
                                value={art.comments_count}
                            />
                            <ProfileArtStat
                                icon={Gift}
                                label="Super likes"
                                value={art.super_likes_count}
                            />
                        </div>

                        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Posted {formatDate(art.created_at)}
                        </p>

                        <div className="mt-6">
                            <CommentSection
                                targetType="art"
                                targetId={art.id}
                                artistUsername={artist.username}
                                title="Art comments"
                                compact
                            />
                        </div>
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ProfileArtStat({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon
    label: string
    value: number
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
            </div>
            <p className="mt-1 text-sm font-semibold">{value.toLocaleString()}</p>
        </div>
    )
}

function WorksGrid({
    works,
    display = 'image_title',
}: {
    works: ArtistProfileResponse['works']
    display?: ProfileCanvasDisplay
}) {
    if (works.length === 0) {
        return <EmptyPanel icon={Layers} text="No public works yet" />
    }

    if (display === 'table') {
        return (
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2">Work</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Chapters</th>
                        </tr>
                    </thead>
                    <tbody>
                        {works.map((work) => (
                            <tr key={work.id} className="border-t">
                                <td className="px-3 py-2">
                                    <Link
                                        to={`/works/${work.slug}`}
                                        className="font-medium hover:underline"
                                    >
                                        {work.title}
                                    </Link>
                                </td>
                                <td className="px-3 py-2 capitalize text-muted-foreground">
                                    {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                    {work.chapters_count.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (display === 'split_card') {
        return (
            <div className="grid gap-3">
                {works.map((work) => (
                    <Link
                        key={work.id}
                        to={`/works/${work.slug}`}
                        className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-md border bg-background p-2 transition hover:bg-muted/30"
                    >
                        <div className="aspect-[3/4] overflow-hidden rounded bg-muted">
                            {work.cover ? (
                                <img
                                    src={storageUrl(work.cover)!}
                                    alt={work.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    No Cover
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 py-1">
                            <p className="line-clamp-2 font-semibold">{work.title}</p>
                            <p className="mt-1 text-xs capitalize text-muted-foreground">
                                {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {work.chapters_count.toLocaleString()} chapters
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {works.map((work) => (
                <Link key={work.id} to={`/works/${work.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                        {work.cover ? (
                            <img
                                src={storageUrl(work.cover)!}
                                alt={work.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                No Cover
                            </div>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded bg-[var(--comix-badge-type)] px-2 py-0.5 text-[10px] font-semibold capitalize text-white">
                            {work.type === 'wattpad' ? 'novel' : 'webtoon'}
                        </span>
                    </div>
                    {display !== 'image' && (
                        <>
                            <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">
                                {work.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {work.chapters_count.toLocaleString()} chapters
                            </p>
                        </>
                    )}
                </Link>
            ))}
        </div>
    )
}

function ProfileStickers({
    stickers,
    stickerSize,
}: {
    stickers: ArtistSticker[]
    stickerSize: number
}) {
    if (stickers.length === 0) {
        return <EmptyPanel icon={Layers} text="No stickers yet" />
    }

    return (
        <div
            className="grid gap-4"
            style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${stickerSize}px, 1fr))`,
            }}
        >
            {stickers.map((sticker) => (
                <div key={sticker.id} className="group text-center">
                    <div
                        className="mx-auto flex max-w-full items-center justify-center"
                        style={{ height: stickerSize, width: stickerSize }}
                    >
                        <img
                            src={storageUrl(sticker.image_path)!}
                            alt={sticker.name}
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                        />
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{sticker.name}</p>
                </div>
            ))}
        </div>
    )
}

function ProfileComments({
    comments,
    variant = 'cards',
}: {
    comments: NonNullable<ArtistProfileResponse['comments']>
    variant?: 'cards' | 'table'
}) {
    if (comments.length === 0) {
        return <EmptyPanel icon={MessageCircle} text="No public comments highlighted yet" />
    }

    if (variant === 'table') {
        return (
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-widest text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2">Origin</th>
                            <th className="px-3 py-2">Comment</th>
                            <th className="px-3 py-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map((comment) => (
                            <tr key={comment.id} className="border-t align-top">
                                <td className="px-3 py-2">
                                    <span className="block text-xs capitalize text-muted-foreground">
                                        {comment.origin.type}
                                    </span>
                                    {comment.origin.href ? (
                                        <Link
                                            to={comment.origin.href}
                                            className="font-medium hover:underline"
                                        >
                                            {comment.origin.title}
                                        </Link>
                                    ) : (
                                        <span className="font-medium">{comment.origin.title}</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                    {comment.body || comment.sticker?.name || 'Sticker'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                                    {formatDate(comment.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {comments.map((comment) => {
                const card = (
                    <article className="rounded-lg border bg-background p-4 transition hover:bg-muted/30">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                                {comment.origin.type}
                            </span>
                            <h3 className="truncate text-sm font-semibold">
                                {comment.origin.title}
                            </h3>
                        </div>

                        {comment.body && (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {comment.body}
                            </p>
                        )}

                        {comment.sticker && (
                            <div className="mt-3 h-24 w-24 rounded-md bg-muted/20 p-2">
                                <img
                                    src={storageUrl(comment.sticker.image_path)!}
                                    alt={comment.sticker.name}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                        </p>
                    </article>
                )

                return comment.origin.href ? (
                    <Link key={comment.id} to={comment.origin.href} className="block">
                        {card}
                    </Link>
                ) : (
                    <div key={comment.id}>{card}</div>
                )
            })}
        </div>
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

function StickerPicker({
    value,
    stickers,
    onChange,
    onDragStart,
}: {
    value: string
    stickers: ArtistSticker[]
    onChange: (value: string) => void
    onDragStart?: (event: PointerEvent<HTMLElement>, sticker: ArtistSticker) => void
}) {
    return (
        <div className="grid gap-2">
            <Label>Sticker</Label>
            {onDragStart && (
                <p className="text-xs text-muted-foreground">Drag a sticker onto the board.</p>
            )}
            {stickers.length === 0 ? (
                <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                    Add stickers in My Stickers.
                </p>
            ) : (
                <div className="flex max-w-full gap-2 overflow-x-auto pb-2">
                    {stickers.map((sticker) => (
                        <button
                            key={sticker.id}
                            type="button"
                            onPointerDown={(event) => onDragStart?.(event, sticker)}
                            onClick={() => onChange(sticker.id)}
                            className={`w-24 shrink-0 cursor-grab rounded-lg border bg-background p-2 text-left active:cursor-grabbing ${
                                value === sticker.id ? 'ring-2 ring-foreground' : ''
                            }`}
                        >
                            <span className="block aspect-square rounded-md bg-muted/50 p-2">
                                <img
                                    src={storageUrl(sticker.image_path)!}
                                    alt={sticker.name}
                                    className="h-full w-full object-contain"
                                />
                            </span>
                            <span className="mt-1 block truncate text-xs">{sticker.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function ImageSourceControls({
    id,
    value,
    artImages,
    onUpload,
    onSelect,
}: {
    id: string
    value: string
    artImages: ArtImageOption[]
    onUpload: (file: File | null) => void
    onSelect: (value: string) => void
}) {
    const fileRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)

    return (
        <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                    Upload Image
                </Button>
                {artImages.length > 0 && (
                    <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                        <ImagesIcon className="h-4 w-4" />
                        Select from My Arts
                    </Button>
                )}
            </div>
            <input
                ref={fileRef}
                id={id}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onUpload(event.target.files?.[0] ?? null)
                }
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select from My Arts</DialogTitle>
                        <DialogDescription>
                            Choose one of your posted art images for this board block.
                        </DialogDescription>
                    </DialogHeader>
                    {artImages.length === 0 ? (
                        <div className="rounded-lg border py-12 text-center">
                            <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No art images yet</p>
                        </div>
                    ) : (
                        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
                            {artImages.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item.id)
                                        setOpen(false)
                                    }}
                                    className={`rounded-lg border bg-background p-2 text-left transition-colors hover:bg-muted/40 ${
                                        value === item.id ? 'ring-2 ring-foreground' : ''
                                    }`}
                                >
                                    <span className="block aspect-square overflow-hidden rounded-md bg-muted">
                                        <img
                                            src={storageUrl(item.image.image_path)!}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </span>
                                    <span className="mt-2 block truncate text-xs font-medium">
                                        {item.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SelectField({
    label,
    value,
    options,
    formatOption,
    onChange,
}: {
    label: string
    value: string
    options: string[]
    formatOption?: (option: string) => string
    onChange: (value: string) => void
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {formatOption ? formatOption(option) : option}
                    </option>
                ))}
            </select>
        </label>
    )
}

function FieldMessage({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-medium text-red-500">{children}</p>
}

function EmptyPanel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="rounded-lg border py-16 text-center">
            <Icon className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}

function getArtImageOptions(arts: Art[]): ArtImageOption[] {
    return arts.flatMap((art) =>
        getArtImages(art).map((image, index) => ({
            id: image.id,
            title: `${art.title} ${index + 1}`,
            image,
        }))
    )
}

function getArtImages(art: Art) {
    if (art.images?.length > 0) return art.images

    return [
        {
            id: art.id,
            art_id: art.id,
            image_path: art.image_path,
            description: art.description,
            sort_order: 0,
            created_at: art.created_at,
            updated_at: art.updated_at,
        },
    ]
}

function blockImageSrc(block: ArtistProfileBlock) {
    if (block.source_sticker?.image_path) return storageUrl(block.source_sticker.image_path)
    if (block.source_art_image?.image_path) return storageUrl(block.source_art_image.image_path)
    if (block.image_url) return block.image_url
    if (block.image_path) return storageUrl(block.image_path)
    return null
}

function computeBlockPatch(
    drag: DragState,
    dx: number,
    dy: number,
    blocks: ArtistProfileBlock[]
): BlockPatch | null {
    const { block } = drag

    if (drag.kind === 'move') {
        const rect = {
            ...blockRect(block),
            x: snapCanvasX(clamp(block.x + dx, 0, 100 - block.w), block.w),
            y: snapMin(block.y + dy, 0),
        }

        if (!collides(block.id, rect, blocks)) return { x: rect.x, y: rect.y }

        const open = findNearestOpenRect(block.id, rect, blocks)
        return open ? { x: open.x, y: open.y } : null
    }

    if (drag.kind === 'resize') {
        const rect = {
            ...blockRect(block),
            w: snapWithin(block.w + dx, GRID_STEP, 100 - block.x),
            h: snapWithin(block.h + dy, GRID_STEP, 300),
        }

        return collides(block.id, rect, blocks) ? null : { w: rect.w, h: rect.h }
    }

    if (drag.kind === 'padding-x') {
        const direction = drag.edge === 'left' ? 1 : -1
        return {
            padding_x: Math.round(clamp(block.padding_x + dx * direction, 0, 40)),
        }
    }

    return {
        padding_y: Math.round(clamp(block.padding_y + dy, 0, 40)),
    }
}

function toFormData(patch: Record<string, unknown>) {
    const payload = new FormData()
    Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
    })
    return payload
}

function findOpenSpot(blocks: ArtistProfileBlock[], width: number, height: number) {
    const size = snapRect({ x: 0, y: 0, w: width, h: height })
    const maxY = Math.max(getBoardRows(blocks) + GRID_STEP * 12, 100)

    for (let y = 0; y <= maxY; y += GRID_STEP) {
        for (let x = 0; x <= 100 - size.w; x += GRID_STEP) {
            const rect = { x, y, w: size.w, h: size.h }
            if (!collides('', rect, blocks)) return { x, y }
        }
    }

    return { x: 0, y: snapMin(getBoardRows(blocks) + GRID_STEP, 0) }
}

function blockRect(block: ArtistProfileBlock): BlockRect {
    return {
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
    }
}

function snapRect(rect: BlockRect): BlockRect {
    const w = clamp(snapToGrid(rect.w), GRID_STEP, 100)
    const h = clamp(snapToGrid(rect.h), GRID_STEP, 300)

    return {
        x: clamp(snapToGrid(rect.x), 0, 100 - w),
        y: snapMin(rect.y, 0),
        w,
        h,
    }
}

function snapToGrid(value: number) {
    return Math.round(value / GRID_STEP) * GRID_STEP
}

function snapWithin(value: number, min: number, max: number) {
    return clamp(snapToGrid(value), min, max)
}

function snapMin(value: number, min: number) {
    return Math.max(snapToGrid(value), min)
}

function collides(blockId: string, rect: BlockRect, blocks: ArtistProfileBlock[]) {
    const active = blocks.find((block) => block.id === blockId)
    if (active?.is_sticker) return false

    return blocks.some(
        (block) => block.id !== blockId && !block.is_sticker && overlaps(rect, blockRect(block))
    )
}

function overlaps(a: BlockRect, b: BlockRect) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function snapPercentCenter(value: number) {
    return Math.abs(value - 50) <= 3 ? 50 : value
}

function parseCanvasDropPayload(
    value: string
): (Pick<ProfileCanvasItem, 'kind' | 'type'> & { itemId?: string }) | null {
    const [kind, type, itemId] = value.split(':')
    if ((kind !== 'tab' && kind !== 'section') || !PROFILE_TAB_IDS.includes(type as ProfileTabId)) {
        return null
    }

    return {
        kind,
        type: type as ProfileTabId,
        itemId: itemId || undefined,
    }
}

function findNearestOpenRect(
    blockId: string,
    preferred: BlockRect,
    blocks: ArtistProfileBlock[]
): BlockRect | null {
    const maxY = Math.max(getBoardRows(blocks) + GRID_STEP * 16, preferred.y + GRID_STEP * 16)
    let best: { rect: BlockRect; distance: number } | null = null

    for (let y = 0; y <= maxY; y += GRID_STEP) {
        for (let x = 0; x <= 100 - preferred.w; x += GRID_STEP) {
            const rect = { ...preferred, x, y }
            if (collides(blockId, rect, blocks)) continue

            const distance = Math.abs(preferred.x - x) + Math.abs(preferred.y - y)
            if (!best || distance < best.distance) best = { rect, distance }
        }
    }

    return best?.rect ?? null
}

function getBoardRows(blocks: ArtistProfileBlock[]) {
    return blocks.reduce((max, block) => Math.max(max, block.y + block.h), 0)
}

function getBoardHeight(blocks: ArtistProfileBlock[], minHeight = BOARD_MIN_HEIGHT) {
    return Math.max(minHeight, (getBoardRows(blocks) + GRID_STEP * 8) * BOARD_UNIT_PX)
}

function nextZIndex(blocks: ArtistProfileBlock[]) {
    return Math.max(0, ...blocks.map((block) => block.z_index)) + 1
}

function normalizeRotation(value: number) {
    if (value > 360) return value - 720
    if (value < -360) return value + 720
    return value
}

function createProfileThemeDraft(artist: ArtistProfileResponse['artist']): ProfileThemeDraft {
    return {
        backgroundColor: artist.profile_background_color ?? '',
        gradientFrom: artist.profile_background_gradient_from ?? '',
        gradientTo: artist.profile_background_gradient_to ?? '',
        gradientDirection: artist.profile_background_gradient_direction ?? 'to bottom',
        hasGradient: artist.profile_background_has_gradient ?? false,
        backgroundBlur: artist.profile_background_blur ?? 0,
        showCover: artist.profile_show_cover ?? true,
        coverWidth: artist.profile_cover_width ?? 100,
        bannerHeight: artist.profile_banner_height ?? 288,
        avatarFrameX: artist.profile_avatar_frame_x ?? 50,
        avatarFrameY: artist.profile_avatar_frame_y ?? 100,
        avatarImageX: artist.avatar_position_x ?? 50,
        avatarImageY: artist.avatar_position_y ?? 50,
        avatarBorderWidth: artist.profile_avatar_border_width ?? 4,
        avatarBorderColor: artist.profile_avatar_border_color ?? '',
        avatarBorderRadius: artist.profile_avatar_border_radius ?? 100,
        profileBorderId: artist.profile_border_id ?? '',
        navLayout: artist.profile_nav_layout ?? 'together',
        navX: artist.profile_nav_x ?? 0,
        navY: artist.profile_nav_y ?? 0,
        navW: artist.profile_nav_w ?? 100,
        navH: artist.profile_nav_h ?? 32,
        tabsConfig: normalizeProfileTabsConfig(artist.profile_tabs_config),
        links: normalizeProfileLinkDrafts(artist.profile_links ?? []),
        boardMinHeight: artist.profile_board_min_height ?? 760,
        artsTileWidth: artist.profile_arts_tile_width ?? 220,
        stickerSize: artist.profile_sticker_size ?? 112,
    }
}

function profileThemeToPayload(draft: ProfileThemeDraft) {
    return {
        profile_background_color: draft.backgroundColor,
        profile_background_gradient_from: draft.gradientFrom,
        profile_background_gradient_to: draft.gradientTo,
        profile_background_gradient_direction: draft.gradientDirection,
        profile_background_has_gradient: draft.hasGradient,
        profile_background_blur: draft.backgroundBlur,
        profile_show_cover: draft.showCover,
        profile_cover_width: draft.coverWidth,
        profile_banner_height: draft.bannerHeight,
        profile_avatar_frame_x: draft.avatarFrameX,
        profile_avatar_frame_y: draft.avatarFrameY,
        avatar_position_x: draft.avatarImageX,
        avatar_position_y: draft.avatarImageY,
        profile_avatar_border_width: draft.avatarBorderWidth,
        profile_avatar_border_color: draft.avatarBorderColor,
        profile_avatar_border_radius: draft.avatarBorderRadius,
        profile_border_id: draft.profileBorderId,
        profile_nav_layout: draft.navLayout,
        profile_nav_x: draft.navX,
        profile_nav_y: draft.navY,
        profile_nav_w: draft.navW,
        profile_nav_h: draft.navH,
        profile_board_min_height: draft.boardMinHeight,
        profile_arts_tile_width: draft.artsTileWidth,
        profile_sticker_size: draft.stickerSize,
    }
}

function profileThemeToFormData(draft: ProfileThemeDraft, header: HeaderDraft) {
    const payload = new FormData()
    const fields = {
        ...profileThemeToPayload(draft),
        artist_title: header.artistTitle,
        show_public_links: true,
        profile_tabs_config: JSON.stringify(draft.tabsConfig),
        profile_links: JSON.stringify(
            draft.links.map(({ imageFile, imagePreview, ...link }) => ({
                ...link,
                title: link.title.trim(),
                url: link.url.trim(),
            }))
        ),
    }

    Object.entries(fields).forEach(([key, value]) => {
        payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? ''))
    })

    draft.links.forEach((link, index) => {
        if (link.imageFile) payload.append(`profile_link_images[${index}]`, link.imageFile)
    })

    return payload
}

function getProfileBackground(draft: ProfileThemeDraft): CSSProperties {
    const base = draft.backgroundColor || 'var(--background)'
    if (!draft.hasGradient || (!draft.gradientFrom && !draft.gradientTo)) {
        return { background: base }
    }

    const from = draft.gradientFrom || 'transparent'
    const to = draft.gradientTo || 'transparent'

    return {
        background: `linear-gradient(${draft.gradientDirection}, ${from}, ${to}), ${base}`,
    }
}

function isColorValue(value: string) {
    return /^#[0-9a-fA-F]{6}$/.test(value)
}

function validateProfileEdit(header: HeaderDraft, draft: ProfileThemeDraft): ProfileEditErrors {
    const errors: ProfileEditErrors = {}

    if (header.artistTitle.length > 100) {
        errors.artistTitle = 'Title must be 100 characters or less.'
    }

    const colorFields: Array<[keyof ProfileThemeDraft, string]> = [
        ['backgroundColor', 'Background color'],
        ['avatarBorderColor', 'Border color'],
    ]
    if (draft.hasGradient) {
        colorFields.push(['gradientFrom', 'Gradient start'])
        colorFields.push(['gradientTo', 'Gradient end'])
    }

    colorFields.forEach(([field, label]) => {
        const value = String(draft[field] ?? '')
        if (value && !isColorValue(value)) {
            errors[field] = `${label} must use a hex color like #ffffff.`
        }
    })

    if (draft.links.length > 12) {
        errors.links = 'You can add up to 12 public links.'
    }

    draft.links.forEach((link, index) => {
        const hasAnyValue =
            link.title.trim() || link.url.trim() || link.imageFile || link.image_path
        if (!hasAnyValue) return

        if (!link.title.trim()) {
            errors[`links.${index}.title`] = 'Link title is required.'
        }

        if (!link.url.trim()) {
            errors[`links.${index}.url`] = 'Link URL is required.'
        }
    })

    return errors
}

function normalizeProfileLinkDrafts(links: ProfileLink[]): ProfileLinkDraft[] {
    return links.map((link) => ({
        ...link,
        imageFile: null,
        imagePreview: null,
    }))
}

function getRequestErrorMessage(error: unknown) {
    if (typeof error !== 'object' || error === null || !('response' in error)) return null

    const response = (error as { response?: { data?: { message?: unknown; errors?: unknown } } })
        .response
    if (typeof response?.data?.message === 'string') return response.data.message

    const errors = response?.data?.errors
    if (typeof errors !== 'object' || errors === null) return null

    const first = Object.values(errors)[0]
    return Array.isArray(first) && typeof first[0] === 'string' ? first[0] : null
}

function toPublicHref(value?: string | null): string {
    const href = value?.trim() ?? ''
    if (!href) return '#'
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href
    return `https://${href}`
}

function defaultProfileTabsConfig(): ProfileTabsConfig {
    const positions = {
        board: { x: 0, y: 0, w: 22, h: 36 },
        arts: { x: 0, y: 0, w: 28, h: 36 },
        works: { x: 30, y: 0, w: 28, h: 36 },
        stickers: { x: 60, y: 0, w: 32, h: 36 },
        comments: { x: 30, y: 52, w: 30, h: 36 },
    }
    const defaultTabs: ProfileTabId[] = ['arts', 'works', 'stickers']

    return {
        visibility: {
            board: false,
            arts: true,
            works: true,
            stickers: true,
            comments: false,
        },
        section_mode: 'separate_pages',
        positions,
        buttons: defaultTabs.map((tab) => ({
            id: `tab-${tab}`,
            type: tab,
            kind: 'tab',
            page: tab,
            display: defaultCanvasDisplay(tab),
            pagination: true,
            ...positions[tab],
        })),
        sections: defaultTabs.map((tab) => ({
            id: `section-${tab}`,
            type: tab,
            kind: 'section',
            page: tab,
            display: defaultCanvasDisplay(tab),
            pagination: true,
            x: 5,
            y: 120,
            w: 90,
            h: 420,
        })),
        cover_offset: { x: 0, y: 0 },
        border_offset: { x: 0, y: 0 },

        // Keep for profiles saved before width/height were introduced.
        border_scale: 1.35,

        border_width: 1.35,
        border_height: 1.35,
        border_layer: 'front',
        nav_locked: false,
        header_locks: {
            cover_frame: false,
            avatar_frame: false,
            avatar_border: false,
        },
    }
}

function normalizeProfileTabsConfig(
    value: ProfileTabsConfig | null | undefined
): ProfileTabsConfig {
    const defaults = defaultProfileTabsConfig()
    if (!value) return defaults

    const visibility = { ...defaults.visibility, ...(value.visibility ?? {}) }
    const positions = { ...defaults.positions }
    PROFILE_TAB_IDS.forEach((tab) => {
        positions[tab] = {
            ...positions[tab],
            ...(value.positions?.[tab] ?? {}),
        }
    })

    return {
        visibility,
        section_mode: value.section_mode ?? defaults.section_mode,
        positions,
        buttons: normalizeCanvasItems(value.buttons, defaults.buttons ?? [], 'tab'),
        sections: normalizeCanvasItems(value.sections, defaults.sections ?? [], 'section'),
        cover_offset: {
            x: clamp(value.cover_offset?.x ?? 0, -320, 320),
            y: clamp(value.cover_offset?.y ?? 0, -180, 180),
        },
        border_offset: {
            x: Number(value.border_offset?.x ?? 0),
            y: Number(value.border_offset?.y ?? 0),
        },

        border_scale: Math.max(0.05, Number(value.border_scale ?? 1.35)),

        border_width: Math.max(0.05, Number(value.border_width ?? value.border_scale ?? 1.35)),

        border_height: Math.max(0.05, Number(value.border_height ?? value.border_scale ?? 1.35)),

        border_layer: value.border_layer === 'back' ? 'back' : 'front',
        border_scale: clamp(value.border_scale ?? 1.35, 0.5, 10),
        border_layer: value.border_layer === 'back' ? 'back' : 'front',
        nav_locked: value.nav_locked ?? false,
        header_locks: {
            cover_frame: value.header_locks?.cover_frame ?? false,
            avatar_frame: value.header_locks?.avatar_frame ?? false,
            avatar_border: value.header_locks?.avatar_border ?? false,
        },
    }
}

function normalizeCanvasItems(
    items: ProfileCanvasItem[] | undefined,
    defaults: ProfileCanvasItem[],
    kind: ProfileCanvasItem['kind']
) {
    const source = items === undefined ? defaults : items

    return source
        .filter((item) => PROFILE_TAB_IDS.includes(item.type) && item.kind === kind)
        .map((item, index) => ({
            id: item.id || `${kind}-${item.type}-${index}`,
            type: item.type,
            kind,
            page: PROFILE_TAB_IDS.includes((item.page ?? item.type) as ProfileTabId)
                ? ((item.page ?? item.type) as ProfileTabId)
                : item.type,
            display: item.display ?? defaultCanvasDisplay(item.type),
            pagination: item.pagination ?? true,
            locked: item.locked ?? false,
            x: clamp(item.x, 0, 95),
            y: clamp(item.y, 0, 2400),
            w: clamp(item.w, kind === 'tab' ? 10 : 5, 100),
            h: clamp(item.h, kind === 'tab' ? 28 : 80, 1400),
        }))
}

function patchTabPosition(
    config: ProfileTabsConfig,
    tab: ProfileTabId,
    position: ProfileTabPosition
): ProfileTabsConfig {
    return {
        ...config,
        positions: {
            ...config.positions,
            [tab]: {
                x: Number(clamp(position.x, 0, 90).toFixed(2)),
                y: Number(clamp(position.y, 0, 220).toFixed(2)),
                w: Number(clamp(position.w, 10, 100).toFixed(2)),
                h: Number(clamp(position.h, 28, 96).toFixed(2)),
            },
        },
    }
}

function getVisibleProfileTabs(config: ProfileTabsConfig, isStorytellerProfile: boolean) {
    return PROFILE_TAB_IDS.filter((tab) => {
        if ((tab === 'arts' || tab === 'works') && !isStorytellerProfile) return false
        return config.visibility[tab]
    })
}

function getCanvasItems(
    config: ProfileTabsConfig,
    visibleTabs: ProfileTabId[],
    kind: ProfileCanvasItem['kind']
) {
    const key = kind === 'tab' ? 'buttons' : 'sections'
    const defaults = defaultProfileTabsConfig()[key] ?? []
    const items = config[key] === undefined ? defaults : config[key]!

    return items.filter((item) => item.kind === kind && visibleTabs.includes(item.type))
}

function shouldUseCanvasLayout(
    config: ProfileTabsConfig,
    navLayout: ProfileThemeDraft['navLayout'],
    editMode: boolean
) {
    return (
        editMode ||
        navLayout === 'separate' ||
        config.buttons !== undefined ||
        config.sections !== undefined
    )
}

function patchCanvasItem(config: ProfileTabsConfig, item: ProfileCanvasItem): ProfileTabsConfig {
    const key = item.kind === 'tab' ? 'buttons' : 'sections'
    const visibleTabs = PROFILE_TAB_IDS
    const items = getCanvasItems(config, visibleTabs, item.kind)
    const nextItems = items.some((current) => current.id === item.id)
        ? items.map((current) => (current.id === item.id ? item : current))
        : [...items, item]

    return {
        ...config,
        [key]: nextItems,
    }
}

function getCanvasHeight(
    items: ProfileCanvasItem[],
    heightForItem: (item: ProfileCanvasItem) => number = (item) => item.h
) {
    return Math.max(680, ...items.map((item) => item.y + heightForItem(item) + 80))
}

function getCanvasItemPage(item: ProfileCanvasItem) {
    return item.page && PROFILE_TAB_IDS.includes(item.page) ? item.page : item.type
}

function getCanvasItemRenderHeight(
    item: ProfileCanvasItem,
    boardHeight: number,
    hasBoardEditorPanel: boolean
) {
    if (item.type !== 'board') return item.h
    return Math.max(item.h, boardHeight + 72 + (hasBoardEditorPanel ? 300 : 0))
}

function getNextCanvasItemY(
    items: ProfileCanvasItem[],
    kind: ProfileCanvasItem['kind'],
    page: ProfileTabId,
    heightForItem: (item: ProfileCanvasItem) => number = (item) => item.h
) {
    if (kind === 'tab') {
        if (items.length === 0) return 0
        return Math.max(...items.map((item) => item.y + item.h + 8))
    }
    const pageItems = items.filter((item) => getCanvasItemPage(item) === page)
    if (pageItems.length === 0) return 96
    return Math.max(...pageItems.map((item) => item.y + heightForItem(item) + 24))
}

function defaultCanvasDisplay(type: ProfileTabId): ProfileCanvasDisplay {
    if (type === 'arts') return 'masonry'
    if (type === 'works') return 'image_title'
    if (type === 'comments') return 'table'
    return 'grid'
}

function formatCanvasDisplay(value: string) {
    const labels: Record<string, string> = {
        standard: 'Standard Grid',
        masonry: 'Masonry Grid',
        bento: 'Bento Grid',
        magazine: 'Magazine Grid',
        gallery: 'Gallery Grid',
        carousel: 'Carousel Grid',
        pinterest: 'Masonry Grid',
        instagram: 'Standard Grid',
        image: 'Image Only',
        image_title: 'Image With Title',
        split_card: 'Left Image + Info',
        table: 'Table',
        cards: 'Cards',
        grid: 'Grid',
    }

    return labels[value] ?? value
}

function getWidgetImageLimit(item: ProfileCanvasItem) {
    const estimatedColumns = Math.max(1, Math.round(item.w / 18))
    const estimatedRows = Math.max(1, Math.round(item.h / 160))
    return clamp(estimatedColumns * estimatedRows * 3, 10, 15)
}

function snapCanvasX(value: number, width: number) {
    const centered = 50 - width / 2
    if (Math.abs(value - centered) <= 3) return centered
    return snapWithin(value, 0, 100 - width)
}

function snapCenterOffset(value: number) {
    return Math.abs(value) <= 3 ? 0 : value
}

function snapCanvasY(value: number) {
    return Math.round(value / 20) * 20
}

function getRenderableProfileTabs(tabs: ProfileTabId[], config: ProfileTabsConfig) {
    const combined = new Set<ProfileTabId>()

    if (tabs.includes('board')) {
        if (config.section_mode === 'board_arts' || config.section_mode === 'board_arts_stickers') {
            combined.add('arts')
        }
        if (
            config.section_mode === 'board_stickers' ||
            config.section_mode === 'board_arts_stickers'
        ) {
            combined.add('stickers')
        }
    }

    return tabs.filter((tab) => !combined.has(tab))
}

function getTabsCanvasHeight(config: ProfileTabsConfig, tabs: ProfileTabId[]) {
    return Math.max(
        44,
        ...tabs.map((tab) => {
            const position = config.positions[tab]
            return position.y + position.h + 8
        })
    )
}
