export const getImageUrl = (baseUrl: string, imagePath: string | null): string | null => {
    if (!imagePath) return null
    return `${baseUrl}${imagePath}`
}

export const getResponsiveImageSrcSet = (baseUrl: string, imagePath: string) => {
    if (!imagePath) return ''
    return `${baseUrl}${imagePath}?w=400 400w, ${baseUrl}${imagePath}?w=800 800w`
}
