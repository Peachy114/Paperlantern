import { useQuery } from '@tanstack/react-query'
import { announcementApi, type Announcement } from '@/api/announcement'
import { storageUrl } from '@/utils/storage'

// ── Public announcements (home page) ─────────────────────────────────────────
export function usePublicAnnouncements() {
    const { data, isLoading } = useQuery({
        queryKey: ['public-announcements'],
        queryFn: () => announcementApi.getPublic().then((r) => r.data as Announcement[]),
    })

    const image = (path: string | null) => (path ? storageUrl(path) : null)

    return {
        announcements: data ?? [],
        isLoading,
        image,
    }
}

// ── Studio announcements (storyteller dashboard) ──────────────────────────────
export function useStudioAnnouncements() {
    const { data, isLoading } = useQuery({
        queryKey: ['studio-announcements'],
        queryFn: () => announcementApi.getStudio().then((r) => r.data as Announcement[]),
    })

    const image = (path: string | null) => (path ? storageUrl(path) : null)

    return {
        announcements: data ?? [],
        isLoading,
        image,
    }
}
