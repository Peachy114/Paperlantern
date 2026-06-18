import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'
import { useState } from 'react'
import type { StickyNoteDetail } from '@/types/moderation'

export function useAdminModerationShowStickyNote(noteId: number) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [showViolateForm, setShowViolateForm] = useState(false)

  const queryKey = ['admin-moderation', 'stickyNote', noteId]

  const { data: note } = useSuspenseQuery<StickyNoteDetail>({
    queryKey,
    queryFn: () => moderationApi.getStickyNote(noteId).then(r => r.data),
  })

  const approve = useMutation({
    mutationFn: () => moderationApi.approveStickyNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const violate = useMutation({
    mutationFn: () => moderationApi.violateStickyNote(noteId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })
      queryClient.invalidateQueries({ queryKey })
      setShowViolateForm(false)
      setReason('')
    },
  })

  return {
    note,
    reason, setReason,
    showViolateForm, setShowViolateForm,
    approve:   () => approve.mutate(),
    violate:   () => violate.mutate(),
    approving: approve.isPending,
    violating: violate.isPending,
    result:    approve.data?.data ?? violate.data?.data ?? null,
  }
}