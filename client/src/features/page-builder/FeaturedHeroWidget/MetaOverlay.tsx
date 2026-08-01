import type { PageWidget } from "@/types/pageLayout"
import { Heart, Star } from "lucide-react"
import type { HeroItem } from "./types"

export function MetaOverlay({
    item,
    widget,
    light = false,
}: {
    item: HeroItem
    widget: PageWidget
    light?: boolean
}) {
    const settings = widget.settings ?? {}
    const labels = item.labels?.slice(0, 2) ?? []

    return (
        <div
            className={`absolute inset-x-0 bottom-0 p-4 sm:p-5 ${
                light
                    ? 'static text-foreground'
                    : 'bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white'
            }`}
        >
            {settings.hero_show_name !== false && (
                <h2 className="line-clamp-2 text-lg font-bold sm:text-2xl">{item.title}</h2>
            )}

            {settings.hero_show_artist !== false && item.artist && (
                <p className="mt-1 text-xs opacity-80 sm:text-sm">{item.artist}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {settings.hero_show_views !== false && typeof item.views === 'number' && (
                    <span>{item.views.toLocaleString()} views</span>
                )}

                {settings.hero_show_likes !== false && typeof item.likes === 'number' && (
                    <span>{item.likes.toLocaleString()} likes</span>
                )}

                {settings.hero_show_favorite && (
                    <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Favorite
                    </span>
                )}

                {labels.map((label) => (
                    <span
                        key={label}
                        className={
                            settings.hero_label_style === 'plain'
                                ? 'opacity-80'
                                : 'rounded-full bg-white/20 px-2 py-0.5 backdrop-blur'
                        }
                    >
                        {label}
                    </span>
                ))}

                {item.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-black">
                        <Star className="h-3 w-3" />
                        Featured
                    </span>
                )}
            </div>
        </div>
    )
}