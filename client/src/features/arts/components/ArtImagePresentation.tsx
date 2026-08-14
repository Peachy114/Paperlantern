import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { storageUrl } from '@/utils/storage'
import type { Art } from '@/types/art'
import { getArtImages } from '@/features/arts/utils/myArts'

// Art image carousel ----
export function ArtImageCarousel({ art }: { art: Art }) {
    const images = getArtImages(art)
    if (images.length === 0) {
        return <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center lg:w-72"><ImageOff className="h-6 w-6 text-muted-foreground" /></div>
    }
    return (
        <div className="w-full lg:w-72">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                    <div key={`${image.image_path}-${index}`} className="min-w-full snap-center overflow-hidden rounded-lg border bg-background">
                        <div className="aspect-square bg-muted"><img src={storageUrl(image.image_path)!} alt={`${art.title} image ${index + 1}`} className="h-full w-full object-contain" /></div>
                        {image.description && <p className="line-clamp-2 border-t p-2 text-xs text-muted-foreground">{image.description}</p>}
                    </div>
                ))}
            </div>
            {images.length > 1 && <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ChevronLeft className="h-3 w-3" /><span>{images.length} images</span><ChevronRight className="h-3 w-3" /></div>}
        </div>
    )
}

// Existing art images ----
export function ExistingImagesPreview({ art }: { art: Art }) {
    const images = getArtImages(art)
    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
                <div key={`${image.image_path}-${index}`} className="w-40 shrink-0 overflow-hidden rounded-lg border bg-background">
                    <div className="aspect-square bg-muted"><img src={storageUrl(image.image_path)!} alt={`${art.title} current image ${index + 1}`} className="h-full w-full object-contain" /></div>
                    {image.description && <p className="line-clamp-2 border-t p-2 text-xs text-muted-foreground">{image.description}</p>}
                </div>
            ))}
        </div>
    )
}
