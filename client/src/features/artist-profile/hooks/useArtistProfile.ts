import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { artistProfileApi } from '@/api/artistProfile'
import type { ArtistProfileResponse } from '@/types/artistProfile'

export function useArtistProfile(username: string) {
    const queryClient = useQueryClient()
    const queryKey = ['artist-profile', username]

    const { data } = useSuspenseQuery<ArtistProfileResponse>({
        queryKey,
        queryFn: () => artistProfileApi.show(username).then((res) => res.data),
    })

    const invalidate = () => queryClient.invalidateQueries({ queryKey })

    const updateHeader = useMutation({
        mutationFn: (payload: FormData) =>
            artistProfileApi.updateHeader(payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const createBlock = useMutation({
        mutationFn: (payload: FormData) =>
            artistProfileApi.createBlock(payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const updateBlock = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
            artistProfileApi.updateBlock(id, payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const deleteBlock = useMutation({
        mutationFn: (id: string) => artistProfileApi.deleteBlock(id).then((res) => res.data),
        onSuccess: invalidate,
    })

    const createSticker = useMutation({
        mutationFn: (payload: FormData) =>
            artistProfileApi.createSticker(payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const deleteSticker = useMutation({
        mutationFn: (id: string) => artistProfileApi.deleteSticker(id).then((res) => res.data),
        onSuccess: invalidate,
    })

    const createBorder = useMutation({
        mutationFn: (payload: FormData) =>
            artistProfileApi.createBorder(payload).then((res) => res.data),
        onSuccess: invalidate,
    })

    const deleteBorder = useMutation({
        mutationFn: (id: string) => artistProfileApi.deleteBorder(id).then((res) => res.data),
        onSuccess: invalidate,
    })

    const reorderBlocks = useMutation({
        mutationFn: (blocks: { id: string; sort_order: number }[]) =>
            artistProfileApi.reorderBlocks(blocks).then((res) => res.data),
        onSuccess: invalidate,
    })

    return {
        profile: data,
        updateHeader,
        createBlock,
        updateBlock,
        deleteBlock,
        createSticker,
        deleteSticker,
        createBorder,
        deleteBorder,
        reorderBlocks,
    }
}
