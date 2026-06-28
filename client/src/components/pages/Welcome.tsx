import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { BookOpen, Coins, ImageIcon, Pencil } from 'lucide-react'

const features = [
    {
        icon: BookOpen,
        title: 'Webtoons and novels',
        desc: 'Browse and read comics and novels across genres. Unlock premium chapters with credits — earnings go directly to the creator.',
    },
    {
        icon: ImageIcon,
        title: 'Artist gallery',
        desc: 'Discover original artwork from independent artists. Commission them directly and support their craft.',
    },
    {
        icon: Pencil,
        title: 'Publish your work',
        desc: 'Writers and artists can share their work, build an audience, and earn — through chapter sales or commissions.',
    },
    {
        icon: Coins,
        title: 'Direct earnings',
        desc: 'No middleman. Credits from readers and commissions from fans go straight to the creator.',
    },
]

const steps = [
    {
        step: '1',
        title: 'Create a free account',
        desc: 'Sign up in seconds — no credit card needed.',
    },
    { step: '2', title: 'Browse and discover', desc: 'Explore webtoons and novels across genres.' },
    {
        step: '3',
        title: 'Read and support',
        desc: 'Enjoy free chapters or use credits to unlock premium content and support the creator.',
    },
]

export default function Welcome() {
    const navigate = useNavigate()

    return (
        <div className="w-full">
            {/* Hero */}
            <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-20 gap-6">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                    Later N Comix
                </p>
                <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1] max-w-2xl">
                    Read webtoons and novels.
                    <br />
                    Support the creators.
                </h1>
                <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                    A home for independent storytellers and the readers who love their work.
                    Discover comics and novels you won't find anywhere else.
                </p>
                <div className="flex gap-2.5 flex-wrap justify-center mt-2">
                    <Button onClick={() => navigate('/comix')}>Start reading</Button>
                    <Button variant="outline" onClick={() => navigate('/become-creator')}>
                        Become a creator
                    </Button>
                </div>
                <div className="flex items-center gap-8 mt-4 flex-wrap justify-center">
                    {[
                        { val: 'Free', label: 'to start reading' },
                        { val: 'Webtoon', label: 'and novel format' },
                        { val: 'Direct', label: 'creator support' },
                    ].map(({ val, label }, i, arr) => (
                        <Fragment key={val}>
                            <div className="text-center">
                                <p className="text-xl font-semibold">{val}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                            {i < arr.length - 1 && <div className="w-px h-8 bg-border" />}
                        </Fragment>
                    ))}
                </div>
            </section>

            <Separator />

            {/* Features */}
            <section className="py-20 px-4 max-w-3xl mx-auto">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground text-center mb-2">
                    Why Later N Comix
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-12">
                    Built for readers and creators
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="p-5 bg-card border border-border rounded-xl">
                            <Icon className="h-5 w-5 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium mb-1.5">{title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Separator />

            {/* How it works */}
            <section className="py-20 px-4 max-w-lg mx-auto">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground text-center mb-2">
                    How it works
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-12">
                    Up and reading in minutes
                </h2>
                <div className="flex flex-col">
                    {steps.map(({ step, title, desc }, i) => (
                        <div key={step} className="flex gap-5">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-sm font-medium shrink-0">
                                    {step}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="w-px flex-1 bg-border mt-2" />
                                )}
                            </div>
                            <div className={`pt-1 ${i < steps.length - 1 ? 'pb-8' : ''}`}>
                                <p className="text-sm font-medium mb-1">{title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Separator />

            {/* Bottom CTA */}
            <section className="py-20 px-4 flex flex-col items-center gap-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    Ready to start reading?
                </h2>
                <p className="text-sm text-muted-foreground">Join for free. No strings attached.</p>
                <Button onClick={() => navigate('/register')} className="mt-2">
                    Get started
                </Button>
            </section>
        </div>
    )
}
