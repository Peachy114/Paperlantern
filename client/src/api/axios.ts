import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
    baseURL: import.meta.env.PROD
        ? import.meta.env.VITE_API_URL_PROD
        : import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth()
        }
        if (error.response?.status === 403) {
            useAuthStore.getState().clearAuth()
            // optional: redirect to a banned page
            // window.location.href = '/banned'
        }
        return Promise.reject(error)
    }
)

export default api
