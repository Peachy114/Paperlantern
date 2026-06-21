import { useSuspenseQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

interface DashboardStats {
    total_users: number
    total_works: number
    total_chapters: number
    banned_users: number
}

export function useAdminDashboard() {
    const { data: stats } = useSuspenseQuery<DashboardStats>({
        queryKey: ['admin-dashboard'],
        queryFn: () => adminApi.getDashboard().then((r) => r.data),
    })

    return { stats }
}
