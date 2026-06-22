import api from './axios'

export const publicApi = {
    getWork: (slug: string) => api.get(`/public/works/${slug}`),
    getChapters: (slug: string) => api.get(`/public/works/${slug}/chapters`),
    getChapter: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}`),

    getLikeStatus: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}/like-status`),
    toggleLike: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/like`),
    recordView: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/view`),
}
