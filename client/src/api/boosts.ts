import api from './axios'

export type BoostKind = 'artist_profile' | 'art' | 'webtoon' | 'novel' | 'commission'
export type BoostTargetType = 'artist_profile' | 'art' | 'work' | 'commission_service'

export interface BoostPrices {
    art: number
    webtoon: number
    novel: number
    artist_profile: number
    commission: number
}

export interface BoostPayload {
    target_type: BoostTargetType
    target_id?: string
    days: number
}

export const boostApi = {
    prices: () => api.get<BoostPrices>('/boosts/prices'),
    create: (payload: BoostPayload) => api.post('/boosts', payload),
}
