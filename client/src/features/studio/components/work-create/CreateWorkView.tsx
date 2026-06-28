import { useCreateWork, GENRES } from '@/features/studio/hooks/useCreateWork'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'

import CreateWorkTitle from './CreateWorkTitle'
import CreateWorkDescription from './CreateWorkDescription'
import CreateWorkGenres from './CreateWorkGenres'
import CreateWorkSchedule from './CreateWorkSchedule'
import CreateWorkFirstChapter from './CreateWorkFirstChapter'
import CreateWorkFirstChapterCover from './CreateWorkFirstChapterCover'
import CreateWorkFirstStoryContent from './CreateWorkFirstStoryContent'
import CreateWorkImages from './CreateWorkImages'

const DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
] as const

const RECURRING = ['daily', 'weekly', 'biweekly', 'monthly'] as const

export default function CreateWorkView() {
    const {
        type,
        form,
        coverPreview,
        bannerPreview,
        chapterForm,
        chapterCoverPreview,
        chapterImages,
        chapterImagePreviews,
        loading,
        error,
        fieldErrors,
        chapterFieldErrors,
        requiresChapter,
        reorderChapterImages,
        navigate,
        handleChange,
        handleGenreToggle,
        handleFileChange,
        handleChapterChange,
        handleChapterCoverChange,
        handleChapterImagesChange,
        removeChapterImage,
        handleSubmit,
    } = useCreateWork()

    const fe = (field: string) => !!fieldErrors[field]

    // Schedule mode: 'days' if a day is selected, 'recurring' if recurring, '' if none
    const scheduleMode = DAYS.some((d) => d.value === form.schedule)
        ? 'days'
        : RECURRING.includes(form.schedule as (typeof RECURRING)[number])
          ? 'recurring'
          : ''

    const selectValue =
        scheduleMode === 'days' ? 'days' : scheduleMode === 'recurring' ? form.schedule : '__none__'

    const selectedDays = scheduleMode === 'days' ? [form.schedule] : []

    const handleDayToggle = (day: string) => {
        const newVal = form.schedule === day ? '' : day
        handleChange({ target: { name: 'schedule', value: newVal } } as any)
    }

    const handleRecurringChange = (val: string) => {
        handleChange({ target: { name: 'schedule', value: val } } as any)
    }

    const handleScheduleModeChange = (mode: string) => {
        if (mode === 'days') {
            handleChange({ target: { name: 'schedule', value: 'mon' } } as any)
        } else {
            handleChange({ target: { name: 'schedule', value: '' } } as any)
        }
    }

    // CROP IMAGE.
    const handleCroppedFile = (file: File, field: 'cover' | 'banner') => {
        const preview = URL.createObjectURL(file)
        // reuse handleFileChange by faking an event — but simpler to call hook directly
        // Since the hook doesn't expose setters, use handleFileChange with a fake event:
        const dt = new DataTransfer()
        dt.items.add(file)
        const fakeEvent = {
            target: { files: dt.files },
        } as React.ChangeEvent<HTMLInputElement>
        handleFileChange(fakeEvent, field)
    }

    // INFORMATION
    const scheduleLabel = (() => {
        if (!form.schedule) return null
        if (scheduleMode === 'days') {
            const day = DAYS.find((d) => d.value === form.schedule)
            return `Your readers will know you post every ${day?.label ?? form.schedule}.`
        }
        const labels: Record<string, string> = {
            daily: 'Your readers will know you post every day.',
            weekly: 'Your readers will know you post once a week.',
            biweekly: 'Your readers will know you post every two weeks.',
            monthly: 'Your readers will know you post once a month.',
        }
        return labels[form.schedule] ?? null
    })()

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

                <h1 className="text-xl font-bold text-foreground">
                    Create new {type === 'webtoon' ? 'webtoon' : 'novel'}
                </h1>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ── RIGHT: Images ── */}
                <div className="flex flex-col gap-5 block lg:hidden my-10">
                    <CreateWorkImages
                        coverPreview={coverPreview}
                        bannerPreview={bannerPreview}
                        fieldErrors={fieldErrors}
                        onFileChange={handleFileChange}
                        onCroppedFile={handleCroppedFile}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    {/* ── LEFT: Inputs ── */}
                    <div className="flex flex-col gap-6">
                        {/* Status + Schedule */}
                        {scheduleLabel && (
                            <p className="text-xs text-muted-foreground -mt-4 flex items-center gap-1.5">
                                <span>📅</span>
                                {scheduleLabel}
                            </p>
                        )}
                        <CreateWorkSchedule
                            status={form.status}
                            schedule={form.schedule}
                            scheduleTime={form.schedule_time}
                            scheduleMode={scheduleMode}
                            selectValue={selectValue}
                            selectedDays={selectedDays}
                            days={DAYS}
                            recurring={RECURRING}
                            onStatusChange={handleChange}
                            onScheduleModeChange={handleScheduleModeChange}
                            onRecurringChange={handleRecurringChange}
                            onDayToggle={handleDayToggle}
                            onScheduleTimeChange={handleChange}
                            statusError={fe('status')}
                            scheduleTimeError={fe('schedule_time')}
                            fieldErrors={fieldErrors}
                        />

                        {/* Title */}
                        <CreateWorkTitle
                            value={form.title}
                            onChange={handleChange}
                            error={fe('title')}
                            fieldErrors={fieldErrors}
                        />

                        {/* Description */}
                        <CreateWorkDescription
                            value={form.description}
                            onChange={handleChange}
                            error={fe('description')}
                            fieldErrors={fieldErrors}
                        />

                        {/* Genres */}
                        <CreateWorkGenres
                            genres={GENRES}
                            selectedGenres={form.genres}
                            onGenreToggle={handleGenreToggle}
                            error={fe('genres')}
                            fieldErrors={fieldErrors}
                        />

                        <Separator />

                        {/* Chapter Section */}
                        {requiresChapter && (
                            <div className="flex flex-col gap-5 mt-10">
                                <div className="flex flex-col md:flex-row gap-5 mt-10">
                                    {/* Chapter info — takes remaining space */}
                                    <div className="flex-1 min-w-0">
                                        <CreateWorkFirstChapter
                                            chapterTitle={chapterForm.title}
                                            chapterStatus={chapterForm.status}
                                            onChapterTitleChange={handleChapterChange}
                                            onChapterStatusChange={handleChapterChange}
                                            requiresChapter={requiresChapter}
                                            chapterFieldErrors={chapterFieldErrors}
                                        />
                                    </div>

                                    {/* Chapter cover — fixed width */}
                                    <div className="w-full lg:w-60 md:w-60 shrink-0">
                                        <CreateWorkFirstChapterCover
                                            coverPreview={chapterCoverPreview}
                                            onCroppedFile={(file) => {
                                                const dt = new DataTransfer()
                                                dt.items.add(file)
                                                handleChapterCoverChange({
                                                    target: { files: dt.files },
                                                } as any)
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Chapter Content */}
                                <CreateWorkFirstStoryContent
                                    type={type}
                                    chapterImages={chapterImages}
                                    chapterImagePreviews={chapterImagePreviews}
                                    chapterContent={chapterForm.content}
                                    onImagesChange={handleChapterImagesChange}
                                    onImageRemove={removeChapterImage}
                                    onImagesReorder={reorderChapterImages} // ← add this
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
                                {loading ? 'Creating…' : 'Create work'}
                            </Button>
                        </div>
                    </div>

                    {/* ── RIGHT: Images ── */}
                    <div className="flex flex-col gap-5 hidden lg:block">
                        <CreateWorkImages
                            coverPreview={coverPreview}
                            bannerPreview={bannerPreview}
                            fieldErrors={fieldErrors}
                            onFileChange={handleFileChange}
                            onCroppedFile={handleCroppedFile}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}
