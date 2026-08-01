export function sampleHeroImage(label: string, from = '#56b6ff', to = '#ff8a00') {
    const safeLabel = label.replace(/[<>&"']/g, '')

    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1280" height="720" rx="56" fill="url(#g)"/><circle cx="1000" cy="180" r="130" fill="rgba(255,255,255,.28)"/><circle cx="210" cy="560" r="180" fill="rgba(255,255,255,.18)"/><text x="50%" y="50%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="74" font-weight="800" fill="white">${safeLabel}</text><text x="50%" y="60%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="30" fill="rgba(255,255,255,.82)">Preview sample</text></svg>`
    )}`
}