// pages/studio/Edit.tsx
import { useEditWork, GENRES } from '@/hooks/useEditWork'
import FieldError from '@/components/ui/FieldError'

const BASE_INPUT = 'w-full h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all'
const BASE_TEXTAREA = 'w-full px-3 py-2.5 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none'
const BASE_SELECT = 'h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all'

function inputClass(fieldErrors: Record<string, string>, field: string, base: string) {
  return fieldErrors[field]
    ? `${base} border-red-400 dark:border-red-500`
    : `${base} border-zinc-200 dark:border-zinc-800`
}

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
  } = useEditWork()

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground tracking-[0.2em]"
      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}>
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
            required
            placeholder="Enter title"
            className={inputClass(fieldErrors, 'title', BASE_INPUT)}
          />
          <FieldError fieldErrors={fieldErrors} field="title" />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            maxLength={300}
            placeholder="Write a synopsis..."
            className={inputClass(fieldErrors, 'description', BASE_TEXTAREA)}
          />
          <FieldError fieldErrors={fieldErrors} field="description" />
          <span
              className="text-[11px] ml-auto"
              style={{
                fontFamily: "'Kalam', cursive",
                color: form.description.length >= 290 ? '#ef4444' : '#a1a1aa',
              }}
            >
              {form.description.length}/300
            </span>
        </div>

        {/* Cover + Banner */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cover */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Cover image</label>
            <label className={`relative flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${
              fieldErrors.cover
                ? 'border-red-400 dark:border-red-500'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}>
              {coverPreview
                ? <img src={coverPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-1 text-muted-foreground"><span className="text-2xl">🖼</span><span className="text-xs">Click to upload</span></div>
              }
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} className="sr-only" />
            </label>
            <FieldError fieldErrors={fieldErrors} field="cover" />
          </div>

          {/* Banner */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Banner image</label>
            <label className={`relative flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${
              fieldErrors.banner
                ? 'border-red-400 dark:border-red-500'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}>
              {bannerPreview
                ? <img src={bannerPreview} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="flex flex-col items-center gap-1 text-muted-foreground"><span className="text-2xl">🏞</span><span className="text-xs">Click to upload</span></div>
              }
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} className="sr-only" />
            </label>
            <FieldError fieldErrors={fieldErrors} field="banner" />
          </div>
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
              className={inputClass(fieldErrors, 'status', BASE_SELECT)}
            >
              <option value="draft">Draft</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>
            <FieldError fieldErrors={fieldErrors} field="status" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Update schedule</label>
            <select
              name="schedule"
              value={form.schedule}
              onChange={handleChange}
              className={inputClass(fieldErrors, 'schedule', BASE_SELECT)}
            >
              <option value="">No schedule</option>
              <optgroup label="Every day">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
                  <option key={d} value={d}>Every {d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </optgroup>
              <optgroup label="Recurring">
                {['daily', 'weekly', 'biweekly', 'monthly'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </optgroup>
            </select>
            <FieldError fieldErrors={fieldErrors} field="schedule" />
          </div>
        </div>

        {/* Schedule time (conditional) */}
        {form.schedule && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Preferred update time</label>
              <input
                type="time"
                name="schedule_time"
                value={form.schedule_time}
                onChange={handleChange}
                className={inputClass(fieldErrors, 'schedule_time', BASE_INPUT)}
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