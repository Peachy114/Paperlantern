import api from './axios'

export type ContentLabel = {
    id: string
    type: 'genre' | 'label'
    name: string
    slug: string
    sort_order: number
    is_active: boolean
}

export type LabelRequest = {
    id: string
    type: 'genre' | 'label'
    name: string
    reason?: string | null
    status: 'pending' | 'approved' | 'rejected'
}

export const labelingApi = {
    publicIndex: () =>
        api.get<{
            genres: ContentLabel[]
            labels: ContentLabel[]
            commission_types: Array<{ id: string; name: string; slug: string }>
        }>('/public/labeling'),
    requestLabel: (payload: { type: 'genre' | 'label'; name: string; reason?: string }) =>
        api.post('/labeling/requests', payload),
}
