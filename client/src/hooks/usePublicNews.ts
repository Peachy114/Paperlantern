import { useState, useEffect } from 'react'
import { announcementApi, type Announcement } from '@/api/announcement'

type Audience = 'public' | 'studio'

export function useAnnouncements(audience: Audience) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

    useEffect(() => {
        const call = audience === 'public'
        ? () => announcementApi.getPublic()
        : () => announcementApi.getStudio()

        setLoading(true)
        setError(null)

        call()
        .then(res => setAnnouncements(res.data))
        .catch(() => setError('Failed to load announcements.'))
        .finally(() => setLoading(false))
    }, [audience])

  return { announcements, loading, error }
}