import api from './axios'

export const moderationApi = {
    getQueue: () => api.get('/admin/moderation'),
    getViolations: () => api.get('/admin/moderation/violations'),
    getUserViolations: (userId: number) => api.get(`/admin/moderation/users/${userId}/violations`),

    // Chapters — just chapterSlug
    getChapter: (chapterSlug: string) => api.get(`/admin/moderation/chapters/${chapterSlug}`),
    approveChapter: (chapterSlug: string) =>
        api.put(`/admin/moderation/chapters/${chapterSlug}/approve`),
    violateChapter: (chapterSlug: string, reason: string) =>
        api.put(`/admin/moderation/chapters/${chapterSlug}/violate`, { reason }),

    // Works — just workSlug
    getWork: (workSlug: string) => api.get(`/admin/moderation/works/${workSlug}`),
    approveWork: (workSlug: string) => api.put(`/admin/moderation/works/${workSlug}/approve`),
    violateWork: (workSlug: string, reason: string) =>
        api.put(`/admin/moderation/works/${workSlug}/violate`, { reason }),

    // Sticky Notes
    getStickyNote: (id: number) => api.get(`/admin/moderation/sticky-notes/${id}`),
    approveStickyNote: (id: number) => api.put(`/admin/moderation/sticky-notes/${id}/approve`),
    violateStickyNote: (id: number, reason: string) =>
        api.put(`/admin/moderation/sticky-notes/${id}/violate`, { reason }),
}
