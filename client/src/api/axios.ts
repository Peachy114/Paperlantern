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
        if (error.response?.status === 422 && error.response?.data?.errors) {
            window.dispatchEvent(new CustomEvent('api-validation-error', {
                detail: error.response.data.errors,
            }))
        }
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth()
        }
        return Promise.reject(error)
    }
)

export default api
