import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { violationSchema, type ViolationFormData } from '../schemas/violationSchema'
import type { WorkDetail } from '@/types/moderation'

export function useAdminModerationShowWork(workId: number) {
    const queryClient = useQueryClient()
    const [showViolateForm, setShowViolateForm] = useState(false)

    const queryKey = ['admin-moderation', 'work', workId]

    const { data: work } = useSuspenseQuery<WorkDetail>({
        queryKey,
        queryFn: () => moderationApi.getWork(workId).then((r) => r.data),
    })

    const form = useForm<ViolationFormData>({
        resolver: yupResolver(violationSchema),
        defaultValues: { reason: '' },
    })

    const approve = useMutation({
        mutationFn: () => moderationApi.approveWork(workId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
        },
    })

    const violate = useMutation({
        mutationFn: (data: ViolationFormData) => moderationApi.violateWork(workId, data.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
            setShowViolateForm(false)
            form.reset()
        },
    })

    return {
        work,
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
