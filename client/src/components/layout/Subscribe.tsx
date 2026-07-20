import { FormEvent, useState } from 'react'
import axios from 'axios'
import api from '@/api/axios'

const SUBSCRIBE_ENDPOINT = '/public/subscribe'

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error'

interface SubscribeResponse {
    message?: string
}

interface SubscribeErrorResponse {
    message?: string
    errors?: {
        email?: string[]
    }
}

export default function Subscribe() {
    const [email, setEmail] = useState<string>('')
    const [agreed, setAgreed] = useState<boolean>(false)
    const [status, setStatus] = useState<SubscribeStatus>('idle')
    const [message, setMessage] = useState<string>('')

    const isLoading = status === 'loading'
    const canSubmit = email.trim() !== '' && agreed && !isLoading

    const handleScrollToTop = (): void => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    const clearStatusMessage = (): void => {
        if (status === 'idle') return

        setStatus('idle')
        setMessage('')
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()

        const normalizedEmail = email.trim()

        if (!normalizedEmail) {
            setStatus('error')
            setMessage('Please enter your email address.')
            return
        }

        if (!agreed) {
            setStatus('error')
            setMessage('Please agree to the privacy notice before subscribing.')
            return
        }

        if (isLoading) return

        setStatus('loading')
        setMessage('')

        try {
            const response = await api.post<SubscribeResponse>(SUBSCRIBE_ENDPOINT, {
                email: normalizedEmail,
                agreed: true,
            })

            setStatus('success')
            setMessage(
                response.data?.message || 'You are subscribed! Check your inbox for confirmation.'
            )

            setEmail('')
            setAgreed(false)
        } catch (error: unknown) {
            setStatus('error')

            if (axios.isAxiosError<SubscribeErrorResponse>(error)) {
                const emailError = error.response?.data?.errors?.email?.[0]
                const responseMessage = error.response?.data?.message

                setMessage(
                    emailError || responseMessage || 'Something went wrong. Please try again.'
                )
                return
            }

            setMessage('Something went wrong. Please try again.')
        }
    }

    return (
        <section className="relative z-20 mt-20 w-full overflow-visible">
            {/* ====================================================== */}
            {/* // subscribe parent ---- */}
            {/* ====================================================== */}

            {/* //// yellow top background — 20% opacity ---- */}
            <div className="h-10 w-full bg-[rgb(255_177_77_/_20%)] dark:bg-[rgb(255_177_77_/_12%)]" />

            {/* //// subscribe content ---- */}
            <div className="relative border-y border-black/5 bg-white dark:border-white/10 dark:bg-[#171717]">
                <div className="relative mx-auto flex min-h-[168px] w-full max-w-[1490px] flex-col gap-8 px-5 pb-10 pt-28 sm:px-8 md:px-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-16 lg:pb-8 lg:pt-8">
                    {/* ====================================================== */}
                    {/* // top button parent ---- */}
                    {/* ====================================================== */}

                    {/* //// top ribbon button ---- */}
                    <button
                        type="button"
                        onClick={handleScrollToTop}
                        aria-label="Go to the top of the page"
                        className="
                            group
                            absolute
                            left-5
                            top-[-40px]
                            z-10
                            flex
                            h-[95px]
                            w-[90px]
                            flex-col
                            items-center
                            justify-start
                            bg-[#ffad53]
                            pt-5
                            text-white
                            shadow-sm
                            transition-colors
                            duration-200
                            hover:bg-[#ff9e38]
                            focus-visible:outline-none
                            focus-visible:ring-4
                            focus-visible:ring-[#ffad53]/40
                            sm:left-10
                            lg:left-10
                        "
                    >
                        {/* //// upward arrow ---- */}
                        <span
                            aria-hidden="true"
                            className="
                                h-0
                                w-0
                                border-b-[24px]
                                border-l-[20px]
                                border-r-[20px]
                                border-b-white
                                border-l-transparent
                                border-r-transparent
                                transition-transform
                                duration-200
                                group-hover:-translate-y-1
                            "
                        />

                        {/* //// top label ---- */}
                        <span className="mt-2 text-xs font-extrabold uppercase leading-none">
                            Top
                        </span>

                        {/* //// pointed ribbon bottom ---- */}
                        <span
                            aria-hidden="true"
                            className="
                                pointer-events-none
                                absolute
                                -bottom-[28px]
                                left-0
                                h-0
                                w-0
                                border-l-[45px]
                                border-r-[45px]
                                border-t-[28px]
                                border-l-transparent
                                border-r-transparent
                                border-t-[#ffad53]
                                transition-colors
                                duration-200
                                group-hover:border-t-[#ff9e38]
                            "
                        />
                    </button>

                    {/* ====================================================== */}
                    {/* // subscribe information parent ---- */}
                    {/* ====================================================== */}

                    {/* //// subscribe title and description ---- */}
                    <div className="w-full lg:ml-[145px] lg:max-w-[460px]">
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-black sm:text-[27px] dark:text-white">
                            Subscribe to Messages
                        </h2>

                        <p className="mt-1 max-w-[460px] text-sm leading-snug text-black/75 dark:text-white/70">
                            Subscribe to Comix exclusive notifications for the latest news on
                            events, new releases, and more!
                        </p>
                    </div>

                    {/* ====================================================== */}
                    {/* // subscribe form parent ---- */}
                    {/* ====================================================== */}

                    <form onSubmit={handleSubmit} noValidate className="w-full lg:max-w-[610px]">
                        {/* //// email and subscribe button ---- */}
                        <div className="flex w-full flex-col gap-3 sm:flex-row">
                            <label htmlFor="subscribe-email" className="sr-only">
                                Email address
                            </label>

                            <input
                                id="subscribe-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="Email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value)
                                    clearStatusMessage()
                                }}
                                disabled={isLoading}
                                aria-invalid={status === 'error'}
                                aria-describedby={message ? 'subscribe-message' : undefined}
                                className="
                                    input
                                    h-[54px]
                                    min-w-0
                                    flex-1
                                    rounded-full
                                    border-2
                                    border-[#ffa23e]
                                    bg-white
                                    px-8
                                    text-base
                                    text-black
                                    placeholder:text-gray-400
                                    focus:border-[#ff9221]
                                    focus:ring-[#ffa23e]/15
                                    dark:bg-[#202020]
                                    dark:text-white
                                "
                            />

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="btn btn-primary btn-lg shrink-0 sm:min-w-[188px]"
                            >
                                {isLoading ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </div>

                        {/* //// consent checkbox ---- */}
                        <label className="mt-3 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(event) => {
                                    setAgreed(event.target.checked)
                                    clearStatusMessage()
                                }}
                                disabled={isLoading}
                                className="
                                    mt-[2px]
                                    h-[18px]
                                    w-[18px]
                                    shrink-0
                                    cursor-pointer
                                    appearance-none
                                    rounded-sm
                                    border-2
                                    border-gray-300
                                    bg-white
                                    transition
                                    checked:border-[#58aef0]
                                    checked:bg-[#58aef0]
                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-[#58aef0]/40
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    dark:border-gray-600
                                    dark:bg-[#202020]
                                "
                            />

                            <span className="max-w-[470px] text-[10px] leading-[1.3] text-black/75 sm:text-[11px] dark:text-white/65">
                                I agree for my personal data to be collected and used to receive
                                event invitations and other info.{' '}
                                <a
                                    href="/privacy"
                                    className="font-medium text-black underline underline-offset-2 hover:text-[#399ce8] dark:text-white"
                                >
                                    Read details &gt;&gt;
                                </a>
                            </span>
                        </label>

                        {/* //// request status message ---- */}
                        {message && (
                            <p
                                id="subscribe-message"
                                role="status"
                                aria-live="polite"
                                className={`mt-2 text-xs font-medium ${
                                    status === 'success' ? 'yes-color' : 'no-color'
                                }`}
                            >
                                {message}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </section>
    )
}
