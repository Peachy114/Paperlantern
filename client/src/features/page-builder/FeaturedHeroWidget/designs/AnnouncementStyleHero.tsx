import { CarouselNavigation } from '../CarouselNavigation'
import { HeroActionCard } from '../HeroActionCard'
import { MetaOverlay } from '../MetaOverlay'
import type { HeroLayoutProps } from '../types'

export function AnnouncementStyleHero({
    widget,
    items,
    current,
    currentIndex,
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
        <section className="relative w-full overflow-hidden bg-background">
            <div
                className={`relative h-[400px] w-full touch-pan-y select-none overflow-hidden sm:h-[500px] lg:h-[620px] ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <img
                    src={current.image!}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-2xl"
                />

                <div className="absolute inset-0 bg-black/45" />

                <div className="relative mx-auto flex h-full w-full max-w-[1600px] items-center px-3 sm:px-6">
                    <HeroActionCard
                        item={current}
                        onOpenItem={onOpenItem}
                        className="relative block h-[86%] w-full overflow-hidden rounded-2xl border border-white/20 bg-black/20 shadow-2xl"
                        style={{
                            transform: `translateX(${dragOffset * 0.18}px)`,
                            transition: isDragging ? 'none' : 'transform 300ms ease',
                        }}
                    >
                        <img
                            src={current.image!}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <img
                            src={current.image!}
                            alt={current.title}
                            draggable={false}
                            className="relative z-10 h-full w-full object-contain"
                        />
                        <MetaOverlay item={current} widget={widget} />
                    </HeroActionCard>
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
