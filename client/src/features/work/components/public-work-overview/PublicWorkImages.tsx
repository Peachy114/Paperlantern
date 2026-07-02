export const getImageUrl = (
    baseUrl: string,
    imagePath: string | null,
    variant?: 'sm'
): string | null => {
    if (!imagePath) return null
    const finalPath = variant === 'sm' ? imagePath.replace(/(\.[^.]+)$/, '_sm$1') : imagePath
    return `${baseUrl}${finalPath}`
}
