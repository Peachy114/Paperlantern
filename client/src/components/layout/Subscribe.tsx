import { useState } from 'react'
import { FaThreads } from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import axios from 'axios'
import api from '@/api/axios'

interface SocialLink {
    label: string
    href: string
    icon: IconType
}

const SOCIAL: SocialLink[] = [
    { label: 'Threads', href: 'https://www.threads.com/@laterncomix', icon: FaThreads },
]

const SUBSCRIBE_ENDPOINT = '/public/subscribe'

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error'

interface SubscribeResponse {
    message?: string
}

export default function Subscribe() {
    const [email, setEmail] = useState<string>('')
    const [agreed, setAgreed] = useState<boolean>(false)
    const [status, setStatus] = useState<SubscribeStatus>('idle')
    const [message, setMessage] = useState<string>('')

    const handleSubmit = async (): Promise<void> => {
        if (!email || !agreed || status === 'loading') return

        setStatus('loading')
        setMessage('')

        try {
            const res = await api.post<SubscribeResponse>(SUBSCRIBE_ENDPOINT, {
                email,
                agreed,
            })

            setStatus('success')
            setMessage(
                res.data?.message || 'You are subscribed! Check your inbox for confirmation.'
            )
            setEmail('')
            setAgreed(false)
        } catch (err) {
            setStatus('error')
            if (axios.isAxiosError(err)) {
                setMessage(err.response?.data?.message || 'Something went wrong. Please try again.')
            } else {
                setMessage('Something went wrong. Please try again.')
            }
        }
    }

    return (
        <div className="w-full bg-[#181818] dark:bg-black border-t mt-20 z-90">
            {/* Social icons */}
            <div className="flex justify-center items-center gap-3 py-5 border border-[#3f3f3f] dark:border-[#181818] ">
                {SOCIAL.map(({ label, href, icon: Icon }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="flex items-center justify-center text-white/50 hover:text-white transition-all duration-100"
                    >
                        <Icon size={40} />
                    </a>
                ))}
            </div>

            <div className="w-full pt-20 max-w-[1360px] mx-auto px-10 lg:px-5 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Left */}
                <div className="lg:max-w-sm">
                    <h3 className="text-3xl lg:text-2xl font-bold text-white dark:text-white">
                        Subscribe to Messages
                    </h3>
                    <p className="text-md lg:text-sm text-gray-400 mt-1">
                        Subscribe to Comix exclusive notifications for the latest news on events,
                        new releases, and more!
                    </p>
                </div>

                {/* Right */}
                <div className="flex flex-col lg:flex-row gap-3 w-full md:max-w-[600px] md:min-w-[450px]">
                    {/* input */}
                    <div className="flex flex-col gap-3">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={status === 'loading'}
                            className="flex-1 px-4 py-3.5 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder:text-gray-500 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        />

                        <label className="flex items-start gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                disabled={status === 'loading'}
                                className="mt-0.5 accent-foreground"
                            />
                            <span className="text-xs text-muted-foreground">
                                I agree for my personal data to be collected and used to receive
                                event invitations and other info.{' '}
                                <a href="/privacy" className="text-primary underline">
                                    Read details &gt;&gt;
                                </a>
                            </span>
                        </label>

                        {message && (
                            <p
                                className={`text-xs ${
                                    status === 'success' ? 'text-green-400' : 'text-red-400'
                                }`}
                            >
                                {message}
                            </p>
                        )}
                    </div>
                    {/* subscribe button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!email || !agreed || status === 'loading'}
                        className="px-6 py-2 rounded-full lg:max-w-50 w-full h-12 bg-comix-accent text-white text-sm hover:opacity-80 transition-opacity disabled:opacity-30"
                    >
                        {status === 'loading' ? 'Subscribing…' : 'Subscribe Now'}
                    </button>
                </div>
            </div>
        </div>
    )
}
