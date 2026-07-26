import api from './axios'

export interface Announcement {
    id: string
    created_by: string
    title: string
    content: string
    tag: 'event' | 'update' | 'reminder'
    is_event?: boolean
    audience: 'public' | 'artist' | 'studio'
    page_targets?: string[] | null
    placement?: 'banner' | 'hero' | 'both'
    is_public?: boolean
    image: string | null
    is_pinned: boolean
    is_featured?: boolean
    rotation_seconds?: number | null
    created_at: string
    updated_at: string
    creator?: {
        id: string
        name: string
        username: string
    }
}

export interface AnnouncementPayload {
    title: string
    content: string
    tag: 'event' | 'update' | 'reminder'
    is_event?: boolean
    audience: 'public' | 'artist' | 'studio'
    page_targets?: string[]
    placement?: 'banner' | 'hero' | 'both'
    is_public?: boolean
    image?: File | null
    is_pinned?: boolean
    rotation_seconds?: number | null
}

export const announcementApi = {
    // Admin
    getAll: () => api.get('/admin/announcements'),

    create: (payload: AnnouncementPayload) => {
        const form = new FormData()
        form.append('title', payload.title)
        form.append('content', payload.content)
        form.append('tag', payload.tag)
        form.append('is_event', payload.is_event ? '1' : '0')
        form.append('audience', payload.audience)
        form.append('is_pinned', payload.is_pinned ? '1' : '0')
        form.append('is_public', payload.is_public === false ? '0' : '1')
        form.append('placement', payload.placement ?? 'banner')
        ;(payload.page_targets ?? []).forEach((page) => form.append('page_targets[]', page))
        if (payload.rotation_seconds !== undefined && payload.rotation_seconds !== null) {
            form.append('rotation_seconds', String(payload.rotation_seconds))
        }
        if (payload.image) form.append('image', payload.image)
        return api.post('/admin/announcements', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    update: (id: string, payload: Partial<AnnouncementPayload>) => {
        const form = new FormData()
        if (payload.title) form.append('title', payload.title)
        if (payload.content) form.append('content', payload.content)
        if (payload.tag) form.append('tag', payload.tag)
        if (payload.is_event !== undefined) form.append('is_event', payload.is_event ? '1' : '0')
        if (payload.audience) form.append('audience', payload.audience)
        if (payload.is_pinned !== undefined) form.append('is_pinned', payload.is_pinned ? '1' : '0')
        if (payload.is_public !== undefined) form.append('is_public', payload.is_public ? '1' : '0')
        if (payload.placement) form.append('placement', payload.placement)
        if (payload.page_targets) {
            payload.page_targets.forEach((page) => form.append('page_targets[]', page))
        }
        if (payload.rotation_seconds !== undefined && payload.rotation_seconds !== null) {
            form.append('rotation_seconds', String(payload.rotation_seconds))
        }
        if (payload.image) form.append('image', payload.image)
        form.append('_method', 'PUT')
        return api.post(`/admin/announcements/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    delete: (id: string) => api.delete(`/admin/announcements/${id}`),

    // Public
    getPublic: () => api.get('/public/announcements'),

    // Studio (storyteller)
    getStudio: () => api.get('/studio/announcements'),
}
