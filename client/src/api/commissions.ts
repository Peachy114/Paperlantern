import api from './axios'

export const commissionApi = {
    getAccountOrders: () => api.get('/account/commissions'),
    updateAccountOrder: (id: string, action: 'cancel' | 'dispute') =>
        api.patch(`/account/commissions/${id}`, { action }),
    acceptQuote: (id: string, quoteId?: string) =>
        api.post(`/account/commissions/${id}/accept-quote`, quoteId ? { quote_id: quoteId } : {}),
    requestNewQuote: (
        id: string,
        payload: {
            quote_id: string
            reason: string
            preferred_credits?: number
            requested_changes?: string
        }
    ) =>
        api.patch(`/account/commissions/${id}`, {
            action: 'request_new_quote',
            ...payload,
        }),
    rejectQuote: (id: string, payload: { quote_id: string; reason?: string }) =>
        api.patch(`/account/commissions/${id}`, {
            action: 'reject_quote',
            ...payload,
        }),
    payNextStage: (id: string) => api.post(`/account/commissions/${id}/pay-next-stage`),
    payFinalDelivery: (id: string) => api.post(`/account/commissions/${id}/pay-final-delivery`),
    downloadDeliveryFile: (orderId: string, fileId: string) =>
        api.get(`/account/commissions/${orderId}/delivery-files/${fileId}/download`, {
            responseType: 'blob',
        }),
    continueStage: (id: string) => api.post(`/account/commissions/${id}/continue-stage`),
    releaseAccountOrder: (id: string) => api.post(`/account/commissions/${id}/release`),
    requestRevision: (
        id: string,
        payload: { reason: string; step_index?: number; pay_extra?: boolean }
    ) => api.post(`/account/commissions/${id}/revisions`, payload),
    rateOrder: (id: string, payload: { rating: number; comment?: string }) =>
        api.post(`/account/commissions/${id}/rating`, payload),
    getMessageThreads: () => api.get('/messages/commissions'),
    startDirectThread: (username: string) => api.post(`/messages/artists/${username}`),
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
