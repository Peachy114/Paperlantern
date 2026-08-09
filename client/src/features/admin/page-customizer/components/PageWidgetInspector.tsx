import { useMemo, type ChangeEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import { adminArtsApi } from '@/api/adminArts'
import { commentsApi } from '@/api/comments'
import { labelingApi } from '@/api/labeling'
import { pageLayoutApi } from '@/api/pageLayouts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ArtistSticker } from '@/types/artistProfile'
import type { PageBoardItem, PageKey, PageWidget } from '@/types/pageLayout'
import { fontFamilyFromUrl } from '@/features/page-builder/PageWidgetFrame'
import { storageUrl } from '@/utils/storage'
import { WidgetAppearanceSettings } from '@/features/admin/page-customizer/components/WidgetAppearanceSettings'
import { BoardWidgetContentSettings } from '@/features/admin/page-customizer/components/BoardWidgetContentSettings'
import {
    GRID_OPTIONS,
    WIDGET_TYPES,
} from '@/features/admin/page-customizer/pageCustomizerRegistry'
import {
    CardContentControls,
    DateControls,
    FilterControls,
    NumberField,
    SelectField,
    SettingsSection,
    supportsDataControls,
    supportsDateControls,
} from '@/features/admin/page-customizer/components/WidgetInspectorControls'

// Page widget inspector ----
export function PageWidgetInspector({
    page,
    widget,
    onChange,
    onRemove,
    onOverlayPlacementChange,
}: {
    page: PageKey
    widget: PageWidget | null
    onChange: (id: string, updater: (widget: PageWidget) => PageWidget) => void
    onRemove: (id: string) => void
    onOverlayPlacementChange: (id: string, enabled: boolean) => void
}) {
    const upload = useMutation({
        mutationFn: (file: File) => {
            const payload = new FormData()
            payload.append('asset', file)
            return pageLayoutApi.uploadAsset(payload).then((res) => res.data)
        },
        onSuccess: (data) => {
            if (!widget) return
            onChange(widget.id, (current) => ({
                ...current,
                settings: { ...current.settings, asset_path: data.path },
            }))
            toast.success('Asset uploaded.')
        },
        onError: () => toast.error('Could not upload asset.'),
    })
    const userStickerLibrary = useQuery<ArtistSticker[]>({
        queryKey: ['page-builder-sticker-library'],
        queryFn: () => commentsApi.stickerLibrary().then((res) => res.data.data),
        enabled: widget?.type === 'sticker' || widget?.type === 'board',
        staleTime: 60_000,
    })
    const adminStickerLibrary = useQuery<ArtistSticker[]>({
        queryKey: ['page-builder-admin-sticker-library'],
        queryFn: () => adminArtsApi.stickers().then((res) => res.data.data),
        enabled: widget?.type === 'sticker' || widget?.type === 'board',
        staleTime: 60_000,
    })
    const labeling = useQuery({
        queryKey: ['page-builder-labeling-options'],
        queryFn: () => labelingApi.publicIndex().then((res) => res.data),
        enabled: Boolean(widget),
        staleTime: 300_000,
    })
    const stickerLibrary = useMemo(() => {
        const stickers = [...(adminStickerLibrary.data ?? []), ...(userStickerLibrary.data ?? [])]
        return Array.from(new Map(stickers.map((sticker) => [sticker.id, sticker])).values())
    }, [adminStickerLibrary.data, userStickerLibrary.data])
    const stickersLoading = adminStickerLibrary.isLoading || userStickerLibrary.isLoading

    if (!widget) {
        return (
            <div>
                <h2 className="text-sm font-semibold">Widget settings</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Click the corner settings button on a preview block to edit content, box style,
                    and layout.
                </p>
            </div>
        )
    }

    const setField = <K extends keyof PageWidget>(key: K, value: PageWidget[K]) => {
        onChange(widget.id, (current) => ({ ...current, [key]: value }))
    }

    const setSetting = (key: string, value: unknown) => {
        onChange(widget.id, (current) => ({
            ...current,
            settings: { ...current.settings, [key]: value },
        }))
    }

    const setStyle = (key: string, value: string | number | boolean) => {
        onChange(widget.id, (current) => ({
            ...current,
            style: { ...current.style, [key]: value },
        }))
    }

    const assetUrl = widget.settings.asset_path ? storageUrl(widget.settings.asset_path) : null
    const selectedStickerUrl = widget.settings.sticker_image_path
        ? storageUrl(widget.settings.sticker_image_path)
        : null
    const boardItems = widget.settings.board_items ?? []
    const selectedBoardItem =
        boardItems.find((item) => item.id === widget.settings.selected_board_item_id) ??
        boardItems[0] ??
        null
    const updateBoardItems = (items: PageBoardItem[], selectedId?: string) => {
        onChange(widget.id, (current) => ({
            ...current,
            settings: {
                ...current.settings,
                board_items: items,
                selected_board_item_id: selectedId ?? current.settings.selected_board_item_id,
            },
        }))
    }
    const updateBoardItem = (itemId: string, updater: (item: PageBoardItem) => PageBoardItem) => {
        updateBoardItems(
            boardItems.map((item) => (item.id === itemId ? updater(item) : item)),
            itemId
        )
    }
    const uploadBoardItemAsset = (file: File, itemId: string) => {
        const payload = new FormData()
        payload.append('asset', file)
        pageLayoutApi
            .uploadAsset(payload)
            .then((res) => {
                updateBoardItem(itemId, (item) => ({
                    ...item,
                    asset_path: res.data.path,
                }))
                toast.success('Board image uploaded.')
            })
            .catch(() => toast.error('Could not upload board image.'))
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {WIDGET_TYPES[page].find((type) => type.value === widget.type)?.label ??
                            widget.type}
                    </p>
                    <h2 className="text-sm font-semibold">Widget settings</h2>
                </div>
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(widget.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <SettingsSection title="Content">
                <div>
                    <Label>Title</Label>
                    <Input
                        value={widget.title}
                        onChange={(event) => setField('title', event.target.value)}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={(event) => setField('enabled', event.target.checked)}
                    />
                    Enabled
                </label>

                {supportsDataControls(widget.type) && (
                    <FilterControls
                        widget={widget}
                        labeling={labeling.data}
                        setSetting={setSetting}
                    />
                )}

                {supportsDateControls(widget.type) && (
                    <DateControls widget={widget} setSetting={setSetting} />
                )}

                {[
                    'cards',
                    'grid_image',
                    'grid_con',
                    'top_10s',
                    'shop_card',
                    'tab_cards',
                    'popular',
                    'weekly',
                    'daily',
                    'today_releases',
                    'today_top',
                    'fresh',
                    'top_liker',
                    'episodes',
                ].includes(widget.type) && (
                    <CardContentControls widget={widget} setSetting={setSetting} />
                )}

                {widget.type === 'labels' && (
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <SelectField
                            label="Label widget type"
                            value={widget.settings.labels_display ?? 'labels'}
                            options={['labels', 'menu_label', 'labels_cards']}
                            onChange={(value) => setSetting('labels_display', value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Labels uses the selected data source. Menu Label shows Main, Comix,
                            Novel, and Arts. Labels and Cards shows the label rail with cards below.
                        </p>
                    </div>
                )}

                {widget.type === 'featured_hero' && (
                    <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                        <SelectField
                            label="Hero design"
                            value={widget.settings.hero_design ?? 'default'}
                            options={[
                                'default',
                                'reference_1',
                                'reference_2',
                                'reference_3',
                                'reference_4',
                            ]}
                            onChange={(value) => setSetting('hero_design', value)}
                        />
                        <div className="grid gap-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Show information
                            </p>
                            {[
                                ['hero_show_name', 'Name'],
                                ['hero_show_artist', 'Artist Name'],
                                ['hero_show_views', 'Views'],
                                ['hero_show_likes', 'Likes'],
                                ['hero_show_favorite', 'Favorite'],
                            ].map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(
                                            widget.settings[key as keyof typeof widget.settings] ??
                                            key !== 'hero_show_favorite'
                                        )}
                                        onChange={(event) => setSetting(key, event.target.checked)}
                                    />
                                    {label}
                                </label>
                            ))}
                            <SelectField
                                label="Labels type"
                                value={widget.settings.hero_label_style ?? 'badges'}
                                options={['badges', 'plain']}
                                onChange={(value) => setSetting('hero_label_style', value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Data source
                            </p>
                            {[
                                ['hero_source_arts', 'Arts'],
                                ['hero_source_announcements', 'Announcement'],
                                ['hero_source_works', 'Comix'],
                                ['hero_source_novels', 'Novels'],
                                ['hero_source_commissions', 'Commission'],
                                ['hero_source_shop', 'Shop'],
                            ].map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(
                                            widget.settings[key as keyof typeof widget.settings] ??
                                            true
                                        )}
                                        onChange={(event) => setSetting(key, event.target.checked)}
                                    />
                                    {label}
                                </label>
                            ))}
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={Boolean(widget.settings.hero_featured_only)}
                                    onChange={(event) =>
                                        setSetting('hero_featured_only', event.target.checked)
                                    }
                                />
                                Use featured / boosted first
                            </label>
                        </div>
                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 10}
                            min={1}
                            max={30}
                            onChange={(value) => setSetting('limit', value)}
                        />
                    </div>
                )}

                {widget.type === 'group_hero' && (
                    <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                        <SelectField
                            label="Group design"
                            value={widget.settings.group_hero_design ?? 'default'}
                            options={['default', 'popular_arts', 'spotlight_stack']}
                            onChange={(value) => setSetting('group_hero_design', value)}
                        />

                        <div>
                            <Label>Text box</Label>
                            <Input
                                value={widget.settings.text ?? ''}
                                onChange={(event) => setSetting('text', event.target.value)}
                                placeholder="Artwork for this week"
                            />
                        </div>

                        <div className="grid gap-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Data source
                            </p>
                            {[
                                ['group_source_arts', 'Arts'],
                                ['group_source_comix', 'Comix'],
                                ['group_source_novels', 'Novels'],
                                ['group_source_commissions', 'Commission'],
                            ].map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(
                                            widget.settings[key as keyof typeof widget.settings] ??
                                            key === 'group_source_arts'
                                        )}
                                        onChange={(event) => setSetting(key, event.target.checked)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>

                        <SelectField
                            label="Sort"
                            value={widget.settings.group_sort ?? 'popular'}
                            options={['popular', 'latest', 'likes', 'views', 'featured']}
                            onChange={(value) => setSetting('group_sort', value)}
                        />

                        <div>
                            <Label>Filters</Label>
                            <Input
                                value={widget.settings.group_filter_labels ?? ''}
                                onChange={(event) =>
                                    setSetting('group_filter_labels', event.target.value)
                                }
                                placeholder="romance, action, illustration"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Separate labels, genres, or commission categories with commas.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={widget.settings.group_view_all_enabled !== false}
                                onChange={(event) =>
                                    setSetting('group_view_all_enabled', event.target.checked)
                                }
                            />
                            Show View all
                        </label>

                        <SelectField
                            label="View all sort"
                            value={
                                widget.settings.group_view_all_sort ??
                                widget.settings.group_sort ??
                                'popular'
                            }
                            options={['popular', 'latest', 'likes', 'views', 'featured']}
                            onChange={(value) => setSetting('group_view_all_sort', value)}
                        />

                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 10}
                            min={7}
                            max={30}
                            onChange={(value) => setSetting('limit', value)}
                        />

                        <p className="text-xs text-muted-foreground">
                            Popular arts uses one large image, six small images, and one text area.
                            Spotlight Stack is the extra group design.
                        </p>
                    </div>
                )}

                {widget.type === 'content_tabs' && (
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Tabs to show
                        </p>
                        {[
                            ['tabs_show_main', 'Main (Mix)'],
                            ['tabs_show_comix', 'Comix'],
                            ['tabs_show_novels', 'Novels'],
                            ['tabs_show_arts', 'Arts'],
                            ['tabs_show_commissions', 'Commission'],
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={Boolean(
                                        widget.settings[key as keyof typeof widget.settings]
                                    )}
                                    onChange={(event) => setSetting(key, event.target.checked)}
                                />
                                {label}
                            </label>
                        ))}
                        <p className="text-xs text-muted-foreground">
                            Use this on Daily, Rankings, and Genre when you want the page to switch
                            between mixed content, comics, novels, arts, or commissions.
                        </p>
                    </div>
                )}

                {widget.type === 'text' && (
                    <>
                        <div>
                            <Label>Text</Label>
                            <textarea
                                value={widget.settings.text ?? ''}
                                onChange={(event) => setSetting('text', event.target.value)}
                                className="mt-1 min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                            />
                        </div>
                        <div>
                            <Label>Font name</Label>
                            <Input
                                value={widget.style.font_family ?? ''}
                                onChange={(event) => setStyle('font_family', event.target.value)}
                                placeholder={
                                    fontFamilyFromUrl(widget.settings.font_url) ??
                                    'Inter, Poppins, MyFont'
                                }
                            />
                        </div>
                        <div>
                            <Label>Font CDN / import URL</Label>
                            <Input
                                value={widget.settings.font_url ?? ''}
                                onChange={(event) => {
                                    setSetting('font_url', event.target.value)
                                    const family = fontFamilyFromUrl(event.target.value)
                                    if (family && !widget.style.font_family)
                                        setStyle('font_family', family)
                                }}
                                placeholder="https://fonts.googleapis.com/css2?family=Poppins..."
                            />
                        </div>
                    </>
                )}

                {widget.type === 'banner' && (
                    <>
                        <div>
                            <Label>Banner text</Label>
                            <textarea
                                value={widget.settings.text ?? ''}
                                onChange={(event) => setSetting('text', event.target.value)}
                                className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                                placeholder="Write the banner message..."
                            />
                        </div>
                        <div>
                            <Label>Banner image</Label>
                            {assetUrl && (
                                <img
                                    src={assetUrl}
                                    alt=""
                                    className="mt-2 max-h-32 rounded-md object-contain"
                                />
                            )}
                            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60">
                                <ImagePlus className="h-4 w-4" />
                                Upload banner image
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        const file = event.target.files?.[0]
                                        if (file) upload.mutate(file)
                                    }}
                                />
                            </label>
                        </div>
                        <SelectField
                            label="Text/image direction"
                            value={widget.settings.layout ?? 'horizontal'}
                            options={['horizontal', 'vertical']}
                            onChange={(value) => setSetting('layout', value)}
                        />
                        <SelectField
                            label="CSS layout"
                            value={widget.settings.banner_layout_mode ?? 'grid'}
                            options={['grid', 'flex']}
                            onChange={(value) => setSetting('banner_layout_mode', value)}
                        />
                        <SelectField
                            label="Image placement"
                            value={widget.settings.banner_image_mode ?? 'side'}
                            options={['side', 'background']}
                            onChange={(value) => setSetting('banner_image_mode', value)}
                        />
                        <SelectField
                            label="Image fit"
                            value={widget.settings.banner_image_fit ?? 'cover'}
                            options={['cover', 'contain', 'fill']}
                            onChange={(value) => setSetting('banner_image_fit', value)}
                        />
                        <div>
                            <Label>Image position</Label>
                            <Input
                                value={widget.settings.banner_image_position ?? 'center'}
                                onChange={(event) =>
                                    setSetting('banner_image_position', event.target.value)
                                }
                                placeholder="center, top, 50% 30%"
                            />
                        </div>
                        <div>
                            <Label>Font name</Label>
                            <Input
                                value={widget.style.font_family ?? ''}
                                onChange={(event) => setStyle('font_family', event.target.value)}
                                placeholder={
                                    fontFamilyFromUrl(widget.settings.font_url) ??
                                    'Inter, Poppins, MyFont'
                                }
                            />
                        </div>
                        <div>
                            <Label>Font CDN / import URL</Label>
                            <Input
                                value={widget.settings.font_url ?? ''}
                                onChange={(event) => {
                                    setSetting('font_url', event.target.value)
                                    const family = fontFamilyFromUrl(event.target.value)
                                    if (family && !widget.style.font_family)
                                        setStyle('font_family', family)
                                }}
                                placeholder="https://fonts.googleapis.com/css2?family=Poppins..."
                            />
                        </div>
                        <div>
                            <Label>Parent CSS</Label>
                            <textarea
                                value={widget.settings.custom_css ?? ''}
                                onChange={(event) => setSetting('custom_css', event.target.value)}
                                className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-xs"
                                placeholder="display: grid; gap: 12px;"
                            />
                        </div>
                        <div>
                            <Label>Text CSS</Label>
                            <textarea
                                value={widget.settings.text_css ?? ''}
                                onChange={(event) => setSetting('text_css', event.target.value)}
                                className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-xs"
                                placeholder="justify-content: center; max-width: 620px;"
                            />
                        </div>
                        <div>
                            <Label>Image CSS</Label>
                            <textarea
                                value={widget.settings.image_css ?? ''}
                                onChange={(event) => setSetting('image_css', event.target.value)}
                                className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-xs"
                                placeholder="filter: saturate(1.1);"
                            />
                        </div>
                    </>
                )}

                {widget.type === 'sticker' && (
                    <div>
                        <Label>Sticker</Label>
                        {selectedStickerUrl && (
                            <img
                                src={selectedStickerUrl}
                                alt={widget.title}
                                className="mt-2 h-24 w-24 object-contain"
                            />
                        )}
                        <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
                            {stickerLibrary.map((sticker) => {
                                const selected = widget.settings.sticker_id === sticker.id

                                return (
                                    <button
                                        key={sticker.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(widget.id, (current) => ({
                                                ...current,
                                                title: current.title || sticker.name,
                                                settings: {
                                                    ...current.settings,
                                                    sticker_id: sticker.id,
                                                    sticker_image_path: sticker.image_path,
                                                    asset_path: '',
                                                },
                                            }))
                                        }}
                                        className={`flex h-24 items-center justify-center rounded-md bg-background p-2 transition ${
                                            selected
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
                                )
                            })}
                            {stickersLoading && (
                                <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">
                                    Loading stickers...
                                </p>
                            )}
                            {!stickersLoading && stickerLibrary.length === 0 && (
                                <p className="col-span-3 py-4 text-center text-xs text-muted-foreground">
                                    No stickers in your library yet.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {widget.type === 'image' && (
                    <div>
                        <Label>Image</Label>
                        {assetUrl && (
                            <img
                                src={assetUrl}
                                alt=""
                                className="mt-2 max-h-32 rounded-md object-contain"
                            />
                        )}
                        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/60">
                            <ImagePlus className="h-4 w-4" />
                            Upload asset
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    const file = event.target.files?.[0]
                                    if (file) upload.mutate(file)
                                }}
                            />
                        </label>
                    </div>
                )}

                <BoardWidgetContentSettings
                    widget={widget}
                    boardItems={boardItems}
                    selectedBoardItem={selectedBoardItem}
                    stickerLibrary={stickerLibrary}
                    setSetting={setSetting}
                    updateBoardItems={updateBoardItems}
                    updateBoardItem={updateBoardItem}
                    uploadBoardItemAsset={uploadBoardItemAsset}
                    onOverlayPlacementChange={onOverlayPlacementChange}
                />                {widget.type === 'labels' && (
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Label rail
                        </p>
                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 99}
                            min={1}
                            max={99}
                            onChange={(value) => setSetting('limit', value)}
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={Boolean(widget.settings.continue_from_previous)}
                                onChange={(event) =>
                                    setSetting('continue_from_previous', event.target.checked)
                                }
                            />
                            Continue from previous labels widget
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={widget.settings.show_continuation_badge !== false}
                                onChange={(event) =>
                                    setSetting('show_continuation_badge', event.target.checked)
                                }
                            />
                            Show continuation badge, like 99+
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Background color</Label>
                                <Input
                                    value={String(widget.settings.label_background_color ?? '')}
                                    onChange={(event) =>
                                        setSetting('label_background_color', event.target.value)
                                    }
                                    placeholder="#ff8a00"
                                />
                            </div>
                            <div>
                                <Label>Text color</Label>
                                <Input
                                    value={String(widget.settings.label_text_color ?? '')}
                                    onChange={(event) =>
                                        setSetting('label_text_color', event.target.value)
                                    }
                                    placeholder="#ffffff"
                                />
                            </div>
                            <div>
                                <Label>Active background</Label>
                                <Input
                                    value={String(
                                        widget.settings.label_active_background_color ?? ''
                                    )}
                                    onChange={(event) =>
                                        setSetting(
                                            'label_active_background_color',
                                            event.target.value
                                        )
                                    }
                                    placeholder="#56b6ff"
                                />
                            </div>
                            <div>
                                <Label>Active text</Label>
                                <Input
                                    value={String(widget.settings.label_active_text_color ?? '')}
                                    onChange={(event) =>
                                        setSetting('label_active_text_color', event.target.value)
                                    }
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {['arts_grid', 'commission_grid', 'boosted_commissions', 'grid_con'].includes(
                    widget.type
                ) && (
                    <>
                        <SelectField
                            label="Grid"
                            value={widget.settings.grid ?? 'masonry'}
                            options={GRID_OPTIONS}
                            onChange={(value) => setSetting('grid', value)}
                        />
                        <NumberField
                            label="Columns"
                            value={widget.settings.columns ?? 0}
                            min={0}
                            max={6}
                            onChange={(value) => setSetting('columns', value)}
                        />
                        <SelectField
                            label="Info layout"
                            value={widget.settings.info_layout ?? 'image_only'}
                            options={[
                                'image_only',
                                'image_title',
                                'image_title_inline',
                                'title_image',
                                'image_title_description',
                            ]}
                            onChange={(value) => setSetting('info_layout', value)}
                        />
                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 10}
                            min={1}
                            max={99}
                            onChange={(value) => setSetting('limit', value)}
                        />
                        {widget.type === 'grid_con' && (
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={widget.settings.continue_from_previous !== false}
                                    onChange={(event) =>
                                        setSetting('continue_from_previous', event.target.checked)
                                    }
                                />
                                Continue from previous grid widget
                            </label>
                        )}
                    </>
                )}

                {[
                    'weekly',
                    'daily',
                    'today_releases',
                    'today_top',
                    'fresh',
                    'popular',
                    'top_liker',
                ].includes(widget.type) && (
                    <>
                        <SelectField
                            label="Filter"
                            value={widget.settings.filter ?? 'all'}
                            options={['all', 'webtoon', 'novel', 'art']}
                            onChange={(value) => setSetting('filter', value)}
                        />
                        <NumberField
                            label="Columns"
                            value={widget.settings.columns ?? 0}
                            min={0}
                            max={6}
                            onChange={(value) => setSetting('columns', value)}
                        />
                        <SelectField
                            label="Info layout"
                            value={widget.settings.info_layout ?? 'image_title_description'}
                            options={[
                                'image_only',
                                'image_title',
                                'image_title_inline',
                                'title_image',
                                'image_title_description',
                            ]}
                            onChange={(value) => setSetting('info_layout', value)}
                        />
                        <NumberField
                            label="Limit"
                            value={widget.settings.limit ?? 10}
                            min={1}
                            max={99}
                            onChange={(value) => setSetting('limit', value)}
                        />
                        {widget.type === 'today_top' && (
                            <SelectField
                                label="Rank by"
                                value={widget.settings.metric ?? 'views'}
                                options={['views', 'likes']}
                                onChange={(value) => setSetting('metric', value)}
                            />
                        )}
                    </>
                )}
            </SettingsSection>

            <WidgetAppearanceSettings
                widget={widget}
                selectedBoardItem={selectedBoardItem}
                setSetting={setSetting}
                setStyle={setStyle}
                updateBoardItem={updateBoardItem}
                onOverlayPlacementChange={onOverlayPlacementChange}
            />
        </div>
    )
}

// ============================================================================
// SECTION 12: REUSABLE INSPECTOR INPUT COMPONENTS ----
// ============================================================================



