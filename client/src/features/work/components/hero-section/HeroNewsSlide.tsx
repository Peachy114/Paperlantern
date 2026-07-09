import { storageUrl } from '@/utils/storage'

interface Announcement {
    id: string
    title: string
    content: string
    image?: string | null
    tag?: 'event' | 'reminder' | 'update'
    is_pinned: boolean
    created_at: string
    creator?: { name?: string | null } | null
}

interface Props {
    announcement: Announcement
    isActive: boolean
    isFirst: boolean
    onClick: () => void
}

export default function HeroNewsSlide({ announcement, isFirst, onClick }: Props) {
    const img = storageUrl(announcement.image ?? null)
    return (
        <div onClick={onClick} className="relative w-full cursor-pointer overflow-hidden">
            <div className="w-full aspect-square bg-zinc-900">
                {img ? (
                    <img
                        src={img}
                        alt={announcement.title}
                        loading={isFirst ? 'eager' : 'lazy'}
                        fetchPriority={isFirst ? 'high' : 'auto'}
                        width={900}
                        height={480}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800" />
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-white/50">COMIX TIMES</span>
                    <span className="text-xs text-white/40">
                        {announcement.is_pinned ? 'PINNED' : 'NEWS'}
                    </span>
                </div>
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">
                    {announcement.title}
                </h1>
                <p className="text-xs md:text-sm text-white/70 mt-1 line-clamp-2 hidden sm:block">
                    {announcement.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/50">
                        {announcement.creator?.name?.toUpperCase() ?? 'STAFF'}
                    </span>
                    <span className="text-xs text-white/40">
                        {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </div>
        </div>
    )
}
