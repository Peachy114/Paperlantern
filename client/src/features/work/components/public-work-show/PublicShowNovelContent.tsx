import ChapterRichContent from './ChapterRichContent'

interface PublicShowNovelContentProps {
    content: string | null
}

export default function PublicShowNovelContent({ content }: PublicShowNovelContentProps) {
    if (!content) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground italic">
                No content yet.
            </div>
        )
    }

    return (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 px-6 sm:px-10 py-8 sm:py-12 my-5">
            <ChapterRichContent content={content} variant="public" />
        </div>
    )
}
