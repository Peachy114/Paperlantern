import { create } from 'zustand'

type ModalView = 'login' | 'register'

interface ModalState {
    isOpen: boolean
    view: ModalView
    openLogin: () => void
    openRegister: () => void
    close: () => void
}

export const useModalStore = create<ModalState>()((set) => ({
    isOpen: false,
    view: 'login',
    openLogin: () => set({ isOpen: true, view: 'login' }),
    openRegister: () => set({ isOpen: true, view: 'register' }),
    close: () => set({ isOpen: false }),
}))
