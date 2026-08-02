import api from './axios'

function logStickerOwnership(responseData: any): void {
    const stickers = Array.isArray(responseData?.stickers)
        ? responseData.stickers
        : Array.isArray(responseData?.stickers?.data)
          ? responseData.stickers.data
          : []

    console.group('[Public Shop] Sticker ownership')
    console.log('Full shop response:', responseData)

    if (stickers.length === 0) {
        console.warn('No stickers found in the shop response.')
        console.groupEnd()
        return
    }

    console.table(
        stickers.map((sticker: any) => ({
            id: sticker.id,
            name: sticker.name,
            owned: Boolean(sticker.owned),
            can_use: Boolean(sticker.can_use),
            is_free: Boolean(sticker.is_free),
            credit_cost: sticker.credit_cost,
            owner_user_id: sticker.user_id,
        }))
    )

    console.groupEnd()
}

export const publicApi = {
    // ======================================================
    // Homepage
    // ======================================================

    getHome: () => api.get('/public/home'),

    // ======================================================
    // Works / Comics / Novels
    // ======================================================

    getWork: (slug: string) => api.get(`/public/works/${slug}`),

    getWorkEngagement: (slug: string) => api.get(`/public/works/${slug}/engagement-status`),

    toggleWorkLike: (slug: string) => api.post(`/public/works/${slug}/like`),

    toggleWorkFavorite: (slug: string) => api.post(`/public/works/${slug}/favorite`),

    getChapters: (slug: string) => api.get(`/public/works/${slug}/chapters`),

    getChapter: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}`),

    getLikeStatus: (slug: string, chapterSlug: string) =>
        api.get(`/public/works/${slug}/chapters/${chapterSlug}/like-status`),

    toggleLike: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/like`),

    recordView: (slug: string, chapterSlug: string) =>
        api.post(`/public/works/${slug}/chapters/${chapterSlug}/view`),

    // ======================================================
    // Arts / Shop
    // ======================================================

    getArts: (params?: URLSearchParams) =>
        api.get(`/public/arts${params ? `?${params.toString()}` : ''}`),

    getArt: (identifier: string) => api.get(`/public/arts/${encodeURIComponent(identifier)}`),

    getArtTags: (q = '') => api.get(`/public/arts/tags${q ? `?q=${encodeURIComponent(q)}` : ''}`),

    getShop: async (params?: URLSearchParams) => {
        const response = await api.get(`/public/shop${params ? `?${params.toString()}` : ''}`)

        logStickerOwnership(response.data)

        return response
    },

    purchaseShopDownload: (shopItemId: string) => api.post(`/public/shop/${shopItemId}/purchase`),

    rateShopItem: (shopItemId: string, data: { rating: number; comment?: string }) =>
        api.post(`/public/shop/${shopItemId}/rating`, data),

    downloadShopItem: (shopItemId: string) =>
        api.get(`/public/shop/${shopItemId}/download`, {
            responseType: 'blob',
        }),

    recordArtView: (artId: string) => api.post(`/public/arts/${artId}/view`),

    toggleArtLike: (artId: string) => api.post(`/public/arts/${artId}/like`),

    purchaseArtDownload: (artId: string) => api.post(`/public/arts/${artId}/download/purchase`),

    downloadArt: (artId: string, imageId?: string) =>
        api.get(`/public/arts/${artId}/download`, {
            params: imageId ? { image_id: imageId } : undefined,
            responseType: 'blob',
        }),

    // ======================================================
    // Commissions
    // ======================================================

    getCommissions: (params?: URLSearchParams) =>
        api.get(`/public/commissions${params ? `?${params.toString()}` : ''}`),

    getCommission: (slug: string) => api.get(`/public/commissions/${slug}`),

    requestCommission: (
        slug: string,
        payload:
            | FormData
            | {
                  request_message: string
                  reference_notes?: string
                  agree_to_flow: boolean
              }
    ) =>
        api.post(
            `/public/commissions/${slug}/request`,
            payload,
            payload instanceof FormData
                ? {
                      headers: {
                          'Content-Type': 'multipart/form-data',
                      },
                  }
                : undefined
        ),
}
