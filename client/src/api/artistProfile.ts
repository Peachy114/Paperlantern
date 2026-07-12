import api from './axios'

export const artistProfileApi = {
    show: (username: string) => api.get(`/public/artists/${username}`),
    updateHeader: (data: FormData) =>
        api.post('/artist-profile/header', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    createBlock: (data: FormData) =>
        api.post('/artist-profile/blocks', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateBlock: (id: string, data: FormData) =>
        api.post(`/artist-profile/blocks/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteBlock: (id: string) => api.delete(`/artist-profile/blocks/${id}`),
    reorderBlocks: (blocks: { id: string; sort_order: number }[]) =>
        api.post('/artist-profile/blocks/reorder', { blocks }),
    createSticker: (data: FormData) =>
        api.post('/artist-profile/stickers', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteSticker: (id: string) => api.delete(`/artist-profile/stickers/${id}`),
    createBorder: (data: FormData) =>
        api.post('/artist-profile/borders', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteBorder: (id: string) => api.delete(`/artist-profile/borders/${id}`),
}
