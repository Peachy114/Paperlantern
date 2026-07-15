import { useState } from 'react'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreateWorkGenresProps {
    genres: string[]
    selectedGenres: string[]
    onGenreToggle: (genre: string) => void
    onGenreRequest: (name: string) => Promise<boolean>
    error: boolean
    fieldErrors: Record<string, string>
}

export default function CreateWorkGenres({
    genres,
    selectedGenres,
    onGenreToggle,
    onGenreRequest,
    fieldErrors,
}: CreateWorkGenresProps) {
    const [requestName, setRequestName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const submitRequest = async () => {
        setSubmitting(true)
        const sent = await onGenreRequest(requestName)
        if (sent) setRequestName('')
        setSubmitting(false)
    }

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
            <div className="mt-2 rounded-lg border border-dashed border-border p-3">
                <Label className="text-xs text-muted-foreground">Request a new genre</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                        value={requestName}
                        onChange={(event) => setRequestName(event.target.value)}
                        placeholder="Genre name"
                        className="h-9"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={submitRequest}
                    >
                        {submitting ? 'Sending...' : 'Request'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
