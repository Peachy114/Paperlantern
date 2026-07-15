import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { moderationApi } from '@/api/moderation'

interface ModerationUser {
    id: string
    name: string
    username: string
    strike_count: number
    is_suspended?: boolean
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
    cover: string | null
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
    review: ModerationReview
}

interface ActiveSuspension {
    id: string
    target_type: string
    target_id: string
    target_field: string | null
    reason: string
    status: 'active' | 'restored'
    hidden_at: string | null
    user: ModerationUser
    ticket?: {
        id: string
        subject: string
        status: string
    } | null
}

interface ReviewArtImage {
    id: string
    image_path: string
    active_content_suspensions?: ActiveSuspension[]
}

interface ReviewArt {
    id: string
    slug: string
    title: string
    image_path: string | null
    created_at: string
    user: ModerationUser
    images: ReviewArtImage[]
    active_content_suspensions?: ActiveSuspension[]
}

interface ReviewProfileBlock {
    id: string
    type: 'image' | 'text'
    text_content?: string | null
    image_path?: string | null
    image_url?: string | null
    created_at: string
    user: ModerationUser
    active_content_suspensions?: ActiveSuspension[]
}

interface ReviewCommentImage {
    id: string
    body: string | null
    image_path: string
    image_moderation_status: string
    created_at: string
    user: ModerationUser
}

interface ReviewCommissionMessageImage {
    id: string
    body: string | null
    image_path: string
    image_moderation_status: string
    created_at: string
    sender: ModerationUser
    order?: {
        service?: {
            title: string
            slug: string
        } | null
    } | null
}

interface ReviewCommissionDeliveryFile {
    id: string
    file_path: string
    original_name: string | null
    mime_type: string | null
    size_bytes: number
    note: string | null
    moderation_status: string
    created_at: string
    uploader: ModerationUser
    order?: {
        service?: {
            title: string
            slug: string
        } | null
    } | null
}

interface ModerationReview {
    works: ModerationWorkItem[]
    chapters: ModerationChapter[]
    arts: ReviewArt[]
    profile_blocks: ReviewProfileBlock[]
    comment_images?: ReviewCommentImage[]
    commission_message_images?: ReviewCommissionMessageImage[]
    commission_delivery_files?: ReviewCommissionDeliveryFile[]
    active_suspensions: ActiveSuspension[]
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

    const suspendContent = useMutation({
        mutationFn: ({
            type,
            id,
            reason,
            field,
        }: {
            type: string
            id: string
            reason: string
            field?: string | null
        }) => moderationApi.suspendContent(type, id, reason, field),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    const restoreSuspension = useMutation({
        mutationFn: (id: string) => moderationApi.restoreSuspension(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    const approveCommentImage = useMutation({
        mutationFn: (id: string) => moderationApi.approveCommentImage(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          review: {
                              ...prev.review,
                              comment_images: (prev.review.comment_images ?? []).filter(
                                  (comment) => comment.id !== id
                              ),
                          },
                      }
                    : prev
            )
        },
    })

    const suspendCommentImage = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            moderationApi.suspendCommentImage(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    const approveCommissionMessageImage = useMutation({
        mutationFn: (id: string) => moderationApi.approveCommissionMessageImage(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          review: {
                              ...prev.review,
                              commission_message_images: (
                                  prev.review.commission_message_images ?? []
                              ).filter((message) => message.id !== id),
                          },
                      }
                    : prev
            )
        },
    })

    const suspendCommissionMessageImage = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            moderationApi.suspendCommissionMessageImage(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    const approveCommissionDeliveryFile = useMutation({
        mutationFn: (id: string) => moderationApi.approveCommissionDeliveryFile(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<ModerationQueue>(QUEUE_KEY, (prev) =>
                prev
                    ? {
                          ...prev,
                          review: {
                              ...prev.review,
                              commission_delivery_files: (
                                  prev.review.commission_delivery_files ?? []
                              ).filter((file) => file.id !== id),
                          },
                      }
                    : prev
            )
        },
    })

    const suspendCommissionDeliveryFile = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            moderationApi.suspendCommissionDeliveryFile(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
    })

    return {
        chapters: data.chapters,
        works: data.works,
        stickyNotes: data.sticky_notes,
        pendingCount: data.pending_count,
        review: data.review,

        approveChapter: (slug: string) => approveChapter.mutate(slug),
        violateChapter: (slug: string, reason: string) => violateChapter.mutate({ slug, reason }),
        approveWork: (slug: string) => approveWork.mutate(slug),
        violateWork: (slug: string, reason: string) => violateWork.mutate({ slug, reason }),

        // sticky notes unchanged (still by id)
        approveStickyNote: (id: string) => approveStickyNote.mutate(id),
        violateStickyNote: (id: string, reason: string) => violateStickyNote.mutate({ id, reason }),
        suspendContent: (type: string, id: string, reason: string, field?: string | null) =>
            suspendContent.mutate({ type, id, reason, field }),
        restoreSuspension: (id: string) => restoreSuspension.mutate(id),
        approveCommentImage: (id: string) => approveCommentImage.mutate(id),
        suspendCommentImage: (id: string, reason: string) =>
            suspendCommentImage.mutate({ id, reason }),
        approveCommissionMessageImage: (id: string) => approveCommissionMessageImage.mutate(id),
        suspendCommissionMessageImage: (id: string, reason: string) =>
            suspendCommissionMessageImage.mutate({ id, reason }),
        approveCommissionDeliveryFile: (id: string) => approveCommissionDeliveryFile.mutate(id),
        suspendCommissionDeliveryFile: (id: string, reason: string) =>
            suspendCommissionDeliveryFile.mutate({ id, reason }),

        approvingChapter: approveChapter.isPending ? approveChapter.variables : null,
        violatingChapter: violateChapter.isPending ? violateChapter.variables?.slug : null,
        approvingWork: approveWork.isPending ? approveWork.variables : null,
        violatingWork: violateWork.isPending ? violateWork.variables?.slug : null,
        approvingStickyNote: approveStickyNote.isPending ? approveStickyNote.variables : null,
        violatingStickyNote: violateStickyNote.isPending ? violateStickyNote.variables?.id : null,
        suspendingContent: suspendContent.isPending
            ? `${suspendContent.variables?.type}:${suspendContent.variables?.id}:${suspendContent.variables?.field ?? ''}`
            : null,
        restoringSuspension: restoreSuspension.isPending ? restoreSuspension.variables : null,
        approvingCommentImage: approveCommentImage.isPending ? approveCommentImage.variables : null,
        suspendingCommentImage: suspendCommentImage.isPending
            ? suspendCommentImage.variables?.id
            : null,
        approvingCommissionMessageImage: approveCommissionMessageImage.isPending
            ? approveCommissionMessageImage.variables
            : null,
        suspendingCommissionMessageImage: suspendCommissionMessageImage.isPending
            ? suspendCommissionMessageImage.variables?.id
            : null,
        approvingCommissionDeliveryFile: approveCommissionDeliveryFile.isPending
            ? approveCommissionDeliveryFile.variables
            : null,
        suspendingCommissionDeliveryFile: suspendCommissionDeliveryFile.isPending
            ? suspendCommissionDeliveryFile.variables?.id
            : null,
    }
}
