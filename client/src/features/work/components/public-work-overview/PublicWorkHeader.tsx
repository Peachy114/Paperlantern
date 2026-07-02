import { FaXTwitter, FaInstagram, FaTiktok } from 'react-icons/fa6'

interface PublicWorkHeaderProps {
    work: any
    coverUrl: (url: string, variant?: 'sm') => string | null
}

export default function PublicWorkHeader({ work, coverUrl }: PublicWorkHeaderProps) {
    const twitter = work.user?.twitter_url
    const instagram = work.user?.instagram_url
    const tiktok = work.user?.tiktok_url
    const hasSocials = twitter || instagram || tiktok

    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-md bg-muted h-64">
            {coverUrl(work.banner) && (
                <img
                    src={coverUrl(work.banner)!}
                    alt={work.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                />
            )}

            {/* Social Icons — bottom-left of banner */}
            {hasSocials && (
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                    {twitter && (
                        <a
                            href={twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        >
                            <FaXTwitter className="w-6 h-6" />
                        </a>
                    )}
                    {instagram && (
                        <a
                            href={instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        >
                            <FaInstagram className="w-6 h-6" />
                        </a>
                    )}
                    {tiktok && (
                        <a
                            href={tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        >
                            <FaTiktok className="w-6 h-6" />
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}
