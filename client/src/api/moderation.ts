import api from './axios'

export const moderationApi = {
    getQueue: () => api.get('/admin/moderation'),
    getViolations: () => api.get('/admin/moderation/violations'),
    getUserViolations: (userId: string) => api.get(`/admin/moderation/users/${userId}/violations`),

    getChapter: (chapterSlug: string) => api.get(`/admin/moderation/chapters/${chapterSlug}`),
    approveChapter: (chapterSlug: string) =>
        api.put(`/admin/moderation/chapters/${chapterSlug}/approve`),
    violateChapter: (chapterSlug: string, reason: string) =>
        api.put(`/admin/moderation/chapters/${chapterSlug}/violate`, { reason }),

    getWork: (workSlug: string) => api.get(`/admin/moderation/works/${workSlug}`),
    approveWork: (workSlug: string) => api.put(`/admin/moderation/works/${workSlug}/approve`),
    violateWork: (workSlug: string, reason: string) =>
        api.put(`/admin/moderation/works/${workSlug}/violate`, { reason }),

    getStickyNote: (id: string) => api.get(`/admin/moderation/sticky-notes/${id}`),
    approveStickyNote: (id: string) => api.put(`/admin/moderation/sticky-notes/${id}/approve`),
    violateStickyNote: (id: string, reason: string) =>
        api.put(`/admin/moderation/sticky-notes/${id}/violate`, { reason }),
    suspendContent: (type: string, id: string, reason: string, field?: string | null) =>
        api.post(`/admin/moderation/content/${type}/${id}/suspend`, { reason, field }),
    restoreSuspension: (id: string) => api.put(`/admin/moderation/suspensions/${id}/restore`),
    approveCommentImage: (commentId: string) =>
        api.put(`/admin/moderation/comments/${commentId}/image/approve`),
    suspendCommentImage: (commentId: string, reason: string) =>
        api.put(`/admin/moderation/comments/${commentId}/image/suspend`, { reason }),
    approveCommissionMessageImage: (messageId: string) =>
        api.put(`/admin/moderation/commission-messages/${messageId}/image/approve`),
    suspendCommissionMessageImage: (messageId: string, reason: string) =>
        api.put(`/admin/moderation/commission-messages/${messageId}/image/suspend`, { reason }),
    approveCommissionDeliveryFile: (fileId: string) =>
        api.put(`/admin/moderation/commission-delivery-files/${fileId}/approve`),
    suspendCommissionDeliveryFile: (fileId: string, reason: string) =>
        api.put(`/admin/moderation/commission-delivery-files/${fileId}/suspend`, { reason }),
}
