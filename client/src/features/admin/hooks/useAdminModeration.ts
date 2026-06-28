import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'

interface ModerationUser {
    id: string
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
    slug: string
    title: string
    order: number
    status: string
    moderation_status: string
    created_at: string
    work: ModerationWork
}

interface ModerationWorkItem {
    id: number
    slug: string
    title: string
    cover: string | null
    type: string
    status: string
    moderation_status: string
    created_at: string
    user: ModerationUser
}

interface ModerationStickyNote {
    id: string
    type: 'text' | 'image'
    text?: string
    color?: string
    moderation_status: string
    created_at: string
    user: ModerationUser
}

interface ModerationQueue {
    chapters: ModerationChapter[]
    works: ModerationWorkItem[]
    sticky_notes: ModerationStickyNote[]
    pending_count: number
}

const QUEUE_KEY = ['admin-moderation-queue'] as const

function removeFromQueue<T extends { id: string }>(items: T[], id: string): T[] {
    return items.filter((item) => item.id !== id)
}

export function useAdminModerationQueue() {
    const queryClient = useQueryClient()

    const { data } = useSuspenseQuery<ModerationQueue>({
        queryKey: QUEUE_KEY,
        queryFn: () => moderationApi.getQueue().then((r) => r.data),
    })

    // --- Chapters ---
    const approveChapter = useMutation({
        mutationFn: (slug: string) => moderationApi.approveChapter(slug),
        onSuccess: (_, slug) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          chapters: prev.chapters.filter((c) => c.slug !== slug),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
        },
    })

    const violateChapter = useMutation({
        mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
            moderationApi.violateChapter(slug, reason),
        onSuccess: (_, { slug }) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          chapters: prev.chapters.filter((c) => c.slug !== slug),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    // --- Works ---
    const approveWork = useMutation({
        mutationFn: (slug: string) => moderationApi.approveWork(slug),
        onSuccess: (_, slug) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          works: prev.works.filter((w) => w.slug !== slug),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
        },
    })

    const violateWork = useMutation({
        mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
            moderationApi.violateWork(slug, reason),
        onSuccess: (_, { slug }) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          works: prev.works.filter((w) => w.slug !== slug),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    // --- Sticky Notes ---
    const approveStickyNote = useMutation({
        mutationFn: (id: string) => moderationApi.approveStickyNote(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          sticky_notes: removeFromQueue(prev.sticky_notes, id),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
        },
    })

    const violateStickyNote = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            moderationApi.violateStickyNote(id, reason),
        onSuccess: (_, { id }) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          pending_count: prev.pending_count - 1,
                          sticky_notes: removeFromQueue(prev.sticky_notes, id),
                      }
                    : prev
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    return {
        chapters: data.chapters,
        works: data.works,
        stickyNotes: data.sticky_notes,
        pendingCount: data.pending_count,

        approveChapter: (slug: string) => approveChapter.mutate(slug),
        violateChapter: (slug: string, reason: string) => violateChapter.mutate({ slug, reason }),
        approveWork: (slug: string) => approveWork.mutate(slug),
        violateWork: (slug: string, reason: string) => violateWork.mutate({ slug, reason }),

        // sticky notes unchanged (still by id)
        approveStickyNote: (id: string) => approveStickyNote.mutate(id),
        violateStickyNote: (id: string, reason: string) => violateStickyNote.mutate({ id, reason }),

        approvingChapter: approveChapter.isPending ? approveChapter.variables : null,
        violatingChapter: violateChapter.isPending ? violateChapter.variables?.slug : null,
        approvingWork: approveWork.isPending ? approveWork.variables : null,
        violatingWork: violateWork.isPending ? violateWork.variables?.slug : null,
        approvingStickyNote: approveStickyNote.isPending ? approveStickyNote.variables : null,
        violatingStickyNote: violateStickyNote.isPending ? violateStickyNote.variables?.id : null,
    }
}
