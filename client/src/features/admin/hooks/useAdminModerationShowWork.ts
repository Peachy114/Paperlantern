import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { violationSchema, type ViolationFormData } from '../schemas/violationSchema'
import type { WorkDetail } from '@/types/moderation'

export function useAdminModerationShowWork(workSlug: string) {
    const queryClient = useQueryClient()
    const [showViolateForm, setShowViolateForm] = useState(false)

    const queryKey = ['admin-moderation', 'work', workSlug]

    const { data: work } = useSuspenseQuery<WorkDetail>({
        queryKey,
        queryFn: () => moderationApi.getWork(workSlug).then((r) => r.data),
    })

    const form = useForm<ViolationFormData>({
        resolver: yupResolver(violationSchema),
        defaultValues: { reason: '' },
    })

    const approve = useMutation({
        mutationFn: () => moderationApi.approveWork(workSlug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
            queryClient.invalidateQueries({ queryKey })
        },
    })

    const violate = useMutation({
        mutationFn: (data: ViolationFormData) => moderationApi.violateWork(workSlug, data.reason),
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
