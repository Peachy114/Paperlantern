import type { FormEvent, PointerEvent } from 'react'
import { Image as ImageIcon, Layers, Minus, Plus, Trash2, Type } from 'lucide-react'
import type { ArtistProfileBlock, ArtistSticker } from '@/types/artistProfile'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
    ArtImageOption,
    BlockPatch,
    NewBlockForm,
} from '@/features/artist-profile/types/profileEditor'
import { clamp, normalizeRotation } from '@/features/artist-profile/utils/profileLayout'
import {
    ImageSourceControls,
    StickerPicker,
} from '@/features/artist-profile/components/ProfileMediaControls'
import { ColorField } from '@/features/artist-profile/components/ProfileEditorFields'
import {
    ProfileRangeField as RangeField,
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'

export function BoardEditorPanel({
    form,
    artImages,
    stickers,
    allowText,
    selectedBlock,
    busy,
    onFormChange,
    onCreate,
    onPatchLocal,
    onPersist,
    onDelete,
    onStickerDragStart,
}: {
    form: NewBlockForm
    artImages: ArtImageOption[]
    stickers: ArtistSticker[]
    allowText: boolean
    selectedBlock: ArtistProfileBlock | null
    busy: boolean
    onFormChange: (form: NewBlockForm) => void
    onCreate: (event: FormEvent<HTMLFormElement>) => void
    onPatchLocal: (id: string, patch: BlockPatch) => void
    onPersist: (block: ArtistProfileBlock, patch: BlockPatch | FormData) => void
    onDelete: (block: ArtistProfileBlock) => void
    onStickerDragStart: (event: PointerEvent<HTMLElement>, sticker: ArtistSticker) => void
}) {
    return (
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={onCreate} className="rounded-lg border bg-muted/20 p-3">
                <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={
                                form.type === 'image' && !form.isSticker ? 'default' : 'outline'
                            }
                            onClick={() =>
                                onFormChange({
                                    ...form,
                                    type: 'image',
                                    isSticker: false,
                                    stickerId: '',
                                })
                            }
                        >
                            <ImageIcon className="h-4 w-4" />
                            Image
                        </Button>
                        {allowText && (
                            <Button
                                type="button"
                                variant={form.type === 'text' ? 'default' : 'outline'}
                                onClick={() =>
                                    onFormChange({
                                        ...form,
                                        type: 'text',
                                        isSticker: false,
                                        stickerId: '',
                                    })
                                }
                            >
                                <Type className="h-4 w-4" />
                                Text
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={form.isSticker ? 'default' : 'outline'}
                            onClick={() =>
                                onFormChange({
                                    ...form,
                                    type: 'image',
                                    image: null,
                                    sourceArtImageId: '',
                                    isSticker: true,
                                })
                            }
                        >
                            <Layers className="h-4 w-4" />
                            Sticker
                        </Button>
                    </div>

                    {form.type === 'text' ? (
                        <div className="grid gap-1">
                            <Label htmlFor="board-text">Text</Label>
                            <Textarea
                                id="board-text"
                                rows={3}
                                value={form.text}
                                placeholder="Text"
                                onChange={(event) =>
                                    onFormChange({ ...form, text: event.target.value })
                                }
                            />
                        </div>
                    ) : form.isSticker ? (
                        <StickerPicker
                            value={form.stickerId}
                            stickers={stickers}
                            onChange={(value) => onFormChange({ ...form, stickerId: value })}
                            onDragStart={onStickerDragStart}
                        />
                    ) : (
                        <div className="grid gap-3">
                            <ImageSourceControls
                                id="board-image-source"
                                value={form.sourceArtImageId}
                                artImages={artImages}
                                onUpload={(file) =>
                                    onFormChange({ ...form, image: file, sourceArtImageId: '' })
                                }
                                onSelect={(value) =>
                                    onFormChange({
                                        ...form,
                                        image: null,
                                        sourceArtImageId: value,
                                    })
                                }
                            />
                        </div>
                    )}

                    {!form.isSticker && (
                        <Button type="submit" disabled={busy} className="justify-self-start">
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    )}
                </div>
            </form>

            <SelectedBlockPanel
                key={selectedBlock?.id ?? 'none'}
                block={selectedBlock}
                artImages={artImages}
                stickers={stickers}
                busy={busy}
                onPatchLocal={onPatchLocal}
                onPersist={onPersist}
                onDelete={onDelete}
            />
        </div>
    )
}

function SelectedBlockPanel({
    block,
    artImages,
    stickers,
    busy,
    onPatchLocal,
    onPersist,
    onDelete,
}: {
    block: ArtistProfileBlock | null
    artImages: ArtImageOption[]
    stickers: ArtistSticker[]
    busy: boolean
    onPatchLocal: (id: string, patch: BlockPatch) => void
    onPersist: (block: ArtistProfileBlock, patch: BlockPatch | FormData) => void
    onDelete: (block: ArtistProfileBlock) => void
}) {
    if (!block) {
        return (
            <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm text-muted-foreground">Select a block</p>
            </div>
        )
    }

    const patch = (changes: BlockPatch) => {
        onPatchLocal(block.id, changes)
        onPersist(block, changes)
    }

    const setSource = (fields: Record<string, string | File | null>) => {
        const payload = new FormData()
        payload.append('type', 'image')
        payload.append('is_sticker', block.is_sticker ? '1' : '0')
        Object.entries(fields).forEach(([key, value]) => {
            if (value !== null && value !== '') payload.append(key, value)
        })
        onPersist(block, payload)
    }

    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Block</p>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    onClick={() => onDelete(block)}
                    className="text-red-500 hover:text-red-500"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {block.type === 'text' ? (
                <div className="mt-3 grid gap-2">
                    <Textarea
                        rows={4}
                        defaultValue={block.text_content ?? ''}
                        onBlur={(event) => patch({ text_content: event.target.value })}
                    />
                    <SelectField
                        label="Font theme"
                        value={block.font_family || ''}
                        options={[
                            '',
                            'Inter, sans-serif',
                            'Georgia, serif',
                            'Kalam, cursive',
                            'Bebas Neue, sans-serif',
                            'Comic Sans MS, cursive',
                        ]}
                        formatOption={(option) => (option ? option.split(',')[0] : 'Default')}
                        onChange={(font_family) => patch({ font_family })}
                    />
                    <ColorField
                        label="Text color"
                        value={block.font_color ?? ''}
                        fallback="#111111"
                        onChange={(font_color) => patch({ font_color })}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => patch({ font_size: clamp(block.font_size - 2, 10, 96) })}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-12 text-center">
                            {block.font_size}px
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => patch({ font_size: clamp(block.font_size + 2, 10, 96) })}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : block.is_sticker ? (
                <div className="mt-3 grid gap-2">
                    <StickerPicker
                        value={block.source_sticker_id ?? ''}
                        stickers={stickers}
                        onChange={(value) => setSource({ source_sticker_id: value })}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                                patch({
                                    rotation: normalizeRotation((block.rotation ?? 0) - 15),
                                })
                            }
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center text-xs text-muted-foreground">
                            {Math.round(block.rotation ?? 0)} deg
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                                patch({
                                    rotation: normalizeRotation((block.rotation ?? 0) + 15),
                                })
                            }
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mt-3 grid gap-2">
                    <ImageSourceControls
                        id="selected-image-source"
                        value={block.source_art_image_id ?? ''}
                        artImages={artImages}
                        onUpload={(file) => file && setSource({ image: file })}
                        onSelect={(value) => value && setSource({ source_art_image_id: value })}
                    />
                    <SelectField
                        label="Fit"
                        value={block.fit_mode}
                        options={['contain', 'cover', 'stretch']}
                        onChange={(value) =>
                            patch({ fit_mode: value as ArtistProfileBlock['fit_mode'] })
                        }
                    />
                    <RangeField
                        label="Image position X"
                        value={block.image_position_x ?? 50}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(image_position_x) => patch({ image_position_x })}
                    />
                    <RangeField
                        label="Image position Y"
                        value={block.image_position_y ?? 50}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(image_position_y) => patch({ image_position_y })}
                    />
                </div>
            )}

            <div className="mt-4 grid gap-3 border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Box Style
                </p>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={block.transparent_background ?? false}
                        onChange={(event) =>
                            patch({ transparent_background: event.target.checked })
                        }
                    />
                    Transparent background
                </label>
                <ColorField
                    label="Background color"
                    value={block.background_color ?? ''}
                    fallback="#ffffff"
                    onChange={(background_color) => patch({ background_color })}
                />
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={block.show_border ?? false}
                        onChange={(event) => patch({ show_border: event.target.checked })}
                    />
                    Show border
                </label>
                <ColorField
                    label="Border color"
                    value={block.border_color ?? ''}
                    fallback="#d4d4d8"
                    onChange={(border_color) => patch({ border_color })}
                />
                <RangeField
                    label="Border radius"
                    value={block.border_radius ?? 0}
                    min={0}
                    max={200}
                    suffix="px"
                    onChange={(border_radius) => patch({ border_radius })}
                />
                <div className="grid grid-cols-2 gap-2">
                    <RangeField
                        label="Padding X"
                        value={block.padding_x ?? 0}
                        min={0}
                        max={40}
                        suffix="%"
                        onChange={(padding_x) => patch({ padding_x })}
                    />
                    <RangeField
                        label="Padding Y"
                        value={block.padding_y ?? 0}
                        min={0}
                        max={40}
                        suffix="%"
                        onChange={(padding_y) => patch({ padding_y })}
                    />
                </div>
            </div>

            <div className="mt-4 grid gap-3 border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Layout
                </p>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={block.overlay ?? false}
                        onChange={(event) => patch({ overlay: event.target.checked })}
                    />
                    Overlay
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={block.locked ?? false}
                        onChange={(event) => patch({ locked: event.target.checked })}
                    />
                    Lock position
                </label>
                <RangeField
                    label="Rotation"
                    value={block.rotation ?? 0}
                    min={-360}
                    max={360}
                    suffix="deg"
                    onChange={(rotation) => patch({ rotation })}
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => patch({ z_index: clamp((block.z_index ?? 1) - 1, 1, 999) })}
                    >
                        Send Back
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => patch({ z_index: clamp((block.z_index ?? 1) + 1, 1, 999) })}
                    >
                        Bring Front
                    </Button>
                </div>
            </div>
        </div>
    )
}
