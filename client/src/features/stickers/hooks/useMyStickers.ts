import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stickersApi } from '@/api/stickers'
import type { ArtistStickerLibraryResponse } from '@/types/artistProfile'

const queryKey = ['my-stickers']

export function useMyStickers() {
    const queryClient = useQueryClient()

    const query = useQuery<ArtistStickerLibraryResponse>({
        queryKey,
        queryFn: () => stickersApi.index().then((res) => res.data),
    })

    const invalidate = () => queryClient.invalidateQueries({ queryKey })

    const createSticker = useMutation({
        mutationFn: (payload: FormData) => stickersApi.create(payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const deleteSticker = useMutation({
        mutationFn: (id: string) => stickersApi.delete(id).then((res) => res.data),
        onSuccess: invalidate,
    })

    return {
        ...query,
        createSticker,
        deleteSticker,
    }
}
