import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'

interface CreateWorkGenresProps {
    genres: string[]
    selectedGenres: string[]
    onGenreToggle: (genre: string) => void
    error: boolean
    fieldErrors: Record<string, string>
}

export default function CreateWorkGenres({
    genres,
    selectedGenres,
    onGenreToggle,
    error,
    fieldErrors,
}: CreateWorkGenresProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label>
                Genres <span className="text-red-400">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                    <button
                        key={genre}
                        type="button"
                        onClick={() => onGenreToggle(genre)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            selectedGenres.includes(genre)
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
                        }`}
                    >
                        {genre}
                    </button>
                ))}
            </div>
            <FieldError fieldErrors={fieldErrors} field="genres" />
        </div>
    )
}
