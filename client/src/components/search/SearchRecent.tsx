import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
    recentSearches: string[]
    onSelect: (term: string) => void
    onClear: () => void
}

export default function SearchRecent({ recentSearches, onSelect, onClear }: Props) {
    if (recentSearches.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">No recent searches.</p>
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Recent searches</p>
                <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
                    Clear all
                </Button>
            </div>
            <Separator />
            {recentSearches.map((term) => (
                <Button
                    key={term}
                    variant="ghost"
                    className="justify-start text-sm"
                    onClick={() => onSelect(term)}
                >
                    {term}
                </Button>
            ))}
        </div>
    )
}
