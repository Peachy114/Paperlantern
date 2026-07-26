import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const TYPES = [
    {
        label: 'Comic',
        value: 'comic',
    },
    {
        label: 'Novels',
        value: 'novel',
    },
]

const GENRES = [
    'All',
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Thriller',
    'Sports',
    'Supernatural',
    'Historical',
    'Psychological',
]

export default function ContentFilter({ contentType }: { contentType?: 'comic' | 'novel' }) {
    const location = useLocation()

    const genreScrollRef = useRef<HTMLDivElement | null>(null)

    const [isDragging, setIsDragging] = useState(false)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0)

    const isAllowedPage =
        location.pathname === '/' ||
        location.pathname.startsWith('/comix') ||
        location.pathname.startsWith('/novels')

    if (!isAllowedPage) {
        return null
    }

    const searchParams = new URLSearchParams(location.search)

    const currentType = contentType ?? searchParams.get('type') ?? 'comic'
    const currentGenre = searchParams.get('genre') ?? 'All'

    const buildHref = (key: string, value: string | null) => {
        const next = new URLSearchParams(location.search)

        if (value) {
            next.set(key, value)
        } else {
            next.delete(key)
        }

        const query = next.toString()

        return query ? `${location.pathname}?${query}` : location.pathname
    }

    const handleDragStart = (clientX: number) => {
        const container = genreScrollRef.current

        if (!container) {
            return
        }

        setIsDragging(true)
        setDragStartX(clientX)
        setDragStartScrollLeft(container.scrollLeft)
    }

    const handleDragMove = (clientX: number) => {
        const container = genreScrollRef.current

        if (!container || !isDragging) {
            return
        }

        const distance = clientX - dragStartX

        container.scrollLeft = dragStartScrollLeft - distance
    }

    const handleDragEnd = () => {
        setIsDragging(false)
    }

    return (
        <section className="w-full font-[var(--comix-font-family)]">
            <div className="mx-auto w-full max-w-[1390px] px-4 py-3 sm:px-6 md:px-8">
                {/* // content filter parent ---- */}
                <nav
                    aria-label="Content filters"
                    className="
                        flex
                        min-h-14
                        w-full
                        items-center
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-[var(--comix-filter-border)]
                        bg-[var(--comix-filter-background)]
                        shadow-[var(--shadow-xs)]
                    "
                >
                    {/* //// fixed content type section ---- */}
                    {!contentType && (
                        <div
                            className="
                                flex
                                shrink-0
                                items-center
                                gap-1
                                px-3
                                sm:px-5
                            "
                        >
                            {TYPES.map((type) => {
                                const active = currentType === type.value

                                return (
                                    <Link
                                        key={type.value}
                                        to={buildHref('type', type.value)}
                                        aria-current={active ? 'page' : undefined}
                                        className={[
                                            'inline-flex',
                                            'h-9',
                                            'items-center',
                                            'justify-center',
                                            'rounded-full',
                                            'px-3.5',
                                            'text-sm',
                                            'font-semibold',
                                            'no-underline',
                                            'whitespace-nowrap',
                                            'transition-all',
                                            'duration-200',
                                            active
                                                ? [
                                                      'bg-[var(--comix-accent)]',
                                                      'text-white',
                                                      'shadow-sm',
                                                  ].join(' ')
                                                : [
                                                      'text-[var(--foreground)]',
                                                      'hover:bg-white/50',
                                                  ].join(' '),
                                        ].join(' ')}
                                    >
                                        {type.label}
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* //// section divider ---- */}
                    {!contentType && (
                        <div
                            aria-hidden="true"
                            className="
                                h-14
                                w-px
                                shrink-0
                                bg-[var(--comix-filter-border)]
                            "
                        />
                    )}

                    {/* //// scrollable draggable genres ---- */}
                    <div
                        ref={genreScrollRef}
                        onMouseDown={(event) => {
                            event.preventDefault()
                            handleDragStart(event.clientX)
                        }}
                        onMouseMove={(event) => {
                            handleDragMove(event.clientX)
                        }}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={(event) => {
                            handleDragStart(event.touches[0].clientX)
                        }}
                        onTouchMove={(event) => {
                            handleDragMove(event.touches[0].clientX)
                        }}
                        onTouchEnd={handleDragEnd}
                        className={[
                            'flex',
                            'min-w-0',
                            'flex-1',
                            'items-center',
                            'gap-1',
                            'overflow-x-auto',
                            'px-3',
                            'scrollbar-hide',
                            'select-none',
                            'sm:gap-2',
                            'sm:px-5',
                            isDragging ? 'cursor-grabbing' : 'cursor-grab',
                        ].join(' ')}
                    >
                        {GENRES.map((genre) => {
                            const active =
                                genre === 'All' ? currentGenre === 'All' : currentGenre === genre

                            return (
                                <Link
                                    key={genre}
                                    to={buildHref('genre', genre === 'All' ? null : genre)}
                                    draggable={false}
                                    aria-current={active ? 'page' : undefined}
                                    className={[
                                        'inline-flex',
                                        'h-9',
                                        'shrink-0',
                                        'items-center',
                                        'justify-center',
                                        'rounded-full',
                                        'px-3.5',
                                        'text-sm',
                                        'no-underline',
                                        'whitespace-nowrap',
                                        'transition-all',
                                        'duration-200',
                                        active
                                            ? [
                                                  'bg-white/80',
                                                  'text-[var(--foreground)]',
                                                  'font-bold',
                                                  'shadow-sm',
                                              ].join(' ')
                                            : [
                                                  'text-[var(--foreground)]',
                                                  'font-medium',
                                                  'hover:bg-white/50',
                                              ].join(' '),
                                    ].join(' ')}
                                >
                                    {genre}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </section>
    )
}
