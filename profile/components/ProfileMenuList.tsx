// features/profile/components/ProfileMenuList.tsx
import Link from 'next/link'

type MenuItemProps = {
    href: string
    label: string
}

function MenuItem({ href, label }: MenuItemProps) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between px-4 py-3 text-[13px] font-medium text-foreground dark:text-[#e8dfc8] hover:bg-foreground/5 transition-colors"
        >
            {label}
            <span className="text-foreground/40">›</span>
        </Link>
    )
}

export default function ProfileMenuList() {
    return (
        <div className="flex flex-col">
            <MenuItem href="/transactions" label="Transactions" />
            <MenuItem href="/settings" label="Settings" />
            <MenuItem href="/help-center" label="Help Center" />
        </div>
    )
}
