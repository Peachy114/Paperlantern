import type { CommentSort, PublicComment } from '@/types/comment'

// Comment thread defaults ----
export const COMMENT_REACTION_EMOJIS = [
    '😀',
    '😂',
    '😭',
    '🔥',
    '❤️',
    '😍',
    '🥰',
    '😮',
    '😆',
    '👏',
    '👍',
    '✨',
    '💯',
    '🤔',
    '😎',
    '🥹',
    '😅',
    '🙌',
    '🎉',
    '⭐',
]
COMMENT_REACTION_EMOJIS.splice(
    0,
    COMMENT_REACTION_EMOJIS.length,
    '\uD83D\uDE00',
    '\uD83D\uDE02',
    '\uD83D\uDE2D',
    '\uD83D\uDD25',
    '\u2764\uFE0F',
    '\uD83D\uDE0D',
    '\uD83E\uDD70',
    '\uD83D\uDE2E',
    '\uD83D\uDE06',
    '\uD83D\uDC4F',
    '\uD83D\uDC4D',
    '\u2728',
    '\uD83D\uDCAF',
    '\uD83E\uDD14',
    '\uD83D\uDE0E',
    '\uD83E\uDD79',
    '\uD83D\uDE05',
    '\uD83D\uDE4C',
    '\uD83C\uDF89',
    '\u2B50'
)

export const COMMENT_SORTS: Array<{ value: CommentSort; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Popular' },
]

export const INITIAL_VISIBLE_REPLIES = 5

export function normalizeUsername(value?: string | null): string {
    return value?.trim().replace(/^@/, '').toLowerCase() ?? ''
}

export function compareRepliesOldestFirst(a: PublicComment, b: PublicComment): number {
    const aTime = Date.parse(a.created_at)
    const bTime = Date.parse(b.created_at)

    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return aTime - bTime
    }

    return String(a.id).localeCompare(String(b.id))
}

