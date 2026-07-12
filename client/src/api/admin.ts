import api from './axios'

export const adminApi = {
    getDashboard: () => api.get('/admin/dashboard'),

    getUsers: () => api.get('/admin/users'),
    getUser: (id: string) => api.get(`/admin/users/${id}`),
    banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
    unbanUser: (id: string) => api.put(`/admin/users/${id}/unban`),
    updateArtistVerification: (id: string, artistVerified: boolean) =>
        api.patch(`/admin/users/${id}/artist-verification`, { artist_verified: artistVerified }),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    deleteWork: (id: string, notes?: string) =>
        api.delete(`/admin/works/${id}`, { data: { notes } }),

    viewChapter: (id: string) => api.get(`/admin/chapters/${id}`),
    deleteChapter: (id: string, notes?: string) =>
        api.delete(`/admin/chapters/${id}`, { data: { notes } }),

    getLogs: (page = 1) => api.get(`/admin/logs?page=${page}`),
    getSuperLikeAwards: () => api.get('/admin/super-like-awards'),
    createSuperLikeAward: (payload: {
        name: string
        icon: string
        credit_cost: number
        is_active: boolean
        sort_order?: number
    }) => api.post('/admin/super-like-awards', payload),
    updateSuperLikeAward: (
        id: string,
        payload: {
            name: string
            icon: string
            credit_cost: number
            is_active: boolean
            sort_order?: number
        }
    ) => api.put(`/admin/super-like-awards/${id}`, payload),
    deleteSuperLikeAward: (id: string) => api.delete(`/admin/super-like-awards/${id}`),
}
