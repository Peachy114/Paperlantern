import { useState } from 'react'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SearchResult, SearchResultsPayload } from './SearchBarView'

interface Props {
    results: SearchResultsPayload
    searching: boolean
    query: string
    onSelect: (work: SearchResult) => void
    onSeeAll: () => void
}

export default function SearchResults({ results, searching, query, onSelect, onSeeAll }: Props) {
    const sections = [
        { title: 'Webcomics', items: results.webcomics },
        { title: 'Novels', items: results.novels },
        { title: 'Arts', items: results.arts },
        { title: 'Artist', items: results.artists },
    ].filter((section) => section.items.length > 0)
    const total = sections.reduce((sum, section) => sum + section.items.length, 0)

    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
                {searching ? 'Searching...' : `${total} results`}
            </p>
            <Separator />

            {!searching && total === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
            )}

            {!searching &&
                sections.map((section) => (
                    <div key={section.title} className="py-1">
                        <div className="px-2 py-1">
                            <p className="border-b pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                {section.title}
                            </p>
                        </div>
                        {section.items.map((item) => (
                            <button
                                key={`${section.title}-${item.id}`}
                                type="button"
                                onMouseDown={(event) => {
                                    event.preventDefault()
                                    onSelect(item)
                                }}
                                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
                            >
                                {item.cover ? (
                                    <SearchThumb item={item} size="sm" />
                                ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold uppercase text-muted-foreground">
                                        {item.type === 'art_label' ? '#' : item.title[0] ?? '?'}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{item.title}</p>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                        <Badge variant="outline" className="text-[10px]">
                                            {labelFor(item)}
                                        </Badge>
                                        {item.subtitle && (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {item.subtitle}
                                            </span>
                                        )}
                                        {item.genres && item.genres.length > 0 && (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {item.genres.slice(0, 2).join(' - ')}
                                            </span>
                                        )}
                                        {item.count !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                {item.count} post{item.count === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ))}

            {!searching && total >= 4 && (
                <Button variant="ghost" className="w-full text-xs mt-1" onMouseDown={onSeeAll}>
                    See all results for "{query}"
                </Button>
            )}
        </div>
    )
}

function SearchThumb({ item, size }: { item: SearchResult; size: 'sm' | 'md' }) {
    const fallback = item.cover ? storageUrl(item.cover) : null
    const [src, setSrc] = useState(item.cover ? storageUrl(item.cover, 'sm') : null)
    const [failed, setFailed] = useState(false)

    if (!src || failed) {
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold uppercase text-muted-foreground">
                {item.type === 'art_label' ? '#' : item.title[0] ?? '?'}
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={item.title}
            width={size === 'sm' ? 40 : 64}
            height={size === 'sm' ? 40 : 64}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded object-cover"
            onError={() => {
                if (fallback && src !== fallback) {
                    setSrc(fallback)
                } else {
                    setFailed(true)
                }
            }}
        />
    )
}

function labelFor(item: SearchResult) {
    if (item.type === 'webtoon') return 'WEBTOON'
    if (item.type === 'wattpad') return 'NOVEL'
    if (item.type === 'art_label') return 'ART LABEL'
    return item.verified ? 'VERIFIED ARTIST' : 'ARTIST'
}
