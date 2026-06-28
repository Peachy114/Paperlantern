interface PublicWorkCoverProps {
    coverUrl: string | null
    title: string
}

export default function PublicWorkCover({ coverUrl, title }: PublicWorkCoverProps) {
    if (!coverUrl) {
        return <div className="w-full sm:w-40 sm:h-56 h-64 shrink-0 bg-muted rounded-md" />
    }

    return (
        <img
            src={coverUrl}
            alt={title}
            className="w-full sm:w-40 sm:h-56 h-1/6 shrink-0 object-cover rounded-md shadow-sm"
        />
    )
}
