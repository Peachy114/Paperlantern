import { useState, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'

interface CreateWorkImagesProps {
    coverPreview: string | null
    bannerPreview: string | null
    fieldErrors: Record<string, string>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'banner') => void
    onCroppedFile: (file: File, field: 'cover' | 'banner') => void
}

const ASPECTS = { cover: 3 / 4, banner: 16 / 9 }
const IDEAL = { cover: '400 × 600px', banner: '1280 × 720px' }

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h)
}

export default function CreateWorkImages({
    coverPreview,
    bannerPreview,
    fieldErrors,
    onCroppedFile,
}: CreateWorkImagesProps) {
    const previews = { cover: coverPreview, banner: bannerPreview }

    const [cropModal, setCropModal] = useState<{
        field: 'cover' | 'banner'
        src: string
    } | null>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const imgRef = useRef<HTMLImageElement>(null)

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget
        const aspect = ASPECTS[cropModal!.field]
        setCrop(centerAspectCrop(width, height, aspect))
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'cover' | 'banner'
    ) => {
        const file = e.target.files?.[0]
        if (!file) return
        const src = URL.createObjectURL(file)
        setCropModal({ field, src })
        setCrop(undefined)
        setCompletedCrop(undefined)
    }

    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop || !cropModal) return
        const canvas = document.createElement('canvas')
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height
        canvas.width = completedCrop.width * scaleX
        canvas.height = completedCrop.height * scaleY
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        )
        canvas.toBlob(
            (blob) => {
                if (!blob) return
                const file = new File([blob], `${cropModal.field}.jpg`, { type: 'image/jpeg' })
                onCroppedFile(file, cropModal.field)
                setCropModal(null)
            },
            'image/jpeg',
            0.85
        )
    }

    return (
        <>
            <Card>
                <CardContent className="pt-5 flex flex-col gap-5">
                    {(['cover', 'banner'] as const).map((field) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="capitalize text-sm font-medium">
                                    {field} image
                                </label>
                                <span className="text-xs text-muted-foreground">
                                    Ideal: {IDEAL[field]}
                                </span>
                            </div>

                            <label
                                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-muted ${
                                    field === 'cover' ? 'h-[360px]' : 'aspect-[16/9]'
                                } ${
                                    fieldErrors[field]
                                        ? 'border-red-400'
                                        : 'border-border hover:border-foreground/40'
                                }`}
                            >
                                {previews[field] ? (
                                    <img
                                        src={previews[field]!}
                                        alt={`${field} preview`}
                                        className={`absolute inset-0 w-full h-full ${
                                            field === 'cover' ? 'object-contain' : 'object-cover'
                                        }`}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                        <span className="text-2xl">
                                            {field === 'cover' ? '🖼' : '🏞'}
                                        </span>
                                        <span className="text-xs">Click to upload</span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            {field === 'cover' ? '3:4 ratio' : '16:9 ratio'}
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, field)}
                                    className="sr-only"
                                />
                            </label>

                            {fieldErrors[field] && (
                                <p className="text-xs text-red-400">{fieldErrors[field]}</p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Crop Modal */}
            <Dialog open={!!cropModal} onOpenChange={(o) => !o && setCropModal(null)}>
                <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="text-sm font-medium">
                            Crop {cropModal?.field} image
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Crop and confirm your {cropModal?.field} image
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[60vh] flex items-center justify-center">
                        {cropModal && (
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={ASPECTS[cropModal.field]}
                                keepSelection
                            >
                                <img
                                    ref={imgRef}
                                    src={cropModal.src}
                                    onLoad={onImageLoad}
                                    className="max-w-full"
                                />
                            </ReactCrop>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setCropModal(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCropConfirm}>Apply crop</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
