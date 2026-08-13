import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

interface EditWorkImagesProps {
    coverPreview: string | null
    bannerPreview: string | null
    onCroppedFile: (file: File, field: 'cover' | 'banner') => void
    coverError: boolean
    bannerError: boolean
    fieldErrors: Record<string, string>
}

const ASPECTS = { cover: 3 / 4, banner: 16 / 9 } as const
const IDEAL = { cover: '400 × 600px', banner: '1280 × 720px' } as const

type CropField = 'cover' | 'banner'
type CropModal = { field: CropField; src: string } | null

export default function EditWorkImages({
    coverPreview,
    bannerPreview,
    onCroppedFile,
    coverError,
    bannerError,
    fieldErrors,
}: EditWorkImagesProps) {
    const previews: Record<CropField, string | null> = {
        cover: coverPreview,
        banner: bannerPreview,
    }
    const errors: Record<CropField, boolean> = { cover: coverError, banner: bannerError }

    const [cropModal, setCropModal] = useState<CropModal>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: CropField) => {
        const file = e.target.files?.[0]
        if (!file) return
        setCropModal({ field, src: URL.createObjectURL(file) })
    }

    return (
        <>
            <Card>
                <CardContent className="pt-5 flex flex-col gap-5">
                    {(['cover', 'banner'] as const).map((field) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="capitalize">{field} image</Label>
                                <span className="text-xs text-muted-foreground">
                                    Ideal: {IDEAL[field]}
                                </span>
                            </div>
                            <label
                                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-muted ${
                                    field === 'cover' ? 'h-[400px]' : 'aspect-[16/9]'
                                } ${
                                    errors[field]
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
                            <FieldError fieldErrors={fieldErrors} field={field} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <ImageCropDialog
                key={cropModal?.src ?? 'work-edit-crop'}
                open={Boolean(cropModal)}
                source={cropModal?.src ?? null}
                aspect={cropModal ? ASPECTS[cropModal.field] : 1}
                title={`Crop ${cropModal?.field ?? 'work'} image`}
                outputName={`${cropModal?.field ?? 'work'}.jpg`}
                onClose={() => setCropModal(null)}
                onComplete={(file) => { if (cropModal) onCroppedFile(file, cropModal.field) }}
            />
        </>
    )
}
