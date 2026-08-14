import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

interface Props {
    coverPreview: string | null
    onCroppedFile: (file: File) => void
    error?: string
}

export default function ChapterCreateImages({ coverPreview, onCroppedFile, error }: Props) {
    const [src, setSrc] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
    }

    return (
        <>
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Thumbnail</Label>
                <label
                    className={cn(
                        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden',
                        'bg-muted/20 h-36',
                        error
                            ? 'border-destructive'
                            : 'border-border hover:border-muted-foreground/50'
                    )}
                >
                    {coverPreview ? (
                        <img
                            src={coverPreview}
                            alt="Thumbnail"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-6 w-6 opacity-40" />
                            <span className="text-xs">Click to upload thumbnail</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                    />
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <ImageCropDialog key={src ?? 'chapter-create'} open={Boolean(src)} source={src}
                aspect={3 / 4} title="Crop thumbnail" outputName="episode-thumbnail.jpg"
                onClose={() => setSrc(null)} onComplete={onCroppedFile} />
        </>
    )
}
