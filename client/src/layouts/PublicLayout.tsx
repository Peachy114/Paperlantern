import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NavbarWrapper from '@/components/pages/NavbarWrapper'
import AuthModal from '@/components/shared/AuthModal'
import Footer from '@/components/pages/Footer'
import RotateScreen from '@/components/pages/RotateScreen'
import Subscribe from '@/components/pages/Subscribe'

export default function PublicLayout() {
    const [showRotateScreen, setShowRotateScreen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkDevice = () => {
            const isMobileDevice =
                /Android|iPhone|iPad|webOS|BlackBerry/i.test(navigator.userAgent) ||
                navigator.maxTouchPoints > 0

            const isLandscape = window.innerWidth >= window.innerHeight

            setShowRotateScreen(isMobileDevice && isLandscape)
            setIsMobile(isMobileDevice)
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
        return <RotateScreen />
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black/70">
            <div className="flex-1">
                <NavbarWrapper />
                <main className="overflow-hidden max-w-[1360px] mx-auto py-3 md:pt-3 pt-16 mt-20">
                    <Outlet />
                </main>
            </div>

            <AuthModal />
            <div>
                <Subscribe />
                <Footer />
            </div>
        </div>
    )
}
