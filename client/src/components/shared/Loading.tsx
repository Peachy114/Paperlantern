export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3.5">
            <div className="w-7 h-7 rounded-full border-2 border-border border-t-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Loading</p>
        </div>
    )
}
