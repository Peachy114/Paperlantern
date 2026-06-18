import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import type { WorkDetail } from '@/types/moderation'

export function useAdminModerationShowWork(workId: number) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [showViolateForm, setShowViolateForm] = useState(false)

  const queryKey = ['admin-moderation', 'work', workId]

  const { data: work } = useSuspenseQuery<WorkDetail>({
    queryKey,
    queryFn: () => moderationApi.getWork(workId).then(r => r.data),
  })

  const approve = useMutation({
    mutationFn: () => moderationApi.approveWork(workId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const violate = useMutation({
    mutationFn: () => moderationApi.violateWork(workId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
      queryClient.invalidateQueries({ queryKey })
      setShowViolateForm(false)
      setReason('')
    },
  })

  return {
    work,
    reason, setReason,
    showViolateForm, setShowViolateForm,
    approve:   () => approve.mutate(),
    violate:   () => violate.mutate(),
    approving: approve.isPending,
    violating: violate.isPending,
    result:    approve.data?.data ?? violate.data?.data ?? null,
  }
}