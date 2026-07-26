import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type WorkspaceStat = {
    label: string
    value: ReactNode
    icon?: LucideIcon
}

type WorkspaceNavItem = {
    value: string
    label: string
    icon?: LucideIcon
    description?: string
    count?: number
}

type CreatorWorkspaceShellProps = {
    title: string
    description: string
    layout?: 'default' | 'dashboard'
    eyebrow?: string
    heroTitle?: string
    heroDescription?: string
    heroImage?: string | null
    heroAction?: ReactNode
    stats?: WorkspaceStat[]
    navItems?: WorkspaceNavItem[]
    activeItem?: string
    onActiveItemChange?: (value: string) => void
    action?: ReactNode
    children: ReactNode
}

export default function CreatorWorkspaceShell({
    title,
    description,
    layout = 'default',
    eyebrow = 'Creator workspace',
    heroTitle,
    heroDescription,
    heroImage,
    heroAction,
    stats = [],
    navItems = [],
    activeItem,
    onActiveItemChange,
    action,
    children,
}: CreatorWorkspaceShellProps) {
    if (layout === 'dashboard') {
        return (
            <main className="mx-auto w-full max-w-[1500px] px-3 pb-16 pt-6 sm:px-5 lg:px-6">
                <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
                        {title}, <span className="text-rose-500">{description}</span>
                    </h1>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </header>
                <div className="min-w-0">{children}</div>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-[1500px] px-3 pb-16 pt-6 sm:px-4">
            <header className="mb-5 flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                        {eyebrow}
                    </p>
                    <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.03em] sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
                        {description}
                    </p>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </header>

            <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
                <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="relative min-h-48 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
                        {heroAction ? <div className="absolute right-3 top-3 z-20">{heroAction}</div> : null}
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.25),transparent_34%),radial-gradient(circle_at_80%_25%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(241,245,249,0.95))]" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-4 pb-3 pt-12 text-white">
                            <p className="line-clamp-1 text-sm font-bold">{heroTitle ?? title}</p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] text-white/80">
                                {heroDescription ?? description}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-background p-4 shadow-sm sm:p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                                    Overview
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Current activity and workspace totals.
                                </p>
                            </div>
                        </div>

                        <div className="h-24 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50 to-white p-3">
                            <div className="h-full rounded-xl bg-[linear-gradient(135deg,transparent_0_35%,rgba(56,189,248,0.18)_35%_65%,transparent_65%),repeating-linear-gradient(to_bottom,transparent_0_18px,rgba(15,23,42,0.08)_19px,transparent_20px)]" />
                        </div>

                        {stats.length > 0 ? (
                            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                                {stats.map(({ label, value, icon: Icon }) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm"
                                    >
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground">
                                            {Icon ? <Icon className="h-4 w-4" /> : null}
                                        </div>
                                        <p className="text-lg font-black leading-none">{value}</p>
                                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
                {navItems.length > 0 ? (
                    <nav className="flex h-auto w-full flex-row items-stretch justify-start gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-background/80 p-2 shadow-sm backdrop-blur lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                        {navItems.map(({ value, label, icon: Icon, count }) => {
                            const active = activeItem === value

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onActiveItemChange?.(value)}
                                    className={`group flex h-11 shrink-0 items-center justify-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 lg:w-full ${
                                        active
                                            ? 'border-sky-200 bg-sky-500 text-white shadow-[0_8px_20px_rgba(14,165,233,0.28)]'
                                            : 'border-transparent bg-transparent text-foreground hover:bg-muted/70'
                                    }`}
                                >
                                    {Icon ? (
                                        <Icon
                                            className={`h-4 w-4 shrink-0 ${
                                                active ? 'text-white' : 'text-orange-500'
                                            }`}
                                        />
                                    ) : null}
                                    <span className="min-w-0 truncate">{label}</span>
                                    {typeof count === 'number' ? (
                                        <span
                                            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${
                                                active
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    ) : null}
                                </button>
                            )
                        })}
                    </nav>
                ) : null}

                <div className="min-w-0 rounded-[24px] border border-slate-200/80 bg-background/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-4">
                    {children}
                </div>
            </div>
        </main>
    )
}
