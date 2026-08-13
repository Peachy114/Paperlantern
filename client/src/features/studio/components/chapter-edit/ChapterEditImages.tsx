import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

interface ImageItem {
    preview: string
    file?: File
}

interface ChapterEditImagesProps {
    workType: 'webtoon' | 'wattpad'
    coverPreview: string | null
    imageItems: ImageItem[]
    onCroppedFile: (file: File) => void
    onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: (index: number) => void
    onReorderImages: (from: number, to: number) => void
}

export function ChapterEditImages({ coverPreview, onCroppedFile }: ChapterEditImagesProps) {
    const [src, setSrc] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">Chapter cover</Label>
                    <label
                        className={cn(
                            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden',
                            'border-border hover:border-muted-foreground/50 bg-muted/20 h-36'
                        )}
                    >
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Cover"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-6 w-6 opacity-40" />
                                <span className="text-xs">Click to upload cover</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                    </label>
                </div>
            </div>

            <ImageCropDialog key={src ?? 'chapter-edit'} open={Boolean(src)} source={src}
                aspect={3 / 4} title="Crop chapter cover" outputName="chapter-cover.jpg"
                onClose={() => setSrc(null)} onComplete={onCroppedFile} />
        </>
    )
}
