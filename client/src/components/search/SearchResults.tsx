import { motion } from 'framer-motion'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SearchResult } from './SearchBarView'

interface Props {
    results: SearchResult[]
    searching: boolean
    query: string
    onSelect: (work: SearchResult) => void
    onSeeAll: () => void
}

export default function SearchResults({ results, searching, query, onSelect, onSeeAll }: Props) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
                {searching ? 'Searching...' : `${results.length} results`}
            </p>
            <Separator />

            {!searching && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No results found.</p>
            )}

            {!searching &&
                results.map((work, i) => (
                    <motion.div
                        key={work.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onSelect(work)}
                        className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted"
                    >
                        {work.cover && (
                            <img
                                src={storageUrl(work.cover)!}
                                alt={work.title}
                                className="w-10 h-10 object-cover rounded"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{work.title}</p>
                            <Badge variant="outline" className="text-xs mt-0.5">
                                {work.type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
                            </Badge>
                        </div>
                    </motion.div>
                ))}

            {!searching && results.length >= 4 && (
                <Button variant="ghost" className="w-full text-xs mt-1" onMouseDown={onSeeAll}>
                    See all results for "{query}"
                </Button>
            )}
        </div>
    )
}
