import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, ArrowLeft } from 'lucide-react'

interface Props {
    query: string
    onSearch: (value: string) => void
    onReset: () => void
    onBack?: () => void
    onFocus?: () => void
    onBlur?: () => void
    mobile?: boolean
}

export default function SearchInput({
    query,
    onSearch,
    onReset,
    onBack,
    onFocus,
    onBlur,
    mobile = false,
}: Props) {
    if (mobile) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative flex-1">
                    <Input
                        autoFocus
                        type="text"
                        inputMode="search"
                        enterKeyHint="search"
                        value={query}
                        onChange={(event) => onSearch(event.target.value)}
                        placeholder="Search..."
                        className="pr-9"
                    />

                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                            onClick={onReset}
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                className="pl-9 pr-9"
                value={query}
                onChange={(event) => onSearch(event.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="Search..."
            />

            {query && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={onReset}
                    aria-label="Clear search"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    )
}
