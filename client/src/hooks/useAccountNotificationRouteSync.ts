import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi, type NotificationSection } from '@/api/account'
import { useAuthStore } from '@/store/authStore'

/**
 * Marks notification records read only after the user enters the related
 * account destination. Opening the Account menu itself does nothing.
 *
 * Messages are deliberately excluded: CommissionMessageController marks only
 * the selected conversation's notifications read, preserving unread alerts
 * from every other conversation.
 */
export function useAccountNotificationRouteSync() {
    const location = useLocation()
    const token = useAuthStore((state) => state.token)
    const queryClient = useQueryClient()
    const lastAcknowledgedNavigation = useRef<string | null>(null)

    const section = useMemo(
        () => notificationSectionForPath(location.pathname),
        [location.pathname]
    )

    const acknowledgeSection = useMutation({
        mutationFn: (targetSection: NotificationSection) =>
            accountApi.markNotificationSectionRead(targetSection).then((response) => response.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-center'] })
            queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
        },
    })

    useEffect(() => {
        if (!token || !section) return

        const navigationKey = `${location.key}:${section}`
        if (lastAcknowledgedNavigation.current === navigationKey) return

        lastAcknowledgedNavigation.current = navigationKey
        acknowledgeSection.mutate(section)
    }, [location.key, section, token])
}

function notificationSectionForPath(pathname: string): NotificationSection | null {
    if (matchesAccountPath(pathname, '/my-shop')) return 'shop'
    if (matchesAccountPath(pathname, '/commission')) return 'commissions'
    if (matchesAccountPath(pathname, '/comments')) return 'comments'
    if (matchesAccountPath(pathname, '/earnings')) return 'earnings'
    if (matchesAccountPath(pathname, '/withdrawals')) return 'earnings'
    if (matchesAccountPath(pathname, '/arts')) return 'arts'

    // /messages is handled per selected conversation by the backend.
    // /notifications never auto-marks records; users choose an item or Mark all.
    return null
}

function matchesAccountPath(pathname: string, route: string) {
    return pathname === route || pathname.startsWith(`${route}/`)
}
