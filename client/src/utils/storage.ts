// utils/storage.ts
//Backend Storage URL Helper
// utils/storage.ts
const STORAGE_URL = import.meta.env.DEV
    ? '/storage'
    : 'https://laterncomix.com/storage'

export const storageUrl = (path: string | null, variant?: 'sm') => {
    if (!path) return null

    // Keep local storage on the Vite origin in development. Besides making URLs
    // consistent, this lets canvas-based image tools inspect pixels without CORS
    // blocking animated profile backgrounds served by Laravel.
    if (import.meta.env.DEV && /^https?:\/\/(?:127\.0\.0\.1|localhost):8000\/storage\//i.test(path)) {
        const localStoragePath = new URL(path).pathname
        return variant === 'sm'
            ? localStoragePath.replace(/(\.[^.]+)$/, '_sm$1')
            : localStoragePath
    }

    if (/^(https?:|data:|blob:)/i.test(path)) return path

    const cleanPath = path.replace(/^\/+/, '')
    if (cleanPath.startsWith('storage/')) {
        return `${STORAGE_URL.replace(/\/storage$/, '')}/${cleanPath}`
    }

    const finalPath = variant === 'sm' ? cleanPath.replace(/(\.[^.]+)$/, '_sm$1') : cleanPath
    return `${STORAGE_URL}/${finalPath}`
}
