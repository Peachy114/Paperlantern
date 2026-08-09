import type { PointerEvent } from 'react'
import { Layers, Lock, Move } from 'lucide-react'
import type { ArtistProfileBlock } from '@/types/artistProfile'
import type { DragState } from '@/features/artist-profile/types/profileEditor'
import { BOARD_UNIT_PX, GRID_STEP } from '@/features/artist-profile/constants/profileEditor'
import { blockImageSrc } from '@/features/artist-profile/utils/profileContent'
import { CenterGuide } from '@/features/artist-profile/components/ProfileCanvasHandles'
import { ProfileEmptyPanel as EmptyPanel } from '@/features/artist-profile/components/ProfileFormPrimitives'

// Profile board ----
export function ProfileBoard({
    refEl,
    blocks,
    boardHeight,
    editMode,
    selectedBlockId,
    onSelect,
    onBeginDrag,
    embedded = false,
}: {
    refEl: React.RefObject<HTMLDivElement | null>
    blocks: ArtistProfileBlock[]
    boardHeight: number
    editMode: boolean
    selectedBlockId: string | null
    onSelect: (id: string) => void
    onBeginDrag: (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => void
    embedded?: boolean
}) {
    if (blocks.length === 0 && !editMode) {
        return <EmptyPanel icon={Layers} text="No board blocks yet" />
    }

    return (
        <div
            ref={refEl}
            className={`relative overflow-visible bg-background ${
                embedded ? 'min-h-full' : 'min-h-[760px]'
            } ${embedded ? '' : 'rounded-lg border'} ${
                editMode
                    ? 'bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]'
                    : ''
            }`}
            style={{
                minHeight: embedded ? '100%' : boardHeight,
                backgroundSize: editMode
                    ? `${GRID_STEP}% ${GRID_STEP * BOARD_UNIT_PX}px`
                    : undefined,
            }}
        >
            {editMode && <CenterGuide />}
            {blocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Drag stickers here or add a block
                    </p>
                </div>
            )}
            {blocks.map((block) => (
                <BoardBlock
                    key={block.id}
                    block={block}
                    editMode={editMode}
                    selected={selectedBlockId === block.id}
                    onSelect={onSelect}
                    onBeginDrag={onBeginDrag}
                />
            ))}
        </div>
    )
}

function BoardBlock({
    block,
    editMode,
    selected,
    onSelect,
    onBeginDrag,
}: {
    block: ArtistProfileBlock
    editMode: boolean
    selected: boolean
    onSelect: (id: string) => void
    onBeginDrag: (
        event: PointerEvent<HTMLElement>,
        block: ArtistProfileBlock,
        kind: DragState['kind'],
        edge?: DragState['edge']
    ) => void
}) {
    const imageSrc = blockImageSrc(block)
    const objectFit = block.fit_mode === 'stretch' ? 'fill' : block.fit_mode
    const showBorder = block.show_border ?? (!block.is_sticker && !block.transparent_background)
    const transparent = block.transparent_background ?? block.is_sticker
    const backgroundColor = transparent
        ? 'transparent'
        : block.background_color || 'var(--background)'
    const borderColor = block.border_color || 'var(--border)'
    const borderRadius = block.border_radius ?? 0

    return (
        <div
            className={`absolute ${block.overlay ? 'mix-blend-normal' : ''} ${
                editMode
                    ? selected
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                        : 'ring-1 ring-foreground/20'
                    : ''
            }`}
            style={{
                left: `${block.x}%`,
                top: `${block.y * BOARD_UNIT_PX}px`,
                width: `${block.w}%`,
                height: `${block.h * BOARD_UNIT_PX}px`,
                padding: `${block.padding_y}% ${block.padding_x}%`,
                zIndex: editMode ? (selected ? 1200 : 800 + block.z_index) : block.z_index,
                transform: `rotate(${block.rotation ?? 0}deg)`,
                touchAction: 'none',
                overflow: block.is_sticker || block.overlay ? 'visible' : 'hidden',
                backgroundColor,
                border: showBorder ? `1px solid ${borderColor}` : '1px solid transparent',
                borderRadius,
            }}
            onPointerDown={(event) => {
                if (!editMode) return
                if (event.button !== 0) return
                if ((event.target as HTMLElement).closest('[data-board-control]')) return
                onSelect(block.id)
                onBeginDrag(event, block, 'move')
            }}
            onContextMenu={(event) => event.preventDefault()}
        >
            {block.type === 'image' && imageSrc ? (
                <img
                    src={imageSrc}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none"
                    style={{
                        objectFit: objectFit === 'stay' ? 'contain' : objectFit,
                        objectPosition: `${block.image_position_x ?? 50}% ${block.image_position_y ?? 50}%`,
                        borderRadius: Math.max(
                            0,
                            borderRadius - Math.max(block.padding_x, block.padding_y)
                        ),
                    }}
                />
            ) : (
                <div
                    className="h-full w-full overflow-hidden whitespace-pre-wrap break-words"
                    style={{
                        fontSize: block.font_size,
                        lineHeight: 1.15,
                        fontFamily: block.font_family || undefined,
                        color: block.font_color || undefined,
                    }}
                >
                    {block.text_content}
                </div>
            )}

            {editMode && !block.locked && (
                <>
                    <div
                        data-board-control
                        className="absolute left-0 top-1/2 z-[9999] h-16 w-2 -translate-y-1/2 cursor-ew-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-x', 'left')}
                    />
                    <div
                        data-board-control
                        className="absolute right-0 top-1/2 z-[9999] h-16 w-2 -translate-y-1/2 cursor-ew-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-x', 'right')}
                    />
                    <div
                        data-board-control
                        className="absolute bottom-0 left-1/2 z-[9999] h-2 w-16 -translate-x-1/2 cursor-ns-resize bg-sky-400 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'padding-y', 'bottom')}
                    />
                    <button
                        data-board-control
                        type="button"
                        className="absolute left-2 top-2 z-[9999] rounded bg-background p-1 text-foreground shadow-md ring-1 ring-sky-400"
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <Move className="h-3 w-3" />
                    </button>
                    <div
                        data-board-control
                        className="absolute bottom-0 right-0 z-[9999] h-5 w-5 cursor-nwse-resize border-b-4 border-r-4 border-white bg-sky-500 shadow-md"
                        onPointerDown={(event) => onBeginDrag(event, block, 'resize')}
                    />
                </>
            )}
            {editMode && block.locked && (
                <div
                    data-board-control
                    className="absolute left-2 top-2 z-[9999] rounded bg-background p-1 text-foreground shadow-md ring-1 ring-amber-400"
                    title="Position locked"
                >
                    <Lock className="h-3 w-3" />
                </div>
            )}
        </div>
    )
}
