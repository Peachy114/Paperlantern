import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

interface AdminUser {
    id: number
    name: string
    username: string
    strike_count: number
    email: string
    role: string
    is_banned: boolean
    created_at: string
    works_count: number
}

export function useAdminUsers() {
    const queryClient = useQueryClient()

    const { data: users } = useSuspenseQuery<AdminUser[]>({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers().then((r) => r.data),
    })

    const banUser = useMutation({
        mutationFn: (id: number) => adminApi.banUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.map((u) => (u.id === id ? { ...u, is_banned: true } : u))
            )
        },
    })

    const unbanUser = useMutation({
        mutationFn: (id: number) => adminApi.unbanUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.map((u) => (u.id === id ? { ...u, is_banned: false } : u))
            )
        },
    })

    const deleteUser = useMutation({
        mutationFn: (id: number) => adminApi.deleteUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.filter((u) => u.id !== id)
            )
            // Also invalidate dashboard stats since user count changed
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
        },
    })

    const actionLoading =
        (banUser.isPending ? banUser.variables : null) ??
        (unbanUser.isPending ? unbanUser.variables : null) ??
        (deleteUser.isPending ? deleteUser.variables : null)

    return {
        users,
        actionLoading,
        banUser: (id: number) => banUser.mutate(id),
        unbanUser: (id: number) => unbanUser.mutate(id),
        deleteUser: (id: number) => deleteUser.mutate(id),
    }
}
