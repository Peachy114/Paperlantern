import api from './axios'

export const commissionApi = {
    getAccountOrders: () => api.get('/account/commissions'),
    updateAccountOrder: (id: string, action: 'cancel' | 'dispute') =>
        api.patch(`/account/commissions/${id}`, { action }),
    acceptQuote: (id: string) => api.post(`/account/commissions/${id}/accept-quote`),
    payNextStage: (id: string) => api.post(`/account/commissions/${id}/pay-next-stage`),
    payFinalDelivery: (id: string) => api.post(`/account/commissions/${id}/pay-final-delivery`),
    continueStage: (id: string) => api.post(`/account/commissions/${id}/continue-stage`),
    releaseAccountOrder: (id: string) => api.post(`/account/commissions/${id}/release`),
    requestRevision: (id: string, payload: { reason: string; step_index?: number; pay_extra?: boolean }) =>
        api.post(`/account/commissions/${id}/revisions`, payload),
    rateOrder: (id: string, payload: { rating: number; comment?: string }) =>
        api.post(`/account/commissions/${id}/rating`, payload),
    getMessageThreads: () => api.get('/messages/commissions'),
    getMessagePreferences: () => api.get('/messages/preferences'),
    updateMessagePreferences: (payload: {
        message_read_receipts_enabled: boolean
        message_design_id?: string | null
        message_background_id?: string | null
    }) => api.put('/messages/preferences', payload),
    getMessages: (orderId: string, params?: { before?: string | null }) =>
        api.get(`/messages/commissions/${orderId}`, { params }),
    markMessagesRead: (orderId: string) => api.post(`/messages/commissions/${orderId}/read`),
    approveSubmission: (messageId: string) =>
        api.post(`/messages/commission-submissions/${messageId}/approve`),
    sendMessage: (orderId: string, payload: FormData) =>
        api.post(`/messages/commissions/${orderId}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
}
