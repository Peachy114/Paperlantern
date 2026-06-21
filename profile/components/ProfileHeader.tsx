// features/profile/components/ProfileHeader.tsx
import type { ProfileUser } from '../schemas/profile.schema'

function getInitials(name: string) {
    return name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function getProviderLabel(provider: ProfileUser['loginProvider']) {
    switch (provider) {
        case 'facebook':
            return 'Facebook account'
        case 'google':
            return 'Google account'
        case 'email':
            return 'Email account'
        default:
            return null
    }
}

export default function ProfileHeader({ user }: { user: ProfileUser }) {
    const providerLabel = getProviderLabel(user.loginProvider)

    return (
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
            <div
                className="w-11 h-11 rounded-full border-2 border-[#1a1a1a] overflow-hidden flex items-center justify-center bg-[#f77c9b] shrink-0"
                style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
            >
                {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-[14px] font-bold text-[#fffdf5]">
                        {getInitials(user.name)}
                    </span>
                )}
            </div>
            <div>
                <div className="text-[13.5px] font-semibold text-foreground dark:text-[#e8dfc8] tracking-[0.02em]">
                    {user.name}
                </div>
                {providerLabel && (
                    <div className="text-[11px] text-foreground/50 dark:text-[#e8dfc8]/50">
                        {providerLabel}
                    </div>
                )}
            </div>
        </div>
    )
}
