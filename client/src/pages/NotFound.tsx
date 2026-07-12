import { Link } from 'react-router-dom'
export default function NotFound() {
    return (
        <div className="min-h-[82vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            {/* 404 with clouds */}
            <div className="relative inline-block">
                <i className="ti ti-cloud absolute top-2 -left-5 text-3xl text-foreground/20" />
                <i className="ti ti-cloud absolute top-0 -right-6 text-2xl text-foreground/20" />
                <span
                    className="text-accent block leading-none"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 'clamp(110px, 24vw, 180px)',
                        letterSpacing: '0.02em',
                    }}
                >
                    404
                </span>
            </div>

            {/* Tagline */}
            <p className="text-[15px] font-medium text-foreground -mt-1 mb-6">
                Will to live{' '}
                <em className="font-normal italic text-muted-foreground">not found.</em>
            </p>

            {/* Dead house */}
            <div className="relative w-44 h-36 mb-6">
                {/* Roof */}
                <div
                    className="absolute top-0 left-0"
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: '88px solid transparent',
                        borderRight: '88px solid transparent',
                        borderBottom: '70px solid hsl(var(--foreground))',
                    }}
                />
                {/* Body */}
                <div className="absolute bottom-0 left-0 w-44 h-20 bg-foreground rounded-b flex items-center justify-center gap-5">
                    <span className="text-background text-2xl font-bold">✕</span>
                    <span className="text-background text-2xl font-bold">✕</span>
                </div>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
                <Link
                    to="/"
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                >
                    <div>
                        <p className="text-sm font-medium text-foreground">Home page</p>
                        <p className="text-xs text-muted-foreground">Back to the start</p>
                    </div>
                    <i className="ti ti-chevron-right text-muted-foreground text-base" />
                </Link>
                <Link
                    to="/comix"
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                >
                    <div>
                        <p className="text-sm font-medium text-foreground">Browse comics</p>
                        <p className="text-xs text-muted-foreground">Find your next read</p>
                    </div>
                    <i className="ti ti-chevron-right text-muted-foreground text-base" />
                </Link>
            </div>
        </div>
    )
}
