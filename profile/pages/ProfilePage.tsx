// features/profile/pages/ProfilePage.tsx
'use client'

import { useProfile } from '../hooks/useProfile'
import { useProfileStore } from '../store/profile.store'
import ProfileHeader from '../components/ProfileHeader'
import MembershipPromoBanner from '../components/MembershipPromoBanner'
import CreditsBalanceRow from '../components/CreditsBalanceRow'

/**
 * Standalone profile page — useful for a dedicated /profile route,
 * separate from the dropdown panel used in the navbar.
 */
export default function ProfilePage() {
    const { loading, error } = useProfile()
    const user = useProfileStore((s) => s.user)

    if (loading) {
        return <div className="px-6 py-10 text-center text-foreground/60">Loading profile…</div>
    }

    if (error || !user) {
        return (
            <div className="px-6 py-10 text-center text-foreground/60">
                Couldn&apos;t load your profile. Please try logging in again.
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <div
                className="border-[3px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1e1b14] overflow-hidden"
                style={{ boxShadow: '6px 6px 0 #1a1a1a' }}
            >
                <ProfileHeader user={user} />
                <div className="px-4 pb-4">
                    <MembershipPromoBanner />
                    <CreditsBalanceRow credits={user.credits} />
                </div>
            </div>
        </div>
    )
}
