import api from './axios'
import type { Art } from '@/types/art'
import type { ProfileBorder } from '@/types/artistProfile'

export const adminArtsApi = {
    list: () => api.get<Art[]>('/admin/arts'),
    create: (data: FormData) =>
        api.post('/admin/arts', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    reorder: (artIds: string[]) => api.post('/admin/arts/reorder', { art_ids: artIds }),
    featureArtist: (username: string, days: number) =>
        api.post('/admin/featured-artists', { username, days }),
    profileBorders: () => api.get<ProfileBorder[]>('/admin/profile-borders'),
    createProfileBorder: (data: FormData) =>
        api.post('/admin/profile-borders', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteProfileBorder: (id: string) => api.delete(`/admin/profile-borders/${id}`),
}
