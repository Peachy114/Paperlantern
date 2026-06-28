import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, ArrowLeft } from 'lucide-react'

interface Props {
    query: string
    onSearch: (val: string) => void
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
    mobile,
}: Props) {
    if (mobile) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="relative flex-1">
                    <Input
                        autoFocus
                        type="search"
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search..."
                    />
                    {query && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={onReset}
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Input
                type="text"
                className="pl-9 pr-8"
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="Search..."
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={onReset}
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}
