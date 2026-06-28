import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { studioApi } from '@/api/studio'
import { useEditChapter } from '@/features/studio/hooks/useEditChapter'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ChapterEditHeader } from './ChapterEditHeader'
import { ChapterEditStatus } from './ChapterEditStatus'
import { ChapterEditImages } from './ChapterEditImages'
import { ChapterEditContent } from './ChapterEditContent'
import { ChapterEditAccess } from './ChapterEditAccess'
import ChapterEditImageContent from './ChapterEditImageContent'
import { Separator } from '@/components/ui/separator'

function LoadingState() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
    )
}

export default function ChapterEdit() {
    const { workSlug } = useParams()
    const [workType, setWorkType] = useState<'webtoon' | 'wattpad'>('webtoon')
    const [fetchingWork, setFetchingWork] = useState(true)

    useEffect(() => {
        studioApi
            .getWork(workSlug!)
            .then((res) => setWorkType(res.data.type))
            .finally(() => setFetchingWork(false))
    }, [workSlug])

    if (fetchingWork) return <LoadingState />
    return <ChapterEditForm workType={workType} />
}

function ChapterEditForm({ workType }: { workType: 'webtoon' | 'wattpad' }) {
    const {
        form,
        coverPreview,
        imageItems,
        loading,
        fetching,
        error,
        navigate,
        workSlug,
        handleChange,
        handleLockTypeChange,
        handleCoverChange,
        handleImagesChange,
        removeImage,
        reorderImages,
        handleSubmit,
    } = useEditChapter(workType)

    if (fetching) return <LoadingState />

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-10">
            {/* HEADER + BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-start w-full justify-between gap-4 py-5">
                <ChapterEditHeader
                    workType={workType}
                    onBack={() => navigate(`/studio/works/${workSlug}/chapters`)}
                />
            </div>

            <Separator />

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
                <div className="flex flex-col gap-8">
                    <ChapterEditStatus
                        title={form.title}
                        status={form.status}
                        scheduledAt={form.scheduled_at}
                        onTitleChange={handleChange}
                        onStatusChange={(val) =>
                            handleChange({ target: { name: 'status', value: val } } as any)
                        }
                        onScheduledAtChange={(val) =>
                            handleChange({ target: { name: 'scheduled_at', value: val } } as any)
                        }
                    />

                    {/* MOBILE - COVER */}
                    <div className="block lg:hidden">
                        <ChapterEditImages
                            workType={workType}
                            coverPreview={coverPreview}
                            imageItems={imageItems}
                            onCroppedFile={(file) => {
                                const dt = new DataTransfer()
                                dt.items.add(file)
                                handleCoverChange({
                                    target: { files: dt.files },
                                } as React.ChangeEvent<HTMLInputElement>)
                            }}
                            onImagesChange={handleImagesChange}
                            onRemoveImage={removeImage}
                            onReorderImages={reorderImages}
                        />
                    </div>

                    {workType === 'wattpad' && (
                        <ChapterEditContent content={form.content} onChange={handleChange} />
                    )}

                    {workType === 'webtoon' && (
                        <ChapterEditImageContent
                            imageItems={imageItems}
                            onImagesChange={handleImagesChange}
                            onRemoveImage={removeImage}
                            onReorderImages={reorderImages}
                        />
                    )}

                    {/* BUTTONS */}
                    <div className="hidden lg:flex justify-end items-center gap-2 sm:pt-2 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(`/studio/works/${workSlug}/chapters`)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* DESKTOP - COVER */}
                    <div className="hidden lg:block">
                        <ChapterEditImages
                            workType={workType}
                            coverPreview={coverPreview}
                            imageItems={imageItems}
                            onCroppedFile={(file) => {
                                const dt = new DataTransfer()
                                dt.items.add(file)
                                handleCoverChange({
                                    target: { files: dt.files },
                                } as React.ChangeEvent<HTMLInputElement>)
                            }}
                            onImagesChange={handleImagesChange}
                            onRemoveImage={removeImage}
                            onReorderImages={reorderImages}
                        />
                    </div>

                    {/* ACCESS TYPE */}
                    <ChapterEditAccess
                        lockType={form.lock_type as 'free' | 'early_access' | 'premium'}
                        creditsRequired={form.credits_required}
                        onLockTypeChange={handleLockTypeChange}
                        onCreditsChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex lg:hidden justify-end items-center gap-2 pt-10 lg:pt-2 shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/studio/works/${workSlug}/chapters`)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving…' : 'Save changes'}
                </Button>
            </div>
        </form>
    )
}
