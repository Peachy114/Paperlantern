import { Link } from 'react-router-dom'
import {
    BookOpen,
    Bell,
    BriefcaseBusiness,
    Clock,
    Coins,
    Crown,
    Heart,
    Images,
    Layers,
    MessageCircle,
    Newspaper,
    Receipt,
    Shield,
    Sparkles,
    ShoppingBag,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import { useNotificationCenter } from '@/hooks/useNotificationCenter'
import type { NotificationAttention } from '@/api/account'

interface Props {
    isStoryteller: boolean
    isAdmin: boolean
    accountMenuStyle?: 'circular' | 'detailed'
    onClose: () => void
}

type MenuItem = {
    label: string
    icon: LucideIcon
    to: string
    description?: string
    dot?: boolean
}

export default function ProfileIconGrid({
    isStoryteller,
    isAdmin,
    accountMenuStyle = 'circular',
    onClose,
}: Props) {
    const { attention } = useNotificationCenter()

    const primaryItems: MenuItem[] = isAdmin
        ? [
              { label: 'Admin', icon: Shield, to: '/admin' },
              { label: 'Arts', icon: Images, to: '/admin/arts' },
              { label: 'Top Up', icon: Coins, to: '/admin/top-up-settings' },
              { label: 'Messages', icon: MessageCircle, to: '/messages' },
              { label: 'Earnings', icon: Wallet, to: '/admin/earnings' },
              { label: 'Expenses', icon: Receipt, to: '/expenses' },
          ]
        : isStoryteller
          ? [
                { label: 'My Series', icon: BookOpen, to: '/studio' },
                { label: 'My Arts', icon: Images, to: '/arts' },
                { label: 'My Shop', icon: ShoppingBag, to: '/my-shop' },
                { label: 'My Commission', icon: BriefcaseBusiness, to: '/commission' },
            ]
          : [
                { label: 'Favorites', icon: Heart, to: '/favorites' },
                { label: 'My Commission', icon: BriefcaseBusiness, to: '/commission' },
                { label: 'Messages', icon: MessageCircle, to: '/messages' },
            ]

    const secondaryItems: MenuItem[] = isAdmin
        ? []
        : [
              ...(isStoryteller
                  ? [
                        { label: 'Favorites', icon: Heart, to: '/favorites' },
                        { label: 'Messages', icon: MessageCircle, to: '/messages' },
                        { label: 'Earnings', icon: Wallet, to: '/earnings' },
                        { label: 'Withdrawals', icon: Coins, to: '/withdrawals' },
                        { label: 'Expenses', icon: Receipt, to: '/expenses' },
                        { label: 'Credits', icon: Coins, to: '/credits' },
                        { label: 'Notifications', icon: Bell, to: '/notifications' },
                        { label: 'Feeds', icon: Newspaper, to: '/feeds' },
                    ]
                  : [
                        { label: 'My Comments', icon: MessageCircle, to: '/comments' },
                        { label: 'Earnings', icon: Wallet, to: '/earnings' },
                        { label: 'Withdrawals', icon: Coins, to: '/withdrawals' },
                        { label: 'Expenses', icon: Receipt, to: '/expenses' },
                        { label: 'Credits', icon: Coins, to: '/credits' },
                        { label: 'Notifications', icon: Bell, to: '/notifications' },
                        { label: 'Feeds', icon: Newspaper, to: '/feeds' },
                        { label: 'Become Storyteller', icon: Sparkles, to: '/become-creator' },
                    ]),
              { label: 'My Stickers', icon: Layers, to: '/stickers' },
              { label: 'Noble Royalty', icon: Crown, to: '/noble-royalty' },
              { label: 'Subscription', icon: Sparkles, to: '/subscriptions' },
              { label: 'History', icon: Clock, to: '/history' },
          ]

    if (isStoryteller && !isAdmin && accountMenuStyle === 'detailed') {
        return <ArtistMenu attention={attention} onClose={onClose} />
    }

    const circularItems = orderCircularItems(
        [...primaryItems, ...secondaryItems].map((item) => ({
            ...item,
            dot: itemNeedsAttention(item.label, attention),
        })),
        isAdmin,
        isStoryteller
    )

    return (
        <div className="grid gap-2">
            <MenuRow items={circularItems} onClose={onClose} />
        </div>
    )
}

function ArtistMenu({
    attention,
    onClose,
}: {
    attention: NotificationAttention
    onClose: () => void
}) {
    const sections: { title: string; items: MenuItem[] }[] = [
        {
            title: 'Studio',
            items: [
                {
                    label: 'My Series',
                    icon: BookOpen,
                    to: '/studio',
                    description: 'Works, chapters, analytics',
                },
                {
                    label: 'My Arts',
                    icon: Images,
                    to: '/arts',
                    description: 'Posts, comments, boosts',
                },
                {
                    label: 'My Shop',
                    icon: ShoppingBag,
                    to: '/my-shop',
                    description: 'Download products and adoptables',
                },
                {
                    label: 'My Commission',
                    icon: BriefcaseBusiness,
                    to: '/commission',
                    description: 'Services, orders, messages',
                },
            ],
        },
        {
            title: 'Activity',
            items: [
                {
                    label: 'Favorites',
                    icon: Heart,
                    to: '/favorites',
                    description: 'Saved webtoons and novels',
                },
                {
                    label: 'Messages',
                    icon: MessageCircle,
                    to: '/messages',
                    description: 'Commission conversations',
                },
                {
                    label: 'Earnings',
                    icon: Wallet,
                    to: '/earnings',
                    description: 'Income and withdrawals',
                },
                {
                    label: 'Withdrawals',
                    icon: Coins,
                    to: '/withdrawals',
                    description: 'Payout requests',
                },
                {
                    label: 'Expenses',
                    icon: Receipt,
                    to: '/expenses',
                    description: 'Expense history',
                },
                {
                    label: 'Credits',
                    icon: Coins,
                    to: '/credits',
                    description: 'Top up and payment history',
                },
                {
                    label: 'Notifications',
                    icon: Bell,
                    to: '/notifications',
                    description: 'Releases, likes, messages, and credits',
                },
                {
                    label: 'Feeds',
                    icon: Newspaper,
                    to: '/feeds',
                    description: 'Create posts and follow updates',
                },
            ],
        },
        {
            title: 'Library',
            items: [
                {
                    label: 'My Stickers',
                    icon: Layers,
                    to: '/stickers',
                    description: 'Sticker uploads and bundles',
                },
                {
                    label: 'Noble Royalty',
                    icon: Crown,
                    to: '/noble-royalty',
                    description: 'Browse stickers, borders, and designs',
                },
                {
                    label: 'Subscription',
                    icon: Sparkles,
                    to: '/subscriptions',
                    description: 'Plans, board limits, boosts',
                },
                {
                    label: 'History',
                    icon: Clock,
                    to: '/history',
                    description: 'Reads, likes, comments, buys',
                },
            ],
        },
    ]

    return (
        <div className="space-y-3">
            {sections.map((section) => (
                <section key={section.title} className="space-y-1.5">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {section.title}
                    </p>
                    <div className="grid gap-1.5">
                        {section.items.map((item) => (
                            <ArtistMenuItem
                                key={item.label}
                                item={{ ...item, dot: itemNeedsAttention(item.label, attention) }}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}

function ArtistMenuItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
    const Icon = item.icon
    return (
        <Link
            to={item.to}
            onClick={onClose}
            className="group flex items-center gap-3 rounded-lg border border-transparent bg-muted/35 px-3 py-2.5 transition hover:border-border hover:bg-muted"
        >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm ring-1 ring-border transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
                {item.dot && <AccountAttentionDot />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight text-foreground">
                    {item.label}
                </span>
                {item.description && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.description}
                    </span>
                )}
            </span>
            {item.dot && (
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"
                    aria-label="Needs attention"
                />
            )}
        </Link>
    )
}

function MenuRow({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
            {items.map(({ label, icon: Icon, to, dot }) => (
                <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition hover:bg-muted/50"
                >
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
                        <Icon className="h-4 w-4" />
                        {dot && <AccountAttentionDot />}
                    </div>
                    <span className="text-center text-[11px] leading-tight text-muted-foreground">
                        {label}
                    </span>
                </Link>
            ))}
        </div>
    )
}

function AccountAttentionDot() {
    return (
        <span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-600 ring-2 ring-background"
            aria-label="Needs attention"
        />
    )
}

function itemNeedsAttention(label: string, attention: NotificationAttention) {
    if (label === 'Messages') return attention.messages
    if (label === 'My Commission') return attention.commissions
    if (label === 'My Shop') return attention.shop
    if (label === 'My Comments') return attention.comments
    if (label === 'My Arts') return attention.arts
    if (label === 'Earnings' || label === 'Withdrawals') return attention.earnings
    if (label === 'Notifications') return attention.notifications
    return false
}

function orderCircularItems(items: MenuItem[], isAdmin: boolean, isStoryteller: boolean) {
    const order = isAdmin
        ? ['Admin', 'Messages', 'Arts', 'Top Up', 'Earnings', 'Expenses']
        : isStoryteller
          ? [
                'My Series',
                'My Arts',
                'My Shop',
                'My Commission',
                'Messages',
                'Favorites',
                'Earnings',
                'Withdrawals',
                'Expenses',
                'Credits',
                'Notifications',
                'Feeds',
                'My Stickers',
                'Noble Royalty',
                'Subscription',
                'History',
            ]
          : [
                'Favorites',
                'My Commission',
                'Messages',
                'My Comments',
                'Earnings',
                'Withdrawals',
                'Expenses',
                'Credits',
                'Notifications',
                'Feeds',
                'My Stickers',
                'Noble Royalty',
                'Subscription',
                'History',
                'Become Storyteller',
            ]
    const rank = new Map(order.map((label, index) => [label, index]))
    return [...items].sort(
        (a, b) =>
            (rank.get(a.label) ?? 999) - (rank.get(b.label) ?? 999) ||
            a.label.localeCompare(b.label)
    )
}
