export function FeaturedHeroSkeleton() {
    return (
        <section className="relative w-full overflow-hidden bg-background py-5 sm:py-7">
            <div className="mx-auto flex min-h-[400px] max-w-[1600px] items-center justify-center px-4 sm:min-h-[500px]">
                <div className="h-[420px] w-full max-w-[900px] animate-pulse rounded-3xl bg-muted sm:h-[480px]" />
            </div>
        </section>
    )
}
