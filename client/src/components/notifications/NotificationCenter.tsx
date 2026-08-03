import { useEffect, useMemo, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
    UserPlus,
    Wallet,
    X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { storageUrl } from '@/utils/storage'
import { useNotificationCenter } from '@/hooks/useNotificationCenter'
import type { AppNotification } from '@/api/account'

type NotificationFilter = 'all' | 'unread'

interface NotificationCenterProps {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    buttonRef: RefObject<HTMLButtonElement | null>
    onButtonClick: () => void
}

export default function NotificationCenter({
    open,
    setOpen,
    buttonRef,
    onButtonClick,
}: NotificationCenterProps) {
    const navigate = useNavigate()
    const { notifications, unreadTotal, isLoading, isFetching, refetch, markRead, markAllRead } =
        useNotificationCenter()
    const [filter, setFilter] = useState<NotificationFilter>('all')
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : false
    )

    const closePanel = () => {
        setOpen(false)
        requestAnimationFrame(() => buttonRef.current?.focus())
    }

    useEffect(() => {
        const desktopQuery = window.matchMedia('(min-width: 1280px)')
        const handleDesktopChange = (event: MediaQueryListEvent) => {
            setIsDesktop(event.matches)
            setOpen(false)
        }

        setIsDesktop(desktopQuery.matches)
        desktopQuery.addEventListener('change', handleDesktopChange)
        return () => desktopQuery.removeEventListener('change', handleDesktopChange)
    }, [setOpen])

    useEffect(() => {
        if (!open) return

        refetch()
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closePanel()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open])

    useEffect(() => {
        if (!open || isDesktop) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [open, isDesktop])

    const visibleNotifications = useMemo(
        () =>
            filter === 'unread'
                ? notifications.filter((notification) => !notification.read_at)
                : notifications,
        [filter, notifications]
    )

    const openNotification = async (notification: AppNotification) => {
        try {
            if (!notification.read_at) await markRead.mutateAsync(notification.id)
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not mark notification as read.')
        } finally {
            closePanel()
            navigate(
                notification.action_url?.startsWith('/')
                    ? notification.action_url
                    : '/notifications'
            )
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllRead.mutateAsync()
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not mark notifications as read.')
        }
    }

    const content = (
        <NotificationPanel
            filter={filter}
            setFilter={setFilter}
            notifications={visibleNotifications}
            unreadTotal={unreadTotal}
            isLoading={isLoading}
            isFetching={isFetching}
            markAllPending={markAllRead.isPending}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={openNotification}
            onSeeAll={() => {
                closePanel()
                navigate('/notifications')
            }}
            mobile={!isDesktop}
        />
    )

    return (
        <div className="relative shrink-0">
            <Button
                ref={buttonRef}
                type="button"
                variant="ghost"
                size="icon"
                onClick={onButtonClick}
                aria-label={
                    unreadTotal > 0
                        ? `Open notifications, ${unreadTotal} unread`
                        : 'Open notifications'
                }
                aria-expanded={open}
                className={`relative h-10 w-10 rounded-full transition ${open ? 'bg-accent text-accent-foreground' : ''}`}
            >
                {unreadTotal > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                {unreadTotal > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-background">
                        {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                )}
            </Button>

            <div className="absolute right-0 top-full hidden pt-2 xl:block">
                <DropdownMenu
                    open={open && isDesktop}
                    onOpenChange={(nextOpen) => {
                        setOpen(nextOpen)
                        if (!nextOpen) requestAnimationFrame(() => buttonRef.current?.focus())
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 top-0 h-0 w-0 overflow-hidden opacity-0"
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        avoidCollisions
                        collisionPadding={16}
                        className="w-[410px] overflow-hidden p-0"
                    >
                        {content}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {open && !isDesktop && (
                            <motion.div
                                key="responsive-notification-menu"
                                className="fixed inset-0 z-[2147483001] xl:hidden"
                            >
                                <motion.button
                                    type="button"
                                    aria-label="Close notifications"
                                    onClick={closePanel}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                                />
                                <motion.aside
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Notifications"
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:w-[420px] sm:max-w-[92vw]"
                                >
                                    <div className="flex items-center justify-between border-b px-4 py-4">
                                        <div>
                                            <h2 className="text-lg font-bold">Notifications</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {unreadTotal > 0
                                                    ? `${unreadTotal} unread`
                                                    : 'You are all caught up'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closePanel}
                                            aria-label="Close notifications"
                                            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-hidden">{content}</div>
                                </motion.aside>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

function NotificationPanel({
    filter,
    setFilter,
    notifications,
    unreadTotal,
    isLoading,
    isFetching,
    markAllPending,
    onMarkAllRead,
    onNotificationClick,
    onSeeAll,
    mobile,
}: {
    filter: NotificationFilter
    setFilter: (filter: NotificationFilter) => void
    notifications: AppNotification[]
    unreadTotal: number
    isLoading: boolean
    isFetching: boolean
    markAllPending: boolean
    onMarkAllRead: () => void
    onNotificationClick: (notification: AppNotification) => void
    onSeeAll: () => void
    mobile: boolean
}) {
    return (
        <div className={`flex min-h-0 flex-col ${mobile ? 'h-full' : 'max-h-[min(70vh,620px)]'}`}>
            {!mobile && (
                <div className="border-b px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold">Notifications</h2>
                            <p className="text-xs text-muted-foreground">
                                {unreadTotal > 0
                                    ? `${unreadTotal} unread`
                                    : 'You are all caught up'}
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={unreadTotal === 0 || markAllPending}
                            onClick={onMarkAllRead}
                        >
                            <CheckCheck className="mr-1 h-4 w-4" />
                            Mark all read
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
                <div className="flex rounded-full bg-muted p-1">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('unread')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === 'unread' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Unread{unreadTotal > 0 ? ` ${unreadTotal}` : ''}
                    </button>
                </div>
                {mobile && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={unreadTotal === 0 || markAllPending}
                        onClick={onMarkAllRead}
                    >
                        <CheckCheck className="mr-1 h-4 w-4" />
                        Mark all
                    </Button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading || (isFetching && notifications.length === 0) ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                        </span>
                        <p className="mt-3 text-sm font-semibold">
                            {filter === 'unread'
                                ? 'No unread notifications'
                                : 'No notifications yet'}
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                            New messages, commissions, shop sales, comments, and account updates
                            will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <NotificationRow
                                key={notification.id}
                                notification={notification}
                                onClick={() => onNotificationClick(notification)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t bg-background p-3">
                <Button type="button" variant="outline" className="w-full" onClick={onSeeAll}>
                    See all notifications
                </Button>
            </div>
        </div>
    )
}

function NotificationRow({
    notification,
    onClick,
}: {
    notification: AppNotification
    onClick: () => void
}) {
    const unread = !notification.read_at
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/70 ${unread ? 'bg-red-500/[0.06]' : 'bg-background'}`}
        >
            <NotificationAvatar notification={notification} />
            <span className="min-w-0 flex-1">
                <span
                    className={`block text-sm leading-5 ${unread ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}
                >
                    {notification.title}
                </span>
                {notification.body && (
                    <span className="mt-0.5 block overflow-hidden text-ellipsis text-xs leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {notification.body}
                    </span>
                )}
                <span className="mt-1 block text-[11px] font-medium text-primary">
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

function NotificationAvatar({ notification }: { notification: AppNotification }) {
    const [avatarFailed, setAvatarFailed] = useState(false)
    const avatarPath = notification.meta?.actor_avatar
    const avatarUrl = avatarPath && !avatarFailed ? storageUrl(avatarPath) : null

    useEffect(() => {
        setAvatarFailed(false)
    }, [avatarPath])

    if (avatarUrl) {
        return (
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                />
            </span>
        )
    }

    const Icon = notificationIcon(notification)
    return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <Icon className="h-5 w-5" />
        </span>
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
    if (notification.category === 'new_follower') return UserPlus
    if (notification.category === 'likes') return Heart
    if (notification.category === 'creator_announcement') return Megaphone
    if (notification.category === 'new_supporter') return Sparkles
    return Bell
}

export function relativeNotificationTime(value: string) {
    const timestamp = new Date(value).getTime()
    if (!Number.isFinite(timestamp)) return ''
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d`
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
