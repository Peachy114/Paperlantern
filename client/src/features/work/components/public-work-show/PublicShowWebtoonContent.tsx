interface Image {
    id: string
    path: string
    order: number
}

interface PublicShowWebtoonContentProps {
    images: Image[]
    imageUrl: (path: string) => string | null
}

export default function PublicShowWebtoonContent({
    images,
    imageUrl,
}: PublicShowWebtoonContentProps) {
    if (images.length === 0) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                No images uploaded yet.
            </div>
        )
    }

    return (
        <div className="flex flex-col overflow-hidden bg-zinc-950 rounded-lg my-5">
            {images.map((img) => (
                <img
                    key={img.id}
                    src={imageUrl(img.path)!}
                    alt={`Page ${img.order + 1}`}
                    className="w-full block"
                    draggable={false}
                    loading="eager"
                />
            ))}
        </div>
    )
}
