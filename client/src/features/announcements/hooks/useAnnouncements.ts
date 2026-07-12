import { useQuery } from '@tanstack/react-query'
import { announcementApi, type Announcement } from '@/api/announcement'

type Audience = 'public' | 'studio'

export function useAnnouncements(audience: Audience) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['announcements', audience],
        queryFn: () => {
            const request =
                audience === 'public'
                    ? announcementApi.getPublic()
                    : announcementApi.getStudio()

            return request.then((res) => res.data as Announcement[])
        },
    })

    return {
        announcements: data ?? [],
        loading: isLoading,
        error: error ? 'Failed to load announcements.' : null,
    }
}

