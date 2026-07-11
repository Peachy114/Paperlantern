import api from './axios'

export const publicApi = {
    getWork: (slug: string) => api.get(`/public/works/${slug}`),
    getWorkEngagement: (slug: string) => api.get(`/public/works/${slug}/engagement-status`),
    toggleWorkLike: (slug: string) => api.post(`/public/works/${slug}/like`),
    toggleWorkFavorite: (slug: string) => api.post(`/public/works/${slug}/favorite`),
    getChapters: (slug: string) => api.get(`/public/works/${slug}/chapters`),
    getChapter: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}`),

    getLikeStatus: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}/like-status`),
    toggleLike: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/like`),
    recordView: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/view`),
    getArts: (params?: URLSearchParams) =>
        api.get(`/public/arts${params ? `?${params.toString()}` : ''}`),
    getArtTags: (q = '') => api.get(`/public/arts/tags${q ? `?q=${encodeURIComponent(q)}` : ''}`),
}
