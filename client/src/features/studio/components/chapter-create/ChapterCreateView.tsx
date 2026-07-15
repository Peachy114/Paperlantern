import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { useCreateChapter } from '@/features/studio/hooks/useCreateChapter'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

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
    const [scheduledOpen, setScheduledOpen] = useState(false)
    const [scheduledEpisodes, setScheduledEpisodes] = useState<
        Array<{ id: string; title: string; scheduled_at?: string }>
    >([])
    const {
        form,
        images,
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

    useEffect(() => {
        if (!workSlug) return
        studioApi.getChapters(workSlug).then((res) => {
            setScheduledEpisodes(
                (res.data ?? []).filter((chapter: any) => chapter.status === 'scheduled')
            )
        })
    }, [workSlug])

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
                        onOpenScheduled={() => setScheduledOpen(true)}
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
                            imageNames={images.map((image) => image.name)}
                            onImagesChange={handleImagesChange}
                            onRemoveImage={removeImage}
                            onReorderImages={reorderImages}
                        />
                    )}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="artist_note">Artist note (optional)</Label>
                        <Textarea
                            id="artist_note"
                            name="artist_note"
                            value={form.artist_note}
                            onChange={handleChange}
                            placeholder="Leave a short note for readers."
                            className="min-h-28"
                        />
                        {fieldErrors.artist_note && (
                            <p className="text-xs text-destructive">{fieldErrors.artist_note}</p>
                        )}
                    </div>

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

            <Dialog open={scheduledOpen} onOpenChange={setScheduledOpen}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Scheduled episodes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {scheduledEpisodes.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                                No scheduled episodes yet.
                            </p>
                        ) : (
                            scheduledEpisodes.map((episode) => (
                                <div
                                    key={episode.id}
                                    className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm"
                                >
                                    <span className="font-medium">{episode.title}</span>
                                    <span className="text-muted-foreground">
                                        {episode.scheduled_at
                                            ? new Date(episode.scheduled_at).toLocaleString()
                                            : 'No date'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </form>
    )
}
