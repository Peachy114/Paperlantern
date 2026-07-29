import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import {
    Bold,
    Italic,
    Link,
    List,
    ListOrdered,
    Monitor,
    Redo2,
    Save,
    Search,
    Smartphone,
    Strikethrough,
    TextQuote,
    Underline,
    Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ChapterRichContent from '@/features/work/components/public-work-show/ChapterRichContent'
import { cn } from '@/lib/utils'

interface RevisionItem {
    id: string
    source: string
    title: string | null
    word_count: number
    created_at: string
}

interface Props {
    label?: string
    value: string
    editorKey: string
    revisions?: RevisionItem[]
    onChange: (value: string) => void
    onSave?: () => void
    onAutosave?: (value: string) => Promise<void>
    onRestoreRevision?: (revisionId: string) => void
}

const AUTOSAVE_MS = 1200
const WORDS_PER_MINUTE = 225

export default function NovelRichTextEditor({
    label = 'Story content',
    value,
    editorKey,
    revisions = [],
    onChange,
    onSave,
    onAutosave,
    onRestoreRevision,
}: Props) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [findOpen, setFindOpen] = useState(false)
    const [findText, setFindText] = useState('')
    const [replaceText, setReplaceText] = useState('')
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
    const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [previewMode, setPreviewMode] = useState<'pc' | 'mobile' | null>(null)

    // editor stats ----
    const plainText = useMemo(() => htmlToText(value), [value])
    const wordCount = useMemo(() => countWords(plainText), [plainText])
    const readingMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

    // external value sync ----
    useEffect(() => {
        const editor = editorRef.current
        if (!editor) return
        if (editor.innerHTML !== value) {
            editor.innerHTML = value || ''
        }
    }, [value])

    // local autosave ----
    useEffect(() => {
        if (!editorKey) return
        window.localStorage.setItem(`novel-editor:${editorKey}`, value)
    }, [editorKey, value])

    // server autosave ----
    useEffect(() => {
        if (!onAutosave || !value.trim()) return
        setSavingState('saving')
        const timer = window.setTimeout(async () => {
            try {
                await onAutosave(value)
                setSavingState('saved')
                setLastSavedAt(new Date().toLocaleTimeString())
            } catch {
                setSavingState('idle')
            }
        }, AUTOSAVE_MS)

        return () => window.clearTimeout(timer)
    }, [onAutosave, value])

    // keyboard shortcuts ----
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const ctrl = event.ctrlKey || event.metaKey
        if (!ctrl) return

        const key = event.key.toLowerCase()
        if (key === 'b') return runCommand(event, 'bold')
        if (key === 'i') return runCommand(event, 'italic')
        if (key === 'u') return runCommand(event, 'underline')
        if (key === 'z') return runCommand(event, 'undo')
        if (key === 'y') return runCommand(event, 'redo')
        if (key === 'k') return insertLink(event)
        if (key === 'f') return openFind(event)
        if (key === 'h') return openFind(event)
        if (key === 's' && event.shiftKey) return runCommand(event, 'strikeThrough')
        if (key === 's') return saveNow(event)
        if (event.key === 'Enter') return insertSceneBreak(event)
        if (event.shiftKey && event.key === '7') return runCommand(event, 'insertOrderedList')
        if (event.shiftKey && event.key === '8') return runCommand(event, 'insertUnorderedList')
    }

    // editor commands ----
    const exec = (command: string, argument?: string) => {
        document.execCommand(command, false, argument)
        syncValue()
    }

    const runCommand = (event: KeyboardEvent | MouseEvent, command: string) => {
        event.preventDefault()
        exec(command)
    }

    const insertLink = (event: KeyboardEvent | MouseEvent) => {
        event.preventDefault()
        const href = window.prompt('Paste the link URL')
        if (!href) return
        exec('createLink', href)
    }

    const insertSceneBreak = (event: KeyboardEvent | MouseEvent) => {
        event.preventDefault()
        exec('insertHTML', '<hr><p><br></p>')
    }

    const openFind = (event: KeyboardEvent | MouseEvent) => {
        event.preventDefault()
        setFindOpen(true)
    }

    const saveNow = (event?: KeyboardEvent | MouseEvent) => {
        event?.preventDefault()
        syncValue()
        onSave?.()
    }

    const syncValue = () => {
        onChange(editorRef.current?.innerHTML ?? '')
    }

    const replaceCurrentText = () => {
        if (!findText) return
        const html = editorRef.current?.innerHTML ?? ''
        const escaped = escapeRegExp(findText)
        const next = html.replace(new RegExp(escaped, 'i'), replaceText)
        if (editorRef.current) editorRef.current.innerHTML = next
        onChange(next)
    }

    const replaceAllText = () => {
        if (!findText) return
        const html = editorRef.current?.innerHTML ?? ''
        const escaped = escapeRegExp(findText)
        const next = html.replace(new RegExp(escaped, 'gi'), replaceText)
        if (editorRef.current) editorRef.current.innerHTML = next
        onChange(next)
    }

    return (
        <section className="rounded-xl border bg-card">
            {/* editor header ---- */}
            <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Label className="text-sm font-semibold">{label}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {wordCount.toLocaleString()} words · {plainText.length.toLocaleString()} chars · {readingMinutes} min read
                    </p>
                </div>
                <div className="text-xs text-muted-foreground">
                    {savingState === 'saving' && 'Autosaving...'}
                    {savingState === 'saved' && `Autosaved${lastSavedAt ? ` at ${lastSavedAt}` : ''}`}
                    {savingState === 'idle' && 'Ready'}
                </div>
            </div>

            {/* editor toolbar ---- */}
            <div className="flex flex-wrap items-center gap-1 border-b p-2">
                <ToolbarButton label="Bold" onClick={(event) => runCommand(event, 'bold')} icon={<Bold />} />
                <ToolbarButton label="Italic" onClick={(event) => runCommand(event, 'italic')} icon={<Italic />} />
                <ToolbarButton label="Underline" onClick={(event) => runCommand(event, 'underline')} icon={<Underline />} />
                <ToolbarButton label="Strikethrough" onClick={(event) => runCommand(event, 'strikeThrough')} icon={<Strikethrough />} />
                <ToolbarButton label="Numbered list" onClick={(event) => runCommand(event, 'insertOrderedList')} icon={<ListOrdered />} />
                <ToolbarButton label="Bulleted list" onClick={(event) => runCommand(event, 'insertUnorderedList')} icon={<List />} />
                <ToolbarButton label="Quote" onClick={(event) => {
                    event.preventDefault()
                    exec('formatBlock', 'blockquote')
                }} icon={<TextQuote />} />
                <ToolbarButton label="Undo" onClick={(event) => runCommand(event, 'undo')} icon={<Undo2 />} />
                <ToolbarButton label="Redo" onClick={(event) => runCommand(event, 'redo')} icon={<Redo2 />} />
                <ToolbarButton label="Link" onClick={insertLink} icon={<Link />} />
                <ToolbarButton label="Find" onClick={openFind} icon={<Search />} />
                <ToolbarButton label="PC preview" onClick={(event) => {
                    event.preventDefault()
                    syncValue()
                    setPreviewMode('pc')
                }} icon={<Monitor />} />
                <ToolbarButton label="Mobile preview" onClick={(event) => {
                    event.preventDefault()
                    syncValue()
                    setPreviewMode('mobile')
                }} icon={<Smartphone />} />
                <ToolbarButton label="Scene break" onClick={insertSceneBreak} text="Scene" />
                <ToolbarButton label="Save" onClick={saveNow} icon={<Save />} />
            </div>

            {/* find and replace ---- */}
            {findOpen && (
                <div className="grid gap-2 border-b bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
                    <Input value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Find text" />
                    <Input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} placeholder="Replace with" />
                    <Button type="button" variant="outline" onClick={() => document.execCommand('findString', false, findText)}>
                        Find
                    </Button>
                    <Button type="button" variant="outline" onClick={replaceCurrentText}>
                        Replace
                    </Button>
                    <Button type="button" onClick={replaceAllText}>
                        Replace all
                    </Button>
                </div>
            )}

            {/* writing surface ---- */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncValue}
                onBlur={syncValue}
                onKeyDown={handleKeyDown}
                className={cn(
                    'min-h-[520px] px-5 py-4 outline-none',
                    'prose prose-sm max-w-none dark:prose-invert',
                    'font-[Georgia,serif] text-base leading-8'
                )}
            />

            {/* revision history ---- */}
            {revisions.length > 0 && (
                <div className="border-t p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Draft history
                    </p>
                    <div className="mt-2 grid gap-2">
                        {revisions.slice(0, 6).map((revision) => (
                            <div key={revision.id} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">{revision.title || 'Untitled draft'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {revision.source} · {revision.word_count.toLocaleString()} words · {new Date(revision.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {onRestoreRevision && (
                                    <Button type="button" size="sm" variant="outline" onClick={() => onRestoreRevision(revision.id)}>
                                        Restore
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* shortcut help ---- */}
            <div className="border-t bg-muted/20 p-3 text-xs text-muted-foreground">
                Ctrl+B bold · Ctrl+I italic · Ctrl+U underline · Ctrl+Shift+S strike · Ctrl+K link · Ctrl+F find · Ctrl+H replace · Ctrl+S save · Ctrl+Enter scene break
            </div>

            {/* real device preview ---- */}
            <Dialog open={previewMode !== null} onOpenChange={(open) => !open && setPreviewMode(null)}>
                <DialogContent className="h-[96dvh] w-[min(96vw,1180px)] max-w-none overflow-hidden p-0 sm:max-w-none">
                    <DialogHeader className="border-b px-5 py-4">
                        <DialogTitle>{previewMode === 'mobile' ? 'Mobile Preview' : 'PC Preview'}</DialogTitle>
                        <DialogDescription>
                            This renders the current chapter content in a reader-sized preview.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 overflow-auto bg-muted/40 px-4 py-5">
                        {previewMode === 'mobile' ? (
                            <div className="mx-auto h-[calc(96dvh-8rem)] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-[10px] border-zinc-950 bg-background shadow-2xl">
                                <div className="h-full overflow-y-auto px-4 py-6">
                                    <ChapterRichContent content={value} variant="preview-mobile" />
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto h-[calc(96dvh-8rem)] w-[min(920px,calc(100vw-6rem))] overflow-hidden rounded-xl bg-background shadow-xl">
                                <div className="h-full overflow-y-auto px-12 py-10">
                                    <ChapterRichContent content={value} variant="preview-pc" />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    )
}

function ToolbarButton({
    label,
    icon,
    text,
    onClick,
}: {
    label: string
    icon?: ReactNode
    text?: string
    onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className="h-8 min-w-8 px-2"
        >
            {icon ? <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span> : text}
        </Button>
    )
}

function htmlToText(html: string): string {
    // plain text extraction ----
    const element = document.createElement('div')
    element.innerHTML = html
    return element.textContent ?? ''
}

function countWords(text: string): number {
    // word count ----
    const words = text.trim().match(/\S+/g)
    return words ? words.length : 0
}

function escapeRegExp(value: string): string {
    // find-replace escaping ----
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
