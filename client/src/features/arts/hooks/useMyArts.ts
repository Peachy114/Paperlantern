import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { studioApi } from '@/api/studio'
import type { Art, MyArtsDashboardResponse } from '@/types/art'

const ARTS_QUERY_KEY = ['studio-arts']
const ARTS_TRASH_QUERY_KEY = ['studio-arts-trash']

export function useMyArts() {
    const queryClient = useQueryClient()

    const { data } = useSuspenseQuery<MyArtsDashboardResponse>({
        queryKey: ARTS_QUERY_KEY,
        queryFn: () => studioApi.getArts().then((res) => res.data),
    })

    const trashedArts = useQuery<Art[]>({
        queryKey: ARTS_TRASH_QUERY_KEY,
        queryFn: () => studioApi.getTrashedArts().then((res) => res.data),
    })

    const invalidateArts = () => {
        queryClient.invalidateQueries({ queryKey: ARTS_QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: ARTS_TRASH_QUERY_KEY })
    }

    const createArt = useMutation({
        mutationFn: (payload: FormData) => studioApi.createArt(payload).then((res) => res.data),
        onSuccess: invalidateArts,
    })

    const updateArt = useMutation({
        mutationFn: ({ slug, payload }: { slug: string; payload: FormData }) =>
            studioApi.updateArt(slug, payload).then((res) => res.data),
        onSuccess: invalidateArts,
    })

    const trashArt = useMutation({
        mutationFn: (slug: string) => studioApi.trashArt(slug).then((res) => res.data),
        onSuccess: invalidateArts,
    })

    const restoreArt = useMutation({
        mutationFn: (slug: string) => studioApi.restoreArt(slug).then((res) => res.data),
        onSuccess: invalidateArts,
    })

    const forceDeleteArt = useMutation({
        mutationFn: (slug: string) => studioApi.forceDeleteArt(slug).then((res) => res.data),
        onSuccess: invalidateArts,
    })

    return {
        arts: data.arts,
        stats: data.stats,
        trashedArts: trashedArts.data ?? [],
        trashLoading: trashedArts.isLoading,
        createArt,
        updateArt,
        trashArt,
        restoreArt,
        forceDeleteArt,
    }
}
