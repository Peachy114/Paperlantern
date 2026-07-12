import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function ComingSoon() {
    const navigate = useNavigate()

    const links = [
        { label: 'Stay tuned', desc: 'Back to home', to: '/' },
        { label: 'Browse comics', desc: 'Read while you wait', to: '/comix' },
    ]

    return (
        <div className="min-h-[82vh] flex flex-col items-center justify-center gap-8 px-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm w-full">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                        Later N Comix — Blog
                    </p>

                    <span
                        className="text-[100px] font-semibold leading-none tracking-[-4px] select-none"
                        style={{
                            background:
                                'linear-gradient(135deg, #f59e0b 0%, #d97706 45%, #92400e 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Soon
                    </span>

                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                        Our blog is getting its ink ready. Creator spotlights, updates and stories —
                        arriving soon.
                    </p>
                </div>

                <div className="w-12 h-px bg-border" />

                <div className="flex flex-col gap-2.5 w-full">
                    {links.map(({ label, desc, to }) => (
                        <button
                            key={to}
                            onClick={() => navigate(to)}
                            className="flex items-center justify-between px-4 py-3.5 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left"
                        >
                            <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
