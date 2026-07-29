import NovelRichTextEditor from '@/features/studio/components/novel-editor/NovelRichTextEditor'

interface Props {
    content: string
    editorKey: string
    onChange: (value: string) => void
    onSave?: () => void
}

export default function ChapterCreateContent({ content, editorKey, onChange, onSave }: Props) {
    return (
        <NovelRichTextEditor
            value={content}
            editorKey={editorKey}
            onChange={onChange}
            onSave={onSave}
        />
    )
}
