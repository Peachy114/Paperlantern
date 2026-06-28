import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import type { StickyNoteDetail } from '@/types/moderation'
import { violationSchema, type ViolationFormData } from '../schemas/violationSchema'

export function useAdminModerationShowStickyNote(noteId: string) {
    const queryClient = useQueryClient()
    const [showViolateForm, setShowViolateForm] = useState(false)

    const queryKey = ['admin-moderation', 'stickyNote', noteId]

    const { data: note } = useSuspenseQuery<StickyNoteDetail>({
        queryKey,
        queryFn: () => moderationApi.getStickyNote(noteId).then((r) => r.data),
    })

    const form = useForm<ViolationFormData>({
        resolver: yupResolver(violationSchema),
        defaultValues: { reason: '' },
    })

    const approve = useMutation({
        mutationFn: () => moderationApi.approveStickyNote(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
        },
    })

    const violate = useMutation({
        mutationFn: (data: ViolationFormData) =>
            moderationApi.violateStickyNote(noteId, data.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
            setShowViolateForm(false)
            form.reset()
        },
    })

    return {
        note,
        form,
        showViolateForm,
        setShowViolateForm,
        approve: () => approve.mutate(),
        violate: form.handleSubmit((data) => violate.mutate(data)),
        approving: approve.isPending,
        violating: violate.isPending,
        result: approve.data?.data ?? violate.data?.data ?? null,
    }
}
