import api from './axios'
import type { CreditPackage } from '@/types/wallet'

export type CreditPackagePayload = {
    name: string
    credits: number
    price: number
    promo_label?: string | null
    promo_start_at?: string | null
    promo_end_at?: string | null
    is_active: boolean
    sort_order?: number
}

export const adminApi = {
    getDashboard: () => api.get('/admin/dashboard'),

    getUsers: () => api.get('/admin/users'),
    getUser: (id: string) => api.get(`/admin/users/${id}`),
    banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
    unbanUser: (id: string) => api.put(`/admin/users/${id}/unban`),
    updateArtistVerification: (id: string, artistVerified: boolean) =>
        api.patch(`/admin/users/${id}/artist-verification`, { artist_verified: artistVerified }),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

    deleteWork: (id: string, notes?: string) =>
        api.delete(`/admin/works/${id}`, { data: { notes } }),

    viewChapter: (id: string) => api.get(`/admin/chapters/${id}`),
    deleteChapter: (id: string, notes?: string) =>
        api.delete(`/admin/chapters/${id}`, { data: { notes } }),

    getLogs: (page = 1) => api.get(`/admin/logs?page=${page}`),
    getCommissionApplications: (status = 'pending') =>
        api.get(`/admin/commission-applications?status=${status}`),
    updateCommissionApplication: (
        id: string,
        applicationStatus: 'approved' | 'rejected' | 'suspended'
    ) =>
        api.patch(`/admin/commission-applications/${id}`, {
            application_status: applicationStatus,
        }),
    getCommissionOrders: (status = 'all') => api.get(`/admin/commission-orders?status=${status}`),
    updateCommissionOrder: (id: string, action: 'release' | 'refund' | 'dispute') =>
        api.patch(`/admin/commission-orders/${id}`, { action }),
    getCommissionRatingAppeals: () => api.get('/admin/commission-rating-appeals'),
    updateCommissionRating: (id: string, status: 'published' | 'hidden') =>
        api.patch(`/admin/commission-ratings/${id}`, { status }),
    getCommissionArtistTerms: (status = 'pending') =>
        api.get(`/admin/commission-artist-terms?status=${status}`),
    updateCommissionArtistTerms: (
        id: string,
        terms_moderation_status: 'approved' | 'hidden' | 'suspended'
    ) => api.patch(`/admin/commission-artist-terms/${id}`, { terms_moderation_status }),
    getCommissionOrderMessages: (id: string) => api.get(`/admin/commission-orders/${id}/messages`),
    getCommissionTerms: () => api.get('/admin/commission-terms'),
    updateCommissionTerms: (terms: string[]) => api.put('/admin/commission-terms', { terms }),
    getCommissionCategories: () => api.get('/admin/commission-categories'),
    createCommissionCategory: (payload: {
        name: string
        sort_order?: number
        is_active?: boolean
    }) => api.post('/admin/commission-categories', payload),
    updateCommissionCategory: (
        id: string,
        payload: { name?: string; sort_order?: number; is_active?: boolean }
    ) => api.patch(`/admin/commission-categories/${id}`, payload),
    getSuperLikeAwards: () => api.get('/admin/super-like-awards'),
    createSuperLikeAward: (payload: {
        name: string
        icon: string
        credit_cost: number
        is_active: boolean
        sort_order?: number
    }) => api.post('/admin/super-like-awards', payload),
    updateSuperLikeAward: (
        id: string,
        payload: {
            name: string
            icon: string
            credit_cost: number
            is_active: boolean
            sort_order?: number
        }
    ) => api.put(`/admin/super-like-awards/${id}`, payload),
    deleteSuperLikeAward: (id: string) => api.delete(`/admin/super-like-awards/${id}`),
    getCreditPackages: () => api.get<{ data: CreditPackage[] }>('/admin/credit-packages'),
    createCreditPackage: (payload: CreditPackagePayload) =>
        api.post<{ data: CreditPackage }>('/admin/credit-packages', payload),
    updateCreditPackage: (id: string | number, payload: CreditPackagePayload) =>
        api.put<{ data: CreditPackage }>(`/admin/credit-packages/${id}`, payload),
    deleteCreditPackage: (id: string | number) => api.delete(`/admin/credit-packages/${id}`),
    getLabeling: () => api.get('/admin/labeling'),
    createLabel: (payload: {
        type: 'genre' | 'label'
        name: string
        sort_order?: number
        is_active?: boolean
    }) => api.post('/admin/labeling/labels', payload),
    updateLabel: (
        id: string,
        payload: { name?: string; sort_order?: number; is_active?: boolean }
    ) => api.patch(`/admin/labeling/labels/${id}`, payload),
    updateLabelRequest: (id: string, status: 'approved' | 'rejected') =>
        api.patch(`/admin/labeling/requests/${id}`, { status }),
}
