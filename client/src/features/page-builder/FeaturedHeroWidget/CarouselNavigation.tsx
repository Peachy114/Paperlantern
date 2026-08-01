
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'



export function CarouselNavigation({
    itemCount,
    currentIndex,
    onPrev,
    onNext,
    onGoTo,
}: {
    itemCount: number
    currentIndex: number
    onPrev: () => void
    onNext: () => void
    onGoTo: (index: number) => void
}) {
    if (itemCount <= 1) return null

    const stopPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    const clickNav = (event: ReactMouseEvent<HTMLButtonElement>, callback: () => void) => {
        event.preventDefault()
        event.stopPropagation()
        callback()
    }

    return (
        <>
            <button
                type="button"
                onPointerDown={stopPointer}
                onClick={(event) => clickNav(event, onPrev)}
                className="absolute left-5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground shadow-lg ring-1 ring-border transition hover:scale-105 sm:left-7"
                aria-label="Previous hero"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <button
                type="button"
                onPointerDown={stopPointer}
                onClick={(event) => clickNav(event, onNext)}
                className="absolute right-5 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground shadow-lg ring-1 ring-border transition hover:scale-105 sm:right-7"
                aria-label="Next hero"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 z-30 flex max-w-[70%] -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
                {Array.from({ length: itemCount }).map((_, dotIndex) => (
                    <button
                        key={dotIndex}
                        type="button"
                        onPointerDown={stopPointer}
                        onClick={(event) => clickNav(event, () => onGoTo(dotIndex))}
                        className={`h-2 rounded-full transition-all ${
                            dotIndex === currentIndex
                                ? 'w-6 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Show hero ${dotIndex + 1}`}
                    />
                ))}
            </div>
        </>
    )
}