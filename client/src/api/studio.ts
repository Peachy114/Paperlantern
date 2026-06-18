import api from './axios'

export const studioApi = {
    // Storyteller Work Management
    getWorks: () => api.get('/studio/works'),
    createWork: (data: FormData) => api.post('/studio/works', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateWork: (id: number, data: FormData) => api.post(`/studio/works/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteWork: (id: number) => api.delete(`/studio/works/${id}`),
    getWork: (id: number) => api.get(`/studio/works/${id}`),


    // Chapter Management
    getChapters: (workId: number) => api.get(`/studio/works/${workId}/chapters`),
    createChapter: (workId: number, data: FormData) => api.post(`/studio/works/${workId}/chapters`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getChapter: (workId: number, chapterId: number) => api.get(`/studio/works/${workId}/chapters/${chapterId}`),
    updateChapter: (workId: number, chapterId: number, data: FormData) =>
    api.post(`/studio/works/${workId}/chapters/${chapterId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteChapter: (workId: number, chapterId: number) => api.delete(`/studio/works/${workId}/chapters/${chapterId}`),
}