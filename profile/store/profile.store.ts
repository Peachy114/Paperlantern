// features/profile/store/profile.store.ts
import { create } from 'zustand'
import type { ProfileUser } from '../schemas/profile.schema'

type ProfileState = {
    user: ProfileUser | null
    isPanelOpen: boolean
    setUser: (user: ProfileUser | null) => void
    setCredits: (credits: number) => void
    openPanel: () => void
    closePanel: () => void
    togglePanel: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
    user: null,
    isPanelOpen: false,

    setUser: (user) => set({ user }),

    setCredits: (credits) =>
        set((state) => ({
            user: state.user ? { ...state.user, credits } : state.user,
        })),

    openPanel: () => set({ isPanelOpen: true }),
    closePanel: () => set({ isPanelOpen: false }),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}))
