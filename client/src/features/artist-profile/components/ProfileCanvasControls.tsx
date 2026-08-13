import type { ReactNode } from 'react'
import { Edit3, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ArtistProfileResponse, ProfileCanvasItem } from '@/types/artistProfile'
import type {
    CanvasItemPatch,
    ProfileFilterOption,
    ProfileThemeDraft,
} from '@/features/artist-profile/types/profileEditor'
import {
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'
import { getCanvasFilters } from '@/features/artist-profile/utils/profileContent'
import {
    defaultProfileSort,
    formatCanvasDisplay,
    formatProfileSort,
    getProfileFilterOptions,
    profileFilterLabel,
    profileSortOptions,
} from '@/features/artist-profile/utils/profileLayout'

// Canvas controls ----
export function ProfilePageHeading({
    title,
    canEdit,
    editMode,
    onToggleEdit,
    onSave,
    onCancel,
    busy = false,
}: {
    title: string
    canEdit: boolean
    editMode: boolean
    onToggleEdit: () => void
    onSave?: () => void
    onCancel?: () => void
    busy?: boolean
}) {
    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <h2 data-profile-label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
            </h2>
            {canEdit && editMode ? (
                <div className="flex items-center gap-2">
                    <Button data-profile-system-control variant="outline" onClick={onCancel ?? onToggleEdit} disabled={busy}>
                        Cancel
                    </Button>
                    <Button data-profile-system-control onClick={onSave ?? onToggleEdit} disabled={busy}>
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                </div>
            ) : canEdit ? (
                <Button data-profile-system-control variant={editMode ? 'default' : 'outline'} onClick={onToggleEdit}>
                    <Edit3 className="h-4 w-4" />
                    Edit Mode
                </Button>
            ) : null}
        </div>
    )
}

export function ProfileWidgetEditControls({
    item,
    theme: _theme,
    profile,
    visible,
    busy,
    onUpdateCanvasItem,
    onThemeChange: _onThemeChange,
}: {
    item: ProfileCanvasItem
    theme: ProfileThemeDraft
    profile: ArtistProfileResponse
    visible: boolean
    busy: boolean
    onUpdateCanvasItem: (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => void
    onThemeChange: (patch: Partial<ProfileThemeDraft>) => void
}) {
    if (!visible || item.type === 'board') return null

    return (
        <div data-profile-system-control className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-background/95 p-3 text-foreground shadow-sm">
            {['arts', 'works', 'stickers', 'shop'].includes(item.type) && (
                <SelectField
                    label="Items per page"
                    value={String(item.limit ?? 0)}
                    options={['0', '4', '6', '8', '10', '12']}
                    formatOption={(value) => value === '0' ? 'No limit' : value}
                    onChange={(value) =>
                        onUpdateCanvasItem(item.id, item.kind, {
                            limit: Number(value),
                            pagination: Number(value) > 0,
                        })
                    }
                />
            )}
            {item.type === 'arts' && (
                <>
                    <SelectField
                        label="Arts grid"
                        value={item.display ?? 'masonry'}
                        options={[
                            'standard',
                            'masonry',
                            'bento',
                            'magazine',
                            'gallery',
                            'carousel',
                        ]}
                        formatOption={formatCanvasDisplay}
                        onChange={(display) =>
                            onUpdateCanvasItem(item.id, item.kind, {
                                display: display as ProfileCanvasItem['display'],
                            })
                        }
                    />
                    <label className="flex min-h-8 items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={item.pagination !== false}
                            onChange={(event) =>
                                onUpdateCanvasItem(item.id, item.kind, {
                                    pagination: event.target.checked,
                                })
                            }
                        />
                        Pagination
                    </label>
                    <ProfileSortFilterControls
                        item={item}
                        options={getProfileFilterOptions(profile, item.type)}
                        onUpdateCanvasItem={onUpdateCanvasItem}
                    />
                </>
            )}

            {item.type === 'works' && (
                <>
                    <SelectField
                        label="Works display"
                        value={item.display ?? 'image_title'}
                        options={['image', 'image_title', 'split_card', 'table']}
                        formatOption={formatCanvasDisplay}
                        onChange={(display) =>
                            onUpdateCanvasItem(item.id, item.kind, {
                                display: display as ProfileCanvasItem['display'],
                            })
                        }
                    />
                    <ProfileSortFilterControls
                        item={item}
                        options={getProfileFilterOptions(profile, item.type)}
                        onUpdateCanvasItem={onUpdateCanvasItem}
                    />
                </>
            )}

            {item.type === 'stickers' && (
                <>
                    <ProfileSortFilterControls
                        item={item}
                        options={getProfileFilterOptions(profile, item.type)}
                        onUpdateCanvasItem={onUpdateCanvasItem}
                    />
                </>
            )}

            {item.type === 'comments' && (
                <SelectField
                    label="Comments display"
                    value={item.display ?? 'table'}
                    options={['table', 'cards']}
                    formatOption={formatCanvasDisplay}
                    onChange={(display) =>
                        onUpdateCanvasItem(item.id, item.kind, {
                            display: display as ProfileCanvasItem['display'],
                        })
                    }
                />
            )}

            {item.type === 'feeds' && (
                <SelectField
                    label="Feeds display"
                    value={item.display ?? 'cards'}
                    options={['cards', 'compact']}
                    formatOption={formatCanvasDisplay}
                    onChange={(display) =>
                        onUpdateCanvasItem(item.id, item.kind, {
                            display: display as ProfileCanvasItem['display'],
                        })
                    }
                />
            )}

            {busy && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
    )
}

export function ProfileSortFilterControls({
    item,
    options,
    onUpdateCanvasItem,
}: {
    item: ProfileCanvasItem
    options: ProfileFilterOption[]
    onUpdateCanvasItem: (
        itemId: string,
        kind: ProfileCanvasItem['kind'],
        patch: CanvasItemPatch
    ) => void
}) {
    const selected = getCanvasFilters(item)
    const toggleFilter = (value: string) => {
        const next = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value]
        onUpdateCanvasItem(item.id, item.kind, { filters: next, filter: '' })
    }

    return (
        <>
            <SelectField
                label="Sort by"
                value={item.sort ?? defaultProfileSort(item.type)}
                options={profileSortOptions(item.type)}
                formatOption={formatProfileSort}
                onChange={(sort) => onUpdateCanvasItem(item.id, item.kind, { sort })}
            />
            <div className="grid min-w-56 gap-1 text-sm">
                <span>{profileFilterLabel(item.type)}</span>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() =>
                            onUpdateCanvasItem(item.id, item.kind, { filters: [], filter: '' })
                        }
                        className={`rounded-md border px-2 py-1 text-xs ${
                            selected.length === 0
                                ? 'bg-banner text-background'
                                : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        None
                    </button>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleFilter(option.value)}
                            className={`rounded-md border px-2 py-1 text-xs ${
                                selected.includes(option.value)
                                    ? 'bg-banner text-background'
                                    : 'bg-background text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}

export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
            </h2>
            {children}
        </section>
    )
}
