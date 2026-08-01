export function normalizeContentFilter(contentFilter: string | null) {
    if (!contentFilter || contentFilter === 'all') return null
    if (contentFilter === 'webtoon') return 'webtoon'
    if (contentFilter === 'wattpad') return 'wattpad'
    if (contentFilter === 'art') return 'art'
    if (contentFilter === 'commission') return 'commission'
    return null
}