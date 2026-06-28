import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import NavbarWrapper from '@/components/pages/NavbarWrapper'
import { Toaster } from '@/components/ui/sonner'

export default function AuthLayout() {
    const { token } = useAuthStore()

    if (!token) return <Navigate to="/" replace />

    return (
        <>
            <div className="relative z-10 flex flex-col min-h-screen bg-white dark:bg-black/70">
                <NavbarWrapper />
                <main className="w-full flex-1 max-w-[1360px] mx-auto py-3 px-1 mb-32 mt-20">
                    <Outlet />
                </main>
            </div>

            <Toaster richColors position="top-center" />
        </>
    )
}
