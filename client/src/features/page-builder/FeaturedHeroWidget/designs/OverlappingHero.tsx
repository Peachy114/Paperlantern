import { CarouselNavigation } from '../CarouselNavigation'
import { HeroImageCard } from '../HeroImageCard'
import { SideImageCard } from '../SideImageCard'
import type { HeroLayoutProps } from '../types'

export function OverlappingHero({
    widget,
    items,
    current,
    currentIndex,
    previousItem,
    nextItem,
    onPrev,
    onNext,
    onGoTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onOpenItem,
    dragOffset,
    isDragging,
}: HeroLayoutProps) {
    return (
        <section className="relative w-full overflow-hidden bg-background py-8 sm:py-10">
            <div
                className={`relative mx-auto h-[420px] w-full max-w-[1920px] touch-pan-y select-none px-4 sm:h-[500px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="relative mx-auto h-full w-full"
                    style={{
                        transform: `translateX(${dragOffset * 0.24}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <div className="absolute left-0 top-1/2 hidden h-[82%] w-[clamp(380px,38vw,620px)] -translate-y-1/2 overflow-hidden rounded-2xl bg-black opacity-80 shadow-lg md:block">
                        <SideImageCard
                            item={previousItem}
                            onClick={onPrev}
                            side="left"
                            className="h-full w-full blur-[1.5px] brightness-[0.50]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/10" />
                    </div>

                    <div className="absolute right-0 top-1/2 hidden h-[82%] w-[clamp(380px,38vw,620px)] -translate-y-1/2 overflow-hidden rounded-2xl bg-black opacity-80 shadow-lg md:block">
                        <SideImageCard
                            item={nextItem}
                            onClick={onNext}
                            side="right"
                            className="h-full w-full blur-[1.5px] brightness-[0.50]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/10" />
                    </div>

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="absolute left-1/2 top-1/2 z-10 h-full w-[min(900px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-2 border-background shadow-2xl md:w-[clamp(720px,60vw,900px)]"
                    />
                </div>

                <CarouselNavigation
                    itemCount={items.length}
                    currentIndex={currentIndex}
                    onPrev={onPrev}
                    onNext={onNext}
                    onGoTo={onGoTo}
                />
            </div>
        </section>
    )
}
