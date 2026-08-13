import { CarouselNavigation } from '../CarouselNavigation'
import { HeroImageCard } from '../HeroImageCard'
import { SideImageCard } from '../SideImageCard'
import type { HeroLayoutProps } from '../types'

export function BlurredBackgroundHeroSameHeight({
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
        <section className="relative w-full overflow-hidden py-5 sm:py-7">
            <img
                key={`background-${current.id}`}
                src={current.image!}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
            />

            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />

            <div
                className={`relative mx-auto flex min-h-[390px] max-w-[1600px] touch-pan-y select-none items-center justify-center px-4 sm:min-h-[470px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="flex w-full items-center justify-center gap-3 sm:gap-5"
                    style={{
                        transform: `translateX(${dragOffset * 0.25}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        side="left"
                        className="h-[380px] w-full max-w-[900px] sm:h-[440px] md:w-[60%]"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="h-[380px] w-full max-w-[900px] sm:h-[440px] md:w-[60%]"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        side="right"
                        className="h-[380px] w-full max-w-[900px] sm:h-[440px] md:w-[60%]"
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
