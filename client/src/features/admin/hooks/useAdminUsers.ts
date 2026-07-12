import { useSuspenseQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

interface AdminUser {
    id: string
    name: string
    username: string
    strike_count: number
    email: string
    role: string
    artist_verified: boolean
    is_banned: boolean
    is_suspended?: boolean
    created_at: string
    works_count: number
    arts_count: number
    comments_count: number
}

export function useAdminUsers() {
    const queryClient = useQueryClient()

    const { data: users } = useSuspenseQuery<AdminUser[]>({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers().then((r) => r.data),
    })

    const banUser = useMutation({
        mutationFn: (id: string) => adminApi.banUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.map((u) => (u.id === id ? { ...u, is_banned: true } : u))
            )
        },
    })

    const unbanUser = useMutation({
        mutationFn: (id: string) => adminApi.unbanUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.map((u) => (u.id === id ? { ...u, is_banned: false } : u))
            )
        },
    })

    const deleteUser = useMutation({
        mutationFn: (id: string) => adminApi.deleteUser(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.filter((u) => u.id !== id)
            )
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
        },
    })

    const updateArtistVerification = useMutation({
        mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
            adminApi.updateArtistVerification(id, verified),
        onSuccess: (response, { id }) => {
            queryClient.setQueryData<AdminUser[]>(['admin-users'], (prev) =>
                prev?.map((u) => (u.id === id ? { ...u, ...response.data.user } : u))
            )
        },
    })

    const actionLoading =
        (banUser.isPending ? banUser.variables : null) ??
        (unbanUser.isPending ? unbanUser.variables : null) ??
        (deleteUser.isPending ? deleteUser.variables : null) ??
        (updateArtistVerification.isPending ? updateArtistVerification.variables?.id : null)

    return {
        users,
        actionLoading,
        banUser: (id: string) => banUser.mutate(id),
        unbanUser: (id: string) => unbanUser.mutate(id),
        deleteUser: (id: string) => deleteUser.mutate(id),
        updateArtistVerification: (id: string, verified: boolean) =>
            updateArtistVerification.mutate({ id, verified }),
    }
}
