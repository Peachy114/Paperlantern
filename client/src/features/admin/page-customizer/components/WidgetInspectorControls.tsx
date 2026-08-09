import { useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PageWidget } from '@/types/pageLayout'
import { isSharedDiscoveryWidget } from '@/features/page-builder/SharedDiscoveryWidget'

// Widget inspector controls ----
export function SettingsSection({
    title,
    children,
    defaultOpen = true,
}: {
    title: string
    children: ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <section className="rounded-lg border">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
                aria-expanded={open}
            >
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="grid h-6 w-6 place-items-center rounded-md border text-base leading-none">
                    {open ? '-' : '+'}
                </span>
            </button>
            {open && <div className="space-y-3 border-t p-3">{children}</div>}
        </section>
    )
}

export function FilterControls({
    widget,
    labeling,
    setSetting,
}: {
    widget: PageWidget
    labeling?: {
        genres?: Array<{ name: string; slug: string }>
        labels?: Array<{ name: string; slug: string }>
        commission_types?: Array<{ name: string; slug: string }>
    }
    setSetting: (key: string, value: unknown) => void
}) {
    const labelSource = widget.settings.label_filter_source ?? 'none'
    const badgeSource = widget.settings.badge_filter_source ?? 'none'
    const labelValues = widget.settings.label_filter_values ?? []
    const badgeValue = widget.settings.badge_filter_value ?? ''
    const sortOrder = widget.settings.sort_order ?? []
    const dataSource = widget.settings.filter_cards_data ?? defaultDataSourceForWidget(widget.type)
    const sourceOptions = filterSourceOptionsForData(dataSource)
    const sortOptions = sortOptionsForData(dataSource)
    const choicesFor = (source: string) => {
        if (source === 'genre') return labeling?.genres?.map((item) => item.name) ?? []
        if (source === 'label') return labeling?.labels?.map((item) => item.name) ?? []
        if (source === 'commission_type')
            return labeling?.commission_types?.map((item) => item.name) ?? []
        if (source === 'source') return ['By Admin', 'By Artist']
        if (source === 'artist') return []
        if (source === 'status') return ['ongoing', 'completed', 'hiatus', 'draft', 'published']
        return []
    }
    const labelChoices = choicesFor(labelSource)
    const badgeChoices = choicesFor(badgeSource)
    const toggleLabel = (value: string) => {
        setSetting(
            'label_filter_values',
            labelValues.includes(value)
                ? labelValues.filter((item) => item !== value)
                : [...labelValues, value]
        )
    }
    const toggleSort = (value: (typeof sortOptions)[number]) => {
        setSetting(
            'sort_order',
            sortOrder.includes(value)
                ? sortOrder.filter((item) => item !== value)
                : [...sortOrder, value]
        )
    }

    return (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Data and filters
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Use label filtering for multiple chips. Use badge filtering when this widget
                    should show only one selected genre/status/label.
                </p>
            </div>

            <SelectField
                label="Cards data"
                value={dataSource}
                options={[
                    'mixed',
                    'comix',
                    'novels',
                    'arts',
                    'shop',
                    'commissions',
                    'announcements',
                ]}
                onChange={(value) => {
                    setSetting('filter_cards_data', value)
                    setSetting('label_filter_source', 'none')
                    setSetting('label_filter_values', [])
                    setSetting('badge_filter_source', 'none')
                    setSetting('badge_filter_value', '')
                    if (value === 'comix') setSetting('filter', 'webtoon')
                    if (value === 'novels') setSetting('filter', 'novel')
                    if (value === 'arts') setSetting('filter', 'art')
                    if (value === 'mixed') setSetting('filter', 'all')
                }}
            />

            <div>
                <Label>Sort in order</Label>
                <div className="mt-2 flex flex-wrap gap-2 rounded-md border bg-background p-2">
                    {sortOptions.map((sort) => {
                        const active = sortOrder.includes(sort)
                        const order = sortOrder.indexOf(sort) + 1

                        return (
                            <button
                                key={sort}
                                type="button"
                                onClick={() => toggleSort(sort)}
                                className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                                    active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-background hover:bg-muted'
                                }`}
                            >
                                {active ? `${order}. ` : ''}
                                {sort}
                            </button>
                        )
                    })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Click multiple sorts in the order you want. Empty uses featured, popular, then
                    latest.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                    label="Label filtering"
                    value={labelSource}
                    options={sourceOptions}
                    onChange={(value) => {
                        setSetting('label_filter_source', value)
                        setSetting('label_filter_values', [])
                    }}
                />
                <SelectField
                    label="Badge filtering"
                    value={badgeSource}
                    options={sourceOptions}
                    onChange={(value) => {
                        setSetting('badge_filter_source', value)
                        setSetting('badge_filter_value', '')
                    }}
                />
            </div>

            {labelSource !== 'none' && (
                <div>
                    <Label>Choose label filters</Label>
                    <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border bg-background p-2">
                        {labelChoices.length ? (
                            labelChoices.map((choice) => (
                                <button
                                    key={choice}
                                    type="button"
                                    onClick={() => toggleLabel(choice)}
                                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                                        labelValues.includes(choice)
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'bg-background hover:bg-muted'
                                    }`}
                                >
                                    {choice}
                                </button>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                No options found yet. You can still type values below.
                            </p>
                        )}
                    </div>
                    <Input
                        className="mt-2"
                        value={labelValues.join(', ')}
                        onChange={(event) =>
                            setSetting(
                                'label_filter_values',
                                event.target.value
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean)
                            )
                        }
                        placeholder="romance, fantasy, completed"
                    />
                </div>
            )}

            {badgeSource !== 'none' && (
                <div>
                    <Label>Badge filter</Label>
                    <select
                        value={badgeValue}
                        onChange={(event) => setSetting('badge_filter_value', event.target.value)}
                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                        <option value="">None</option>
                        {badgeChoices.map((choice) => (
                            <option key={choice} value={choice}>
                                {choice}
                            </option>
                        ))}
                    </select>
                    <Input
                        className="mt-2"
                        value={badgeValue}
                        onChange={(event) => setSetting('badge_filter_value', event.target.value)}
                        placeholder="One manual badge value"
                    />
                </div>
            )}
        </div>
    )
}

export function DateControls({
    widget,
    setSetting,
}: {
    widget: PageWidget
    setSetting: (key: string, value: unknown) => void
}) {
    const mode = widget.settings.date_mode ?? 'all'

    return (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Date
            </p>
            <SelectField
                label="Date range"
                value={mode}
                options={['all', 'daily', 'weekly', 'monthly']}
                onChange={(value) => {
                    setSetting('date_mode', value)
                    if (value === 'all') {
                        setSetting('date_value', undefined)
                        setSetting('daily_date', undefined)
                    }
                }}
            />
            {mode !== 'all' && (
                <div>
                    <Label>Start date</Label>
                    <Input
                        type="date"
                        value={widget.settings.date_value ?? widget.settings.daily_date ?? ''}
                        onChange={(event) => {
                            const nextValue = event.target.value || undefined
                            setSetting('date_value', nextValue)
                            setSetting('daily_date', nextValue)
                        }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        Daily matches this day. Weekly shows the 7 days around it. Monthly matches
                        its month.
                    </p>
                </div>
            )}
        </div>
    )
}

export function supportsDataControls(type: string) {
    return (
        isSharedDiscoveryWidget(type) ||
        [
            'featured_hero',
            'group_hero',
            'labels',
            'arts_grid',
            'commission_grid',
            'boosted_commissions',
            'shop_card',
            'sticker_shop',
        ].includes(type)
    )
}

export function supportsDateControls(type: string) {
    return supportsDataControls(type)
}

export function defaultDataSourceForWidget(type: string) {
    if (type === 'shop_card') return 'shop'
    if (type === 'commission_grid' || type === 'boosted_commissions') return 'commissions'
    if (type === 'arts_grid') return 'arts'
    if (type === 'episodes' || type === 'latest') return 'comix'
    return 'mixed'
}

export function filterSourceOptionsForData(dataSource: string) {
    if (dataSource === 'comix' || dataSource === 'novels') {
        return ['none', 'genre', 'status', 'artist']
    }
    if (dataSource === 'arts') return ['none', 'label', 'artist']
    if (dataSource === 'shop') return ['none', 'label', 'source', 'artist']
    if (dataSource === 'commissions') return ['none', 'commission_type', 'status', 'artist']
    if (dataSource === 'announcements') return ['none', 'label', 'status']
    return ['none', 'genre', 'status', 'label', 'artist', 'source', 'commission_type']
}

export function sortOptionsForData(dataSource: string) {
    if (dataSource === 'shop') return ['featured', 'latest', 'popular', 'likes', 'new'] as const
    if (dataSource === 'commissions')
        return ['featured', 'latest', 'popular', 'views', 'new'] as const
    if (dataSource === 'announcements') return ['featured', 'latest', 'new'] as const
    return ['featured', 'latest', 'popular', 'views', 'likes', 'new'] as const
}

export function CardContentControls({
    widget,
    setSetting,
}: {
    widget: PageWidget
    setSetting: (key: string, value: unknown) => void
}) {
    const dataSource = widget.settings.filter_cards_data ?? defaultDataSourceForWidget(widget.type)
    const baseOptions: Array<[keyof PageWidget['settings'], string]> = [
        ['card_show_new', 'New badge'],
        ['card_show_popular', 'Popular badge'],
        ['card_show_name', dataSource === 'shop' ? 'Product name' : 'Name'],
        ['card_show_artist', dataSource === 'shop' ? 'Seller / artist' : 'Artist name'],
        ['card_show_rank', 'Rank'],
    ]
    const sourceOptions: Record<string, Array<[keyof PageWidget['settings'], string]>> = {
        mixed: [
            ['card_show_views', 'Views'],
            ['card_show_likes', 'Likes'],
            ['card_show_labels', 'Labels'],
            ['card_show_type', 'Type badge'],
        ],
        comix: [
            ['card_show_views', 'Views'],
            ['card_show_likes', 'Likes'],
            ['card_show_status', 'Status'],
            ['card_show_genres', 'Genres'],
            ['card_show_type', 'Webcomic badge'],
        ],
        novels: [
            ['card_show_views', 'Views'],
            ['card_show_likes', 'Likes'],
            ['card_show_status', 'Status'],
            ['card_show_genres', 'Genres'],
            ['card_show_type', 'Novel badge'],
        ],
        arts: [
            ['card_show_views', 'Views'],
            ['card_show_likes', 'Likes'],
            ['card_show_labels', 'Labels'],
        ],
        shop: [
            ['card_show_price', 'Price / credits'],
            ['card_show_sold', 'Sold'],
            ['card_show_rating', 'Rating'],
            ['card_show_labels', 'Labels'],
        ],
        commissions: [
            ['card_show_price', 'Base price'],
            ['card_show_rating', 'Rating'],
            ['card_show_status', 'Open status'],
            ['card_show_labels', 'Category'],
        ],
        announcements: [['card_show_labels', 'Tag']],
    }
    const options = [...baseOptions, ...(sourceOptions[dataSource] ?? sourceOptions.mixed)]

    return (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Card content
            </p>
            <div className="grid grid-cols-2 gap-2">
                {options.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={widget.settings[key] !== false}
                            onChange={(event) => setSetting(key, event.target.checked)}
                        />
                        {label}
                    </label>
                ))}
            </div>
        </div>
    )
}

export function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: string
    options: string[]
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

export function NumberField({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
}: {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    )
}
