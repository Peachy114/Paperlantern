import { useModalStore } from '@/store/modalStore'
import LoginForm from '@/features/auth/pages/LoginForm'
import RegisterForm from '@/features/auth/pages/RegisterForm'

export default function AuthModal() {
    const { isOpen, view, openLogin, openRegister, close } = useModalStore()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm bg-background dark:bg-neutral-950 border border-border rounded-xl shadow-lg overflow-hidden"
            >
                <div className="relative w-full">
                    {/* LOGOO */}
                    <div className="flex justify-center items-center w-full mt-4">
                        <div className="shrink-0">
                            <img
                                src="/logo_white.png"
                                alt="logo"
                                width={100}
                                height={100}
                                className="dark:block hidden"
                            />

                            <img
                                src="/logo_black.png"
                                alt="logo"
                                width={100}
                                height={100}
                                className="dark:hidden block"
                            />
                        </div>
                    </div>

                    <button
                        onClick={close}
                        className="absolute right-2 top-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M1 1L13 13M13 1L1 13"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            {view === 'login' ? 'Welcome back' : 'Get started'}
                        </p>
                        <h2 className="text-base font-semibold text-foreground leading-tight">
                            {view === 'login' ? 'Log in to your account' : 'Create an account'}
                        </h2>
                    </div>
                </div>

                {/* Form */}
                <div className="px-5 py-5">
                    {view === 'login' ? <LoginForm /> : <RegisterForm />}
                </div>

                {/* GOOGLE */}

                <div className="px-10">
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <a
                        href={`${import.meta.env.VITE_API_URL}/auth/google/redirect`}
                        target="__blank"
                        className="flex items-center justify-center gap-2 border border-border rounded-md py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                        Continue with Google
                    </a>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 text-center mt-5">
                    <span className="text-xs text-muted-foreground">
                        {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    </span>
                    <button
                        onClick={view === 'login' ? openRegister : openLogin}
                        className="text-xs font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                        {view === 'login' ? 'Sign up' : 'Log in'}
                    </button>

                    <span className="w-full flex justify-center mt-5">
                        <p className="text-xs text-foreground dark:text-white">Powered by</p>
                        <img src="/devorbit_logo.png" alt="devorbit logo" width={20} height={20} />
                    </span>
                </div>
            </div>
        </div>
    )
}
