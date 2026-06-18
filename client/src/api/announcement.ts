import api from './axios'

export interface Announcement {
  id: number
  created_by: number
  title: string
  content: string
  tag: 'event' | 'update' | 'reminder'
  audience: 'public' | 'studio'
  image: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  creator?: {
    id: number
    name: string
    username: string
  }
}

export interface AnnouncementPayload {
  title: string
  content: string
  tag: 'event' | 'update' | 'reminder'
  audience: 'public' | 'studio'
  image?: File | null
  is_pinned?: boolean
}

export const announcementApi = {
  // Admin
  getAll: () =>
    api.get('/admin/announcements'),

  create: (payload: AnnouncementPayload) => {
    const form = new FormData()
    form.append('title',    payload.title)
    form.append('content',  payload.content)
    form.append('tag',      payload.tag)
    form.append('audience', payload.audience)
    form.append('is_pinned', payload.is_pinned ? '1' : '0')
    if (payload.image) form.append('image', payload.image)
    return api.post('/admin/announcements', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  update: (id: number, payload: Partial<AnnouncementPayload>) => {
    const form = new FormData()
    if (payload.title)    form.append('title',    payload.title)
    if (payload.content)  form.append('content',  payload.content)
    if (payload.tag)      form.append('tag',      payload.tag)
    if (payload.audience) form.append('audience', payload.audience)
    if (payload.is_pinned !== undefined) form.append('is_pinned', payload.is_pinned ? '1' : '0')
    if (payload.image)    form.append('image',    payload.image)
    form.append('_method', 'PUT')
    return api.post(`/admin/announcements/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: number) =>
    api.delete(`/admin/announcements/${id}`),

  // Public
  getPublic: () =>
    api.get('/public/announcements'),

  // Studio (storyteller)
  getStudio: () =>
    api.get('/studio/announcements'),
}