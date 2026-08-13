import type {
    ArtistProfileBlock,
    ProfileCanvasItem,
    ProfileBlockType,
    ProfileLink,
    ProfileTabId,
    ProfileTabPosition,
    ProfileTabsConfig,
} from '@/types/artistProfile'
import type { ArtImage } from '@/types/art'

// Profile editor drafts ----
export type HeaderDraft = {
    artistTitle: string
    showPublicLinks: boolean
}

export type ProfileLinkDraft = ProfileLink & {
    imageFile?: File | null
    imagePreview?: string | null
}

export type ProfileThemeDraft = {
    backgroundColorEnabled: boolean
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

export type ProfileEditErrors = Record<string, string>

export type NewBlockForm = {
    type: ProfileBlockType
    text: string
    image: File | null
    sourceArtImageId: string
    stickerId: string
    isSticker: boolean
}

// Drag state ----
export type BlockPatch = Partial<
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
        | 'background_color'
        | 'transparent_background'
        | 'overlay'
        | 'show_border'
        | 'border_color'
        | 'border_radius'
        | 'font_family'
        | 'font_color'
        | 'locked'
        | 'image_position_x'
        | 'image_position_y'
    >
>

export type DragState = {
    kind: 'move' | 'resize' | 'padding-x' | 'padding-y'
    blockId: string
    startX: number
    startY: number
    block: ArtistProfileBlock
    patch: BlockPatch
    edge?: 'left' | 'right' | 'top' | 'bottom'
}

export type NavDragState = {
    kind: 'move' | 'resize'
    startX: number
    startY: number
    navX: number
    navY: number
    navW: number
    navH: number
    patch: Record<string, number>
}

export type TabDragState = {
    tab: ProfileTabId
    kind: 'move' | 'resize'
    startX: number
    startY: number
    position: ProfileTabPosition
    config: ProfileTabsConfig
}

export type CanvasDragState = {
    itemId: string
    itemKind: 'tab' | 'section'
    kind: 'move' | 'resize'
    startX: number
    startY: number
    item: ProfileCanvasItem
    config: ProfileTabsConfig
}

export type CanvasItemPatch = Partial<
    Pick<
        ProfileCanvasItem,
        'display' | 'pagination' | 'page' | 'locked' | 'sort' | 'filter' | 'filters'
    >
>

// Shared editor types ----
export type ProfileCanvasDisplay = NonNullable<ProfileCanvasItem['display']>
export type ProfileFilterOption = {
    value: string
    label: string
}
export type ProfileHeaderLocks = NonNullable<ProfileTabsConfig['header_locks']>
export type ProfileHeaderLockKey = keyof ProfileHeaderLocks
export type HeaderDragKind =
    | 'cover-frame'
    | 'cover-image'
    | 'cover-size'
    | 'avatar-frame'
    | 'avatar-image'
    | 'avatar-frame-width'
    | 'avatar-frame-height'
    | 'avatar-frame-size'
    | 'avatar-frame-left'
    | 'avatar-frame-right'
    | 'avatar-frame-top'
    | 'avatar-frame-bottom'
    | 'avatar-frame-top-left'
    | 'avatar-frame-top-right'
    | 'avatar-frame-bottom-left'
    | 'avatar-frame-bottom-right'
    | 'avatar-border'
    | 'avatar-border-width'
    | 'avatar-border-height'
    | 'avatar-border-size'

export type ArtImageOption = {
    id: string
    title: string
    image: ArtImage
}

export type BlockRect = Pick<ArtistProfileBlock, 'x' | 'y' | 'w' | 'h'>
