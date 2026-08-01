import type { WorkItem } from '@/features/work/hooks/useHome'

export function hrefFor(work: WorkItem) {
    if (work.type === 'art') return `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
    if (work.content_type === 'chapter' && work.chapter_slug) {
        return `/works/${work.slug}/chapters/${work.chapter_slug}`
    }
    return `/works/${work.slug}`
}