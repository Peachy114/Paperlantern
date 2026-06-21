function SectionHeader({
    title,
    subtitle,
    color,
}: {
    title: string
    subtitle: string
    color: string
}) {
    return (
        <div className="mb-6 flex items-end gap-4">
            <div className="shrink-0">
                <div
                    className="inline-block text-[10px] tracking-[0.22em] border px-2 py-0.5 rounded-sm mb-1 opacity-80"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", color, borderColor: color }}
                >
                    {subtitle.toUpperCase()}
                </div>
                <h2
                    className="text-foreground leading-none mt-5"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '34px',
                        letterSpacing: '0.04em',
                        fontWeight: 400,
                    }}
                >
                    {title}
                </h2>
            </div>
            <div className="flex-1 h-[2px] mb-1.5 opacity-50" style={{ background: color }} />
        </div>
    )
}

export default SectionHeader
