export function responseFileName(response: any, fallback: string) {
    const disposition = response?.headers?.['content-disposition'] as string | undefined
    const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    if (!match?.[1]) return fallback

    try {
        return decodeURIComponent(match[1].replace(/"/g, ''))
    } catch {
        return match[1].replace(/"/g, '') || fallback
    }
}