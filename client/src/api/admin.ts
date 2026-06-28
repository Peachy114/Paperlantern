import api from './axios'

export const adminApi = {
    getDashboard: () => api.get('/admin/dashboard'),

    getUsers: () => api.get('/admin/users'),
    getUser: (id: string) => api.get(`/admin/users/${id}`),
    banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
    unbanUser: (id: string) => api.put(`/admin/users/${id}/unban`),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    deleteWork: (id: string, notes?: string) =>
        api.delete(`/admin/works/${id}`, { data: { notes } }),

    viewChapter: (id: string) => api.get(`/admin/chapters/${id}`),
    deleteChapter: (id: string, notes?: string) =>
        api.delete(`/admin/chapters/${id}`, { data: { notes } }),

    getLogs: (page = 1) => api.get(`/admin/logs?page=${page}`),
}
