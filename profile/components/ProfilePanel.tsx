// features/profile/components/ProfilePanel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../store/profile.store'
import { useLogout } from '../hooks/useLogout'
import ProfileAvatarButton from './ProfileAvatarButton'
import ProfileHeader from './ProfileHeader'
import MembershipPromoBanner from './MembershipPromoBanner'
import CreditsBalanceRow from './CreditsBalanceRow'
import ProfileMenuList from './ProfileMenuList'

export default function ProfilePanel() {
    const user = useProfileStore((s) => s.user)
    const isPanelOpen = useProfileStore((s) => s.isPanelOpen)
    const togglePanel = useProfileStore((s) => s.togglePanel)
    const closePanel = useProfileStore((s) => s.closePanel)
    const { logout } = useLogout()

    const panelRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                !triggerRef.current?.contains(e.target as Node)
            ) {
                closePanel()
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [closePanel])

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePanel()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [closePanel])

    if (!user) return null

    return (
        <div className="relative inline-block">
            <ProfileAvatarButton ref={triggerRef} user={user} onClick={togglePanel} />

            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-[300px] z-[90] border-[3px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1e1b14] overflow-hidden"
                        style={{ boxShadow: '6px 6px 0 #1a1a1a' }}
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-[4px]"
                            style={{
                                background:
                                    'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
                            }}
                        />

                        <ProfileHeader user={user} />

                        <div className="px-4">
                            <MembershipPromoBanner />
                            <CreditsBalanceRow credits={user.credits} />
                        </div>

                        <ProfileMenuList />

                        <div className="h-[2px] bg-foreground/10 mx-4 my-1" />

                        <button
                            onClick={logout}
                            className="w-full text-center py-3.5 text-[13px] font-semibold tracking-[0.05em] text-[#b91c4a] dark:text-[#f77c9b] hover:bg-foreground/5 transition-colors"
                        >
                            Sign out
                        </button>

                        <div
                            className="absolute bottom-0 left-0 right-0 h-[3px]"
                            style={{
                                background:
                                    'linear-gradient(90deg, #b45309 0%, #d97706 50%, #e8a838 100%)',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
