interface PublicWorkHeaderProps {
    work: any
    coverUrl: (url: string) => string | null
}

export default function PublicWorkHeader({ work, coverUrl }: PublicWorkHeaderProps) {
    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-md bg-muted h-64">
            {coverUrl(work.banner) && (
                <img
                    src={coverUrl(work.banner)!}
                    alt={work.title}
                    className="w-full h-full object-cover"
                />
            )}
        </div>
    )
}
