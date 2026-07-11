import api from './axios'

export const stickersApi = {
    index: () => api.get('/artist-profile/stickers'),
    create: (data: FormData) =>
        api.post('/artist-profile/stickers', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    delete: (id: string) => api.delete(`/artist-profile/stickers/${id}`),
}
