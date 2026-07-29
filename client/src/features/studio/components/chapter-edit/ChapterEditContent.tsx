import NovelRichTextEditor from '@/features/studio/components/novel-editor/NovelRichTextEditor'

interface RevisionItem {
    id: string
    source: string
    title: string | null
    word_count: number
    created_at: string
}

interface ChapterEditContentProps {
    content: string
    editorKey: string
    revisions?: RevisionItem[]
    onChange: (value: string) => void
    onSave?: () => void
    onAutosave?: (value: string) => Promise<void>
    onRestoreRevision?: (revisionId: string) => void
}

export function ChapterEditContent({
    content,
    editorKey,
    revisions,
    onChange,
    onSave,
    onAutosave,
    onRestoreRevision,
}: ChapterEditContentProps) {
    return (
        <NovelRichTextEditor
            value={content}
            editorKey={editorKey}
            revisions={revisions}
            onChange={onChange}
            onSave={onSave}
            onAutosave={onAutosave}
            onRestoreRevision={onRestoreRevision}
        />
    )
}
