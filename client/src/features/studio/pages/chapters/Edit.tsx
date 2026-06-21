// import { useEffect, useState, useRef } from 'react'
// import { useParams } from 'react-router-dom'
// import { studioApi } from '@/api/studio'
// import { useEditChapter } from '@/features/studio/hooks/useEditChapter'

// const LOCK_OPTIONS = [
//     { value: 'free', label: '🔓 Free', desc: 'Everyone can read immediately', color: '#86efac' },
//     {
//         value: 'early_access',
//         label: '⏳ Early Access',
//         desc: 'Locked for 7 days with credits, then free for everyone',
//         color: '#fef08a',
//     },
//     {
//         value: 'premium',
//         label: '💎 Premium',
//         desc: 'Always locked — readers need credits',
//         color: '#fca5a5',
//     },
// ] as const

// export default function ChapterEdit() {
//     const { workId } = useParams()
//     const [workType, setWorkType] = useState<'webtoon' | 'wattpad'>('webtoon')
//     const [fetchingWork, setFetchingWork] = useState(true)

//     useEffect(() => {
//         studioApi
//             .getWork(Number(workId))
//             .then((res) => setWorkType(res.data.type))
//             .finally(() => setFetchingWork(false))
//     }, [workId])

//     if (fetchingWork)
//         return (
//             <div
//                 className="flex items-center justify-center min-h-[60vh] text-muted-foreground tracking-[0.2em]"
//                 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}
//             >
//                 — LOADING... —
//             </div>
//         )

//     return <ChapterEditForm workType={workType} />
// }

// function ChapterEditForm({ workType }: { workType: 'webtoon' | 'wattpad' }) {
//     const {
//         form,
//         coverPreview,
//         imageItems,
//         loading,
//         fetching,
//         error,
//         navigate,
//         workId,
//         handleChange,
//         handleLockTypeChange,
//         handleCoverChange,
//         handleImagesChange,
//         removeImage,
//         reorderImages,
//         handleSubmit,
//     } = useEditChapter(workType)

//     const dragIndex = useRef<number | null>(null)
//     const dragOverIndex = useRef<number | null>(null)

//     const handleDragStart = (i: number) => {
//         dragIndex.current = i
//     }
//     const handleDragOver = (e: React.DragEvent, i: number) => {
//         e.preventDefault()
//         dragOverIndex.current = i
//     }
//     const handleDrop = () => {
//         if (dragIndex.current === null || dragOverIndex.current === null) return
//         if (dragIndex.current === dragOverIndex.current) return
//         reorderImages(dragIndex.current, dragOverIndex.current)
//         dragIndex.current = null
//         dragOverIndex.current = null
//     }

//     if (fetching)
//         return (
//             <div
//                 className="flex items-center justify-center min-h-[60vh] text-muted-foreground tracking-[0.2em]"
//                 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}
//             >
//                 — LOADING... —
//             </div>
//         )

//     return (
//         <div className="max-w-2xl mx-auto px-6 py-10">
//             <link
//                 href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap"
//                 rel="stylesheet"
//             />

//             {/* Header */}
//             <div className="flex flex-col gap-0.5 mb-8">
//                 <button
//                     onClick={() => navigate(`/studio/works/${workId}/chapters`)}
//                     className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
//                     style={{ fontFamily: "'Kalam', cursive" }}
//                 >
//                     ← Back to chapters
//                 </button>
//                 <h1
//                     className="text-xl font-bold text-foreground mt-0.5"
//                     style={{ fontFamily: "'Kalam', cursive" }}
//                 >
//                     Edit chapter — {workType === 'webtoon' ? 'Webtoon' : 'Novel'}
//                 </h1>
//             </div>

//             {error && (
//                 <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-500">
//                     {error}
//                 </div>
//             )}

//             <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//                 {/* Title + Status */}
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-sm font-medium text-foreground">
//                             Title <span className="text-red-400">*</span>
//                         </label>
//                         <input
//                             name="title"
//                             value={form.title}
//                             onChange={handleChange}
//                             placeholder="Chapter title"
//                             className="w-full h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
//                         />
//                     </div>
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-sm font-medium text-foreground">Status</label>
//                         <select
//                             name="status"
//                             value={form.status}
//                             onChange={handleChange}
//                             className="h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
//                         >
//                             <option value="draft">Draft</option>
//                             <option value="scheduled">Scheduled</option>
//                             <option value="published">Published</option>
//                         </select>
//                     </div>
//                 </div>

//                 {/* Scheduled at */}
//                 {form.status === 'scheduled' && (
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-sm font-medium text-foreground">
//                             Scheduled date & time
//                         </label>
//                         <input
//                             type="datetime-local"
//                             name="scheduled_at"
//                             value={form.scheduled_at}
//                             onChange={handleChange}
//                             className="h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
//                         />
//                     </div>
//                 )}

//                 {/* Cover */}
//                 <div className="flex flex-col gap-1.5">
//                     <label className="text-sm font-medium text-foreground">Chapter cover</label>
//                     <label className="relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors overflow-hidden">
//                         {coverPreview ? (
//                             <img
//                                 src={coverPreview}
//                                 alt="Cover preview"
//                                 className="absolute inset-0 w-full h-full object-cover"
//                             />
//                         ) : (
//                             <div className="flex flex-col items-center gap-1 text-muted-foreground">
//                                 <span className="text-2xl">🖼</span>
//                                 <span className="text-xs">Click to upload cover</span>
//                             </div>
//                         )}
//                         <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleCoverChange}
//                             className="sr-only"
//                         />
//                     </label>
//                 </div>

//                 {/* Webtoon pages */}
//                 {workType === 'webtoon' && (
//                     <div className="flex flex-col gap-2">
//                         <div className="flex items-center justify-between">
//                             <label className="text-sm font-medium text-foreground">
//                                 Chapter pages
//                             </label>
//                             {imageItems.length > 0 && (
//                                 <span className="text-xs text-muted-foreground">
//                                     {imageItems.length} page{imageItems.length !== 1 ? 's' : ''} ·
//                                     drag to reorder
//                                 </span>
//                             )}
//                         </div>

//                         <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-sm text-muted-foreground hover:text-foreground">
//                             <span>+</span>
//                             <span>{imageItems.length > 0 ? 'Replace pages' : 'Add pages'}</span>
//                             <input
//                                 type="file"
//                                 accept="image/*"
//                                 multiple
//                                 onChange={handleImagesChange}
//                                 className="sr-only"
//                             />
//                         </label>

//                         {imageItems.length > 0 && (
//                             <div className="grid grid-cols-3 gap-2 mt-1">
//                                 {imageItems.map((item, i) => (
//                                     <div
//                                         key={item.preview}
//                                         draggable
//                                         onDragStart={() => handleDragStart(i)}
//                                         onDragOver={(e) => handleDragOver(e, i)}
//                                         onDrop={handleDrop}
//                                         className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 cursor-grab active:cursor-grabbing aspect-[3/4]"
//                                     >
//                                         <img
//                                             src={item.preview}
//                                             alt={`Page ${i + 1}`}
//                                             className="w-full h-full object-cover pointer-events-none"
//                                         />
//                                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
//                                         <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
//                                             {i + 1}
//                                         </div>
//                                         <button
//                                             type="button"
//                                             onClick={() => removeImage(i)}
//                                             className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white"
//                                         >
//                                             Remove
//                                         </button>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 )}

//                 {/* Novel content */}
//                 {workType === 'wattpad' && (
//                     <div className="flex flex-col gap-1.5">
//                         <label className="text-sm font-medium text-foreground">Story content</label>
//                         <textarea
//                             name="content"
//                             value={form.content}
//                             onChange={handleChange}
//                             rows={20}
//                             placeholder="Write your story here..."
//                             className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none leading-relaxed font-[Georgia,serif]"
//                         />
//                     </div>
//                 )}

//                 {/* Lock settings */}
//                 <div className="flex flex-col gap-3">
//                     <p
//                         className="text-sm font-medium text-foreground"
//                         style={{ fontFamily: "'Kalam', cursive" }}
//                     >
//                         🔒 Chapter access type
//                     </p>

//                     <div className="flex flex-col gap-2 text-start">
//                         {LOCK_OPTIONS.map((option) => {
//                             const active = form.lock_type === option.value
//                             return (
//                                 <div
//                                     key={option.value}
//                                     onClick={() => {
//                                         handleChange({
//                                             target: {
//                                                 name: 'lock_type',
//                                                 type: 'text',
//                                                 value: option.value,
//                                             },
//                                         } as any)
//                                         if (
//                                             (option.value === 'early_access' ||
//                                                 option.value === 'premium') &&
//                                             (!form.credits_required || form.credits_required < 3)
//                                         ) {
//                                             handleChange({
//                                                 target: {
//                                                     name: 'credits_required',
//                                                     type: 'number',
//                                                     value: '3',
//                                                 },
//                                             } as any)
//                                         }
//                                         handleLockTypeChange(option.value)
//                                     }}
//                                     className={`flex items-start gap-3 px-4 py-3 border-[2px] cursor-pointer transition-all duration-150 ${
//                                         active
//                                             ? 'border-foreground'
//                                             : 'border-foreground/20 hover:border-foreground/50'
//                                     }`}
//                                     style={{
//                                         boxShadow: active ? `3px 3px 0 ${option.color}` : 'none',
//                                     }}
//                                 >
//                                     <div
//                                         className={`mt-0.5 w-4 h-4 border-[2px] shrink-0 flex items-center justify-center transition-all ${
//                                             active ? 'border-foreground' : 'border-foreground/30'
//                                         }`}
//                                         style={{
//                                             background: active ? option.color : 'transparent',
//                                         }}
//                                     >
//                                         {active && (
//                                             <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
//                                                 <path
//                                                     d="M1 3L3 5L7 1"
//                                                     stroke="#1a1a1a"
//                                                     strokeWidth="1.5"
//                                                     strokeLinecap="round"
//                                                     strokeLinejoin="round"
//                                                 />
//                                             </svg>
//                                         )}
//                                     </div>
//                                     <div>
//                                         <p
//                                             className="text-sm font-medium text-foreground"
//                                             style={{ fontFamily: "'Kalam', cursive" }}
//                                         >
//                                             {option.label}
//                                         </p>
//                                         <p
//                                             className="text-xs text-muted-foreground"
//                                             style={{ fontFamily: "'Kalam', cursive" }}
//                                         >
//                                             {option.desc}
//                                         </p>
//                                     </div>
//                                     {active && (
//                                         <div
//                                             className="ml-auto px-2 py-0.5 text-[10px] rotate-1 shrink-0"
//                                             style={{
//                                                 background: option.color,
//                                                 fontFamily: "'Kalam', cursive",
//                                                 color: '#1a1a1a',
//                                                 boxShadow: '1px 2px 3px rgba(0,0,0,0.12)',
//                                             }}
//                                         >
//                                             selected ✦
//                                         </div>
//                                     )}
//                                 </div>
//                             )
//                         })}
//                     </div>

//                     {(form.lock_type === 'early_access' || form.lock_type === 'premium') && (
//                         <div className="flex items-center gap-3 pl-2 pt-1">
//                             <div
//                                 className="px-2 py-1 text-[11px] -rotate-1 shrink-0"
//                                 style={{
//                                     background: '#fef08a',
//                                     fontFamily: "'Kalam', cursive",
//                                     color: '#1a1a1a',
//                                     boxShadow: '1px 2px 4px rgba(0,0,0,0.15)',
//                                 }}
//                             >
//                                 credits ✦
//                             </div>
//                             <input
//                                 type="number"
//                                 name="credits_required"
//                                 value={form.credits_required}
//                                 onChange={handleChange}
//                                 min={3}
//                                 max={20}
//                                 className="w-24 h-9 px-3 text-sm border-[2px] border-foreground/40 bg-background text-foreground focus:outline-none focus:border-amber-400 transition-colors"
//                                 style={{
//                                     fontFamily: "'Bebas Neue', sans-serif",
//                                     fontSize: '16px',
//                                     boxShadow: '2px 2px 0 var(--foreground)',
//                                 }}
//                             />
//                             <span
//                                 className="text-xs text-muted-foreground"
//                                 style={{ fontFamily: "'Kalam', cursive" }}
//                             >
//                                 credits to unlock (min. 3 - max 20)
//                             </span>
//                         </div>
//                     )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex items-center justify-end gap-2 pt-2">
//                     <button
//                         type="button"
//                         onClick={() => navigate(`/studio/works/${workId}/chapters`)}
//                         className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-zinc-400 transition-colors"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="px-5 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
//                     >
//                         {loading ? 'Saving…' : 'Save changes'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     )
// }
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { useEditChapter } from '@/features/studio/hooks/useEditChapter'

const LOCK_OPTIONS = [
    { value: 'free', label: '🔓 Free', desc: 'Everyone can read immediately', color: '#86efac' },
    {
        value: 'early_access',
        label: '⏳ Early Access',
        desc: 'Locked for 7 days with credits, then free for everyone',
        color: '#fef08a',
    },
    {
        value: 'premium',
        label: '💎 Premium',
        desc: 'Always locked — readers need credits',
        color: '#fca5a5',
    },
] as const

export default function ChapterEdit() {
    const { workId } = useParams()
    const [workType, setWorkType] = useState<'webtoon' | 'wattpad'>('webtoon')
    const [fetchingWork, setFetchingWork] = useState(true)

    useEffect(() => {
        studioApi
            .getWork(Number(workId))
            .then((res) => setWorkType(res.data.type))
            .finally(() => setFetchingWork(false))
    }, [workId])

    if (fetchingWork)
        return (
            <div
                className="flex items-center justify-center min-h-[60vh] text-muted-foreground tracking-[0.2em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}
            >
                — LOADING... —
            </div>
        )

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
        workId,
        handleChange,
        handleLockTypeChange,
        handleCoverChange,
        handleImagesChange,
        removeImage,
        reorderImages,
        handleSubmit,
    } = useEditChapter(workType)

    const dragIndex = useRef<number | null>(null)
    const dragOverIndex = useRef<number | null>(null)

    const handleDragStart = (i: number) => {
        dragIndex.current = i
    }
    const handleDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault()
        dragOverIndex.current = i
    }
    const handleDrop = () => {
        if (dragIndex.current === null || dragOverIndex.current === null) return
        if (dragIndex.current === dragOverIndex.current) return
        reorderImages(dragIndex.current, dragOverIndex.current)
        dragIndex.current = null
        dragOverIndex.current = null
    }

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
                    onClick={() => navigate(`/studio/works/${workId}/chapters`)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                    style={{ fontFamily: "'Kalam', cursive" }}
                >
                    ← Back to chapters
                </button>
                <h1
                    className="text-xl font-bold text-foreground mt-0.5"
                    style={{ fontFamily: "'Kalam', cursive" }}
                >
                    Edit chapter — {workType === 'webtoon' ? 'Webtoon' : 'Novel'}
                </h1>
            </div>

            {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Title + Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Chapter title"
                            className="w-full h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        >
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                {/* Scheduled at */}
                {form.status === 'scheduled' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                            Scheduled date & time
                        </label>
                        <input
                            type="datetime-local"
                            name="scheduled_at"
                            value={form.scheduled_at}
                            onChange={handleChange}
                            className="h-10 px-3 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                        />
                    </div>
                )}

                {/* Cover */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Chapter cover</label>
                    <label className="relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors overflow-hidden">
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Cover preview"
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
                            onChange={handleCoverChange}
                            className="sr-only"
                        />
                    </label>
                </div>

                {/* Webtoon pages */}
                {workType === 'webtoon' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                                Chapter pages
                            </label>
                            {imageItems.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {imageItems.length} page{imageItems.length !== 1 ? 's' : ''} ·
                                    drag to reorder
                                </span>
                            )}
                        </div>

                        <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-sm text-muted-foreground hover:text-foreground">
                            <span>+</span>
                            <span>{imageItems.length > 0 ? 'Replace pages' : 'Add pages'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                                className="sr-only"
                            />
                        </label>

                        {imageItems.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {imageItems.map((item, i) => (
                                    <div
                                        key={item.preview}
                                        draggable
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={handleDrop}
                                        className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 cursor-grab active:cursor-grabbing aspect-[3/4]"
                                    >
                                        <img
                                            src={item.preview}
                                            alt={`Page ${i + 1}`}
                                            className="w-full h-full object-cover pointer-events-none"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                                            {i + 1}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
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
                {workType === 'wattpad' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Story content</label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            rows={20}
                            placeholder="Write your story here..."
                            className="w-full px-4 py-3 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all resize-none leading-relaxed font-[Georgia,serif]"
                        />
                    </div>
                )}

                {/* Lock settings */}
                <div className="flex flex-col gap-3">
                    <p
                        className="text-sm font-medium text-foreground"
                        style={{ fontFamily: "'Kalam', cursive" }}
                    >
                        🔒 Chapter access type
                    </p>

                    <div className="flex flex-col gap-2 text-start">
                        {LOCK_OPTIONS.map((option) => {
                            const active = form.lock_type === option.value
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => handleLockTypeChange(option.value)}
                                    className={`flex items-start gap-3 px-4 py-3 border-[2px] cursor-pointer transition-all duration-150 ${
                                        active
                                            ? 'border-foreground'
                                            : 'border-foreground/20 hover:border-foreground/50'
                                    }`}
                                    style={{
                                        boxShadow: active ? `3px 3px 0 ${option.color}` : 'none',
                                    }}
                                >
                                    <div
                                        className={`mt-0.5 w-4 h-4 border-[2px] shrink-0 flex items-center justify-center transition-all ${
                                            active ? 'border-foreground' : 'border-foreground/30'
                                        }`}
                                        style={{
                                            background: active ? option.color : 'transparent',
                                        }}
                                    >
                                        {active && (
                                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                                <path
                                                    d="M1 3L3 5L7 1"
                                                    stroke="#1a1a1a"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-foreground"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {option.label}
                                        </p>
                                        <p
                                            className="text-xs text-muted-foreground"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {option.desc}
                                        </p>
                                    </div>
                                    {active && (
                                        <div
                                            className="ml-auto px-2 py-0.5 text-[10px] rotate-1 shrink-0"
                                            style={{
                                                background: option.color,
                                                fontFamily: "'Kalam', cursive",
                                                color: '#1a1a1a',
                                                boxShadow: '1px 2px 3px rgba(0,0,0,0.12)',
                                            }}
                                        >
                                            selected ✦
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {(form.lock_type === 'early_access' || form.lock_type === 'premium') && (
                        <div className="flex items-center gap-3 pl-2 pt-1">
                            <div
                                className="px-2 py-1 text-[11px] -rotate-1 shrink-0"
                                style={{
                                    background: '#fef08a',
                                    fontFamily: "'Kalam', cursive",
                                    color: '#1a1a1a',
                                    boxShadow: '1px 2px 4px rgba(0,0,0,0.15)',
                                }}
                            >
                                credits ✦
                            </div>
                            <input
                                type="number"
                                name="credits_required"
                                value={form.credits_required}
                                onChange={handleChange}
                                min={3}
                                max={20}
                                className="w-24 h-9 px-3 text-sm border-[2px] border-foreground/40 bg-background text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '16px',
                                    boxShadow: '2px 2px 0 var(--foreground)',
                                }}
                            />
                            <span
                                className="text-xs text-muted-foreground"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                credits to unlock (min. 3 - max 20)
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(`/studio/works/${workId}/chapters`)}
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
