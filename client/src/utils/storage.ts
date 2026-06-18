// utils/storage.ts
//Backend Storage URL Helper
const STORAGE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8000/storage'
  : 'https://paperlantern.devorbitstudio.com/storage'

export const storageUrl = (path: string | null) =>
  path ? `${STORAGE_URL}/${path}` : null