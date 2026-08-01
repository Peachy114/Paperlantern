import type { WorkItem } from "@/features/work/hooks/useHome"
import { Link } from "react-router-dom"
import { hrefFor } from "./utils/hrefFor"
import { labelFor } from "./utils/labelFor"

export function DiscoveryWorkGrid({
    title,
    works,
    cover,
    metric,
    columns,
    infoLayout = 'image_title_description',
}: {
    title: string
    works: WorkItem[]
    cover: (path: string | null, variant?: 'sm') => string | null
    metric?: 'views' | 'likes'
    columns?: number
    infoLayout?: string
}) {
    if (works.length === 0) return null

    return (
        <section className="mx-auto my-5 w-full max-w-[1480px] px-5">
            <h2 className="py-5 text-2xl font-bold uppercase">{title}</h2>
            <div
                style={
                    columns
                        ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
                        : undefined
                }
                className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 lg:gap-6"
            >
                {works.map((work) => (
                    <Link key={work.id} to={hrefFor(work)} className="group block h-full">
                        <article>
                            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                                {cover(work.cover, work.type === 'art' ? undefined : 'sm') ? (
                                    <img
                                        src={
                                            cover(
                                                work.cover,
                                                work.type === 'art' ? undefined : 'sm'
                                            )!
                                        }
                                        alt={work.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>
                            {infoLayout !== 'image_only' && (
                                <>
                                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
                                        {work.title}
                                    </h3>
                                    {infoLayout === 'image_title_description' && (
                                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                            {labelFor(work, metric)}
                                        </p>
                                    )}
                                </>
                            )}
                        </article>
                    </Link>
                ))}
            </div>
        </section>
    )
}