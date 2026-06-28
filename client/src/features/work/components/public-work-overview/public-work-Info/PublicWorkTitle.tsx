interface PublicWorkTitleProps {
    work: any
}

export default function PublicWorkTitle({ work }: PublicWorkTitleProps) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {work.type === 'webtoon' ? '◆ Webtoon' : '◆ Novel'}
            </p>
            <h1 className="text-xl font-bold leading-tight break-all">{work.title}</h1>
        </div>
    )
}
