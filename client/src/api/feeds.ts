import api from './axios'

export type FeedPost = {
    id: string
    body: string | null
    audience: 'all' | 'followers'
    comments_enabled: boolean
    likes_count: number
    comments_count: number
    super_likes_count: number
    super_like_credits: number
    liked_by_me: boolean
    can_manage?: boolean
    created_at: string
    user: {
        id: string
        name: string
        username: string
        avatar: string | null
        artist_verified?: boolean
    }
    images: Array<{ id: string; image_path: string; sort_order: number }>
    sticker?: { id: string; name: string; image_path: string } | null
    attachment?: FeedAttachment | null
    attachments?: FeedAttachment[]
}

export type FeedAttachment = {
        type: 'work' | 'art' | 'commission'
        id: string
        title: string
        subtitle: string
        image_path: string | null
        href: string
}

export const feedsApi = {
    index: () => api.get<{ data: FeedPost[]; meta: unknown }>('/feeds'),
    create: (data: FormData) =>
        api.post<FeedPost>('/feeds', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    update: (postId: string, payload: {
        body?: string | null
        audience: 'all' | 'followers'
        comments_enabled: boolean
    }) => api.put<FeedPost>(`/feeds/${postId}`, payload),
    delete: (postId: string) => api.delete<{ message: string }>(`/feeds/${postId}`),
    like: (postId: string) =>
        api.post<{ liked: boolean; likes_count: number }>(`/feeds/${postId}/like`),
    report: (postId: string, payload: { reason: string; details?: string }) =>
        api.post<{ message: string; support_number: string; ticket_id: string }>(
            `/feeds/${postId}/report`,
            payload
        ),
    toggleFollow: (username: string) =>
        api.post<{ is_following: boolean; followers_count: number }>(
            `/public/artists/${username}/follow`
        ),
}
