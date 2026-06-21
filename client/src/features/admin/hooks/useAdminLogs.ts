import { useSuspenseQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { useState } from 'react'

interface AdminLog {
    id: number
    action: string
    target_type: string
    target_id: number
    notes: string | null
    created_at: string
    admin: {
        id: number
        name: string
        username: string
    }
}

interface PaginatedLogs {
    data: AdminLog[]
    current_page: number
    last_page: number
    total: number
}

export function useAdminLogs() {
    const [page, setPage] = useState(1)

    const { data } = useSuspenseQuery<PaginatedLogs>({
        queryKey: ['admin-logs', page],
        queryFn: () => adminApi.getLogs(page).then((r) => r.data),
    })

    return {
        logs: data.data,
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
        setPage,
    }
}
