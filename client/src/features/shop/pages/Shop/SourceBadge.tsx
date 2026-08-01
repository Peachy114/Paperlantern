export function SourceBadge({
    source,
    label,
    className = '',
}: {
    source?: 'admin' | 'artist'
    label?: string
    className?: string
}) {
    const byAdmin = source === 'admin'

    return (
        <span
            className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                byAdmin
                    ? 'bg-sky-500 text-white'
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300'
            } ${className}`}
        >
            {label ?? (byAdmin ? 'By Admin' : 'By Artist')}
        </span>
    )
}