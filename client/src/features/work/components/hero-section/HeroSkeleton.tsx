import { Skeleton } from '@/components/ui/skeleton'

export default function HeroSkeleton() {
    return (
        <div className="w-full max-w-[1360px] mx-auto py-3 px-4 select-none">
            <div className="flex gap-4 justify-center">
                <div className="hidden md:block basis-[50%] lg:basis-[40%] scale-90 opacity-50">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                </div>
                <div className="basis-[80%] md:basis-[50%] lg:basis-[40%]">
                    <div className="relative w-full overflow-hidden rounded-lg">
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 flex flex-col gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-3 w-full hidden sm:block" />
                            <Skeleton className="h-3 w-2/3 hidden sm:block" />
                        </div>
                    </div>
                </div>
                <div className="hidden md:block basis-[50%] lg:basis-[40%] scale-90 opacity-50">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                </div>
            </div>
            <div className="flex justify-center gap-2 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className={`h-2 rounded-full ${i === 0 ? 'w-6' : 'w-2'}`} />
                ))}
            </div>
        </div>
    )
}
