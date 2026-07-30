import { useModalStore } from '@/store/modalStore'
import LoginForm from '@/features/auth/pages/LoginForm'
import RegisterForm from '@/features/auth/pages/RegisterForm'
import ThemedLogo from '@/components/layout/ThemedLogo'

export default function AuthModal() {
    const { isOpen, view, openLogin, openRegister, close } = useModalStore()

    if (!isOpen) return null

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                overflow-y-auto
                bg-black/50
                p-4
            "
            onClick={close}
        >
            <div className="flex min-h-full items-center justify-center">
                <div
                    onClick={(event) => event.stopPropagation()}
                    className="
                        relative
                        my-auto
                        w-full
                        max-w-sm
                        max-h-[calc(100dvh-2rem)]
                        overflow-y-auto
                        overscroll-contain
                        rounded-xl
                        border
                        border-border
                        bg-background
                        shadow-lg
                        [scrollbar-gutter:stable]
                        dark:bg-neutral-950
                    "
                >
                    {/* Logo and close button */}
                    <div className="relative w-full">
                        <div className="flex w-full items-center justify-center pt-4">
                            <div className="shrink-0">
                                <ThemedLogo width={50} height={50} decoding="async" />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={close}
                            className="
                                sticky
                                top-2
                                z-20
                                ml-auto
                                mr-2
                                -mt-[100px]
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-md
                                bg-background/90
                                text-muted-foreground
                                shadow-sm
                                backdrop-blur
                                transition-colors
                                hover:bg-accent
                                hover:text-foreground
                                dark:bg-neutral-950/90
                            "
                            aria-label="Close"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M1 1L13 13M13 1L1 13"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>

                        <div className="h-[73px]" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-center border-b border-border px-5 py-4">
                        <div>
                            <p className="text-xs text-center text-muted-foreground">
                                {view === 'login' ? 'Welcome back' : 'Get started'}
                            </p>

                            <h2 className="text-base font-semibold leading-tight text-foreground">
                                {view === 'login' ? 'Log in to your account' : 'Create an account'}
                            </h2>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-5 py-5">
                        {view === 'login' ? <LoginForm /> : <RegisterForm />}
                    </div>

                    {/* Google */}
                    <div className="px-5 sm:px-10">
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>

                            <div className="relative flex justify-center text-xs">
                                <span className="bg-background px-2 text-muted-foreground dark:bg-neutral-950">
                                    or
                                </span>
                            </div>
                        </div>

                        <a
                            href={`${import.meta.env.VITE_API_URL}/auth/google/redirect`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-md
                                border
                                border-border
                                py-2
                                text-sm
                                transition-colors
                                hover:bg-muted/50
                            "
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt=""
                                className="h-4 w-4"
                                loading="lazy"
                                decoding="async"
                            />
                            Continue with Google
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 px-5 pb-5 text-center">
                        <span className="text-xs text-muted-foreground">
                            {view === 'login'
                                ? "Don't have an account? "
                                : 'Already have an account? '}
                        </span>

                        <button
                            type="button"
                            onClick={view === 'login' ? openRegister : openLogin}
                            className="
                                text-xs
                                font-medium
                                text-foreground
                                underline
                                underline-offset-2
                                transition-opacity
                                hover:opacity-70
                            "
                        >
                            {view === 'login' ? 'Sign up' : 'Log in'}
                        </button>

                        <div className="mt-5 flex w-full items-center justify-center gap-1">
                            <p className="text-xs text-foreground dark:text-white">Powered by</p>

                            <img
                                src="/devorbit_logo_small.png"
                                alt="Devorbit logo"
                                width={20}
                                height={20}
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
