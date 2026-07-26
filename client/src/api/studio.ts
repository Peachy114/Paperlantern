import api from './axios'

export const studioApi = {
    // ===================================Storyteller Work Management=======================================//
    getWorks: () => api.get('/studio/works'),
    createWork: (data: FormData) =>
        api.post('/studio/works', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateWork: (slug: string, data: FormData) =>
        api.post(`/studio/works/${slug}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    trashWork: (slug: string) => api.post(`/studio/works/${slug}/trash`),
    deleteWork: (slug: string) => api.delete(`/studio/works/${slug}`),
    getWork: (slug: string) => api.get(`/studio/works/${slug}`),
    getViewsChart: () => api.get('/studio/analytics/views'),

    // ===================================Storyteller Art Management=======================================//
    getArts: () => api.get('/studio/arts'),
    createArt: (data: FormData) =>
        api.post('/studio/arts', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateArt: (slug: string, data: FormData) =>
        api.post(`/studio/arts/${slug}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getArt: (slug: string) => api.get(`/studio/arts/${slug}`),
    trashArt: (slug: string) => api.delete(`/studio/arts/${slug}`),
    getTrashedArts: () => api.get('/studio/arts/trash'),
    restoreArt: (slug: string) => api.post(`/studio/arts/trash/${slug}/restore`),
    forceDeleteArt: (slug: string) => api.delete(`/studio/arts/trash/${slug}`),
    getShopItems: () => api.get('/studio/shop'),
    createShopItem: (data: FormData) =>
        api.post('/studio/shop', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateShopItem: (id: string, data: FormData) =>
        api.post(`/studio/shop/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteShopItem: (id: string) => api.delete(`/studio/shop/${id}`),
    getCommissionProfile: () => api.get('/studio/commissions/profile'),
    applyCommission: (data: { application_reason: string }) =>
        api.post('/studio/commissions/apply', data),
    updateCommissionProfile: (data: {
        commissions_enabled?: boolean
        commission_status?: 'open' | 'closed'
        terms?: string
        policies?: unknown
        request_forms?: unknown[]
        faqs?: unknown[]
        discounts?: unknown[]
        client_fields?: unknown
        flow_template?: unknown[]
    }) => api.patch('/studio/commissions/profile', data),
    createCommissionService: (data: FormData) =>
        api.post('/studio/commissions/services', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateCommissionService: (slug: string, data: FormData) =>
        api.post(`/studio/commissions/services/${slug}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteCommissionService: (slug: string) => api.delete(`/studio/commissions/services/${slug}`),
    updateCommissionOrder: (
        id: string,
        payload: { status: 'in_progress' | 'delivered' | 'cancelled' | 'disputed' }
    ) => api.patch(`/studio/commissions/orders/${id}`, payload),
    archiveCommissionOrder: (id: string) => api.post(`/studio/commissions/orders/${id}/archive`),
    quoteCommissionOrder: (
        id: string,
        payload: { quote_credits: number; quote_note?: string; flow?: unknown[] }
    ) => api.post(`/studio/commissions/orders/${id}/quote`, payload),
    advanceCommissionStage: (id: string, payload: { step_index: number; note?: string }) =>
        api.patch(`/studio/commissions/orders/${id}/stage`, payload),
    uploadCommissionDeliveryFile: (id: string, payload: FormData) =>
        api.post(`/studio/commissions/orders/${id}/delivery-files`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateCommissionRevision: (
        id: string,
        payload: { status: 'in_progress' | 'resolved' | 'rejected'; artist_response?: string }
    ) => api.patch(`/studio/commissions/revisions/${id}`, payload),
    appealCommissionRating: (id: string, appeal_reason: string) =>
        api.patch(`/studio/commissions/ratings/${id}/appeal`, { appeal_reason }),

    // ======================================Chapter Management===========================================//
    getChapters: (workSlug: string) => api.get(`/studio/works/${workSlug}/chapters`),
    createChapter: (workSlug: string, data: FormData) =>
        api.post(`/studio/works/${workSlug}/chapters`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getChapter: (workSlug: string, chapterSlug: string) =>
        api.get(`/studio/works/${workSlug}/chapters/${chapterSlug}`),
    updateChapter: (workSlug: string, chapterSlug: string, data: FormData) =>
        api.post(`/studio/works/${workSlug}/chapters/${chapterSlug}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    uploadChapterImages: (workSlug: string, chapterSlug: string, data: FormData) =>
        api.post(`/studio/works/${workSlug}/chapters/${chapterSlug}/images`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    trashChapter: (workSlug: string, chapterSlug: string) =>
        api.post(`/studio/works/${workSlug}/chapters/${chapterSlug}/trash`),
    deleteChapter: (workSlug: string, chapterSlug: string) =>
        api.delete(`/studio/works/${workSlug}/chapters/${chapterSlug}`),

    //========================STUDIO TRASH==============================//
    getTrashedWorks: () => api.get('/studio/trash/works'),
    restoreWork: (slug: string) => api.post(`/studio/trash/works/${slug}/restore`),
    forceDeleteWork: (slug: string) => api.delete(`/studio/trash/works/${slug}`),

    // Trash — Chapters
    getTrashedChapters: () => api.get('/studio/trash/chapters'),
    restoreChapter: (slug: string) => api.post(`/studio/trash/chapters/${slug}/restore`),
    forceDeleteChapter: (slug: string) => api.delete(`/studio/trash/chapters/${slug}`),
}
