import api from './axios'
import type { Art } from '@/types/art'
import type { ArtistSticker, ProfileBorder, RoyaltyDesignAsset, RoyaltyDesignType } from '@/types/artistProfile'

export interface ArtWatermark {
    id: string
    name: string
    image_path: string
    target: WatermarkTarget
    position: WatermarkPosition
    offset_x: number
    offset_y: number
    width_percent: number
    opacity: number
    rotation: number
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface ArtWatermarkSettings {
    id: number
    noise_enabled: boolean
    noise_opacity: number
    noise_density: number
}

export type WatermarkTarget = 'arts' | 'messages' | 'final_delivery'

export type WatermarkPosition =
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right'

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
    stickers: () => api.get<{ data: ArtistSticker[] }>('/admin/stickers'),
    createSticker: (data: FormData) =>
        api.post('/admin/stickers', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteSticker: (id: string) => api.delete(`/admin/stickers/${id}`),
    royaltyDesigns: (type: RoyaltyDesignType) =>
        api.get<{ data: RoyaltyDesignAsset[] }>(`/admin/royalty-designs/${type}`),
    createRoyaltyDesign: (data: FormData) =>
        api.post('/admin/royalty-designs', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteRoyaltyDesign: (id: string) => api.delete(`/admin/royalty-designs/${id}`),
    watermarks: () =>
        api.get<{ watermarks: ArtWatermark[]; settings: ArtWatermarkSettings }>(
            '/admin/art-watermarks'
        ),
    createWatermark: (data: FormData) =>
        api.post('/admin/art-watermarks', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateWatermark: (id: string, data: FormData) =>
        api.post(`/admin/art-watermarks/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteWatermark: (id: string) => api.delete(`/admin/art-watermarks/${id}`),
    updateWatermarkSettings: (settings: ArtWatermarkSettings) =>
        api.put('/admin/art-watermark-settings', settings),
}
