import api from './axios'
import type {
    CommentSort,
    CommentTargetType,
    PublicComment,
    CommentPage,
    StickerStorePage,
    SuperLikeAward,
} from '@/types/comment'
import type { ArtistSticker } from '@/types/artistProfile'

export const commentsApi = {
    index: (targetType: CommentTargetType, targetId: string, sort: CommentSort) =>
        api.get<CommentPage>(`/public/comments/${targetType}/${targetId}?sort=${sort}`),
    create: (
        targetType: CommentTargetType,
        targetId: string,
        payload: FormData | {
            body?: string
            artist_sticker_id?: string | null
            parent_id?: string | null
            reaction_emoji?: string | null
            gif_url?: string | null
            image_url?: string | null
            is_spoiler?: boolean
        }
    ) =>
        api.post<PublicComment>(
            `/comments/${targetType}/${targetId}`,
            payload,
            payload instanceof FormData
                ? { headers: { 'Content-Type': 'multipart/form-data' } }
                : undefined
        ),
    pin: (commentId: string, isPinned: boolean) =>
        api.patch<PublicComment>(`/comments/${commentId}/pin`, { is_pinned: isPinned }),
    like: (commentId: string) =>
        api.post<{ liked: boolean; likes_count: number }>(`/comments/${commentId}/like`),
    remove: (commentId: string) => api.delete<{ message: string }>(`/comments/${commentId}`),
    report: (commentId: string, payload: { reason: string; details?: string }) =>
        api.post<{ message: string; support_number: string; ticket_id: string }>(
            `/comments/${commentId}/report`,
            payload
        ),
    awards: () => api.get<{ data: SuperLikeAward[] }>('/public/super-like-awards'),
    superLike: (targetType: CommentTargetType, targetId: string, awardId?: string | null) =>
        api.post<{
            message: string
            wallet_balance: number
            super_likes_count: number
            super_like_credits: number
            award?: SuperLikeAward
        }>(`/super-likes/${targetType}/${targetId}`, { award_id: awardId }),
    stickerLibrary: () => api.get<{ data: ArtistSticker[] }>('/stickers/library'),
    artistStickers: (username: string) =>
        api.get<StickerStorePage>(`/public/artists/${username}/stickers`),
    subscribeSticker: (stickerId: string) => api.post<ArtistSticker>(`/stickers/${stickerId}/subscribe`),
    purchaseSticker: (stickerId: string) => api.post<ArtistSticker>(`/stickers/${stickerId}/purchase`),
}
