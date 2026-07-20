import { useCreateWork, WORK_LANGUAGES } from '@/features/studio/hooks/useCreateWork'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'
import { ChevronLeft } from 'lucide-react'

import CreateWorkTitle from './CreateWorkTitle'
import CreateWorkDescription from './CreateWorkDescription'
import CreateWorkGenres from './CreateWorkGenres'
import CreateWorkSchedule from './CreateWorkSchedule'
import CreateWorkFirstChapter from './CreateWorkFirstChapter'
import CreateWorkFirstChapterCover from './CreateWorkFirstChapterCover'
import CreateWorkFirstStoryContent from './CreateWorkFirstStoryContent'
import CreateWorkImages from './CreateWorkImages'
import ContentRatingAssessment from './ContentRatingAssessment'

const DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
] as const

export default function CreateWorkView() {
    const {
        type,
        availableGenres,
        form,
        coverPreview,
        bannerPreview,
        contentRating,
        sensitivityFlags,
        ratingAgreement,
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
        handleGenreRequest,
        handleContentRatingChange,
        handleSensitivityToggle,
        handleRatingAgreementChange,
        handleFileChange,
        handleChapterChange,
        handleChapterCoverChange,
        handleChapterImagesChange,
        removeChapterImage,
        handleSubmit,
    } = useCreateWork()

    const fe = (field: string) => !!fieldErrors[field]

    const [scheduleMode, schedulePayload = ''] = form.schedule.split(':')
    const normalizedScheduleMode = ['daily', 'weekly', 'biweekly', 'monthly'].includes(scheduleMode)
        ? scheduleMode
        : ''
    const selectValue = normalizedScheduleMode || '__none__'
    const selectedDays =
        normalizedScheduleMode === 'weekly' || normalizedScheduleMode === 'biweekly'
            ? schedulePayload.split(',').filter(Boolean)
            : []
    const monthlyDay = normalizedScheduleMode === 'monthly' ? schedulePayload : '1'

    const handleDayToggle = (day: string) => {
        if (normalizedScheduleMode === 'weekly') {
            handleChange({ target: { name: 'schedule', value: `weekly:${day}` } } as any)
            return
        }

        if (normalizedScheduleMode === 'biweekly') {
            const next = selectedDays.includes(day)
                ? selectedDays.filter((selected) => selected !== day)
                : selectedDays.length >= 2
                  ? [selectedDays[1], day]
                  : [...selectedDays, day]
            handleChange({
                target: { name: 'schedule', value: `biweekly:${next.join(',')}` },
            } as any)
        }
    }

    const handleScheduleModeChange = (mode: string) => {
        const defaults: Record<string, string> = {
            daily: 'daily',
            weekly: 'weekly:mon',
            biweekly: 'biweekly:mon,thu',
            monthly: 'monthly:1',
        }
        handleChange({ target: { name: 'schedule', value: defaults[mode] ?? '' } } as any)
    }

    const handleMonthlyDayChange = (day: string) => {
        handleChange({ target: { name: 'schedule', value: `monthly:${day}` } } as any)
    }

    // CROP IMAGE.
    const handleCroppedFile = (file: File, field: 'cover' | 'banner') => {
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
        if (normalizedScheduleMode === 'daily') {
            return 'Your readers will know you post every day.'
        }
        if (normalizedScheduleMode === 'weekly') {
            const day = DAYS.find((d) => d.value === selectedDays[0])
            return `Your readers will know you post every ${day?.label ?? 'week'}.`
        }
        if (normalizedScheduleMode === 'biweekly') {
            const labels = selectedDays
                .map((value) => DAYS.find((d) => d.value === value)?.label ?? value)
                .join(' and ')
            return `Your readers will know you post twice a week: ${labels}.`
        }
        if (normalizedScheduleMode === 'monthly') {
            return `Your readers will know you post on day ${monthlyDay} of each month.`
        }
        return null
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
                            schedule={form.schedule}
                            scheduleTime={form.schedule_time}
                            scheduleMode={normalizedScheduleMode}
                            selectValue={selectValue}
                            selectedDays={selectedDays}
                            monthlyDay={monthlyDay}
                            days={DAYS}
                            recurring={[]}
                            onScheduleClear={() =>
                                handleChange({ target: { name: 'schedule', value: '' } } as any)
                            }
                            onScheduleModeChange={handleScheduleModeChange}
                            onDayToggle={handleDayToggle}
                            onMonthlyDayChange={handleMonthlyDayChange}
                            onScheduleTimeChange={handleChange}
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

                        {/* Genres */}
                        <CreateWorkGenres
                            genres={availableGenres}
                            selectedGenres={form.genres}
                            onGenreToggle={handleGenreToggle}
                            onGenreRequest={handleGenreRequest}
                            error={fe('genres')}
                            fieldErrors={fieldErrors}
                        />

                        <ContentRatingAssessment
                            values={contentRating}
                            sensitivityFlags={sensitivityFlags}
                            agreement={ratingAgreement}
                            errors={fieldErrors}
                            onRatingChange={handleContentRatingChange}
                            onSensitivityToggle={handleSensitivityToggle}
                            onAgreementChange={handleRatingAgreementChange}
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
                                            error={chapterFieldErrors._cover}
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
                                {loading ? 'Submitting…' : 'Submit series'}
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
