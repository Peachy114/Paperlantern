import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import NavbarWrapper from '@/components/pages/NavbarWrapper'
import AuthModal from '@/components/shared/AuthModal'
import Footer from '@/components/pages/Footer'
import RotateScreen from '@/components/pages/RotateScreen'
import Subscribe from '@/components/pages/Subscribe'

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
        return <RotateScreen />
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-white dark:bg-black/70 overflow-hidden">
            <div className="relative z-10 flex-1">
                <NavbarWrapper />
                <main className="overflow-hidden w-full">
                    <Outlet />
                </main>
            </div>

            <AuthModal />
            <div className="relative z-10">
                <Subscribe />
                <Footer />
            </div>
        </div>
    )
}

//max-w-[1360px] mx-auto py-3 md:pt-3 pt-16 mt-20
