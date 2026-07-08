import { Skeleton } from '@/components/ui/skeleton'

const notch = (n: number) =>
    `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`

export default function HeroSkeleton() {
    return (
        <div
            className="w-full pt-30 sm:pt-40 py-6 sm:py-10 px-3 sm:px-4 select-none"
            style={{ background: 'var(--comix-void)' }}
        >
            <div className="flex gap-4 justify-center max-w-[1360px] mx-auto">
                <div className="hidden md:block basis-[50%] lg:basis-[40%] scale-90 opacity-40">
                    <Skeleton className="w-full aspect-square" style={{ clipPath: notch(10) }} />
                </div>
                <div className="basis-[80%] md:basis-[50%] lg:basis-[40%]">
                    <div
                        className="relative w-full overflow-hidden"
                        style={{ clipPath: notch(10) }}
                    >
                        <Skeleton className="w-full aspect-square" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 flex flex-col gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-3 w-full hidden sm:block" />
                            <Skeleton className="h-3 w-2/3 hidden sm:block" />
                        </div>
                    </div>
                </div>
                <div className="hidden md:block basis-[50%] lg:basis-[40%] scale-90 opacity-40">
                    <Skeleton className="w-full aspect-square" style={{ clipPath: notch(10) }} />
                </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-1.5"
                        style={{ width: i === 0 ? 20 : 6, background: 'rgba(255,255,255,0.15)' }}
                    />
                ))}
            </div>
        </div>
    )
}
