interface HeroWork {
    id: string
    slug: string
    title: string
    description?: string | null
    banner?: string | null
    cover: string | null
    type: 'webtoon' | 'wattpad'
    status?: string
}

interface Props {
    work: HeroWork
    cover: (path: string | null) => string | null
    isActive: boolean
    isFirst: boolean
    onClick: () => void
}

export default function HeroComicSlide({ work, cover, isFirst, onClick }: Props) {
    const imgSrc = cover(work.banner ?? work.cover)
    return (
        <div
            onClick={onClick}
            className="relative w-full cursor-pointer overflow-hidden rounded-lg"
        >
            <div className="w-full aspect-square bg-zinc-900">
                {imgSrc && (
                    <img
                        src={imgSrc}
                        alt={work.title}
                        loading={isFirst ? 'eager' : 'lazy'}
                        fetchPriority={isFirst ? 'high' : 'auto'}
                        width={900}
                        height={480}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-xs text-white/60 mb-1">
                    {work.type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
                </div>
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">{work.title}</h1>
                {work.description && (
                    <p className="text-xs md:text-sm text-white/70 mt-1 line-clamp-2 hidden sm:block">
                        {work.description}
                    </p>
                )}
                <span className="text-xs text-white/50 mt-1 block">
                    {work.status === 'completed'
                        ? 'COMPLETED'
                        : work.status === 'hiatus'
                          ? 'HIATUS'
                          : 'NEW'}
                </span>
            </div>
        </div>
    )
}
