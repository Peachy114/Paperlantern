// features/profile/components/ProfileAvatarButton.tsx
'use client'

import { forwardRef } from 'react'
import type { ProfileUser } from '../schemas/profile.schema'

type Props = {
    user: ProfileUser
    onClick: () => void
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

const ProfileAvatarButton = forwardRef<HTMLButtonElement, Props>(({ user, onClick }, ref) => {
    return (
        <button
            ref={ref}
            onClick={onClick}
            aria-label="Open profile menu"
            className="relative w-9 h-9 rounded-full border-2 border-[#1a1a1a] overflow-hidden flex items-center justify-center bg-[#f77c9b] shrink-0"
            style={{ boxShadow: '2px 2px 0 #1a1a1a' }}
        >
            {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-[12px] font-bold text-[#fffdf5]">
                    {getInitials(user.name)}
                </span>
            )}
        </button>
    )
})

ProfileAvatarButton.displayName = 'ProfileAvatarButton'
export default ProfileAvatarButton
