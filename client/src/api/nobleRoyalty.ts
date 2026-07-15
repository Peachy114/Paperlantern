import api from './axios'
import type { ArtistSticker, ProfileBorder, RoyaltyDesignAsset } from '@/types/artistProfile'

export interface SubscriptionPlan {
    id: string
    name: string
    slug: string
    audience: 'wanderer' | 'storyteller'
    tier_key: 'starter' | 'plus' | 'atelier'
    description: string | null
    monthly_credit_cost: number
    effective_credit_cost: number
    promo_label: string | null
    promo_credit_cost: number | null
    promo_start_at: string | null
    promo_end_at: string | null
    promo_active: boolean
    is_recommended: boolean
    is_active: boolean
    unlimited_board: boolean
    board_limit: number
    free_boost_days: number
    early_access: boolean
    perks: string[]
    sort_order: number
}

export interface UserSubscription {
    id: string
    status: string
    starts_at: string | null
    ends_at: string | null
    grace_ends_at: string | null
    plan: SubscriptionPlan | null
}

export interface NobleRoyaltyResponse {
    publish_cost: number
    current_subscription: UserSubscription | null
    stickers: ArtistSticker[]
    borders: ProfileBorder[]
    designs: RoyaltyDesignAsset[]
    plans: SubscriptionPlan[]
}

export const nobleRoyaltyApi = {
    browse: () => api.get<NobleRoyaltyResponse>('/noble-royalty'),
    createBorder: (data: FormData) =>
        api.post<{ message: string; border: ProfileBorder }>('/noble-royalty/borders', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    createMessageBackground: (data: FormData) =>
        api.post('/noble-royalty/message-backgrounds', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    publishSticker: (id: string) => api.post(`/noble-royalty/stickers/${id}/publish`),
    purchaseSticker: (id: string) => api.post<ArtistSticker>(`/stickers/${id}/purchase`),
    publishBorder: (id: string) => api.post(`/noble-royalty/borders/${id}/publish`),
    subscribe: (planId: string) =>
        api.post<{ message: string; subscription: UserSubscription }>(
            `/noble-royalty/subscriptions/${planId}/subscribe`
        ),
}

export const adminNobleRoyaltyApi = {
    plans: () => api.get<{ data: SubscriptionPlan[] }>('/admin/noble-royalty/subscription-plans'),
    createPlan: (data: Record<string, unknown>) =>
        api.post<SubscriptionPlan>('/admin/noble-royalty/subscription-plans', data),
    updatePlan: (id: string, data: Record<string, unknown>) =>
        api.put<SubscriptionPlan>(`/admin/noble-royalty/subscription-plans/${id}`, data),
    gift: (data: {
        recipient_username: string
        asset_type: 'sticker' | 'border' | 'design'
        asset_id: string
        note?: string
    }) => api.post('/admin/noble-royalty/gifts', data),
}
