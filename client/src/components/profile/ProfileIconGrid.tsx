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
    Wallet,
    type LucideIcon,
} from 'lucide-react'

interface Props {
    isStoryteller: boolean
    isAdmin: boolean
    accountMenuStyle?: 'circular' | 'detailed'
    onClose: () => void
}

export default function ProfileIconGrid({
    isStoryteller,
    isAdmin,
    accountMenuStyle = 'circular',
    onClose,
}: Props) {
    const primaryItems = isAdmin
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
                { label: 'Commission', icon: BriefcaseBusiness, to: '/commission' },
            ]
          : [
                { label: 'Favorites', icon: Heart, to: '/favorites' },
                { label: 'Commission', icon: BriefcaseBusiness, to: '/commission' },
                { label: 'Messages', icon: MessageCircle, to: '/messages' },
            ]

    const secondaryItems = isAdmin
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
        return <ArtistMenu onClose={onClose} />
    }

    const circularItems = [...primaryItems, ...secondaryItems]

    return (
        <div className="grid gap-2">
            <MenuRow items={circularItems} onClose={onClose} />
        </div>
    )
}

type MenuItem = {
    label: string
    icon: LucideIcon
    to: string
    description?: string
}

function ArtistMenu({ onClose }: { onClose: () => void }) {
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
                    label: 'Commission',
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
                            <ArtistMenuItem key={item.label} item={item} onClose={onClose} />
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm ring-1 ring-border transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight text-foreground">{item.label}</span>
                {item.description && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.description}
                    </span>
                )}
            </span>
        </Link>
    )
}

function MenuRow({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
    return (
        <div className={`grid gap-x-2 gap-y-3 ${items.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {items.map(({ label, icon: Icon, to }) => (
                <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition hover:bg-muted/50"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-center text-[11px] leading-tight text-muted-foreground">
                        {label}
                    </span>
                </Link>
            ))}
        </div>
    )
}
