import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import { Toaster } from '@/components/ui/sonner'

export default function AuthLayout() {
    const { token } = useAuthStore()
    const location = useLocation()
    const isPageCustomizer = location.pathname === '/admin/customize'

    if (!token) return <Navigate to="/" replace />

    return (
        <>
            <div
                className="relative z-10 flex flex-col min-h-screen bg-white dark:bg-black/70 overflow-hidden"
                style={{ userSelect: 'none' }}
            >
                <div className="relative z-10 flex flex-col flex-1 select-none">
                    <NavbarWrapper />
                    <main
                        className={
                            isPageCustomizer
                                ? 'w-full flex-1 max-w-none mx-0 py-0 px-0 mb-0 select-none'
                                : 'w-full flex-1 max-w-[1360px] mx-auto py-3 px-1 mb-32 select-none'
                        }
                    >
                        <Outlet />
                    </main>
                </div>
            </div>

            <Toaster richColors position="top-center" />
        </>
    )
}
