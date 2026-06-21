// features/profile/hooks/useProfile.ts
import { useEffect, useState } from 'react'
import { useProfileStore } from '../store/profile.store'
import { profileResponseSchema } from '../schemas/profile.schema'

type UseProfileResult = {
    loading: boolean
    error: string | null
    refetch: () => void
}

/**
 * Fetches the logged-in user's profile from Laravel (GET /api/profile)
 * and syncs it into the profile store.
 */
export function useProfile(): UseProfileResult {
    const setUser = useProfileStore((s) => s.setUser)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/profile', {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                })
                if (!res.ok) throw new Error(`Request failed: ${res.status}`)

                const json = await res.json()
                const parsed = profileResponseSchema.parse(json)

                if (!cancelled) setUser(parsed.data)
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load profile')
                    setUser(null)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [reloadKey, setUser])

    return {
        loading,
        error,
        refetch: () => setReloadKey((k) => k + 1),
    }
}
