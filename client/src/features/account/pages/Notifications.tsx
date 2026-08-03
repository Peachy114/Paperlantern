import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Bell,
    BellRing,
    BriefcaseBusiness,
    CheckCheck,
    Heart,
    Megaphone,
    MessageCircle,
    ShoppingBag,
    Sparkles,
    Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { accountApi, type AppNotification, type NotificationPreferences } from '@/api/account'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { storageUrl } from '@/utils/storage'
import { relativeNotificationTime } from '@/components/notifications/NotificationCenter'

type ReadFilter = 'all' | 'unread'

const notificationCategories = [
    { value: 'all', label: 'All categories' },
    { value: 'messages', label: 'Messages' },
    { value: 'commissions', label: 'Commissions' },
    { value: 'new_purchase', label: 'Shop purchases' },
    { value: 'comment_reply', label: 'Comment replies' },
    { value: 'new_comment', label: 'New comments' },
    { value: 'new_follower', label: 'Followers' },
    { value: 'likes', label: 'Likes' },
    { value: 'payout_update', label: 'Payouts' },
    { value: 'creator_announcement', label: 'Announcements' },
    { value: 'new_chapter', label: 'New chapters' },
]

export default function Notifications() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<ReadFilter>('all')
    const [category, setCategory] = useState('all')
    const [showSettings, setShowSettings] = useState(false)

    const notificationQuery = useInfiniteQuery({
        queryKey: ['account-notifications', filter, category],
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            accountApi
                .notifications({
                    filter,
                    category: category === 'all' ? undefined : category,
                    page: Number(pageParam),
                    per_page: 20,
                })
                .then((response) => response.data),
        getNextPageParam: (lastPage) =>
            lastPage.meta.current_page < lastPage.meta.last_page
                ? lastPage.meta.current_page + 1
                : undefined,
    })

    const preferencesQuery = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: () => accountApi.notificationPreferences().then((response) => response.data),
    })

    const markRead = useMutation({
        mutationFn: (notificationId: string) => accountApi.markNotificationRead(notificationId),
        onSettled: () => refreshNotifications(queryClient),
    })

    const markAllRead = useMutation({
        mutationFn: accountApi.markAllNotificationsRead,
        onSuccess: () => toast.success('All notifications marked as read.'),
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not mark notifications as read.'),
        onSettled: () => refreshNotifications(queryClient),
    })

    const savePreferences = useMutation({
        mutationFn: accountApi.updateNotificationPreferences,
        onSuccess: () => {
            toast.success('Notification settings saved.')
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
        },
        onError: (error: any) =>
            toast.error(error?.response?.data?.message ?? 'Could not save notification settings.'),
    })

    const notifications = useMemo(
        () => notificationQuery.data?.pages.flatMap((page) => page.data) ?? [],
        [notificationQuery.data]
    )
    const grouped = useMemo(() => groupNotifications(notifications), [notifications])
    const unreadTotal = notificationQuery.data?.pages[0]?.meta.unread ?? 0

    const openNotification = async (notification: AppNotification) => {
        try {
            if (!notification.read_at) await markRead.mutateAsync(notification.id)
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not mark notification as read.')
        } finally {
            navigate(
                notification.action_url?.startsWith('/')
                    ? notification.action_url
                    : '/notifications'
            )
        }
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bell className="h-5 w-5" />
                        {unreadTotal > 0 && (
                            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                                {unreadTotal > 99 ? '99+' : unreadTotal}
                            </span>
                        )}
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Messages, commissions, shop sales, comments, releases, and account
                            activity.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSettings((value) => !value)}
                    >
                        Settings
                    </Button>
                    <Button
                        type="button"
                        disabled={unreadTotal === 0 || markAllRead.isPending}
                        onClick={() => markAllRead.mutate()}
                    >
                        <CheckCheck className="mr-1 h-4 w-4" />
                        Mark all read
                    </Button>
                </div>
            </div>

            {showSettings && preferencesQuery.data?.preferences && (
                <NotificationSettings
                    preferences={preferencesQuery.data.preferences}
                    busy={savePreferences.isPending}
                    onSave={(payload) => savePreferences.mutate(payload)}
                />
            )}

            <section className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-fit rounded-full bg-muted p-1">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === 'unread' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Unread{unreadTotal > 0 ? ` ${unreadTotal}` : ''}
                        </button>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Show</span>
                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                            {notificationCategories.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {notificationQuery.isLoading ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <BellRing className="h-6 w-6 text-muted-foreground" />
                        </span>
                        <h2 className="mt-4 font-semibold">
                            {filter === 'unread'
                                ? 'No unread notifications'
                                : 'No notifications yet'}
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                            New activity will appear here. Opening this page does not mark
                            notifications as read.
                        </p>
                    </div>
                ) : (
                    <div>
                        {grouped.map((group) => (
                            <section key={group.label}>
                                <div className="border-b bg-muted/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                    {group.label}
                                </div>
                                <div className="divide-y">
                                    {group.items.map((notification) => (
                                        <FullNotificationRow
                                            key={notification.id}
                                            notification={notification}
                                            onClick={() => openNotification(notification)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {notificationQuery.hasNextPage && (
                            <div className="border-t p-4 text-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={notificationQuery.isFetchingNextPage}
                                    onClick={() => notificationQuery.fetchNextPage()}
                                >
                                    {notificationQuery.isFetchingNextPage
                                        ? 'Loading...'
                                        : 'Load more'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    )
}

function NotificationSettings({
    preferences,
    busy,
    onSave,
}: {
    preferences: NotificationPreferences
    busy: boolean
    onSave: (payload: Partial<NotificationPreferences>) => void
}) {
    return (
        <section className="mb-6 rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Notification delivery</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                    ['in_app_enabled', 'In-app notifications'],
                    ['email_enabled', 'Email notifications'],
                    ['push_enabled', 'Push notifications'],
                    ['digest_enabled', 'Digest mode'],
                ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                            disabled={busy}
                            checked={Boolean((preferences as any)[key])}
                            onCheckedChange={(checked) =>
                                onSave({
                                    [key]: checked === true,
                                } as Partial<NotificationPreferences>)
                            }
                        />
                        {label}
                    </label>
                ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                    Quiet hours start
                    <Input
                        type="time"
                        className="mt-1"
                        defaultValue={preferences.quiet_hours_start ?? ''}
                        onBlur={(event) =>
                            onSave({ quiet_hours_start: event.target.value || null })
                        }
                    />
                </label>
                <label className="text-xs text-muted-foreground">
                    Quiet hours end
                    <Input
                        type="time"
                        className="mt-1"
                        defaultValue={preferences.quiet_hours_end ?? ''}
                        onBlur={(event) => onSave({ quiet_hours_end: event.target.value || null })}
                    />
                </label>
            </div>
        </section>
    )
}

function FullNotificationRow({
    notification,
    onClick,
}: {
    notification: AppNotification
    onClick: () => void
}) {
    const unread = !notification.read_at
    const avatar = notification.meta?.actor_avatar
        ? storageUrl(notification.meta.actor_avatar)
        : null
    const Icon = notificationIcon(notification)

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/60 ${unread ? 'bg-red-500/[0.06]' : ''}`}
        >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                    <Icon className="h-5 w-5" />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <span className={`block text-sm ${unread ? 'font-bold' : 'font-semibold'}`}>
                    {notification.title}
                </span>
                {notification.body && (
                    <span className="mt-1 block whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {notification.body}
                    </span>
                )}
                <span className="mt-2 block text-xs font-medium text-primary">
                    {relativeNotificationTime(notification.created_at)}
                </span>
            </span>
            {unread && (
                <span
                    className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"
                    aria-label="Unread"
                />
            )}
        </button>
    )
}

function notificationIcon(notification: AppNotification) {
    const section = notification.meta?.section
    if (section === 'messages' || notification.category === 'messages') return MessageCircle
    if (section === 'commissions' || notification.category === 'commissions')
        return BriefcaseBusiness
    if (section === 'shop' || notification.category === 'new_purchase') return ShoppingBag
    if (section === 'earnings' || notification.category === 'payout_update') return Wallet
    if (
        section === 'comments' ||
        ['comment_reply', 'new_comment', 'creator_liked_comment'].includes(notification.category)
    )
        return MessageCircle
    if (notification.category === 'likes') return Heart
    if (notification.category === 'creator_announcement') return Megaphone
    if (notification.category === 'new_supporter') return Sparkles
    return Bell
}

function groupNotifications(notifications: AppNotification[]) {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 86_400_000
    const groups: Record<'New' | 'Today' | 'Earlier', AppNotification[]> = {
        New: [],
        Today: [],
        Earlier: [],
    }

    for (const notification of notifications) {
        const created = new Date(notification.created_at).getTime()
        if (!notification.read_at) groups.New.push(notification)
        else if (created >= startOfToday || created >= startOfYesterday)
            groups.Today.push(notification)
        else groups.Earlier.push(notification)
    }

    return (Object.entries(groups) as [keyof typeof groups, AppNotification[]][])
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }))
}

function refreshNotifications(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: ['account-notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notification-center'] })
}
