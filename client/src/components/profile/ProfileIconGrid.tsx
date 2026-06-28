import { Link } from 'react-router-dom'
import { BookOpen, Megaphone, Receipt, Settings, Shield, Sparkles } from 'lucide-react'

interface Props {
    isStoryteller: boolean
    isAdmin: boolean
    onClose: () => void
}

export default function ProfileIconGrid({ isStoryteller, isAdmin, onClose }: Props) {
    const items = [
        ...(isAdmin ? [{ label: 'Admin', icon: Shield, to: '/admin' }] : []),
        ...(isAdmin
            ? []
            : [
                  {
                      label: isStoryteller ? 'My Series' : 'Become Storyteller',
                      icon: isStoryteller ? BookOpen : Sparkles,
                      to: isStoryteller ? '/studio' : '/become-creator',
                  },
              ]),
        ...(isAdmin
            ? [{ label: 'Announce', icon: Megaphone, to: '/admin/announcements' }]
            : [{ label: 'Transaction', icon: Receipt, to: '/transaction' }]),
        { label: 'Settings', icon: Settings, to: '/settings' },
    ]

    return (
        <div className="flex justify-around gap-1">
            {items.map(({ label, icon: Icon, to }) => (
                <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className="flex flex-col items-center gap-1.5 min-w-[52px]"
                >
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-muted-foreground text-center leading-tight">
                        {label}
                    </span>
                </Link>
            ))}
        </div>
    )
}
