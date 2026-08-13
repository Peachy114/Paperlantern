import type { CSSProperties } from 'react'
import type {
    ArtistProfileBlock,
    ArtistProfileResponse,
    ProfileCanvasItem,
    ProfileLink,
    ProfileTabId,
    ProfileTabPosition,
    ProfileTabsConfig,
} from '@/types/artistProfile'
import {
    BOARD_MIN_HEIGHT,
    BOARD_UNIT_PX,
    GRID_STEP,
    PROFILE_TAB_IDS,
} from '@/features/artist-profile/constants/profileEditor'
import type {
    BlockPatch,
    BlockRect,
    DragState,
    HeaderDraft,
    ProfileCanvasDisplay,
    ProfileEditErrors,
    ProfileFilterOption,
    ProfileLinkDraft,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'
import type { ExtendedGlobalStyles } from '@/features/artist-profile/types/profileTheme'

// Profile layout engine ----
function normalizeLegacyProfileFilter(item: ProfileCanvasItem) {
    const value = (item.filter ?? '').trim().toLowerCase()
    if (!value) return []

    if (item.type === 'arts') return [`label:${value}`]
    if (item.type === 'works') {
        if (value === 'novel') return ['type:novel']
        if (value === 'webtoon') return ['type:webtoon']
        return [`status:${value}`]
    }
    if (item.type === 'stickers') return [`sticker:${value}`]

    return []
}

export function computeBlockPatch(
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
            y: snapBoardY(block.y + dy, block.h, blocks),
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

export function toFormData(patch: Record<string, unknown>) {
    const payload = new FormData()
    Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
    })
    return payload
}

export function findOpenSpot(blocks: ArtistProfileBlock[], width: number, height: number) {
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

export function blockRect(block: ArtistProfileBlock): BlockRect {
    return {
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
    }
}

export function snapRect(rect: BlockRect): BlockRect {
    const w = clamp(snapToGrid(rect.w), GRID_STEP, 100)
    const h = clamp(snapToGrid(rect.h), GRID_STEP, 300)

    return {
        x: clamp(snapToGrid(rect.x), 0, 100 - w),
        y: snapMin(rect.y, 0),
        w,
        h,
    }
}

export function snapToGrid(value: number) {
    return Math.round(value / GRID_STEP) * GRID_STEP
}

export function snapWithin(value: number, min: number, max: number) {
    return clamp(snapToGrid(value), min, max)
}

export function snapMin(value: number, min: number) {
    return Math.max(snapToGrid(value), min)
}

export function collides(blockId: string, rect: BlockRect, blocks: ArtistProfileBlock[]) {
    const active = blocks.find((block) => block.id === blockId)
    if (active?.is_sticker || active?.overlay) return false

    return blocks.some(
        (block) =>
            block.id !== blockId &&
            !block.is_sticker &&
            !block.overlay &&
            overlaps(rect, blockRect(block))
    )
}

export function overlaps(a: BlockRect, b: BlockRect) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function normalizeProfileDisplayScale(value: number | undefined) {
    const scale = Number(value)
    return Number.isFinite(scale) && scale >= 0.5 && scale <= 1.75 ? scale : 1
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

export function snapPercentCenter(value: number) {
    return Math.abs(value - 50) <= 3 ? 50 : value
}

export function parseCanvasDropPayload(
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

export function findNearestOpenRect(
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

export function getBoardRows(blocks: ArtistProfileBlock[]) {
    return blocks.reduce((max, block) => Math.max(max, block.y + block.h), 0)
}

export function getBoardHeight(blocks: ArtistProfileBlock[], minHeight = BOARD_MIN_HEIGHT) {
    return Math.max(minHeight, (getBoardRows(blocks) + GRID_STEP * 8) * BOARD_UNIT_PX)
}

export function nextZIndex(blocks: ArtistProfileBlock[]) {
    return Math.max(0, ...blocks.map((block) => block.z_index)) + 1
}

export function normalizeRotation(value: number) {
    if (value > 360) return value - 720
    if (value < -360) return value + 720
    return value
}

export function createProfileThemeDraft(artist: ArtistProfileResponse['artist']): ProfileThemeDraft {
    return {
        backgroundColorEnabled: artist.profile_background_color_enabled ?? true,
        backgroundColor: artist.profile_background_color ?? '',
        gradientFrom: artist.profile_background_gradient_from ?? '',
        gradientTo: artist.profile_background_gradient_to ?? '',
        gradientDirection: artist.profile_background_gradient_direction ?? 'to bottom',
        hasGradient: artist.profile_background_has_gradient ?? false,
        backgroundBlur: artist.profile_background_blur ?? 0,
        showCover: artist.profile_show_cover ?? true,
        coverWidth: artist.profile_cover_width ?? 100,
        bannerHeight: artist.profile_banner_height ?? 288,
        avatarFrameX: 50,
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

export function profileThemeToPayload(draft: ProfileThemeDraft) {
    return {
        profile_background_color_enabled: draft.backgroundColorEnabled,
        profile_background_color: draft.backgroundColor,
        profile_background_gradient_from: draft.gradientFrom,
        profile_background_gradient_to: draft.gradientTo,
        profile_background_gradient_direction: draft.gradientDirection,
        profile_background_has_gradient: draft.hasGradient,
        profile_background_blur: draft.backgroundBlur,
        profile_show_cover: draft.showCover,
        profile_cover_width: draft.coverWidth,
        profile_banner_height: draft.bannerHeight,
        profile_avatar_frame_x: 50,
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

export function profileThemeToFormData(draft: ProfileThemeDraft, header: HeaderDraft) {
    const payload = new FormData()
    const fields = {
        ...profileThemeToPayload(draft),
        artist_title: header.artistTitle,
        show_public_links: true,
        profile_tabs_config: JSON.stringify(draft.tabsConfig),
        profile_links: JSON.stringify(
            draft.links.map(({ imageFile, imagePreview, ...link }) => ({
                id: link.id,
                title: link.title.trim(),
                url: link.url.trim(),
                is_public: link.is_public,
            }))
        ),
    }

    Object.entries(fields).forEach(([key, value]) => {
        payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? ''))
    })

    return payload
}

export function getProfileBackground(draft: ProfileThemeDraft): CSSProperties {
    const opacity = clamp(
        Number(
            (draft.tabsConfig.global_styles as ExtendedGlobalStyles | undefined)
                ?.background_color_opacity ?? 100
        ),
        0,
        100
    )
    const base = draft.backgroundColorEnabled
        ? toRgba(draft.backgroundColor || '#ffffff', opacity / 100)
        : 'transparent'
    if (!draft.hasGradient || (!draft.gradientFrom && !draft.gradientTo)) return { background: base }

    const from = draft.gradientFrom || 'transparent'
    const to = draft.gradientTo || 'transparent'

    return {
        background: draft.backgroundColorEnabled
            ? `linear-gradient(${draft.gradientDirection}, ${from}, ${to}), ${base}`
            : `linear-gradient(${draft.gradientDirection}, ${from}, ${to})`,
    }
}

export function isColorValue(value: string) {
    return /^#[0-9a-fA-F]{6}$/.test(value)
}

export function validateProfileEdit(header: HeaderDraft, draft: ProfileThemeDraft): ProfileEditErrors {
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
        const hasAnyValue = link.title.trim() || link.url.trim()
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

export function normalizeProfileLinkDrafts(links: ProfileLink[]): ProfileLinkDraft[] {
    return links.map((link) => ({
        ...link,
        imageFile: null,
        imagePreview: null,
    }))
}

export function getRequestErrorMessage(error: unknown) {
    if (typeof error !== 'object' || error === null || !('response' in error)) return null

    const response = (error as { response?: { data?: { message?: unknown; errors?: unknown } } })
        .response
    if (typeof response?.data?.message === 'string') return response.data.message

    const errors = response?.data?.errors
    if (typeof errors !== 'object' || errors === null) return null

    const first = Object.values(errors)[0]
    return Array.isArray(first) && typeof first[0] === 'string' ? first[0] : null
}

export function toPublicHref(value?: string | null): string {
    const href = value?.trim() ?? ''
    if (!href) return '#'
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href
    return `https://${href}`
}

export function defaultProfileTabsConfig(): ProfileTabsConfig {
    const positions = {
        board: { x: 0, y: 0, w: 22, h: 36 },
        arts: { x: 0, y: 0, w: 28, h: 36 },
        works: { x: 30, y: 0, w: 28, h: 36 },
        stickers: { x: 60, y: 0, w: 32, h: 36 },
        comments: { x: 30, y: 52, w: 30, h: 36 },
        shop: { x: 46, y: 52, w: 30, h: 36 },
        feeds: { x: 62, y: 52, w: 28, h: 36 },
    }
    const defaultTabs: ProfileTabId[] = ['arts', 'works', 'stickers', 'feeds']

    return {
        visibility: {
            board: false,
            arts: true,
            works: true,
            stickers: true,
            comments: false,
            shop: true,
            feeds: true,
        },
        section_mode: 'separate_pages',
        positions,
        tab_order: [...PROFILE_TAB_IDS],
        buttons: defaultTabs.map((tab) => ({
            id: `tab-${tab}`,
            type: tab,
            kind: 'tab',
            page: tab,
            display: defaultCanvasDisplay(tab),
            pagination: true,
            sort: defaultProfileSort(tab),
            filters: [],
            ...positions[tab],
        })),
        sections: defaultTabs.map((tab) => ({
            id: `section-${tab}`,
            type: tab,
            kind: 'section',
            page: tab,
            display: defaultCanvasDisplay(tab),
            pagination: true,
            sort: defaultProfileSort(tab),
            filters: [],
            x: 5,
            y: 120,
            w: 90,
            h: 420,
        })),
        cover_offset: { x: 1, y: 1 },
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
        global_styles: {
            font_family: '',
            text_color: '#111827',
            muted_text_color: '#6b7280',
            accent_color: '#f97316',
            base_font_size: 14,
            widget_font_size: 13,
            button_font_size: 14,
            background_color_opacity: 100,
            header_background_enabled: false,
            header_background_color: '#ffffff',
            header_background_opacity: 100,
        },
    }
}

export function normalizeProfileTabsConfig(
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
        tab_order: [
            ...(value.tab_order ?? []).filter((tab): tab is ProfileTabId => PROFILE_TAB_IDS.includes(tab)),
            ...PROFILE_TAB_IDS.filter((tab) => !(value.tab_order ?? []).includes(tab)),
        ],
        buttons: normalizeCanvasItems(value.buttons, defaults.buttons ?? [], 'tab'),
        sections: normalizeCanvasItems(value.sections, defaults.sections ?? [], 'section'),
        cover_offset: {
            x: normalizeProfileDisplayScale(value.cover_offset?.x),
            y: normalizeProfileDisplayScale(value.cover_offset?.y),
        },
        border_offset: {
            x: Number(value.border_offset?.x ?? 0),
            y: Number(value.border_offset?.y ?? 0),
        },

        border_scale: clamp(value.border_scale ?? 1.35, 0.5, 10),
        border_width: clamp(value.border_width ?? value.border_scale ?? 1.35, 0.05, 10),
        border_height: clamp(value.border_height ?? value.border_scale ?? 1.35, 0.05, 10),
        border_layer: value.border_layer === 'back' ? 'back' : 'front',
        nav_locked: value.nav_locked ?? false,
        header_locks: {
            cover_frame: value.header_locks?.cover_frame ?? false,
            avatar_frame: value.header_locks?.avatar_frame ?? false,
            avatar_border: value.header_locks?.avatar_border ?? false,
        },
        global_styles: {
            ...defaults.global_styles!,
            ...(value.global_styles ?? {}),
            base_font_size: clamp(
                value.global_styles?.base_font_size ?? defaults.global_styles!.base_font_size,
                10,
                28
            ),
            widget_font_size: clamp(
                value.global_styles?.widget_font_size ?? defaults.global_styles!.widget_font_size,
                10,
                28
            ),
            button_font_size: clamp(
                value.global_styles?.button_font_size ?? defaults.global_styles!.button_font_size,
                10,
                24
            ),
            background_color_opacity: clamp(
                value.global_styles?.background_color_opacity ?? 100,
                0,
                100
            ),
            header_background_opacity: clamp(
                value.global_styles?.header_background_opacity ?? 100,
                0,
                100
            ),
        },
    }
}

export function normalizeCanvasItems(
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
            limit: typeof item.limit === 'number' && item.limit >= 0 ? item.limit : undefined,
            locked: item.locked ?? false,
            sort: item.sort ?? defaultProfileSort(item.type),
            filter: item.filter ?? '',
            filters: Array.isArray(item.filters)
                ? item.filters.map((filter) => String(filter).trim().toLowerCase()).filter(Boolean)
                : normalizeLegacyProfileFilter(item),
            x: clamp(item.x, 0, 95),
            y: clamp(item.y, 0, 2400),
            w: clamp(item.w, kind === 'tab' ? 10 : 5, 100),
            h: clamp(item.h, kind === 'tab' ? 28 : 80, 1400),
        }))
}

export function patchTabPosition(
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

export function getVisibleProfileTabs(config: ProfileTabsConfig, isStorytellerProfile: boolean) {
    return (config.tab_order ?? PROFILE_TAB_IDS).filter((tab) => {
        if ((tab === 'arts' || tab === 'works') && !isStorytellerProfile) return false
        return config.visibility[tab]
    })
}

export function getCanvasItems(
    config: ProfileTabsConfig,
    visibleTabs: ProfileTabId[],
    kind: ProfileCanvasItem['kind']
) {
    const key = kind === 'tab' ? 'buttons' : 'sections'
    const defaults = defaultProfileTabsConfig()[key] ?? []
    const items = config[key] === undefined ? defaults : config[key]!

    return items.filter((item) => item.kind === kind && visibleTabs.includes(item.type))
}

export function shouldUseCanvasLayout(
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

export function patchCanvasItem(config: ProfileTabsConfig, item: ProfileCanvasItem): ProfileTabsConfig {
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

export function getCanvasHeight(
    items: ProfileCanvasItem[],
    heightForItem: (item: ProfileCanvasItem) => number = (item) => item.h
) {
    return Math.max(680, ...items.map((item) => item.y + heightForItem(item) + 80))
}

export function getCanvasItemPage(item: ProfileCanvasItem) {
    return item.page && PROFILE_TAB_IDS.includes(item.page) ? item.page : item.type
}

export function getCanvasItemRenderHeight(
    item: ProfileCanvasItem,
    boardHeight: number,
    hasBoardEditorPanel: boolean
) {
    if (item.type !== 'board') return item.h
    return Math.max(item.h, boardHeight + 72 + (hasBoardEditorPanel ? 300 : 0))
}

export function getNextCanvasItemY(
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

export function defaultCanvasDisplay(type: ProfileTabId): ProfileCanvasDisplay {
    if (type === 'arts') return 'masonry'
    if (type === 'works') return 'image_title'
    if (type === 'comments') return 'table'
    if (type === 'feeds') return 'cards'
    return 'grid'
}

export function getPrimarySectionItem(config: ProfileTabsConfig, type: ProfileTabId): ProfileCanvasItem {
    const visibleTabs = PROFILE_TAB_IDS
    const existing = getCanvasItems(config, visibleTabs, 'section').find(
        (item) => item.type === type
    )

    return (
        existing ?? {
            id: `section-${type}`,
            type,
            kind: 'section',
            page: type,
            display: defaultCanvasDisplay(type),
            pagination: true,
            sort: defaultProfileSort(type),
            filter: '',
            filters: [],
            x: 5,
            y: 120,
            w: 90,
            h: 420,
        }
    )
}

export function defaultProfileSort(type: ProfileTabId) {
    if (type === 'works') return 'latest'
    if (type === 'stickers') return 'custom'
    return 'latest'
}

export function profileSortOptions(type: ProfileTabId) {
    if (type === 'arts') {
        return [
            'latest',
            'oldest',
            'title_az',
            'title_za',
            'views',
            'likes',
            'comments',
            'super_likes',
        ]
    }

    if (type === 'works') {
        return ['latest', 'oldest', 'title_az', 'title_za', 'type', 'views', 'likes', 'chapters']
    }

    if (type === 'stickers') {
        return ['custom', 'latest', 'oldest', 'name_az', 'name_za', 'popular']
    }

    return ['latest', 'oldest']
}

export function formatProfileSort(value: string) {
    const labels: Record<string, string> = {
        custom: 'Custom Order',
        latest: 'Latest',
        oldest: 'Oldest',
        title_az: 'Title A-Z',
        title_za: 'Title Z-A',
        name_az: 'Name A-Z',
        name_za: 'Name Z-A',
        type: 'Type',
        views: 'Most Views',
        likes: 'Most Likes',
        comments: 'Most Comments',
        super_likes: 'Most Super Likes',
        chapters: 'Most Chapters',
        popular: 'Most Bought/Subscribed',
    }

    return labels[value] ?? value
}

export function profileFilterLabel(type: ProfileTabId) {
    if (type === 'arts') return 'Filters'
    if (type === 'works') return 'Filters'
    if (type === 'stickers') return 'Filters'
    return 'Filters'
}

export function getProfileFilterOptions(
    profile: ArtistProfileResponse,
    type: ProfileTabId
): ProfileFilterOption[] {
    if (type === 'arts') {
        const labelOptions = Array.from(
            new Set(
                profile.arts
                    .flatMap((art) => art.labels ?? [])
                    .map((label) => label.trim().toLowerCase())
                    .filter(Boolean)
            )
        )
            .sort((a, b) => a.localeCompare(b))
            .map((label) => ({ value: `label:${label}`, label: `Label: ${label}` }))

        return [
            ...labelOptions,
            { value: 'download:free', label: 'Free download' },
            { value: 'download:paid', label: 'Credit download' },
            { value: 'download:disabled', label: 'No downloads' },
        ]
    }

    if (type === 'works') {
        const hasWebtoon = profile.works.some((work) => work.type === 'webtoon')
        const hasNovel = profile.works.some((work) => work.type === 'wattpad')
        const statusOptions = Array.from(
            new Set(profile.works.map((work) => work.status.trim().toLowerCase()).filter(Boolean))
        )
            .sort((a, b) => {
                if (a === 'completed') return -1
                if (b === 'completed') return 1
                return a.localeCompare(b)
            })
            .map((status) => ({ value: `status:${status}`, label: formatStatusFilter(status) }))

        return [
            ...(hasWebtoon ? [{ value: 'type:webtoon', label: 'Webtoon' }] : []),
            ...(hasNovel ? [{ value: 'type:novel', label: 'Novel' }] : []),
            ...statusOptions,
        ]
    }

    if (type === 'stickers') {
        return [
            { value: 'sticker:subscribed', label: 'Subscriptions' },
            { value: 'sticker:bought', label: 'Credit buy' },
            { value: 'sticker:free', label: 'Free' },
            { value: 'owner:own', label: 'Own stickers' },
            { value: 'owner:other', label: 'Other artists' },
        ]
    }

    return []
}

export function formatStatusFilter(value: string) {
    return value
        .split(/[_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

export function formatCanvasDisplay(value: string) {
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

export function getWidgetImageLimit(item: ProfileCanvasItem) {
    const estimatedColumns = Math.max(1, Math.round(item.w / 18))
    return clamp(estimatedColumns * 2, 2, 12)
}

export function toRgba(color: string, opacity: number): string {
    const match = /^#([0-9a-fA-F]{6})$/.exec(color)
    if (!match) return color
    const value = Number.parseInt(match[1], 16)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${clamp(opacity, 0, 1)})`
}

export function snapCanvasX(value: number, width: number) {
    const centered = 50 - width / 2
    if (Math.abs(value - centered) <= 3) return centered
    return snapWithin(value, 0, 100 - width)
}

export function snapCenterOffset(value: number) {
    return Math.abs(value) <= 3 ? 0 : value
}

export function snapCanvasY(value: number) {
    return Math.round(value / 20) * 20
}

export function snapBoardY(value: number, height: number, blocks: ArtistProfileBlock[]) {
    const boardRows = Math.max(
        BOARD_MIN_HEIGHT / BOARD_UNIT_PX,
        getBoardRows(blocks) + GRID_STEP * 8
    )
    const centered = (boardRows - height) / 2
    if (Math.abs(value - centered) <= GRID_STEP * 2) return centered
    return snapMin(value, 0)
}

export function getRenderableProfileTabs(tabs: ProfileTabId[], config: ProfileTabsConfig) {
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

export function getTabsCanvasHeight(config: ProfileTabsConfig, tabs: ProfileTabId[]) {
    return Math.max(
        44,
        ...tabs.map((tab) => {
            const position = config.positions[tab]
            return position.y + position.h + 8
        })
    )
}
