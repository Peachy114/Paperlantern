import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorField, ProfileEditSection } from '@/features/artist-profile/components/ProfileEditorFields'
import {
    ProfileRangeField as RangeField,
    ProfileSelectField as SelectField,
} from '@/features/artist-profile/components/ProfileFormPrimitives'
import type { ProfileEditErrors, ProfileThemeDraft } from '@/features/artist-profile/types/profileEditor'
import type { ProfileBorder, ProfileTabsConfig } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'

// Profile avatar border selection, sizing and layering editor ----
export function ProfileBorderEditor({
    draft,
    errors,
    borders,
    onChange,
    updateTabsConfig,
}: {
    draft: ProfileThemeDraft
    errors: ProfileEditErrors
    borders: ProfileBorder[]
    onChange: (patch: Partial<ProfileThemeDraft>) => void
    updateTabsConfig: (patch: Partial<ProfileTabsConfig>) => void
}) {
    return (
        <ProfileEditSection title="Border">
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    className={`rounded-lg border px-2 py-3 text-xs ${
                        !draft.profileBorderId ? 'ring-2 ring-foreground' : ''
                    }`}
                    onClick={() => onChange({ profileBorderId: '' })}
                >
                    None
                </button>
                {borders.map((border) => (
                    <button
                        key={border.id}
                        type="button"
                        className={`group relative rounded-lg border p-2 ${
                            draft.profileBorderId === border.id ? 'ring-2 ring-foreground' : ''
                        }`}
                        onClick={() => onChange({ profileBorderId: border.id })}
                    >
                        <img
                            src={storageUrl(border.image_path)!}
                            alt={border.name}
                            className="mx-auto h-16 w-16 object-contain"
                        />
                        <span className="mt-1 block truncate text-[10px]">{border.name}</span>
                    </button>
                ))}
            </div>
            <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Profile borders come from Noble Royalty.
            </p>
            <div className="grid grid-cols-2 gap-2">
                <RangeField
                    label="Border"
                    value={draft.avatarBorderWidth}
                    min={0}
                    max={16}
                    suffix="px"
                    onChange={(avatarBorderWidth) => onChange({ avatarBorderWidth })}
                />
                <RangeField
                    label="Radius"
                    value={draft.avatarBorderRadius}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(avatarBorderRadius) => onChange({ avatarBorderRadius })}
                />
            </div>
            <SelectField
                label="Border layer"
                value={draft.tabsConfig.border_layer ?? 'front'}
                options={['front', 'back']}
                formatOption={(option) => (option === 'front' ? 'Send Front' : 'Send Back')}
                onChange={(border_layer) =>
                    updateTabsConfig({
                        border_layer: border_layer as ProfileTabsConfig['border_layer'],
                    })
                }
            />
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                    <Label htmlFor="profile-border-width">Border width %</Label>
                    <Input
                        id="profile-border-width"
                        type="number"
                        min="5"
                        step="10"
                        value={Math.round(
                            (draft.tabsConfig.border_width ??
                                draft.tabsConfig.border_scale ??
                                1.35) * 100
                        )}
                        onChange={(event) => {
                            const value = Number(event.target.value)
                            if (!Number.isFinite(value)) return
                            updateTabsConfig({ border_width: Math.max(0.05, value / 100) })
                        }}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="profile-border-height">Border height %</Label>
                    <Input
                        id="profile-border-height"
                        type="number"
                        min="5"
                        step="10"
                        value={Math.round(
                            (draft.tabsConfig.border_height ??
                                draft.tabsConfig.border_scale ??
                                1.35) * 100
                        )}
                        onChange={(event) => {
                            const value = Number(event.target.value)
                            if (!Number.isFinite(value)) return
                            updateTabsConfig({ border_height: Math.max(0.05, value / 100) })
                        }}
                    />
                </div>
            </div>
            <ColorField
                label="Border color"
                value={draft.avatarBorderColor}
                fallback="#ffffff"
                error={errors.avatarBorderColor}
                onChange={(avatarBorderColor) => onChange({ avatarBorderColor })}
            />
        </ProfileEditSection>
    )
}
