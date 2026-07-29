import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing, Heart, MessageCircle, Megaphone, Sparkles, Wallet } from 'lucide-react'
import { accountApi } from '@/api/account'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const categories = [
    {
        title: 'New releases',
        value: 'new_chapter',
        description: 'Boosted releases from series, novels, arts, and commission creators.',
        icon: BellRing,
    },
    {
        title: 'Favorite chapters',
        value: 'new_episode',
        description: 'New episodes from webtoons and novels you follow.',
        icon: Heart,
    },
    {
        title: 'Admin announcements',
        value: 'creator_announcement',
        description: 'Official updates, policy notices, and platform news.',
        icon: Megaphone,
    },
    {
        title: 'Likes',
        value: 'likes',
        description: 'Likes from series, arts, and commission activity.',
        icon: Heart,
    },
    {
        title: 'Commissions',
        value: 'commissions',
        description: 'Requests, quotes, approvals, payments, stages, and delivery notices.',
        icon: Sparkles,
    },
    {
        title: 'Messages',
        value: 'messages',
        description: 'Unread message alerts and commission conversation updates.',
        icon: MessageCircle,
    },
    {
        title: 'Super likes',
        value: 'new_supporter',
        description: 'Super likes and reward notices from readers and clients.',
        icon: Sparkles,
    },
    {
        title: 'Credits bought from artists',
        value: 'new_purchase',
        description: 'Credit purchase notices connected to your creator activity.',
        icon: Wallet,
    },
]

export default function Notifications() {
    const queryClient = useQueryClient()
    const [activeCategory, setActiveCategory] = useState(categories[0].value)
    const [showSettings, setShowSettings] = useState(false)

    // notification data ----
    const notificationQuery = useQuery({
        queryKey: ['account-notifications', activeCategory],
        queryFn: () => accountApi.notifications(activeCategory).then((res) => res.data),
    })

    const preferencesQuery = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: () => accountApi.notificationPreferences().then((res) => res.data),
    })

    const markAllRead = useMutation({
        mutationFn: accountApi.markAllNotificationsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account-notifications'] }),
    })

    const savePreferences = useMutation({
        mutationFn: accountApi.updateNotificationPreferences,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    })

    const grouped = useMemo(() => notificationQuery.data?.data ?? [], [notificationQuery.data])

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            {/* page header ---- */}
            <div className="mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Bell className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Track releases, favorites, announcements, commissions, messages, super
                            likes, and credit activity.
                        </p>
                    </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowSettings((value) => !value)}>
                            Settings
                        </Button>
                        <Button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                            Mark all read
                        </Button>
                    </div>
                </div>
            </div>

            {/* notification settings ---- */}
            {showSettings && preferencesQuery.data?.preferences && (
                <section className="mb-6 rounded-lg border bg-card p-4">
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
                                    checked={Boolean((preferencesQuery.data.preferences as any)[key])}
                                    onCheckedChange={(checked) =>
                                        savePreferences.mutate({ [key]: checked === true } as any)
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <label className="text-xs text-muted-foreground">
                            Quiet hours start
                            <Input
                                type="time"
                                className="mt-1"
                                defaultValue={preferencesQuery.data.preferences.quiet_hours_start ?? ''}
                                onBlur={(event) =>
                                    savePreferences.mutate({ quiet_hours_start: event.target.value })
                                }
                            />
                        </label>
                        <label className="text-xs text-muted-foreground">
                            Quiet hours end
                            <Input
                                type="time"
                                className="mt-1"
                                defaultValue={preferencesQuery.data.preferences.quiet_hours_end ?? ''}
                                onBlur={(event) =>
                                    savePreferences.mutate({ quiet_hours_end: event.target.value })
                                }
                            />
                        </label>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Email notifications are sent through Laravel mail. In local testing, they are
                        written to laravel.log.
                    </p>
                </section>
            )}

            {/* notification tabs ---- */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="h-auto w-full flex-wrap justify-start">
                    {categories.map((category) => (
                        <TabsTrigger key={category.value} value={category.value}>
                            {category.title}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((category) => {
                    const Icon = category.icon
                    return (
                        <TabsContent key={category.value} value={category.value}>
                            <section className="mt-4 rounded-lg border border-border bg-card p-5">
                                {/* category header ---- */}
                                <div className="flex gap-3">
                                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h2 className="text-base font-semibold">
                                            {category.title}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>

                                {/* notification rows ---- */}
                                <div className="mt-5 space-y-2">
                                    {notificationQuery.isLoading ? (
                                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            Loading notifications...
                                        </div>
                                    ) : grouped.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                            No notifications in this tab yet.
                                        </div>
                                    ) : (
                                        grouped.map((notification) => {
                                            const content = (
                                                <div className="rounded-lg border bg-background p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold">
                                                                {notification.title}
                                                            </p>
                                                            {notification.body && (
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {notification.body}
                                                                </p>
                                                            )}
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                {new Date(notification.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {!notification.read_at && (
                                                            <span className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                                                        )}
                                                    </div>
                                                </div>
                                            )

                                            return notification.action_url ? (
                                                <Link key={notification.id} to={notification.action_url}>
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div key={notification.id}>{content}</div>
                                            )
                                        })
                                    )}
                                </div>
                            </section>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </main>
    )
}
