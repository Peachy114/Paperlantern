// utils/storage.ts
//Backend Storage URL Helper
// utils/storage.ts
const STORAGE_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:8000/storage'
    : 'https://laterncomix.com/storage'

export const storageUrl = (path: string | null, variant?: 'sm') => {
    if (!path) return null
    const finalPath = variant === 'sm' ? path.replace(/(\.[^.]+)$/, '_sm$1') : path
    return `${STORAGE_URL}/${finalPath}`
}
