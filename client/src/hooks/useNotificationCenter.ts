import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    accountApi,
    type AppNotification,
    type NotificationAttention,
    type NotificationListResponse,
} from '@/api/account'
import { useAuthStore } from '@/store/authStore'

const emptyAttention: NotificationAttention = {
    messages: false,
    commissions: false,
    shop: false,
    comments: false,
    earnings: false,
    arts: false,
    notifications: false,
}

export function useNotificationCenter() {
    const token = useAuthStore((state) => state.token)
    const queryClient = useQueryClient()

    const query = useQuery<NotificationListResponse>({
        queryKey: ['notification-center'],
        enabled: Boolean(token),
        queryFn: () =>
            accountApi
                .notifications({ filter: 'all', page: 1, per_page: 15 })
                .then((response) => response.data),
        staleTime: 15_000,
        refetchInterval: 45_000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    })

    const markRead = useMutation({
        mutationFn: (notificationId: string) =>
            accountApi.markNotificationRead(notificationId).then((response) => response.data),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ['notification-center'] })
            const previous = queryClient.getQueryData<NotificationListResponse>([
                'notification-center',
            ])

            queryClient.setQueryData<NotificationListResponse>(
                ['notification-center'],
                (current) => {
                    if (!current) return current
                    const target = current.data.find((item) => item.id === notificationId)
                    if (!target || target.read_at) return current

                    return {
                        ...current,
                        data: current.data.map((item) =>
                            item.id === notificationId
                                ? { ...item, read_at: new Date().toISOString() }
                                : item
                        ),
                        meta: {
                            ...current.meta,
                            unread: Math.max(0, current.meta.unread - 1),
                            attention: {
                                ...current.meta.attention,
                                notifications: current.meta.unread - 1 > 0,
                            },
                        },
                    }
                }
            )

            return { previous }
        },
        onError: (_error, _notificationId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['notification-center'], context.previous)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-center'] })
            queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
        },
    })

    const markAllRead = useMutation({
        mutationFn: () => accountApi.markAllNotificationsRead().then((response) => response.data),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['notification-center'] })
            const previous = queryClient.getQueryData<NotificationListResponse>([
                'notification-center',
            ])
            const readAt = new Date().toISOString()

            queryClient.setQueryData<NotificationListResponse>(
                ['notification-center'],
                (current) => {
                    if (!current) return current
                    return {
                        ...current,
                        data: current.data.map((item) => ({
                            ...item,
                            read_at: item.read_at ?? readAt,
                        })),
                        meta: {
                            ...current.meta,
                            unread: 0,
                            attention: {
                                ...current.meta.attention,
                                notifications: false,
                            },
                        },
                    }
                }
            )

            return { previous }
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['notification-center'], context.previous)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-center'] })
            queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
        },
    })

    return {
        notifications: query.data?.data ?? ([] as AppNotification[]),
        unreadTotal: query.data?.meta.unread ?? 0,
        attention: query.data?.meta.attention ?? emptyAttention,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        refetch: query.refetch,
        markRead,
        markAllRead,
    }
}
