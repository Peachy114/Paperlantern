import api from './axios'
import type { CommentSort, CommentTargetType, PublicComment, CommentPage, StickerStorePage } from '@/types/comment'
import type { ArtistSticker } from '@/types/artistProfile'

export const commentsApi = {
    index: (targetType: CommentTargetType, targetId: string, sort: CommentSort) =>
        api.get<CommentPage>(`/public/comments/${targetType}/${targetId}?sort=${sort}`),
    create: (
        targetType: CommentTargetType,
        targetId: string,
        payload: { body?: string; artist_sticker_id?: string | null }
    ) => api.post<PublicComment>(`/comments/${targetType}/${targetId}`, payload),
    superLike: (targetType: CommentTargetType, targetId: string) =>
        api.post<{
            message: string
            wallet_balance: number
            super_likes_count: number
            super_like_credits: number
        }>(`/super-likes/${targetType}/${targetId}`),
    stickerLibrary: () => api.get<{ data: ArtistSticker[] }>('/stickers/library'),
    artistStickers: (username: string) =>
        api.get<StickerStorePage>(`/public/artists/${username}/stickers`),
    subscribeSticker: (stickerId: string) => api.post<ArtistSticker>(`/stickers/${stickerId}/subscribe`),
    purchaseSticker: (stickerId: string) => api.post<ArtistSticker>(`/stickers/${stickerId}/purchase`),
}
