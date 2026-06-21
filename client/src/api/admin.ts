import api from './axios'

export const adminApi = {
    // Dashboard
    getDashboard: () => api.get('/admin/dashboard'),

    // Users
    getUsers: () => api.get('/admin/users'),
    getUser: (id: number) => api.get(`/admin/users/${id}`),
    banUser: (id: number) => api.put(`/admin/users/${id}/ban`),
    unbanUser: (id: number) => api.put(`/admin/users/${id}/unban`),
    deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

    // Works
    deleteWork: (id: number, notes?: string) =>
        api.delete(`/admin/works/${id}`, { data: { notes } }),

    // Chapters
    viewChapter: (id: number) => api.get(`/admin/chapters/${id}`),
    deleteChapter: (id: number, notes?: string) =>
        api.delete(`/admin/chapters/${id}`, { data: { notes } }),

    // Logs
    getLogs: (page = 1) => api.get(`/admin/logs?page=${page}`),
}
