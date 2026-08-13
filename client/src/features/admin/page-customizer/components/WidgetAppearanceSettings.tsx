import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PageBoardItem, PageWidget } from '@/types/pageLayout'
import { NumberField, SelectField, SettingsSection } from '@/features/admin/page-customizer/components/WidgetInspectorControls'
import { clamp } from '@/features/admin/page-customizer/utils/editorInteraction'
import { WIDGET_BACKGROUND_OPTIONS } from '@/features/page-builder/widgetBackgroundPresets'

// Widget appearance settings ----
export function WidgetAppearanceSettings({
    widget,
    selectedBoardItem,
    setSetting,
    setStyle,
    updateBoardItem,
    onOverlayPlacementChange,
}: {
    widget: PageWidget
    selectedBoardItem: PageBoardItem | null
    setSetting: (key: string, value: unknown) => void
    setStyle: (key: string, value: string | number | boolean) => void
    updateBoardItem: (itemId: string, updater: (item: PageBoardItem) => PageBoardItem) => void
    onOverlayPlacementChange: (id: string, enabled: boolean) => void
}) {
    return (
        <>
            <SettingsSection title="Box style">
                <div>
                    <Label>Background style</Label>
                    <select
                        value={widget.style.background_preset ?? (widget.style.transparent ? 'transparent' : 'default')}
                        onChange={(event) => setStyle('background_preset', event.target.value)}
                        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                        {WIDGET_BACKGROUND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Default preserves this widget’s existing design.</p>
                </div>
                {widget.style.background_preset === 'custom' && <div>
                    <Label>Background color</Label>
                    <Input
                        value={widget.style.background ?? ''}
                        onChange={(event) => {
                            setStyle('background', event.target.value)
                            if (event.target.value.trim()) setStyle('transparent', false)
                        }}
                        placeholder="F54927 or #F54927"
                    />
                </div>}
                {(widget.type === 'text' || widget.type === 'banner') && (
                    <div>
                        <Label>Text color</Label>
                        <Input
                            value={widget.style.text_color ?? ''}
                            onChange={(event) => setStyle('text_color', event.target.value)}
                            placeholder="111111 or #111111"
                        />
                    </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={Boolean(widget.style.border)}
                        onChange={(event) => setStyle('border', event.target.checked)}
                    />
                    Show border
                </label>
                <div>
                    <Label>Border color</Label>
                    <Input
                        value={widget.style.border_color ?? ''}
                        onChange={(event) => {
                            setStyle('border_color', event.target.value)
                            if (event.target.value.trim()) setStyle('border', true)
                        }}
                        placeholder="d4d4d8 or #d4d4d8"
                    />
                </div>
                <NumberField
                    label="Border radius"
                    value={widget.style.radius ?? 0}
                    max={80}
                    onChange={(value) => setStyle('radius', value)}
                />
                <NumberField
                    label="Padding block"
                    value={widget.style.padding_block ?? widget.style.padding ?? 0}
                    max={120}
                    onChange={(value) => setStyle('padding_block', value)}
                />
                <NumberField
                    label="Padding inline"
                    value={widget.style.padding_inline ?? widget.style.padding ?? 0}
                    max={120}
                    onChange={(value) => setStyle('padding_inline', value)}
                />
                <NumberField
                    label="Margin block"
                    value={widget.style.margin_block ?? widget.style.margin ?? 0}
                    min={-160}
                    max={160}
                    onChange={(value) => setStyle('margin_block', value)}
                />
                <NumberField
                    label="Margin inline"
                    value={widget.style.margin_inline ?? 0}
                    min={-160}
                    max={160}
                    onChange={(value) => setStyle('margin_inline', value)}
                />
                {widget.type === 'text' && (
                    <>
                        <NumberField
                            label="Text width"
                            value={widget.style.content_width ?? 720}
                            min={120}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Text size"
                            value={widget.style.font_size ?? 14}
                            min={8}
                            max={160}
                            onChange={(value) => setStyle('font_size', value)}
                        />
                        <SelectField
                            label="Text align"
                            value={widget.style.text_align ?? 'start'}
                            options={['start', 'center', 'end']}
                            onChange={(value) => setStyle('text_align', value)}
                        />
                    </>
                )}
                {widget.type === 'spacer' && (
                    <>
                        <NumberField
                            label="Space width"
                            value={widget.style.content_width ?? 720}
                            min={48}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Space height"
                            value={widget.style.content_height ?? 120}
                            min={24}
                            max={1200}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                    </>
                )}
                {widget.type === 'image' && (
                    <>
                        <NumberField
                            label="Image width"
                            value={widget.style.content_width ?? 720}
                            min={120}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Image height"
                            value={widget.style.content_height ?? 240}
                            min={24}
                            max={1200}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                    </>
                )}
                {widget.type === 'banner' && (
                    <>
                        <NumberField
                            label="Banner width"
                            value={widget.style.content_width ?? 960}
                            min={240}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Banner height"
                            value={widget.style.content_height ?? 260}
                            min={120}
                            max={1200}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                        <NumberField
                            label="Side image width %"
                            value={widget.settings.banner_image_width ?? 42}
                            min={20}
                            max={80}
                            onChange={(value) => setSetting('banner_image_width', value)}
                        />
                        <NumberField
                            label="Text size"
                            value={widget.style.font_size ?? 14}
                            min={8}
                            max={160}
                            onChange={(value) => setStyle('font_size', value)}
                        />
                        <SelectField
                            label="Text align"
                            value={widget.style.text_align ?? 'start'}
                            options={['start', 'center', 'end']}
                            onChange={(value) => setStyle('text_align', value)}
                        />
                    </>
                )}
                {widget.type === 'sticker' && (
                    <>
                        <NumberField
                            label="Sticker size"
                            value={widget.style.sticker_size ?? 160}
                            min={48}
                            max={900}
                            onChange={(value) => setStyle('sticker_size', value)}
                        />
                    </>
                )}
                {widget.type === 'board' && (
                    <>
                        <NumberField
                            label="Board width"
                            value={widget.style.content_width ?? 960}
                            min={240}
                            max={1360}
                            onChange={(value) => setStyle('content_width', value)}
                        />
                        <NumberField
                            label="Board height"
                            value={widget.style.content_height ?? 420}
                            min={160}
                            max={1600}
                            onChange={(value) => setStyle('content_height', value)}
                        />
                        {selectedBoardItem && (
                            <div className="space-y-3 rounded-lg border p-3">
                                <p className="text-sm font-semibold">Selected board item style</p>
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
                                {selectedBoardItem.type === 'text' && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
                {['sticker', 'text', 'image', 'banner', 'spacer'].includes(widget.type) &&
                    widget.settings.allow_overlap && (
                        <NumberField
                            label="Rotate degree"
                            value={widget.style.rotate ?? 0}
                            min={-180}
                            max={180}
                            onChange={(value) => setStyle('rotate', value)}
                        />
                    )}
            </SettingsSection>

            <SettingsSection title="Layout">
                <SelectField
                    label="Display"
                    value={widget.settings.display ?? 'block'}
                    options={['block', 'inline']}
                    onChange={(value) => setSetting('display', value)}
                />
                <SelectField
                    label="Direction"
                    value={widget.settings.layout ?? 'horizontal'}
                    options={['horizontal', 'vertical', 'row', 'column', 'compact']}
                    onChange={(value) => setSetting('layout', value)}
                />
                <SelectField
                    label="Align"
                    value={widget.settings.align ?? 'auto'}
                    options={['auto', 'start', 'center', 'end', 'stretch', 'justify']}
                    onChange={(value) => setSetting('align', value)}
                />
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={Boolean(widget.settings.allow_overlap)}
                        onChange={(event) => {
                            onOverlayPlacementChange(widget.id, event.target.checked)
                        }}
                    />
                    {['sticker', 'text', 'image', 'banner', 'spacer'].includes(widget.type)
                        ? 'Overlay other widgets'
                        : 'Allow overlap'}
                </label>
                {['sticker', 'text', 'image', 'banner', 'spacer'].includes(widget.type) &&
                widget.settings.allow_overlap ? (
                    <p className="rounded-md bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
                        Drag this widget directly in the preview to place it anywhere.
                    </p>
                ) : (
                    <>
                        <NumberField
                            label="Move X"
                            value={widget.style.offset_x ?? 0}
                            min={-600}
                            max={600}
                            onChange={(value) => setStyle('offset_x', value)}
                        />
                        <NumberField
                            label="Move Y"
                            value={widget.style.offset_y ?? 0}
                            min={-600}
                            max={600}
                            onChange={(value) => setStyle('offset_y', value)}
                        />
                    </>
                )}
                <NumberField
                    label="Front / back layer"
                    value={widget.style.z_index ?? 1}
                    min={0}
                    max={100}
                    onChange={(value) => setStyle('z_index', value)}
                />
            </SettingsSection>
        </>
    )
}
