interface PublicWorkDescriptionProps {
    description: string | null
}

export default function PublicWorkDescription({ description }: PublicWorkDescriptionProps) {
    if (!description) return null

    return (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{description}</p>
    )
}
