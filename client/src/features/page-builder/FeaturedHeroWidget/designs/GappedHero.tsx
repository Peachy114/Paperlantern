import { CarouselNavigation } from "../CarouselNavigation";
import { HeroImageCard } from "../HeroImageCard";
import { SideImageCard } from "../SideImageCard";
import type { HeroLayoutProps } from "../types";

export function GappedHero({
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
                className={`relative mx-auto flex min-h-[320px] max-w-[1480px] touch-pan-y select-none items-center px-4 sm:min-h-[380px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="flex w-full items-center justify-center gap-4 sm:gap-6 lg:gap-8"
                    style={{
                        transform: `translateX(${dragOffset * 0.25}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        side="left"
                        className="hidden h-[270px] min-w-0 flex-1 rounded-2xl opacity-80 md:block"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="h-[320px] w-[min(620px,88vw)] shrink-0 rounded-3xl sm:h-[370px]"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        side="right"
                        className="hidden h-[270px] min-w-0 flex-1 rounded-2xl opacity-80 md:block"
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