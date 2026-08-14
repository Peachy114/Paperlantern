import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type PublicProfileRole =
    | 'super_admin'
    | 'storyteller'
    | 'wanderer'
    | string
    | null
    | undefined

export function publicProfilePath(
    username?: string | null,
    role?: PublicProfileRole
): string | null {
    const normalizedUsername = username?.trim()

    if (!normalizedUsername) {
        return null
    }

    const encodedUsername = encodeURIComponent(normalizedUsername)

    return role === 'storyteller' || role === 'super_admin'
        ? `/artists/${encodedUsername}`
        : `/users/${encodedUsername}`
}

export default function ViewProfileLink({
    username,
    role,
    label,
    className,
    onClick,
    compact = false,
}: {
    username?: string | null
    role?: PublicProfileRole
    label?: ReactNode
    className?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
    compact?: boolean
}) {
    const to = publicProfilePath(username, role)

    if (!to) {
        return null
    }

    return (
        <Link
            to={to}
            onClick={onClick}
            className={cn(
                'inline-block truncate font-bold text-foreground transition-colors hover:text-sky-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                compact ? 'max-w-[130px] text-xs' : 'max-w-[190px]',
                className
            )}
        >
            {label ?? username}
        </Link>
    )
}
