import api from './axios'

export const authApi = {
    register: (data: {
        name: string
        nickname?: string
        username: string
        email: string
        password: string
        password_confirmation: string
        role: 'wanderer' | 'storyteller'
        twitter_url?: string
        discord_url?: string
        instagram_url?: string
        tiktok_url?: string
    }) => api.post('/auth/register', data),

    login: (data: { login: string; password: string }) => api.post('/auth/login', data),

    logout: () => api.post('/auth/logout'),

    me: () => api.get('/auth/me'),

    updatePreferences: (dark_mode: boolean) => api.patch('/user/preferences', { dark_mode }),

    updateProfile: (data: FormData) =>
        api.post('/profile', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    updatePassword: (data: {
        current_password: string
        password: string
        password_confirmation: string
    }) => api.patch('/profile/password', data),
}
