import type { Art } from '@/types/art'
import type {
    ArtistProfileBlock,
    ArtistProfileResponse,
    ArtistSticker,
    ProfileCanvasItem,
} from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'
import type { ArtImageOption } from '@/features/artist-profile/types/profileEditor'
import { defaultProfileSort } from '@/features/artist-profile/utils/profileLayout'

// Profile content filtering ----
export function formatProfileDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

export function getArtImageOptions(arts: Art[]): ArtImageOption[] {
    return arts.flatMap((art) =>
        getArtImages(art).map((image, index) => ({
            id: image.id,
            title: `${art.title} ${index + 1}`,
            image,
        }))
    )
}

export function getArtImages(art: Art) {
    const validImages = (art.images ?? []).filter((image) => Boolean(image.image_path?.trim()))
    if (validImages.length > 0) return validImages

    if (!art.image_path?.trim()) return []

    return [{
        id: art.id,
        art_id: art.id,
        image_path: art.image_path,
        description: art.description,
        sort_order: 0,
        created_at: art.created_at,
        updated_at: art.updated_at,
    }]
}

export function blockImageSrc(block: ArtistProfileBlock) {
    if (block.source_sticker?.image_path) return storageUrl(block.source_sticker.image_path)
    if (block.source_art_image?.image_path) return storageUrl(block.source_art_image.image_path)
    if (block.image_url) return block.image_url
    if (block.image_path) return storageUrl(block.image_path)
    return null
}

export function filterSortArts(arts: Art[], item: ProfileCanvasItem) {
    const filters = getCanvasFilters(item)
    const labelFilters = filters.filter((filter) => filter.startsWith('label:')).map(tokenValue)
    const downloadFilters = filters
        .filter((filter) => filter.startsWith('download:'))
        .map(tokenValue)
    const filtered = arts.filter((art) => {
        const matchesLabels =
            labelFilters.length === 0 ||
            labelFilters.some((label) =>
                (art.labels ?? []).some((artLabel) => artLabel.toLowerCase() === label)
            )
        const matchesDownload =
            downloadFilters.length === 0 ||
            downloadFilters.includes(art.download_policy ?? 'disabled')

        return matchesLabels && matchesDownload
    })

    return [...filtered].sort((a, b) => {
        switch (item.sort ?? defaultProfileSort('arts')) {
            case 'oldest':
                return dateValue(a.created_at) - dateValue(b.created_at)
            case 'title_az':
                return a.title.localeCompare(b.title)
            case 'title_za':
                return b.title.localeCompare(a.title)
            case 'views':
                return b.views - a.views
            case 'likes':
                return b.likes - a.likes
            case 'comments':
                return b.comments_count - a.comments_count
            case 'super_likes':
                return b.super_likes_count - a.super_likes_count
            default:
                return dateValue(b.created_at) - dateValue(a.created_at)
        }
    })
}

export function filterSortWorks(works: ArtistProfileResponse['works'], item: ProfileCanvasItem) {
    const filters = getCanvasFilters(item)
    const typeFilters = filters.filter((filter) => filter.startsWith('type:')).map(tokenValue)
    const statusFilters = filters.filter((filter) => filter.startsWith('status:')).map(tokenValue)
    const filtered = works.filter((work) => {
        const normalizedType = work.type === 'wattpad' ? 'novel' : work.type
        const matchesType = typeFilters.length === 0 || typeFilters.includes(normalizedType)
        const matchesStatus =
            statusFilters.length === 0 || statusFilters.includes(work.status.toLowerCase())

        return matchesType && matchesStatus
    })

    return [...filtered].sort((a, b) => {
        switch (item.sort ?? defaultProfileSort('works')) {
            case 'oldest':
                return dateValue(a.created_at) - dateValue(b.created_at)
            case 'title_az':
                return a.title.localeCompare(b.title)
            case 'title_za':
                return b.title.localeCompare(a.title)
            case 'type':
                return a.type.localeCompare(b.type) || a.title.localeCompare(b.title)
            case 'views':
                return b.views - a.views
            case 'likes':
                return b.likes - a.likes
            case 'chapters':
                return b.chapters_count - a.chapters_count
            default:
                return dateValue(b.created_at) - dateValue(a.created_at)
        }
    })
}

export function filterSortStickers(stickers: ArtistSticker[], item: ProfileCanvasItem) {
    const filters = getCanvasFilters(item)
    const commerceFilters = filters
        .filter((filter) => filter.startsWith('sticker:'))
        .map(tokenValue)
    const ownerFilters = filters.filter((filter) => filter.startsWith('owner:')).map(tokenValue)
    const filtered = stickers.filter((sticker) => {
        const matchesCommerce =
            commerceFilters.length === 0 ||
            commerceFilters.some((filter) => {
                if (filter === 'subscribed') {
                    return sticker.subscribed || sticker.library_status === 'subscribed'
                }
                if (filter === 'bought') {
                    return sticker.bought || sticker.library_status === 'bought'
                }
                if (filter === 'free') {
                    return !sticker.purchase_cost || sticker.purchase_cost <= 0
                }
                return false
            })
        const matchesOwner =
            ownerFilters.length === 0 ||
            ownerFilters.some((filter) =>
                filter === 'own'
                    ? sticker.owned || sticker.library_status === 'created'
                    : !sticker.owned && sticker.library_status !== 'created'
            )

        return matchesCommerce && matchesOwner
    })

    return [...filtered].sort((a, b) => {
        switch (item.sort ?? defaultProfileSort('stickers')) {
            case 'latest':
                return dateValue(b.created_at) - dateValue(a.created_at)
            case 'oldest':
                return dateValue(a.created_at) - dateValue(b.created_at)
            case 'name_az':
                return a.name.localeCompare(b.name)
            case 'name_za':
                return b.name.localeCompare(a.name)
            case 'popular':
                return (
                    (b.purchases_count ?? 0) +
                    (b.subscriptions_count ?? 0) -
                    ((a.purchases_count ?? 0) + (a.subscriptions_count ?? 0))
                )
            default:
                return a.sort_order - b.sort_order
        }
    })
}

function dateValue(value: string) {
    return new Date(value).getTime()
}

function tokenValue(value: string) {
    return value.split(':').slice(1).join(':').toLowerCase()
}

export function getCanvasFilters(item: ProfileCanvasItem) {
    if (Array.isArray(item.filters)) {
        return item.filters.map((filter) => filter.trim().toLowerCase()).filter(Boolean)
    }

    return normalizeLegacyProfileFilter(item)
}

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
