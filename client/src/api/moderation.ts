import api from './axios'

export const moderationApi = {
  // Admin
  getQueue:          ()                             => api.get('/admin/moderation'),
  getViolations:     ()                             => api.get('/admin/moderation/violations'),
  getUserViolations: (userId: number)               => api.get(`/admin/moderation/users/${userId}/violations`),

  // Chapters
  getChapter:        (id: number)                   => api.get(`/admin/moderation/chapters/${id}`),
  approveChapter:    (id: number)                   => api.put(`/admin/moderation/chapters/${id}/approve`),
  violateChapter:    (id: number, reason: string)   => api.put(`/admin/moderation/chapters/${id}/violate`, { reason }),

  // Works
  getWork:           (id: number)                   => api.get(`/admin/moderation/works/${id}`),
  approveWork:       (id: number)                   => api.put(`/admin/moderation/works/${id}/approve`),
  violateWork:       (id: number, reason: string)   => api.put(`/admin/moderation/works/${id}/violate`, { reason }),

  // Sticky Notes
  getStickyNote:     (id: number)                   => api.get(`/admin/moderation/sticky-notes/${id}`),
  approveStickyNote: (id: number)                   => api.put(`/admin/moderation/sticky-notes/${id}/approve`),
  violateStickyNote: (id: number, reason: string)   => api.put(`/admin/moderation/sticky-notes/${id}/violate`, { reason }),
}