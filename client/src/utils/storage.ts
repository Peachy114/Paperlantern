// utils/storage.ts
//Backend Storage URL Helper
// utils/storage.ts
const STORAGE_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:8000/storage'
    : 'https://laterncomix.com/storage'

export const storageUrl = (path: string | null, variant?: 'sm') => {
    if (!path) return null
    if (/^(https?:|data:|blob:)/i.test(path)) return path

    const cleanPath = path.replace(/^\/+/, '')
    if (cleanPath.startsWith('storage/')) {
        return `${STORAGE_URL.replace(/\/storage$/, '')}/${cleanPath}`
    }

    const finalPath = variant === 'sm' ? cleanPath.replace(/(\.[^.]+)$/, '_sm$1') : cleanPath
    return `${STORAGE_URL}/${finalPath}`
}
