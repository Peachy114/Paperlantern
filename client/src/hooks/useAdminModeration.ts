import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'

interface ModerationUser {
  id: number
  name: string
  username: string
  strike_count: number
}

interface ModerationWork {
  id: number
  title: string
  cover: string | null
  type: string
  user: ModerationUser
}

interface ModerationChapter {
  id: number
  title: string
  order: number
  status: string
  moderation_status: string
  created_at: string
  work: ModerationWork
}

interface ModerationWorkItem {
  id: number
  title: string
  cover: string | null
  type: string
  status: string
  moderation_status: string
  created_at: string
  user: ModerationUser
}

interface ModerationStickyNote {
  id: number
  type: 'text' | 'image'
  text?: string
  color?: string
  moderation_status: string
  created_at: string
  user: ModerationUser
}

interface ModerationQueue {
  chapters:      ModerationChapter[]
  works:         ModerationWorkItem[]
  sticky_notes:  ModerationStickyNote[]
  pending_count: number
}

const QUEUE_KEY = ['admin-moderation-queue'] as const

function removeFromQueue<T extends { id: number }>(items: T[], id: number): T[] {
  return items.filter(item => item.id !== id)
}

export function useAdminModerationQueue() {
  const queryClient = useQueryClient()

  const { data } = useSuspenseQuery<ModerationQueue>({
    queryKey: QUEUE_KEY,
    queryFn: () => moderationApi.getQueue().then(r => r.data),
  })

  // --- Chapters ---
  const approveChapter = useMutation({
    mutationFn: (id: number) => moderationApi.approveChapter(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, chapters: removeFromQueue(prev.chapters, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const violateChapter = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => moderationApi.violateChapter(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, chapters: removeFromQueue(prev.chapters, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  // --- Works ---
  const approveWork = useMutation({
    mutationFn: (id: number) => moderationApi.approveWork(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, works: removeFromQueue(prev.works, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const violateWork = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => moderationApi.violateWork(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, works: removeFromQueue(prev.works, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  // --- Sticky Notes ---
  const approveStickyNote = useMutation({
    mutationFn: (id: number) => moderationApi.approveStickyNote(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, sticky_notes: removeFromQueue(prev.sticky_notes, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const violateStickyNote = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => moderationApi.violateStickyNote(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, prev =>
        prev ? { ...prev, pending_count: prev.pending_count - 1, sticky_notes: removeFromQueue(prev.sticky_notes, id) } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return {
    chapters:     data.chapters,
    works:        data.works,
    stickyNotes:  data.sticky_notes,
    pendingCount: data.pending_count,

    approveChapter:    (id: number) => approveChapter.mutate(id),
    violateChapter:    (id: number, reason: string) => violateChapter.mutate({ id, reason }),
    approveWork:       (id: number) => approveWork.mutate(id),
    violateWork:       (id: number, reason: string) => violateWork.mutate({ id, reason }),
    approveStickyNote: (id: number) => approveStickyNote.mutate(id),
    violateStickyNote: (id: number, reason: string) => violateStickyNote.mutate({ id, reason }),

    approvingChapter:    approveChapter.isPending    ? approveChapter.variables    : null,
    violatingChapter:    violateChapter.isPending    ? violateChapter.variables?.id : null,
    approvingWork:       approveWork.isPending       ? approveWork.variables       : null,
    violatingWork:       violateWork.isPending       ? violateWork.variables?.id   : null,
    approvingStickyNote: approveStickyNote.isPending ? approveStickyNote.variables : null,
    violatingStickyNote: violateStickyNote.isPending ? violateStickyNote.variables?.id : null,
  }
}