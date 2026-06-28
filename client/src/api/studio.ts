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
