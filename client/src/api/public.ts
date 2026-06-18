import api from './axios'

export const publicApi = {
  getWork: (workId: number) => api.get(`/public/works/${workId}`),
  getChapters: (workId: number) => api.get(`/public/works/${workId}/chapters`),
  getChapter: (workId: number, chapterId: number) =>
    api.get(`/public/works/${workId}/chapters/${chapterId}`),

  getLikeStatus: (workId: number, chapterId: number) =>
    api.get(`/public/works/${workId}/chapters/${chapterId}/like-status`),
  toggleLike: (workId: number, chapterId: number) =>
    api.post(`/public/works/${workId}/chapters/${chapterId}/like`),
  recordView: (workId: number, chapterId: number) =>
    api.post(`/public/works/${workId}/chapters/${chapterId}/view`),
}