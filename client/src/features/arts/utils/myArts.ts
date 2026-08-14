import type { Art } from '@/types/art'
import type { ArtConfirmation } from '@/features/arts/types/myArts'

// Image access ----
export function getArtImages(art: Art) {
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

export function getFirstImagePath(art: Art) {
    return getArtImages(art)[0]?.image_path ?? art.image_path
}

// Confirmation copy ----
export function artConfirmationTitle(confirm: ArtConfirmation) {
    if (confirm?.type === 'restore') return 'Restore this art post?'
    if (confirm?.type === 'force') return 'Permanently delete this art post?'
    if (confirm?.type === 'bulk-trash') return `Move ${confirm.count} art posts to trash?`
    return 'Move this art post to trash?'
}

export function artConfirmationDescription(confirm: ArtConfirmation) {
    if (confirm?.type === 'restore') {
        return `"${confirm.art.title}" will return to your My Arts dashboard.`
    }

    if (confirm?.type === 'force') {
        return `"${confirm.art.title}" will be permanently deleted and cannot be recovered.`
    }

    if (confirm?.type === 'trash') {
        return `"${confirm.art.title}" will stay recoverable for 30 days.`
    }

    if (confirm?.type === 'bulk-trash') {
        return `${confirm.count} art post${
            confirm.count === 1 ? '' : 's'
        } will be moved to trash and remain recoverable for 30 days.`
    }

    return 'Please confirm this action.'
}
