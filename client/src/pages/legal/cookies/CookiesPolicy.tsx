import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Info } from 'lucide-react'

const SECTIONS = [
    {
        number: '01',
        title: 'What Are Cookies',
        quote: '"small files, big difference 🍪"',
        items: [
            {
                title: 'Definition',
                text: 'Cookies are small text files stored on your device when you visit a website. They help the site remember you and your preferences.',
                warn: false,
            },
            {
                title: 'They Are Safe',
                text: 'Cookies cannot run code or carry viruses. They only store small pieces of information relevant to your experience on Later N Comix.',
                warn: false,
            },
        ],
    },
    {
        number: '02',
        title: 'Cookies We Use',
        quote: null,
        items: [
            {
                title: 'Session Cookies',
                text: 'Keep you logged in while you browse. Without these, you would have to log in every single page visit.',
                warn: false,
            },
            {
                title: 'Preference Cookies',
                text: 'Save your dark mode setting so the site looks right every time you come back.',
                warn: false,
            },
            {
                title: 'Reading Progress',
                text: 'Remember where you left off in a chapter so you can pick up right where you stopped.',
                warn: false,
            },
            {
                title: 'Security Cookies',
                text: 'Help us detect unusual login activity and protect your account from unauthorized access.',
                warn: false,
            },
        ],
    },
    {
        number: '03',
        title: "What We Don't Do",
        quote: '"no tracking, no selling, no nonsense 🚫"',
        items: [
            {
                title: 'No Ad Tracking',
                text: 'We do not use third-party advertising cookies. Your browsing habits are not tracked for ad targeting.',
                warn: false,
            },
            {
                title: "We Don't Sell Data",
                text: 'Your data is never sold to advertisers or third parties. What happens on Later N Comix stays on Later N Comix.',
                warn: false,
            },
            {
                title: 'No Cross-Site Tracking',
                text: 'We do not track you across other websites. Our cookies only work on laterncomix.app.',
                warn: false,
            },
        ],
    },
    {
        number: '04',
        title: 'Managing Cookies',
        quote: null,
        items: [
            {
                title: 'Browser Settings',
                text: "You can control or delete cookies through your browser settings at any time. Check your browser's help docs for instructions.",
                warn: false,
            },
            {
                title: 'Disabling Cookies',
                text: 'Disabling cookies may affect your experience. Features like staying logged in or dark mode may stop working correctly.',
                warn: true,
            },
            {
                title: 'Questions',
                text: 'If you have any questions about how we use cookies, reach us at support@laterncomix.com',
                warn: false,
            },
        ],
    },
]

interface Props {
    onBack: () => void
}

export default function CookiesPolicy({ onBack }: Props) {
    return (
        <div className="max-w-2xl mx-auto mt-20">
            <div className="bg-white lg:bg-card rounded-xl px-4 py-5 my-6 mx-5 border">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 text-muted-foreground hover:text-foreground mb-2"
                        onClick={onBack}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Go back
                    </Button>
                    <h1 className="text-xl font-bold">Cookie Policy</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        We only use cookies that make Later N Comix work properly for you.
                    </p>
                </div>

                <Separator className="mb-6" />

                {/* Sections */}
                <div className="flex flex-col gap-6">
                    {SECTIONS.map((section) => (
                        <div key={section.number}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-muted-foreground font-mono">
                                    {section.number}
                                </span>
                                <h2 className="text-sm md:text-base font-semibold">
                                    {section.title}
                                </h2>
                            </div>

                            {section.quote && (
                                <p className="text-xs text-muted-foreground italic mb-3 pl-1">
                                    {section.quote}
                                </p>
                            )}

                            <div className="flex flex-col gap-1">
                                {section.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 py-1.5">
                                        {item.warn ? (
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <span className="text-muted-foreground/40 text-xs mt-0.5 shrink-0">
                                                //
                                            </span>
                                        )}
                                        <p
                                            className={`text-xs md:text-sm leading-relaxed ${item.warn ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
                                        >
                                            <span className="font-semibold text-foreground mr-1">
                                                {item.title} —
                                            </span>
                                            {item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <Separator className="mt-6" />
                        </div>
                    ))}
                </div>

                {/* Notice */}
                <div className="my-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs md:text-sm leading-relaxed">
                            No ads, no tracking, no nonsense. We only use cookies that make Later N
                            Comix work properly for you. Your data stays yours. 🍪 — The Later N
                            Comix Team 🏮
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-muted-foreground/40 tracking-widest uppercase text-[10px]">
                        Cookie Policy · V1.0
                    </span>
                    <span className="text-xs text-muted-foreground/40 tracking-widest uppercase text-[10px]">
                        Later N Comix Publishing
                    </span>
                </div>
            </div>
        </div>
    )
}
