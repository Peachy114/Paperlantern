import { Link } from 'react-router-dom'
import {
    BookOpen,
    Clock,
    Heart,
    Images,
    Layers,
    Megaphone,
    MessageCircle,
    Receipt,
    Shield,
    Sparkles,
} from 'lucide-react'

interface Props {
    isStoryteller: boolean
    isAdmin: boolean
    onClose: () => void
}

export default function ProfileIconGrid({ isStoryteller, isAdmin, onClose }: Props) {
    const primaryItems = isAdmin
        ? [
              { label: 'Admin', icon: Shield, to: '/admin' },
              { label: 'Arts', icon: Images, to: '/admin/arts' },
              { label: 'Announce', icon: Megaphone, to: '/admin/announcements' },
          ]
        : isStoryteller
          ? [
                { label: 'My Series', icon: BookOpen, to: '/studio' },
                { label: 'My Arts', icon: Images, to: '/arts' },
                { label: 'Transaction', icon: Receipt, to: '/transaction' },
            ]
          : [
                { label: 'Favorites', icon: Heart, to: '/favorites' },
                { label: 'My Comments', icon: MessageCircle, to: '/comments' },
                { label: 'Transaction', icon: Receipt, to: '/transaction' },
            ]

    const secondaryItems = isAdmin
        ? []
        : [
              ...(isStoryteller
                  ? [
                        { label: 'Favorites', icon: Heart, to: '/favorites' },
                        { label: 'Comments', icon: MessageCircle, to: '/comments' },
                    ]
                  : [{ label: 'Become Storyteller', icon: Sparkles, to: '/become-creator' }]),
              { label: 'My Stickers', icon: Layers, to: '/stickers' },
              { label: 'History', icon: Clock, to: '/history' },
          ]

    return (
        <div className="grid gap-3">
            <MenuRow items={primaryItems} onClose={onClose} />
            {secondaryItems.length > 0 && <MenuRow items={secondaryItems} onClose={onClose} />}
        </div>
    )
}

type MenuItem = {
    label: string
    icon: typeof BookOpen
    to: string
}

function MenuRow({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {items.map(({ label, icon: Icon, to }) => (
                <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className="flex min-w-0 flex-col items-center gap-1.5"
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
