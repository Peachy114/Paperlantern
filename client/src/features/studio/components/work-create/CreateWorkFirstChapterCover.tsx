import { useState } from 'react'
import { Label } from '@/components/ui/label'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

interface Props {
    coverPreview: string | null
    onCroppedFile: (file: File) => void
    error?: string
}

export default function CreateWorkFirstChapterCover({ coverPreview, onCroppedFile, error }: Props) {
    const [src, setSrc] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
    }

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <Label>Chapter cover</Label>
                <label
                    className={`relative flex flex-col items-center justify-center h-[260px] w-full rounded-xl border-2 border-dashed bg-muted cursor-pointer hover:border-foreground/40 transition-colors overflow-hidden ${
                        error ? 'border-destructive' : 'border-border'
                    }`}
                >
                    {coverPreview ? (
                        <img
                            src={coverPreview}
                            alt="Cover"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <span className="text-2xl">🖼</span>
                            <span className="text-xs">Click to upload cover</span>
                            <span className="text-[10px] text-muted-foreground/60">
                                Ideal: 400 × 600px
                            </span>
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

            <ImageCropDialog key={src ?? 'first-chapter-cover'} open={Boolean(src)} source={src}
                aspect={3 / 4} title="Crop chapter cover" outputName="chapter-cover.jpg"
                onClose={() => setSrc(null)} onComplete={onCroppedFile} />
        </>
    )
}
