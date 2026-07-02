import { Badge } from '@/components/ui/badge'

interface PublicWorkTagsProps {
    genres: string[]
}

export default function PublicWorkTags({ genres }: PublicWorkTagsProps) {
    if (!genres || genres.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((genre) => (
                <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-comix-badge-type text-white  dark:text-black"
                >
                    {genre}
                </Badge>
            ))}
        </div>
    )
}
