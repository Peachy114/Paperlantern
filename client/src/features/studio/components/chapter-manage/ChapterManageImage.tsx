import { storageUrl } from '@/utils/storage'
import { ImageOff } from 'lucide-react'

interface Props {
    banner?: string | null
    title?: string
}

export default function ChapterManageImage({ banner, title }: Props) {
    return (
        <div className="relative w-full lg:h- h-64 md:h-56 rounded-xl overflow-hidden bg-muted">
            {banner ? (
                <img
                    src={storageUrl(banner)!}
                    alt={title ? `${title} banner` : 'Work banner'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                </div>
            )}

            {/* gradient overlay so any future title/badge overlay text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
    )
}
