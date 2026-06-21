import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import type { ChapterDetail } from '@/types/moderation'

export function useAdminModerationShow(chapterId: number) {
    const queryClient = useQueryClient()
    const [reason, setReason] = useState('')
    const [showViolateForm, setShowViolateForm] = useState(false)

    const queryKey = ['admin-moderation', 'chapter', chapterId]

    const { data: chapter } = useSuspenseQuery<ChapterDetail>({
        queryKey,
        queryFn: () => moderationApi.getChapter(chapterId).then((r) => r.data),
    })

    const approve = useMutation({
        mutationFn: () => moderationApi.approveChapter(chapterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
        },
    })

    const violate = useMutation({
        mutationFn: () => moderationApi.violateChapter(chapterId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
            setShowViolateForm(false)
            setReason('')
        },
    })

    return {
        chapter,
        reason,
        setReason,
        showViolateForm,
        setShowViolateForm,
        approve: () => approve.mutate(),
        violate: () => violate.mutate(),
        approving: approve.isPending,
        violating: violate.isPending,
        result: approve.data?.data ?? violate.data?.data ?? null,
    }
}
