// utils/storage.ts
//Backend Storage URL Helper
export const storageUrl = (path: string | null) =>
  path ? `https://paperlantern.devorbitstudio.com/storage/${path}` : null