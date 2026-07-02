import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { useCreateChapter } from '@/features/studio/hooks/useCreateChapter'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import ChapterCreateHeader from './ChapterCreateHeader'
import ChapterCreateStatus from './ChapterCreateStatus'
import ChapterCreateImages from './ChapterCreateImages'
import ChapterCreateContent from './ChapterCreateContent'
import ChapterCreateAccess from './ChapterCreateAccess'
import ChapterCreateImageContent from './ChapterCreateImageContent'

function LoadingState() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
    )
}

export default function ChapterCreate() {
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
    return <ChapterCreateForm workType={workType} />
}

function ChapterCreateForm({ workType }: { workType: 'webtoon' | 'wattpad' }) {
    const {
        form,
        coverPreview,
        imagePreviews,
        loading,
        error,
        fieldErrors,
        navigate,
        workSlug,
        handleChange,
        handleLockTypeChange,
        handleCoverChange,
        handleImagesChange,
        removeImage,
        reorderImages,
        handleSubmit,
    } = useCreateChapter(workType)

    if (loading && !form.title) return <LoadingState />

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-10">
            <div className="py-5">
                <ChapterCreateHeader
                    workType={workType}
                    onBack={() => navigate(`/studio/works/${workSlug}/chapters`)}
                />
            </div>

            <Separator />

            {error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
                {/* LEFT */}
                <div className="flex flex-col gap-8">
                    <ChapterCreateStatus
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

                    {/* MOBILE cover */}
                    <div className="block lg:hidden">
                        <ChapterCreateImages
                            coverPreview={coverPreview}
                            onCroppedFile={(file) => {
                                const dt = new DataTransfer()
                                dt.items.add(file)
                                handleCoverChange({
                                    target: { files: dt.files },
                                } as React.ChangeEvent<HTMLInputElement>)
                            }}
                            error={fieldErrors?._cover}
                        />
                    </div>

                    {workType === 'wattpad' && (
                        <ChapterCreateContent content={form.content} onChange={handleChange} />
                    )}

                    {workType === 'webtoon' && (
                        <ChapterCreateImageContent
                            imagePreviews={imagePreviews}
                            onImagesChange={handleImagesChange}
                            onRemoveImage={removeImage}
                            onReorderImages={reorderImages}
                        />
                    )}

                    {/* Desktop buttons */}
                    <div className="hidden lg:flex justify-end items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(`/studio/works/${workSlug}/chapters`)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save chapter'}
                        </Button>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-10">
                    {/* Desktop cover */}
                    <div className="hidden lg:block">
                        <ChapterCreateImages
                            coverPreview={coverPreview}
                            onCroppedFile={(file) => {
                                const dt = new DataTransfer()
                                dt.items.add(file)
                                handleCoverChange({
                                    target: { files: dt.files },
                                } as React.ChangeEvent<HTMLInputElement>)
                            }}
                            error={fieldErrors?._cover}
                        />
                    </div>

                    <ChapterCreateAccess
                        lockType={form.lock_type}
                        creditsRequired={form.credits_required}
                        onLockTypeChange={handleLockTypeChange}
                        onCreditsChange={handleChange}
                    />
                </div>
            </div>

            {/* Mobile buttons */}
            <div className="flex lg:hidden justify-end items-center gap-2 pt-10">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/studio/works/${workSlug}/chapters`)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving…' : 'Save chapter'}
                </Button>
            </div>
        </form>
    )
}
