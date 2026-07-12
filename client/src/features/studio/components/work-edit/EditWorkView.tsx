import { useEditWork } from '@/features/studio/hooks/useEditWork'
import { WORK_LANGUAGES } from '@/features/studio/hooks/useCreateWork'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'
import { ChevronLeft } from 'lucide-react'

import EditWorkTitle from './EditWorkTitle'
import EditWorkImages from './EditWorkImages'
import EditWorkGenres from './EditWorkGenres'
import EditWorkSchedule from './EditWorkSchedule'

// Reuse the same chapter sub-components from CreateWork
import CreateWorkFirstChapter from '../work-create/CreateWorkFirstChapter'
import CreateWorkFirstChapterCover from '../work-create/CreateWorkFirstChapterCover'
import CreateWorkFirstStoryContent from '../work-create/CreateWorkFirstStoryContent'

export default function EditWorkView() {
    const {
        form,
        coverPreview,
        bannerPreview,
        loading,
        fetching,
        error,
        fieldErrors,
        navigate,
        handleChange,
        handleGenreToggle,
        handleFileChange,
        handleSubmit,
        // Chapter
        requiresChapter,
        chapterForm,
        chapterCoverPreview,
        chapterImages,
        chapterImagePreviews,
        chapterFieldErrors,
        handleChapterChange,
        handleChapterCoverChange,
        handleChapterImagesChange,
        removeChapterImage,
        reorderChapterImages,
    } = useEditWork()

    const fe = (field: string) => !!fieldErrors[field]

    if (fetching)
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm tracking-widest">
                — LOADING... —
            </div>
        )

    return (
        <div className="px-6 py-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/studio')}
                    className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Studio
                </Button>

                <h1 className="text-xl font-bold text-foreground">Edit work</h1>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ── RIGHT: Images + Genres ── */}
                <div className="flex flex-col gap-5 block lg:hidden my-10">
                    <EditWorkImages
                        coverPreview={coverPreview}
                        bannerPreview={bannerPreview}
                        onCroppedFile={(file, field) => {
                            const dt = new DataTransfer()
                            dt.items.add(file)
                            handleFileChange({ target: { files: dt.files } } as any, field)
                        }}
                        coverError={fe('cover')}
                        bannerError={fe('banner')}
                        fieldErrors={fieldErrors}
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    {/* ── LEFT: Inputs ── */}
                    <div className="flex flex-col gap-6">
                        {/* Title + Description */}
                        <EditWorkTitle
                            title={form.title}
                            description={form.description}
                            onTitleChange={handleChange}
                            onDescriptionChange={handleChange}
                            titleError={fe('title')}
                            descriptionError={fe('description')}
                            fieldErrors={fieldErrors}
                        />

                        <div className="flex flex-col gap-1.5">
                            <Label>
                                Language <span className="text-red-400">*</span>
                            </Label>
                            <select
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                className={`h-9 rounded-lg border bg-background px-3 text-sm ${
                                    fe('language') ? 'border-red-400' : 'border-input'
                                }`}
                            >
                                {WORK_LANGUAGES.map((language) => (
                                    <option key={language.value} value={language.value}>
                                        {language.label}
                                    </option>
                                ))}
                            </select>
                            <FieldError fieldErrors={fieldErrors} field="language" />
                        </div>

                        <EditWorkGenres
                            selectedGenres={form.genres}
                            onGenreToggle={handleGenreToggle}
                            error={fe('genres')}
                            fieldErrors={fieldErrors}
                        />

                        {/* Status + Schedule */}
                        <EditWorkSchedule
                            status={form.status}
                            schedule={form.schedule}
                            scheduleTime={form.schedule_time}
                            onStatusChange={handleChange}
                            onScheduleChange={handleChange}
                            onScheduleTimeChange={handleChange}
                            statusError={fe('status')}
                            scheduleError={fe('schedule')}
                            scheduleTimeError={fe('schedule_time')}
                            fieldErrors={fieldErrors}
                        />

                        <Separator />

                        {/* Chapter Section */}
                        {requiresChapter && (
                            <div className="flex flex-col gap-5 mt-10">
                                <CreateWorkFirstChapter
                                    chapterTitle={chapterForm.title}
                                    chapterStatus={chapterForm.status}
                                    onChapterTitleChange={handleChapterChange}
                                    onChapterStatusChange={handleChapterChange}
                                    requiresChapter={requiresChapter}
                                    chapterFieldErrors={chapterFieldErrors}
                                />

                                <CreateWorkFirstChapterCover
                                    coverPreview={chapterCoverPreview}
                                    onCroppedFile={(file) => {
                                        const dt = new DataTransfer()
                                        dt.items.add(file)
                                        handleChapterCoverChange({
                                            target: { files: dt.files },
                                        } as React.ChangeEvent<HTMLInputElement>)
                                    }}
                                />

                                <CreateWorkFirstStoryContent
                                    type={form.type}
                                    chapterImages={chapterImages}
                                    chapterImagePreviews={chapterImagePreviews}
                                    chapterContent={chapterForm.content}
                                    onImagesChange={handleChapterImagesChange}
                                    onImageRemove={removeChapterImage}
                                    onImagesReorder={reorderChapterImages}
                                    onContentChange={handleChapterChange}
                                    chapterFieldErrors={chapterFieldErrors}
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/studio')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </div>

                    {/* ── RIGHT: Images + Genres ── */}
                    <div className="flex flex-col gap-5 hidden lg:block">
                        <EditWorkImages
                            coverPreview={coverPreview}
                            bannerPreview={bannerPreview}
                            coverError={fe('cover')}
                            bannerError={fe('banner')}
                            fieldErrors={fieldErrors}
                            onCroppedFile={(file, field) => {
                                const dt = new DataTransfer()
                                dt.items.add(file)
                                handleFileChange({ target: { files: dt.files } } as any, field)
                            }}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}
