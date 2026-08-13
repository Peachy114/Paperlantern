import { CarouselNavigation } from '../CarouselNavigation'
import { HeroImageCard } from '../HeroImageCard'
import { SideImageCard } from '../SideImageCard'
import type { HeroLayoutProps } from '../types'

export function BlurredBackgroundHero({
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
                className={`relative mx-auto flex min-h-[410px] w-full max-w-[1920px] touch-pan-y select-none items-center justify-center px-4 sm:min-h-[500px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <div
                    className="flex w-max max-w-none items-center justify-center gap-[clamp(0.75rem,1.5vw,2.5rem)]"
                    style={{
                        transform: `translateX(${dragOffset * 0.25}px)`,
                        transition: isDragging ? 'none' : 'transform 300ms ease',
                    }}
                >
                    <SideImageCard
                        item={previousItem}
                        onClick={onPrev}
                        side="left"
                        className="hidden h-[390px] w-[clamp(380px,38vw,600px)] shrink-0 opacity-75 md:block"
                    />

                    <HeroImageCard
                        item={current}
                        widget={widget}
                        onOpenItem={onOpenItem}
                        className="h-[460px] w-[min(920px,calc(100vw-2rem))] shrink-0 sm:h-[520px] md:w-[clamp(700px,60vw,920px)]"
                    />

                    <SideImageCard
                        item={nextItem}
                        onClick={onNext}
                        side="right"
                        className="hidden h-[390px] w-[clamp(380px,38vw,600px)] shrink-0 opacity-75 md:block"
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
