export function FeaturedHeroSkeleton() {
    return (
        <section className="relative w-full overflow-hidden bg-background py-5 sm:py-7">
            <div className="mx-auto flex min-h-[330px] max-w-[1480px] items-center justify-center px-4 sm:min-h-[390px]">
                <div className="h-[300px] w-full max-w-[760px] animate-pulse rounded-3xl bg-muted sm:h-[350px]" />
            </div>
        </section>
    )
}
