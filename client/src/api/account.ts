import api from './axios'

export interface AccountWork {
    id: string
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    views: number
    likes: number
    favorites_count: number
    author?: {
        id: string
        name: string
        username: string
    } | null
}

export interface AccountFavorite {
    id: string
    created_at: string
    work: AccountWork
}

export interface AccountComment {
    id: string
    body: string | null
    public_highlight: boolean
    super_likes_count: number
    created_at: string
    origin: {
        type: string
        title: string
        subtitle: string | null
        href: string | null
    }
    sticker?: {
        id: string
        name: string
        image_path: string
    } | null
}

export interface AccountHistory {
    read: ChapterHistoryItem[]
    liked: ChapterHistoryItem[]
    commented: AccountComment[]
    bought: {
        chapters: ChapterHistoryItem[]
        transactions: WalletHistoryItem[]
    }
}

export interface AppNotificationMeta {
    section?: string | null
    actor_id?: string | null
    actor_name?: string | null
    actor_username?: string | null
    actor_avatar?: string | null
    resource_type?: string | null
    resource_id?: string | null
    order_id?: string | null
    quote_id?: string | null
    message_id?: string | null
    shop_item_id?: string | null
    [key: string]: unknown
}

export interface AppNotification {
    id: string
    category: string
    title: string
    body: string | null
    action_url: string | null
    meta: AppNotificationMeta | null
    read_at: string | null
    created_at: string
}

export interface NotificationAttention {
    messages: boolean
    commissions: boolean
    shop: boolean
    comments: boolean
    earnings: boolean
    arts: boolean
    notifications: boolean
}

export interface NotificationListMeta {
    current_page: number
    last_page: number
    total: number
    unread: number
    attention: NotificationAttention
}

export interface NotificationListResponse {
    data: AppNotification[]
    meta: NotificationListMeta
}

export interface NotificationQuery {
    category?: string
    section?: string
    filter?: 'all' | 'unread' | 'read'
    page?: number
    per_page?: number
}

export interface NotificationPreferences {
    reader_categories: string[]
    creator_categories: string[]
    in_app_enabled: boolean
    email_enabled: boolean
    push_enabled: boolean
    digest_enabled: boolean
    digest_frequency: 'daily' | 'weekly'
    quiet_hours_start?: string | null
    quiet_hours_end?: string | null
    per_work_controls?: Record<string, unknown> | null
}

export interface ChapterHistoryItem {
    id: string
    type: string
    chapter: {
        id: string
        slug: string
        title: string
        order: number
    }
    work: AccountWork
    href: string
    created_at: string
}

export interface WalletHistoryItem {
    id: string
    type: string
    source: string
    description: string | null
    amount: number
    created_at: string
}

export const accountApi = {
    favorites: () => api.get<{ data: AccountFavorite[] }>('/account/favorites'),
    comments: () => api.get<{ data: AccountComment[]; total: number }>('/account/comments'),
    setCommentHighlight: (id: string, publicHighlight: boolean) =>
        api.patch<AccountComment>(`/account/comments/${id}/highlight`, {
            public_highlight: publicHighlight,
        }),
    history: () => api.get<AccountHistory>('/account/history'),
    notifications: (query?: string | NotificationQuery) => {
        const params: NotificationQuery | undefined =
            typeof query === 'string' ? { category: query } : query

        return api.get<NotificationListResponse>('/account/notifications', { params })
    },
    markNotificationRead: (id: string) =>
        api.patch<{ notification: AppNotification }>(`/account/notifications/${id}/read`),
    markAllNotificationsRead: () =>
        api.post<{ message: string }>('/account/notifications/read-all'),
    notificationPreferences: () =>
        api.get<{
            preferences: NotificationPreferences
            reader_categories: string[]
            creator_categories: string[]
        }>('/account/notification-preferences'),
    updateNotificationPreferences: (payload: Partial<NotificationPreferences>) =>
        api.put<{ preferences: NotificationPreferences }>(
            '/account/notification-preferences',
            payload
        ),
}
