import { lazy, Suspense, useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import { useModalStore } from '@/store/modalStore'

const AuthModal = lazy(() => import('@/components/shared/AuthModal'))
const Footer = lazy(() => import('@/components/layout/Footer'))
const RotateScreen = lazy(() => import('@/components/layout/RotateScreen'))
const Subscribe = lazy(() => import('@/components/layout/Subscribe'))

export default function PublicLayout() {
    const [showRotateScreen, setShowRotateScreen] = useState(false)

    useEffect(() => {
        const checkDevice = () => {
            const isMobileDevice =
                /Android|iPhone|iPad|webOS|BlackBerry/i.test(navigator.userAgent) ||
                navigator.maxTouchPoints > 0

            const isLandscape = window.innerWidth >= window.innerHeight

            setShowRotateScreen(isMobileDevice && isLandscape)
        }

        checkDevice()
        window.addEventListener('resize', checkDevice)
        window.addEventListener('orientationchange', checkDevice)

        return () => {
            window.removeEventListener('resize', checkDevice)
            window.removeEventListener('orientationchange', checkDevice)
        }
    }, [])

    if (showRotateScreen) {
        return (
            <Suspense fallback={null}>
                <RotateScreen />
            </Suspense>
        )
    }

    return (
        <div className="relative flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-black dark:via-zinc-900 dark:to-black">
            <div className="relative z-10 flex-1">
                <NavbarWrapper />
                <main className="overflow-hidden w-full">
                    <Outlet />
                </main>
            </div>

            <LazyAuthModal />
            <div className="relative z-10">
                <Suspense fallback={null}>
                    <Subscribe />
                    <Footer />
                </Suspense>
            </div>
        </div>
    )
}

function LazyAuthModal() {
    const isOpen = useModalStore((state) => state.isOpen)

    if (!isOpen) return null

    return (
        <Suspense fallback={null}>
            <AuthModal />
        </Suspense>
    )
}
