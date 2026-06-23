import api from './axios'

export const authApi = {
    register: (data: {
        name: string
        username: string
        email: string
        password: string
        password_confirmation: string
        role: 'wanderer' | 'storyteller'
    }) => api.post('/auth/register', data),

    login: (data: { login: string; password: string }) => api.post('/auth/login', data),

    logout: () => api.post('/auth/logout'),

    me: () => api.get('/auth/me'),

    updatePreferences: (dark_mode: boolean) => api.patch('/user/preferences', { dark_mode }),
}
