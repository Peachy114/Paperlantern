import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface PublicShowHeaderProps {
    title: string
    order: number
    workType: string
    createdAt: string
    slug: string
    navigate: (path: string) => void
}

export default function PublicShowHeader({
    title,
    order,
    workType,
    createdAt,
    slug,
    navigate,
}: PublicShowHeaderProps) {
    return (
        <div className="flex items-center justify-between pb-4 mb-6 gap-3">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/works/${slug}`)}
                className="shrink-0 -ml-2 text-muted-foreground hover:text-foreground"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
            </Button>

            <div className="flex-1 min-w-0 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">
                    {workType === 'webtoon' ? 'Webtoon' : 'Novel'} · Ch.{order}
                </p>
                <h1 className="text-lg font-semibold leading-tight truncate">{title}</h1>
            </div>

            <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                {new Date(createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </span>
        </div>
    )
}
