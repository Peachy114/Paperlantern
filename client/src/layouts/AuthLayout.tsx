import { useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import NavbarWrapper from '@/components/layout/NavbarWrapper'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth'
import { toast } from 'sonner'

export default function AuthLayout() {
    const { token, user } = useAuthStore()
    const [resending, setResending] = useState(false)
    const location = useLocation()
    const isPageCustomizer = location.pathname === '/admin/customize'
    const needsEmailVerification = Boolean(
        user && user.role !== 'super_admin' && user.email_verified === false
    )

    const resendVerificationCode = async () => {
        if (!user?.email || resending) return

        setResending(true)
        try {
            const response = await authApi.resendEmailVerificationCode({ email: user.email })
            toast.success(response.data?.message ?? 'A new verification code was sent.')
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Could not send a verification code.')
        } finally {
            setResending(false)
        }
    }

    if (!token) return <Navigate to="/" replace />

    return (
        <>
            <div
                className="relative z-10 flex flex-col min-h-screen bg-background text-foreground overflow-hidden"
                style={{ userSelect: 'none' }}
            >
                <div className="relative z-10 flex flex-col flex-1 select-none">
                    <NavbarWrapper />
                    {needsEmailVerification && (
                        <div className="mx-auto mt-3 flex w-[calc(100%-1rem)] max-w-[920px] flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold">Verify your email to keep your account secure.</p>
                                <p className="text-xs opacity-80">
                                    Request a new code, or update your email from Profile Settings.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={resendVerificationCode}
                                    disabled={resending}
                                    className="border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-500/40 dark:bg-background/70 dark:text-amber-100"
                                >
                                    {resending ? 'Sending...' : 'Request code'}
                                </Button>
                                <Button asChild size="sm" variant="secondary">
                                    <Link to="/settings/profile">Change email</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                    <main
                        className={
                            isPageCustomizer
                                ? 'w-full flex-1 max-w-none mx-0 py-0 px-0 mb-0 select-none'
                                : 'w-full flex-1 max-w-[1480px] mx-auto py-3 px-1 mb-32 select-none'
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
