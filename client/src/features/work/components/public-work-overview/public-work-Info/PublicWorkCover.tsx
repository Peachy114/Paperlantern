interface PublicWorkCoverProps {
    coverUrl: string | null
    title: string
}

export default function PublicWorkCover({ coverUrl, title }: PublicWorkCoverProps) {
    if (!coverUrl) {
        return <div className="w-full h-52 bg-muted rounded-md" />
    }

    return (
        <img
            src={coverUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-cover rounded-md shadow-sm"
        />
    )
}
