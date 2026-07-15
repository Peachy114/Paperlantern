import api from './axios'
import type { PageKey, PageLayout, PageWidget } from '@/types/pageLayout'

export const pageLayoutApi = {
    publicShow: (page: PageKey) => api.get<PageLayout>(`/public/page-layouts/${page}`),
    adminShow: (page: PageKey) => api.get<PageLayout>(`/admin/page-layouts/${page}`),
    adminSave: (page: PageKey, widgets: PageWidget[]) =>
        api.put<PageLayout>(`/admin/page-layouts/${page}`, { widgets }),
    adminReset: (page: PageKey) => api.delete<PageLayout>(`/admin/page-layouts/${page}`),
    uploadAsset: (payload: FormData) =>
        api.post<{ path: string }>('/admin/page-layout-assets', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
}
