import type { ProfileTabId } from '@/types/artistProfile'
import type { NewBlockForm } from '../types/profileEditor'

// Board dimensions ----
export const GRID_STEP = 5
export const BOARD_MIN_HEIGHT = 760
export const BOARD_UNIT_PX = 8
export const STICKER_BLOCK_SIZE = { w: 18, h: 18 }

// Profile options ----
export const PROFILE_GRADIENT_DIRECTIONS = [
    'to bottom',
    'to top',
    'to right',
    'to left',
    'to bottom right',
    'to bottom left',
] as const

export const PROFILE_TAB_IDS: ProfileTabId[] = [
    'board',
    'arts',
    'works',
    'stickers',
    'comments',
    'feeds',
]

export const PROFILE_TAB_LABELS: Record<ProfileTabId, string> = {
    board: 'My Board',
    arts: 'My Arts',
    works: 'My Works',
    stickers: 'My Stickers',
    comments: 'My Comments',
    feeds: 'My Feeds',
}

export const PROFILE_CANVAS_DROP_MIME = 'application/x-latern-profile-canvas-item'

// Default form state ----
export const EMPTY_BLOCK: NewBlockForm = {
    type: 'image',
    text: '',
    image: null,
    sourceArtImageId: '',
    stickerId: '',
    isSticker: false,
}
