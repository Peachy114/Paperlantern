// pages/studio/work/Edit.tsx
import { useEditWork, GENRES } from '@/features/studio/hooks/useEditWork'
import FieldError from '@/components/ui/FieldError'

const BASE_INPUT =
    'w-full h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all'
const BASE_TEXTAREA =
    'w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none'
const BASE_SELECT =
    'h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all'

function inputClass(hasError: boolean, base: string) {
    return `${base} ${hasError ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const RECURRING = ['daily', 'weekly', 'biweekly', 'monthly'] as const

export default function EditWork() {
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
    } = useEditWork()

    const fe = (field: string) => !!fieldErrors[field]

    if (fetching)
        return (
            <div
                className="flex items-center justify-center min-h-[60vh] text-muted-foreground tracking-[0.2em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}
            >
                — LOADING... —
            </div>
        )

    return (
        <div className="max-w-2xl mx-auto px-6 py-10">
            <link
                href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap"
                rel="stylesheet"
            />

            {/* Header */}
            <div className="flex flex-col gap-0.5 mb-8">
                <button
                    onClick={() => navigate('/studio')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                    style={{ fontFamily: "'Kalam', cursive" }}
                >
                    ← Back to Studio
                </button>
                <h1
                    className="text-xl font-bold text-foreground mt-0.5"
                    style={{ fontFamily: "'Kalam', cursive" }}
                >
                    Edit work
                </h1>
            </div>

            {/* General error */}
            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">
                        Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Enter title"
                        className={inputClass(fe('title'), BASE_INPUT)}
                    />
                    <FieldError fieldErrors={fieldErrors} field="title" />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">
                        Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        maxLength={300}
                        placeholder="Write a synopsis..."
                        className={inputClass(fe('description'), BASE_TEXTAREA)}
                    />
                    <span
                        className="text-[11px] ml-auto"
                        style={{
                            fontFamily: "'Kalam', cursive",
                            color: form.description.length >= 290 ? '#ef4444' : '#a1a1aa',
                        }}
                    >
                        {form.description.length}/300
                    </span>
                    <FieldError fieldErrors={fieldErrors} field="description" />
                </div>

                {/* Cover + Banner */}
                <div className="grid grid-cols-2 gap-4">
                    {(['cover', 'banner'] as const).map((field) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground capitalize">
                                {field} image
                            </label>
                            <label
                                className={`relative flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${
                                    fe(field)
                                        ? 'border-red-400 dark:border-red-500'
                                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}
                            >
                                {(field === 'cover' ? coverPreview : bannerPreview) ? (
                                    <img
                                        src={(field === 'cover' ? coverPreview : bannerPreview)!}
                                        alt={`${field} preview`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                        <span className="text-2xl">
                                            {field === 'cover' ? '🖼' : '🏞'}
                                        </span>
                                        <span className="text-xs">Click to upload</span>
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
                </div>

                {/* Genres */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">
                        Genres <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map((genre) => (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => handleGenreToggle(genre)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                    form.genres.includes(genre)
                                        ? 'bg-foreground text-background border-foreground'
                                        : 'bg-transparent text-muted-foreground border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 hover:text-foreground'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                    <FieldError fieldErrors={fieldErrors} field="genres" />
                </div>

                {/* Status + Schedule */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className={inputClass(fe('status'), BASE_SELECT)}
                        >
                            <option value="draft">Draft</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="hiatus">Hiatus</option>
                        </select>
                        <FieldError fieldErrors={fieldErrors} field="status" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            Update schedule
                        </label>
                        <select
                            name="schedule"
                            value={form.schedule}
                            onChange={handleChange}
                            className={inputClass(fe('schedule'), BASE_SELECT)}
                        >
                            <option value="">No schedule</option>
                            <optgroup label="Every day">
                                {DAYS.map((d) => (
                                    <option key={d} value={d}>
                                        Every {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Recurring">
                                {RECURRING.map((s) => (
                                    <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        <FieldError fieldErrors={fieldErrors} field="schedule" />
                    </div>
                </div>

                {/* Chapter Section — only shown when no chapters exist and status requires one */}
                {requiresChapter && (
                    <div className="flex flex-col gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-10">
                        <div className="w-full">
                            <p
                                className="text-center font-medium text-foreground"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                📖 First chapter (required)
                            </p>
                            <p
                                className="text-xs text-muted-foreground mt-0.5 text-center"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                Ongoing and completed works need at least 1 published chapter.
                            </p>
                        </div>

                        {/* Chapter title + status */}
                        <div className="grid grid-cols-2 gap-4 mt-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Chapter title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="title"
                                    value={chapterForm.title}
                                    onChange={handleChapterChange}
                                    placeholder="Chapter title"
                                    className={inputClass(!!chapterFieldErrors.title, BASE_INPUT)}
                                />
                                {chapterFieldErrors.title && (
                                    <p className="text-xs text-red-400">
                                        {chapterFieldErrors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={chapterForm.status}
                                    onChange={handleChapterChange}
                                    disabled
                                    className={inputClass(!!chapterFieldErrors.status, BASE_SELECT)}
                                >
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        {/* Chapter cover */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Chapter cover <span className="text-red-400">*</span>
                            </label>
                            <label
                                className={`relative flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed cursor-pointer hover:border-zinc-400 transition-colors overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${chapterFieldErrors._cover ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                            >
                                {chapterCoverPreview ? (
                                    <img
                                        src={chapterCoverPreview}
                                        alt="Cover"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                        <span className="text-2xl">🖼</span>
                                        <span className="text-xs">Click to upload cover</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleChapterCoverChange}
                                    className="sr-only"
                                />
                            </label>
                            {chapterFieldErrors._cover && (
                                <p className="text-xs text-red-400">{chapterFieldErrors._cover}</p>
                            )}
                        </div>

                        {/* Webtoon pages */}
                        {form.type === 'webtoon' && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-foreground">
                                    Chapter pages <span className="text-red-400">*</span>
                                </label>
                                {chapterFieldErrors._images && (
                                    <p className="text-xs text-red-400">
                                        {chapterFieldErrors._images}
                                    </p>
                                )}
                                <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 transition-colors text-sm text-muted-foreground">
                                    <span>+</span>
                                    <span>
                                        {chapterImages.length > 0 ? 'Add more pages' : 'Add pages'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleChapterImagesChange}
                                        className="sr-only"
                                    />
                                </label>
                                {chapterImagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        {chapterImagePreviews.map((src, i) => (
                                            <div
                                                key={src}
                                                className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-[3/4]"
                                            >
                                                <img
                                                    src={src}
                                                    alt={`Page ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                                                    {i + 1}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeChapterImage(i)}
                                                    className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Novel content */}
                        {form.type === 'wattpad' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Story content <span className="text-red-400">*</span>
                                </label>
                                {chapterFieldErrors.content && (
                                    <p className="text-xs text-red-400">
                                        {chapterFieldErrors.content}
                                    </p>
                                )}
                                <textarea
                                    name="content"
                                    value={chapterForm.content}
                                    onChange={handleChapterChange}
                                    rows={12}
                                    placeholder="Write your story here..."
                                    className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none leading-relaxed font-[Georgia,serif]"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Schedule time (conditional) */}
                {form.schedule && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Preferred update time
                            </label>
                            <input
                                type="time"
                                name="schedule_time"
                                value={form.schedule_time}
                                onChange={handleChange}
                                className={inputClass(fe('schedule_time'), BASE_INPUT)}
                            />
                            <FieldError fieldErrors={fieldErrors} field="schedule_time" />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/studio')}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-zinc-400 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
