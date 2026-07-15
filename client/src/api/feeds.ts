import api from './axios'

export type FeedPost = {
    id: string
    body: string | null
    audience: 'all' | 'followers'
    comments_enabled: boolean
    likes_count: number
    comments_count: number
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
    attachment?: {
        type: 'work' | 'art' | 'commission'
        id: string
        title: string
        subtitle: string
        image_path: string | null
        href: string
    } | null
}

export const feedsApi = {
    index: () => api.get<{ data: FeedPost[]; meta: unknown }>('/feeds'),
    create: (data: FormData) =>
        api.post<FeedPost>('/feeds', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    toggleFollow: (username: string) =>
        api.post<{ is_following: boolean; followers_count: number }>(
            `/public/artists/${username}/follow`
        ),
}
