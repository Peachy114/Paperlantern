import { type ChangeEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ArtistSticker } from '@/types/artistProfile'
import type { PageBoardItem, PageWidget } from '@/types/pageLayout'
import { createBoardItem } from '@/features/admin/page-customizer/pageCustomizerRegistry'
import { NumberField, SelectField } from '@/features/admin/page-customizer/components/WidgetInspectorControls'
import { storageUrl } from '@/utils/storage'
import { fontFamilyFromUrl } from '@/features/page-builder/PageWidgetFrame'
import { clamp } from '@/features/admin/page-customizer/utils/editorInteraction'

// Board widget content settings ----
export function BoardWidgetContentSettings({
    widget,
    boardItems,
    selectedBoardItem,
    stickerLibrary,
    setSetting,
    updateBoardItems,
    updateBoardItem,
    uploadBoardItemAsset,
    onOverlayPlacementChange,
}: {
    widget: PageWidget
    boardItems: PageBoardItem[]
    selectedBoardItem: PageBoardItem | null
    stickerLibrary: ArtistSticker[]
    setSetting: (key: string, value: unknown) => void
    updateBoardItems: (items: PageBoardItem[], selectedId?: string) => void
    updateBoardItem: (itemId: string, updater: (item: PageBoardItem) => PageBoardItem) => void
    uploadBoardItemAsset: (file: File, itemId: string) => void
    onOverlayPlacementChange: (id: string, enabled: boolean) => void
}) {
    return (
        <>
                {widget.type === 'board' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {(['sticker', 'image', 'text'] as const).map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const item = createBoardItem(type, boardItems.length)
                                        updateBoardItems([...boardItems, item], item.id)
                                    }}
                                >
                                    Add {type}
                                </Button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {boardItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSetting('selected_board_item_id', item.id)}
                                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                                        selectedBoardItem?.id === item.id
                                            ? 'border-sky-500 bg-sky-500/10'
                                            : 'bg-background'
                                    }`}
                                >
                                    <span>{item.type}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round(item.x)}%, {item.y}px
                                    </span>
                                </button>
                            ))}
                        </div>
                        {selectedBoardItem && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">
                                        Selected {selectedBoardItem.type}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            const next = boardItems.filter(
                                                (item) => item.id !== selectedBoardItem.id
                                            )
                                            updateBoardItems(next, next[0]?.id)
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                {selectedBoardItem.type === 'text' && (
                                    <>
                                        <div>
                                            <Label>Text</Label>
                                            <textarea
                                                value={selectedBoardItem.text ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(
                                                        selectedBoardItem.id,
                                                        (item) => ({
                                                            ...item,
                                                            text: event.target.value,
                                                        })
                                                    )
                                                }
                                                className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label>Font name</Label>
                                            <Input
                                                value={selectedBoardItem.style?.font_family ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(
                                                        selectedBoardItem.id,
                                                        (item) => ({
                                                            ...item,
                                                            style: {
                                                                ...item.style,
                                                                font_family: event.target.value,
                                                            },
                                                        })
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Font CDN / import URL</Label>
                                            <Input
                                                value={selectedBoardItem.font_url ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(
                                                        selectedBoardItem.id,
                                                        (item) => ({
                                                            ...item,
                                                            font_url: event.target.value,
                                                            style: {
                                                                ...item.style,
                                                                font_family:
                                                                    item.style?.font_family ||
                                                                    fontFamilyFromUrl(
                                                                        event.target.value
                                                                    ) ||
                                                                    item.style?.font_family,
                                                            },
                                                        })
                                                    )
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                                {selectedBoardItem.type === 'image' && (
                                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60">
                                        <ImagePlus className="h-4 w-4" />
                                        Upload board image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                const file = event.target.files?.[0]
                                                if (file)
                                                    uploadBoardItemAsset(file, selectedBoardItem.id)
                                            }}
                                        />
                                    </label>
                                )}
                                {selectedBoardItem.type === 'sticker' && (
                                    <div>
                                        <Label>Sticker</Label>
                                        <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
                                            {stickerLibrary.map((sticker) => (
                                                <button
                                                    key={sticker.id}
                                                    type="button"
                                                    onClick={() =>
                                                        updateBoardItem(
                                                            selectedBoardItem.id,
                                                            (item) => ({
                                                                ...item,
                                                                sticker_id: sticker.id,
                                                                sticker_image_path:
                                                                    sticker.image_path,
                                                                asset_path: '',
                                                            })
                                                        )
                                                    }
                                                    className={`flex h-24 items-center justify-center rounded-md bg-background p-2 transition ${
                                                        selectedBoardItem.sticker_id === sticker.id
                                                            ? 'ring-2 ring-sky-500'
                                                            : 'ring-1 ring-transparent hover:ring-border'
                                                    }`}
                                                    title={sticker.name}
                                                >
                                                    <img
                                                        src={storageUrl(sticker.image_path)!}
                                                        alt={sticker.name}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3 border-t pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Box style for this board content
                                    </p>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(
                                                selectedBoardItem.style?.transparent ?? true
                                            )}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        transparent: event.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        Transparent background
                                    </label>
                                    <div>
                                        <Label>Background color</Label>
                                        <Input
                                            value={selectedBoardItem.style?.background ?? ''}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        background: event.target.value,
                                                        transparent: event.target.value.trim()
                                                            ? false
                                                            : item.style?.transparent,
                                                    },
                                                }))
                                            }
                                            placeholder="F54927 or #F54927"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(selectedBoardItem.style?.border)}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        border: event.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        Show border
                                    </label>
                                    <div>
                                        <Label>Border color</Label>
                                        <Input
                                            value={selectedBoardItem.style?.border_color ?? ''}
                                            onChange={(event) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        border_color: event.target.value,
                                                        border: event.target.value.trim()
                                                            ? true
                                                            : item.style?.border,
                                                    },
                                                }))
                                            }
                                            placeholder="d4d4d8 or #d4d4d8"
                                        />
                                    </div>
                                    <NumberField
                                        label="Border radius"
                                        value={selectedBoardItem.style?.radius ?? 0}
                                        min={0}
                                        max={80}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, radius: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Padding block"
                                        value={
                                            selectedBoardItem.style?.padding_block ??
                                            selectedBoardItem.style?.padding ??
                                            0
                                        }
                                        min={0}
                                        max={120}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, padding_block: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Padding inline"
                                        value={
                                            selectedBoardItem.style?.padding_inline ??
                                            selectedBoardItem.style?.padding ??
                                            0
                                        }
                                        min={0}
                                        max={120}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, padding_inline: value },
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-3 border-t pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                        Layout for this board content
                                    </p>
                                    <NumberField
                                        label="X position %"
                                        value={selectedBoardItem.x}
                                        min={0}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                x: clamp(value, 0, 100 - item.w),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Y position"
                                        value={selectedBoardItem.y}
                                        min={0}
                                        max={widget.style.content_height ?? 420}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                y: clamp(
                                                    value,
                                                    0,
                                                    (widget.style.content_height ?? 420) - item.h
                                                ),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Width %"
                                        value={selectedBoardItem.w}
                                        min={4}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                w: clamp(value, 4, 100 - item.x),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Height"
                                        value={selectedBoardItem.h}
                                        min={24}
                                        max={1600}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                h: clamp(
                                                    value,
                                                    24,
                                                    (widget.style.content_height ?? 420) - item.y
                                                ),
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Rotate degree"
                                        value={selectedBoardItem.style?.rotate ?? 0}
                                        min={-180}
                                        max={180}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, rotate: value },
                                            }))
                                        }
                                    />
                                    <NumberField
                                        label="Front / back layer"
                                        value={selectedBoardItem.style?.z_index ?? 1}
                                        min={0}
                                        max={100}
                                        onChange={(value) =>
                                            updateBoardItem(selectedBoardItem.id, (item) => ({
                                                ...item,
                                                style: { ...item.style, z_index: value },
                                            }))
                                        }
                                    />
                                </div>
                                {selectedBoardItem.type === 'text' && (
                                    <div className="space-y-3 border-t pt-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            Text style for this board content
                                        </p>
                                        <NumberField
                                            label="Text size"
                                            value={selectedBoardItem.style?.font_size ?? 16}
                                            min={8}
                                            max={160}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: { ...item.style, font_size: value },
                                                }))
                                            }
                                        />
                                        <SelectField
                                            label="Text align"
                                            value={selectedBoardItem.style?.text_align ?? 'start'}
                                            options={['start', 'center', 'end']}
                                            onChange={(value) =>
                                                updateBoardItem(selectedBoardItem.id, (item) => ({
                                                    ...item,
                                                    style: {
                                                        ...item.style,
                                                        text_align: value as
                                                            | 'start'
                                                            | 'center'
                                                            | 'end',
                                                    },
                                                }))
                                            }
                                        />
                                        <div>
                                            <Label>Text color</Label>
                                            <Input
                                                value={selectedBoardItem.style?.text_color ?? ''}
                                                onChange={(event) =>
                                                    updateBoardItem(
                                                        selectedBoardItem.id,
                                                        (item) => ({
                                                            ...item,
                                                            style: {
                                                                ...item.style,
                                                                text_color: event.target.value,
                                                            },
                                                        })
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {['sticker', 'text', 'image', 'banner', 'spacer'].includes(widget.type) && (
                    <>
                        <SelectField
                            label="Placement"
                            value={
                                widget.settings.allow_overlap
                                    ? 'overlay'
                                    : (widget.settings.placement ?? 'tight')
                            }
                            options={['tight', 'overlay']}
                            onChange={(value) => {
                                onOverlayPlacementChange(widget.id, value === 'overlay')
                            }}
                        />
                    </>
                )}


        </>
    )
}
